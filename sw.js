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
    });

    console.log('db created!');
}

function openDB(){
    return idb.open(DB_NAME, DB_VERSION);
}

/**
* Return a promise with the Response object (restaurant JSON) or null if not exist.
* 
* @param {Promise} dbPromise - Promise with the opened DB
* @param {String} pathname
* @return {Promise} - Promise with <Response | null>
*/
function getJSONDB(dbPromise, pathname)
{
    return dbPromise.then(db => 
        db.transaction('json-data').objectStore('json-data').get(pathname))
        .then(data => {
            console.log(data);
            if(typeof data === 'undefined')
                return null;
            
            return data.json;  
        });
}

/**
 * Add entry to IndexedDB with the path and the response obtained from the fetch API
 *
 * @param {Promise} dbPromise - Promise with the opened DB
 * @param {String} pathname - 
 * @param {Blob} response 
 * @return {Promise} - Return a promise if the transaction was successful
 */
function addJSONDB(dbPromise, pathname, json){
    return dbPromise.then(db => {
        const tx = db.transaction('json-data', 'readwrite');
        tx.objectStore('json-data')
        .put({path: pathname, json: json});

        return tx.complete;
    });
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
 * Return cached requests and add new resources that are not cached (like images)
 */
self.addEventListener('fetch', function(evt){
    const url = new URL(evt.request.url);
    
    // checking url for restaurant API
    if(url.origin === API_HOST){
        const dbPromise = openDB(); // opening database

        evt.respondWith(
            getJSONDB(dbPromise, url.pathname).then(json => {
                if(json){
                    console.log('RESPONDING JSON FROM DB');
                    return new Response(JSON.stringify(json));
                }
                
                return fetch(evt.request).then(response => {
                    console.log('RESPONDING JSON FROM FETCH:', response);
                    const response2 = response.clone();

                    // adding new JSON response to DB
                    if(response2.status === 200)
                        response2.json().then(json => addJSONDB(dbPromise, url.pathname, json));
                    
                    return response;
                });
            })
        );
    }else{
        evt.respondWith(
            caches.match(evt.request)
                .then(function(response){
                    // response from cache
                    if(response)
                        return response;

                    const requestClone = evt.request.clone();

                    return fetch(requestClone).then(function(response){
                        // console.log('Trying to chache', response.clone());
                        // checking a valid response for caching
                        if(!response || response.status !== 200 || response.type !== 'basic'){
                            return response;
                        }

                        const responseClone = response.clone();
                        // caching the pair request-response
                        caches.open(CACHE_NAME).then(function(cache){
                            cache.put(evt.request, responseClone);
                        });

                        return response;
                    });
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
