/**
 * @desc Service worker registration
 */
if('serviceWorker' in navigator){
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('/sw.js').then(function(registration){
      // registration successful
      console.log(`ServiceWorker was registred with scope ${registration.scope}`);
    }).catch(function(err){
      // registration failed
      console.log('ServiceWorker registration failed:', err);
    });

  });
}

/**
 * @desc Handling offline state on the App
 */
function handleOffline(){
  const offline = document.getElementById('offline');
  offline.classList.add('offline');
  window.alert('Network is not available!');
}


/**
 * @desc Handle Favorite button click
 */
function handleFavoriteClick(){
  const target = event.target;
  const restaurantId = (self.restaurant) ?
    self.restaurant.id : Number(target.parentNode.dataset.restaurantId); // Restaurant id
  const restaurant = self.restaurant || self.restaurants.find(res => res.id === restaurantId);
  const favorite = !(restaurant.is_favorite === true || restaurant.is_favorite === 'true') // set the opposite
  const onlyFavorite = document.getElementById('onlyfavorites');

  DBHelper.setFavorite(restaurantId, favorite)
  .then(response => {
    if(response.status === 200){
      restaurant.is_favorite = favorite;
      target.innerHTML = favorite ?  '♥ ' : '♡';
      if(!onlyFavorite)
        return;

      if(!favorite && onlyFavorite.checked)
        handleOnlyFavorites(onlyFavorite);
    }
  })
  .catch(() => {
    window.alert('Connection error!');
  });
}

//******************************************************************************
// MAIN ************************************************************************
//******************************************************************************

window.addEventListener('offline', handleOffline);
window.addEventListener('online', function(){
    const offline = document.getElementById('offline');
    offline.classList.remove('offline');
});

