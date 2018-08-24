let restaurants;
let neighborhoods;
let cuisines;
var map;
var markers = [];

/**
 * @desc Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  
  // For static map API to map API
  document.getElementById('map-container').onclick = loadMapAPI;  
});

/**
 * @desc Handle "Only favorites" checkbox
 * @param {object} target If it is set then is select as target element, else the target will be getted from event
 */
function handleOnlyFavorites(target=null){
  const checkbox = (target) ? target : event.target;
  const restaurantElms = document.querySelectorAll('#restaurant-list > li');
  const favoriteIds = self.restaurants.map(rest => {
    if(rest.is_favorite === 'true' || rest.is_favorite === true)
      return rest.id;
  }).filter(rest => typeof rest  !== 'undefined');

  if(checkbox.checked)
    restaurantElms.forEach(rest => {
      const restId = Number(rest.dataset.restaurantId);

      if(favoriteIds.indexOf(restId) === -1)
        rest.style.display = 'none';
    });
  else
    restaurantElms.forEach(rest => rest.style.removeProperty('display'));
}

/**
 * @desc Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * @desc Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('filters-neighborhood-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * @desc Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * @desc Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('filters-cuisine-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * @desc Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };

  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });

  addMarkersToMap();
  self.mapLoaded = true;
}

/**
 * @desc Update page and map for current restaurants.
 */
updateRestaurants = (event) => {
  const nSelect = document.getElementById('filters-neighborhood-select');
  const cSelect = document.getElementById('filters-cuisine-select');

  const nIndex = nSelect.selectedIndex;
  const cIndex = cSelect.selectedIndex;

  const neighborhood = nSelect[nIndex].value;
  const cuisine = cSelect[cIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  }).then(function(){
    addMarkersToMap()
    if(event && event.type === 'change' && !self.mapLoaded)
      loadMapAPI();
  });
}

/**
 * @desc Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurant-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * @desc Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  // check if there is any restaurant
  if(restaurants.length == 0){
    document.getElementById('no-restaurant-found').removeAttribute('hidden');
    return;
  }
  document.getElementById('no-restaurant-found').setAttribute('hidden', null);

  const ul = document.getElementById('restaurant-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });

  if(lazyload)
    lazyload.update();
}

/**
 * @desc Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  li.dataset.restaurantId = restaurant.id;

  const more = document.createElement('a');
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', `Read more about ${restaurant.name}'s restaurant`);
  li.append(more)

  const image = document.createElement('img');
  const images = DBHelper.imagesUrlForRestaurant(restaurant);

  image.className = 'restaurant-img';
  image.dataset.src = images.large; // default image

  // responsive images attributes
  image.dataset.srcset = `${images.medium} 460w, ${images.large} 2x`;
  image.sizes = '(min-width: 600px) 320px';
  image.classList.add('lazy');

  // alternative text for better accesibility
  image.alt = `An image of restaurant ${restaurant.name}`;

  more.append(image);
  
  // cuisine type
  const cuisine = document.createElement('span');
  cuisine.className = 'cuisine-type';
  cuisine.setAttribute('aria-label', 'Cuisine type');
  cuisine.innerHTML = restaurant.cuisine_type;
  more.append(cuisine);

  // restaurant info
  const info = document.createElement('div');
  info.className = "restaurant-info";
  more.append(info);

  // restaurant name
  const name = document.createElement('h2');
  name.classList.add('restaurant-name');
  name.innerHTML = restaurant.name;
  name.setAttribute('aria-label', 'Restaurant name');
  info.append(name);

  // neighborhood
  const neighborhood = document.createElement('span');
  neighborhood.className = "restaurant-neighborhood";
  neighborhood.innerHTML = restaurant.neighborhood;
  neighborhood.setAttribute('aria-label', 'Restaurant neighborhood');
  info.append(neighborhood);

  // address
  const address = document.createElement('span');
  address.className = "restaurant-address";
  address.innerHTML = restaurant.address;
  address.setAttribute('aria-label', 'Restaurant address');
  info.append(address);

  // favorite
  const favorite = document.createElement('div');
  favorite.classList.add('favorite');
  // fix error on saved format on backend server
  const isFavorite = (restaurant.is_favorite === true || restaurant.is_favorite === 'true'); 
  favorite.innerHTML = (isFavorite) ? '♥' : '♡';
  favorite.onclick = handleFavoriteClick; // From responsive.js (common script)
  li.append(favorite);

  return li
}

/**
 * @desc Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  if(typeof restaurants === 'undefined' || typeof google === 'undefined')
    return;

  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

updateRestaurants();

// Working with Google Static Map API
//function addStaticMap(){
//  const url = "https://maps.googleapis.com/maps/api/staticmap?";
//  const params = new URLSearchParams();
//  const key = "AIzaSyDS55fy6liCeRXsveBpo3TPwjsN5w9eWh0";
//
//  params.set('center', '40.722216,-73.987501');
//  params.set('zoom', '12');
//  params.set('size', '500x300');
//  params.set('key', key);
//  
//  if(self.restaurants)
//    self.restaurants.forEach(rest => {
//      const position = `${rest.latlng.lat},${rest.latlng.lng}`;
//      params.append('markers', position);
//    });
//
//  console.log(url + params.toString());
//  const staticMap = document.getElementById('static-map');
//  staticMap.src = url + params.toString();
//}

/**
 * @async Load Google Map API dinamically
 */
function loadMapAPI(){
  if(self.mapLoaded)
    return;

  const mapScript = document.getElementById('map-script');
  const mapContainer = document.getElementById('map-container');
  mapContainer.classList.remove('noloaded');
  mapScript.src = mapScript.dataset.src;
}          

