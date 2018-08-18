/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  // ( OLD )
  //  static get DATABASE_URL() {
  //   const port = 80 // Change this to your server port

  //   return `http://localhost:${port}/data/restaurants.json`;
  // }

  static get PORT() {
    return 1337;
  }

  static get API_URL() {
    return `http://localhost:${DBHelper.PORT}`;
  }

  static get RESTAURANTS_URL() {
    return `${DBHelper.API_URL}/restaurants`;
  }

  static get REVIEWS_URL() {
    return `${DBHelper.API_URL}/reviews`;    
}

  // ( OLD )  
  // /**
  //  * Fetch all restaurants.
  //  */
  // static fetchRestaurants(callback) {
  //   let xhr = new XMLHttpRequest();
  //   xhr.open('GET', DBHelper.DATABASE_URL);
  //   xhr.onload = () => {
  //     if (xhr.status === 200) { // Got a success response from server!
  //       const json = JSON.parse(xhr.responseText);
  //       const restaurants = json.restaurants;
  //       callback(null, restaurants);
  //     } else { // Oops!. Got an error from server.
  //       const error = (`Request failed. Returned status of ${xhr.status}`);
  //       callback(error, null);
  //     }
  //   };
  //   xhr.send();
  // }

  /**
   * Fetch all restaurants from Server API with fetch().
   */
  static fetchRestaurants(callback) {
    return fetch(DBHelper.RESTAURANTS_URL)
    .then(res => {
      if(res.status === 200)
        return res.json();
      else
        callback(`Request failed. Returned status of ${res.status}`, null);
    })
    .then(json => callback(null, json)); // json = Restaurants on JSON format
  }

  // ( OLD )
  // /**
  //  * Fetch a restaurant by its ID.
  //  */
  // static fetchRestaurantById(id, callback) {
  //   // fetch all restaurants with proper error handling.
  //   DBHelper.fetchRestaurants((error, restaurants) => {
  //     if (error) {
  //       callback(error, null);
  //     } else {
  //       const restaurant = restaurants.find(r => r.id == id);
  //       if (restaurant) { // Got the restaurant
  //         callback(null, restaurant);
  //       } else { // Restaurant does not exist in the database
  //         callback('Restaurant does not exist', null);
  //       }
  //     }
  //   });
  // }

  /**
   * Fetch a restaurant by its ID using Server API.
   */
  static fetchRestaurantById(id, callback) {
    return fetch(`${DBHelper.RESTAURANTS_URL}/${id}`)
    .then(res => {
      if(res.status === 200)
        return res.json();
      else
        callback('Restaurant does not exist', null);
    })
    .then(restJson => callback(null, restJson)); // resJson = Restaurant with id (param) on JSON format
  }

  /**
   * @param {number} id Restaurant id
   */
  static fetchRestaurantReviews(id){
    return fetch(`${DBHelper.REVIEWS_URL}/?restaurant_id=${id}`)
    .then(res => {
      if(res.status === 200)
        return res.json();
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL. (modified)
   */
  static imagesUrlForRestaurant(restaurant) {
    let images = restaurant.photograph;
    
    // add img folder path
    if(typeof images == 'object'){
      Object.keys(images).map(key => {
        images[key] = 'img/' + images[key];
      });
    }
    else
      images = 'img/' + images; // if is a single URL

    return (images);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );

    return marker;
  }

  /**
   * @desc Create a new review
   * @param {object} data Review data with de values:
   *  - restaurant_id
   *  - name
   *  - comments
   *  - rating
   */
  static newReview(data){
    return fetch(DBHelper.REVIEWS_URL, {
      method: 'POST',
      body: JSON.stringify(data)
    })
    .catch(err => {
      console.log("Error on DBHelper:", err);
    });
  }

  static deleteReview(reviewId){
    return fetch(`${DBHelper.REVIEWS_URL}/${reviewId}`, {
      method: 'DELETE'
    });
  }
}
