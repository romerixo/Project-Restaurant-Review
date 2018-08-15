self.importScripts('idb.js');

const API_HOST = 'http://localhost:1337';
const CACHE_NAME = 'restaurant-review-cache-v1';
const DB_NAME = 'offline-data';
const DB_VERSION = 1; 
const urlsToCache = [
  '/',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/responsive.js',
  '/js/restaurant_info.js',
  '/index.html',
  '/restaurant.html'
];

//************************** DB HELPERS ****************************************
function createDB(){
  // create-open indexedDB
  idb.open(DB_NAME, DB_VERSION, upgradeDB => {
    // creating store
    upgradeDB.createObjectStore('json-data', {keyPath: 'path'});
    upgradeDB.createObjectStore('reviews');
    upgradeDB.createObjectStore('pending-reviews', {autoIncrement: true});
  });

  console.log('db created!');
}

function openDB(){
  return idb.open(DB_NAME, DB_VERSION);
}

/**
 * @description Return a promise with the Response object (restaurant JSON) or null if not exist.
 * 
 * @param {Promise} dbPromise - Promise with the opened DB
 * @param {String} url
 * @return {Promise} - Promise with <Response | null>
 */
function getJSONDB(dbPromise, url){
  const path = url.pathname + url.search;

  return dbPromise.then(db => 
    db.transaction('json-data').objectStore('json-data').get(path))
      .then(data => {
        //console.log(data);
        if(typeof data === 'undefined')
          return null;

        return data.json;  
      });
}

/**
 * @description Add entry to IndexedDB with the path and the response obtained from the fetch API
 *
 * @param {Promise} dbPromise - Promise with the opened DB
 * @param {String} url - 
 * @param {Blob} response 
 * @return {Promise} - Return a promise if the transaction was successful
 */
function addJSONDB(dbPromise, url, json){
  const path = url.pathname + url.search;

  return dbPromise.then(db => {
    const tx = db.transaction('json-data', 'readwrite');
    tx.objectStore('json-data')
      .put({path: path, json: json});

    return tx.complete;
  });
}



/**
 * @desc ADD or UPDATE a new Review list
 * @param {object} dbPromise Opened DB
 * @param {object} review A simple review
 */
function addReviews(dbPromise, reviews){
  return dbPromise.then(db => {
    const tx = db.transaction('reviews', 'readwrite');

    const resId = (Array.isArray(reviews)) ? reviews[0].restaurant_id : reviews.restaurant_id;

    tx.objectStore('reviews').get(resId)
    .then(reviewsDb => {
      console.log('reviewsDb:', reviewsDb);
      // UPDATING AN EXISTENT REVIEWS
      if(!reviewsDb)
        reviewsDb = [];
      
      reviewsDb = reviewsDb.concat(reviews);
      console.log('reviewsDb:', reviewsDb);
      tx.objectStore('reviews').put(reviewsDb, resId);
    })

    return tx.complete;
  });
}

function getReviewsDB(dbPromise, resId){
  return dbPromise.then(db => 
    db.transaction('reviews').objectStore('reviews').getAll()
    .then(data => {
      if(data)
        data = data.filter(rev => rev.restaurant_id === resId);

      return data;
    })
  );
}

async function getAllReviewsDB(dbPromise, resId){
  let reviews = await getReviewsDB(dbPromise, resId);
  reviews.concat(await getPendingReviews(dbPromise, resId));

  return reviews;
}

// Pending Reviews ***************************************************************
/**
 * @desc
 */
function addPendingReview(dbPromise, review){
  return dbPromise.then(db => {
    const tx = db.transaction('pending-reviews', 'readwrite');
    console.log('PUTTING ON DB PENDING-REVIEWS:', review);
    tx.objectStore('pending-reviews').put(review);

    return tx.complete;
  });
}

function getPendingReviews(dbPromise, resId=null){
  return dbPromise.then(db => 
    db.transaction('pending-reviews').objectStore('pending-reviews').getAll()
    .then(data => {
      if(data && resId)
        data = data.filter(rev => rev.restaurant_id === resId);
      
      return data;
    })
  );
}

//******************************************************************************



/**
 * Caching static elements on ServiceWorker installation
 */
self.addEventListener('install', function(evt){
  console.log('Installing ServiceWorker:', evt);

  evt.waitUntil(
    caches.open(CACHE_NAME)
    .then(cache => cache.addAll(urlsToCache))
  );

});

/**
 * @desc SYNC event
 */
self.addEventListener('sync', function(evt){
  if(evt.tag === 'update-reviews'){
    console.log('Sync event fired!');
    //evt.waitUntil(
      
    //);
  }
});

/**
 * Return cached requests and add new resources that are not cached (like images)
 */
self.addEventListener('fetch', async function(evt){
  const request = evt.request;
  const url = new URL(request.url);

  // checking url for restaurant API
  if(url.origin === API_HOST){
    const dbPromise = openDB(); // opening database

    // Checking Pending Reviews
    //getPendingReviews(dbPromise).then(reviews => {
      //console.log('This are the pending reviews from sw.js:', reviews);
    //});

    // [POST] Match when creating new Review
    if(request.method === 'POST' && url.pathname ==='/reviews' && !url.search){
      evt.respondWith(
        fetch(request.clone())
        .then((response) => {
          response.json().then(review => {
            addReviews(dbPromise, review); // Add review to IDB
          });
          
          return response;
        })
        .catch(err => {
          // handling no connection
          console.log(err);
          request.clone().json().then(review => {
            addPendingReview(dbPromise, review);
            return request;
          });
        })
      );
    }

    // [GET] Reviews by restaurant ID
    else if(request.method == 'GET' && url.pathname === '/reviews/' && /restaurant_id=\d+/.test(url.search)){
      console.log('Dentro de [GET] Reviews');
      const resId = url.search.match(/=(\d+)/)[1]; // Getting restaurant ID

      let reviews = await getReviewsDB(dbPromise, resId);

      console.log(reviews);

      if(!reviews.length){
        console.log("Fetching reviews from api");
        const reviewsRes = await fetch(request);
        reviews = await reviewsRes.json();
        addReviews(dbPromise, reviews);
      }

      reviews = reviews.concat(await getPendingReviews(dbPromise, resId));

      // HERE got all Reviews
      console.log("ALL reviews:", reviews);
      evt.respondWith(new Response(reviews));
    }
    else{
      evt.respondWith(
        getJSONDB(dbPromise, url).then(json => {
          if(json){
            //console.log('RESPONDING JSON FROM DB');
            return new Response(JSON.stringify(json));
          }

          return fetch(request).then(response => {
            //console.log('RESPONDING JSON FROM FETCH:', response);
            const response2 = response.clone();

            // adding new JSON response to DB
            if(response2.status === 200)
              response2.json().then(json => addJSONDB(dbPromise, url, json));

            return response;
          }).catch(err => console.log('ERROR FROM SW.JS:', err));
        })
      );
    }
    
  }else{
    evt.respondWith(
      caches.match(request)
      .then(function(response){
        // response from cache
        if(response)
          return response;

        const requestClone = request.clone();

        return fetch(requestClone).then(function(response){
          // console.log('Trying to chache', response.clone());
          // checking a valid response for caching
          if(!response || response.status !== 200 || response.type !== 'basic'){
            return response;
          }

          const responseClone = response.clone();
          // caching the pair request-response
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(request, responseClone);
          });

          return response;
        }).catch(err => console.log('ERROR FROM SW.JS:', err));
      }).catch(function(err){
        console.log('Error on cache.match:', err);
      })
    );
  }  
});

/**
 * Deleting old caches on ServiceWorker Update
 */
self.addEventListener('activate', function(evt){
  console.log('Activating ServiceWorker, Event:', evt);

  createDB(); // Creating Indexed Database

  evt.waitUntil(
    caches.keys().then(function(cacheNames){
      return Promise.all(
        cacheNames.map(cacheName => {
          if(cacheName.startsWith('restaurant-review') && cacheName != CACHE_NAME){
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
