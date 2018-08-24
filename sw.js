self.importScripts('js/idb.js');

let dbPromise = null;
const API_HOST = 'http://localhost:1337';
const API_URL_REVIEWS = `${API_HOST}/reviews`;
const CACHE_NAME = 'restaurant-review-cache-v1';
const DB_NAME = 'offline-data';
const DB_VERSION = 1; 
const urlsToCache = [
  '/',
  '/js/dbhelper.js',
  '/js/index.js',
  '/js/common.js',
  '/css/common.css',
  '/js/restaurant.js',
  '/js/idb.js',
  '/index.html',
  '/restaurant.html'
];

// Db Helpers ****************************************************************** 

/**
 * @desc Make DB
 */
function createDB(){
  // create-open indexedDB
  idb.open(DB_NAME, DB_VERSION, upgradeDB => {
    // creating store
    //upgradeDB.createObjectStore('json-data', {keyPath: 'path'});
    upgradeDB.createObjectStore('reviews');
    upgradeDB.createObjectStore('pending-reviews', {autoIncrement: true});
    upgradeDB.createObjectStore('restaurants', {keyPath: 'id'});
  });

  console.log('db created!');
}

/**
 * @desc Open db
 * @return {Promise} Opened Db
 */
function openDB(){
  return idb.open(DB_NAME, DB_VERSION);
}

/**
 * @description Return a promise with the Response object (restaurant JSON) or null if not exist.
 * 
 * @param {Promise} dbPromise Promise with the opened DB
 * @param {String} url Path as key
 * @return {Promise} Promise with <Response | null>
 */
function getJSONDB(dbPromise, url){
  const path = url.pathname + url.search;

  return dbPromise.then(db => 
    db.transaction('json-data').objectStore('json-data').get(path))
      .then(data => {
        if(typeof data === 'undefined')
          return null;

        return data.json;  
      });
}

function addRestauratnDB(dbPromise, restaurant){
  return dbPromise.then(db => {
    const store = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
    return store.put(restaurant);
  });
}

function getRestaurantDB(dbPromise, id=null){
  return dbPromise.then(db => {
    const store = db.transaction('restaurants').objectStore('restaurants');

    if(id)
      return store.get(id);

    return store.getAll();
  });
}

/**
 * @description Add entry to IndexedDB with the path and the response obtained from the fetch API
 * @param {object} dbPromise Promise with the opened DB
 * @param {string} url Url from request
 * @return {object} Return a promise if the transaction was successful
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
 * @desc Update Restaurant on IDB
 * @param {object} dbPromise Opened db
 * @param {object} restaurant New estaurant to update (use restaurant.id as primary key)
 */
function updateRestaurantDb(dbPromise, restaurant){
  return dbPromise.then(db => {
    const store = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
    return store.put(restaurant);
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
      // UPDATING AN EXISTENT REVIEWS
      if(!reviewsDb)
        reviewsDb = [];
      
      reviewsDb = reviewsDb.concat(reviews);
      tx.objectStore('reviews').put(reviewsDb, resId);
    })

    return tx.complete;
  });
}

/**
 * @desc Get reviews sotred in db by restaurant id
 * @param {object} dbPromise Promise with opened Db
 * @param {number} resId Restaurant id
 */
function getReviewsDB(dbPromise, resId){
  return dbPromise.then(db => 
    db.transaction('reviews').objectStore('reviews').getAll()
    .then(data => {
      if(data.length)
        data = data[0].filter(rev => rev.restaurant_id === resId);

      return data;
    })
  );
}

/**
 * @desc Get all reviews from Db
 * @param {object} dbPromise Promise with the opened Db
 * @param {number} resId Restaurant id
 */
async function getAllReviewsDB(dbPromise, resId){
  let reviews = await getReviewsDB(dbPromise, resId);
  reviews.concat(await getPendingReviews(dbPromise, resId));

  return reviews;
}

// Pending Reviews ***************************************************************
/**
 * @desc Add review into pending-reviews store to send it afterwards
 * @param {object} dbPromise opened Db
 * @param {object} review review to save
 */
function addPendingReview(dbPromise, review){
  return dbPromise.then(db => {
    const tx = db.transaction('pending-reviews', 'readwrite');
    tx.objectStore('pending-reviews').put(review);

    return tx.complete;
  });
}

/**
 * @desc Get all pending reviews if resId is null, else get by restaurant id
 * @param {object} dbPromise opened Db
 * @param {object} resId restaurant ID
 */
function getPendingReviews(dbPromise, resId=null){
  return dbPromise.then(db => {
    const objectStore = db.transaction('pending-reviews').objectStore('pending-reviews');

    return objectStore.getAll().then(reviews => {
      if(reviews && resId)
        reviews = reviews.filter(rev => {
          return rev.restaurant_id === resId;
        });

      return reviews;
    })
  });
}


/**
 * @desc delete pending review register by primary key
 * @param {object} dbPromise Opened database
 * @param {number} key Primary key
 */
function deletePendingReview(dbPromise, key){
  return dbPromise.then(db => {
    const objectStore = db.transaction('pending-reviews', 'readwrite').objectStore('pending-reviews');

    return objectStore.delete(key);
  });
}


/**
 * @desc Get primary keys from pending reviews store
 * @param {object} dbPromise Opened database
 */
function getPendingReviewsKeys(dbPromise){
  return dbPromise.then(db => {
    const objectStore = db.transaction('pending-reviews').objectStore('pending-reviews');

    return objectStore.getAllKeys().then(keys => {
      if(keys)
        return keys;
    })
  });
}

// End Pending Reviews *********************************************************


// Caching static elements on ServiceWorker installation
self.addEventListener('install', function(evt){
  console.log('Installing ServiceWorker:', evt);
  
  evt.waitUntil(
    caches.open(CACHE_NAME)
    .then(cache => cache.addAll(urlsToCache))
  );

});


// Event sync is fired when a new review is created, checking old pending reviews for sending.
self.addEventListener('sync', function(evt){
  const dbPromise = openDB();
  if(evt.tag === 'pending-reviews'){
    console.log('Trying to send pending reviews...');
    
    evt.waitUntil(
      getPendingReviews(dbPromise).then(async pReviews => {
        const pKeys = await getPendingReviewsKeys(dbPromise);

        if(!pReviews || !pKeys){
          throw new Error('No pending reviews to send');
        }

        for(let i = 0; i < pReviews.length; i++){
          const response = await fetch(API_URL_REVIEWS, {
            method: 'POST',
            body: JSON.stringify(pReviews[i]),
            headers: {'Content-type': 'application/json'}
          });

          if(response.status === 201){
            // save review on reviews DB
            response.json().then(review => addReviews(dbPromise, review));

            // delete review from pending reviews on DB
            deletePendingReview(dbPromise, pKeys[i]);
            console.log("Pending review sended successfully!");
          }
          else{
            console.log('Fail to create pending review from API');
            return response;
          }

        }
      })
    );
  }
});


// Fetch event handling request
self.addEventListener('fetch', function(evt){
  const dbPromise = openDB();
  const request = evt.request;
  const url = new URL(request.url);

  // checking url for restaurant API
  if(url.origin === API_HOST){
    
    // [POST] Match when creating new Review
    if(request.method === 'POST' && url.pathname ==='/reviews' && !url.search){
      evt.respondWith(
        new Promise(function(resolve, reject){
          const fetchPromise = fetch(request.clone()).then(response => {
            if(response.status === 201){  // valid response
              response.clone().json().then(review => {
                addReviews(dbPromise, review); // Add review to IDB
              });
            }

            resolve(response);
          });

          fetchPromise.catch(() => {
            request.json().then(review => {
               addPendingReview(dbPromise, review);
                                                                              
               resolve(new Response(JSON.stringify(review)));
            });
          });
        })
      );
    }

    // [GET] Reviews by restaurant ID
    else if(request.method == 'GET' && url.pathname === '/reviews/' && /restaurant_id=\d+/.test(url.search)){
      const resId = Number(url.search.match(/=(\d+)/)[1]); // Getting restaurant ID

      evt.respondWith(
        getReviewsDB(dbPromise, resId)
        .then(async reviews => {
          console.log("Reviews on [GET]:", reviews)
          if(!reviews.length){
            try{
              reviewsRes = await fetch(request);
              reviews = await reviewsRes.json();
              addReviews(dbPromise, reviews); // Adding new reviews to IDB!
            }catch (err){
              console.log("Error FETCHING reviews from API!");
              reviews = [];
            }
          }

          const pendingReviews = await getPendingReviews(dbPromise, resId);
          if(pendingReviews)
            reviews = reviews.concat(pendingReviews);

          return new Response(JSON.stringify(reviews));
        })
      );
    }
    // [PUT] Favorite restaurants bypass cache
    else if(request.method === 'PUT' &&
      /\/restaurants\/\d+\/\?is_favorite=(true|false)/.test(url.pathname + url.search)){ 
      evt.respondWith(
        fetch(request).then(response => {
          if(response.status === 200)
            response.clone().json()
            .then(restaurant => updateRestaurantDb(dbPromise, restaurant));

          return response;
        })
      );
    }
    // [GET] All restaurants
    else if(request.method === 'GET' && /\/restaurants\/*$/.test(url.pathname)){
      console.log("Geting all restaurants");
      evt.respondWith(
        getRestaurantDB(dbPromise).then(restaurants => {
          if(restaurants.length)
            return new Response(JSON.stringify(restaurants));

          // Fetch, caching and return
          return fetch(request).then(response => {
            if(response.status === 200){
              response.clone().json().then(restaurants => {
                restaurants.forEach(rest => addRestauratnDB(dbPromise, rest));
              })
            }
            return response;
          }).catch(err => console.log('ERROR FROM SW.JS:', err));
        })
      );
    }
    // [GET] Restaurant by ID
    else if(request.method === 'GET' && /\/restaurants\/\d+\/*$/.test(url.pathname)){
      const id = Number(url.pathname.match(/\/(\d+)/)[1]);
      evt.respondWith(
        getRestaurantDB(dbPromise, id).then(restaurant => {
          if(restaurant){
            console.log('respondiendo desde la BD');
            return new Response(JSON.stringify(restaurant));            
          }

          const urlRestaurants = url.toString().match(/(.*)\/\d+\/*$/)[1];

          return fetch(urlRestaurants).then(response => {
            if(response.status === 200){
              return response.clone().json().then(restaurants => {
                restaurants.forEach(rest => addRestauratnDB(dbPromise, rest)); // add restaurants to DB

                const restaurant = restaurants.find(rest => rest.id === id);
                console.log(restaurant);
                return new Response(JSON.stringify(restaurant));
              })
            }
          }).catch(err => console.log('ERROR FROM SW.JS:', err));

        })
      );
    }
  }
else{
    evt.respondWith(
      caches.match(request)
      .then(function(response){
        // response from cache
        if(response)
          return response;

        const requestClone = request.clone();

        return fetch(requestClone).then(function(response){
          
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


// Deleting old caches on ServiceWorker Update
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

