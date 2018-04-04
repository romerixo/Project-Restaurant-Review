const CACHE_NAME = 'restaurant-review-cache-v1';
const urlsToCache = [
    '/',
    '/data/restaurants.json',
    '/css/responsive.css',
    //'/css/styles.css', <-- old file
    '/js/dbhelper.js',
    '/js/main.js',
    '/js/responsive.js',
    '/js/restaurant_info.js',
    '/index.html',
    '/restaurant.html'
];

/**
 * Caching static elements on ServiceWorker installation
 */
self.addEventListener('install', function(evt){
    console.log('Installing ServiceWorker');

    evt.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache){
                return cache.addAll(urlsToCache);
            })
    );
});


/**
 * Return cached requests and add new resources that are not cached (like images)
 */
self.addEventListener('fetch', function(evt){
    console.log('Fetch event:', evt);

    evt.respondWith(
        caches.match(evt.request)
            .then(function(response){
                // response from cache
                if(response)
                    return response;

                const requestClone = evt.request.clone();

                return fetch(requestClone).then(function(response){
                    //console.log('Trying to chache', response.clone());
                    // checking a valid response for caching
                    if(!response || response.status !== 200 || response.type !== 'basic'){
                        console.log('Response fail: ', response);
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
                console.log('Error:', err);
            })
    );
});

/**
 * Deleting old caches on ServiceWorker Update
 */
 self.addEventListener('activate', function(evt){
    console.log('Activating ServiceWorker, Event:', evt);

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