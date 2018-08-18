let restaurant;
var map;

/**
 * Initialize Google map, called from HTML. (Fix for offline access)
 */
window.initMap = () => {
  if(self.restaurant){
    self.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 16,
      center: self.restaurant.latlng,
      scrollwheel: false
    });
    DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
  }
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  // Image title (figcaption)
  const figcaption = document.querySelector('#restaurant-img + figcaption');
  figcaption.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  const images = DBHelper.imagesUrlForRestaurant(restaurant); //URLs

  // responsive images attributes
  image.src = images.large;
  image.srcset = `
    ${images.medium} 460w, 
    ${images.large} 900w, 
    ${images.large_2x} 1600w`;

  image.sizes = '(min-width: 950px) 700px';

  // alternative text for better accesibility
  image.alt = `Restaurant ${restaurant.name}`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML(restaurant.id);
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (restaurantId) => {
  const ul = document.getElementById('reviews-list');
  while(ul.firstChild)
    ul.removeChild(ul.firstChild);

  DBHelper.fetchRestaurantReviews(restaurantId)
  .then(reviews => {
     if(!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      ul.appendChild(noReviews);
      return;
    } 
    
    // Sort reviews
    reviews.sort((a, b) => {
      if(a.createdAt > b.createdAt)
        return -1;
      else
        return 1;
    });

    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
  });
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const revRating = Number(review.rating);
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.setAttribute('aria-label', 'Author\'s name');
  li.appendChild(name);

  const date = document.createElement('p');
  // review.createdAt can fallback
  const dateValue = review.createdAt || Date.now();
  date.innerHTML = new Date(dateValue).toLocaleDateString("en-US", {month: 'long', day: 'numeric', year: 'numeric'});
  date.setAttribute('aria-label', 'Date of review publication');
  li.appendChild(date);

  const rating = document.createElement('p');
  let ratingStars = '';
  let ariaLabel = '';

  switch(revRating){
    case 1:
      ratingStars = '★☆☆☆☆';
      ariaLabel = 'Rating one out off five stars';
      break;
    case 2:
      ratingStars = '★★☆☆☆';
      ariaLabel = 'Rating two out off five stars';
      break;
    case 3:
      ratingStars = '★★★☆☆';
      ariaLabel = 'Rating three out off five stars';
      break;
    case 4:
      ratingStars = '★★★★☆';
      ariaLabel = 'Rating four out off five stars';
      break;
    case 5:
      ratingStars = '★★★★★';
      ariaLabel = 'Rating five out off five stars';
      break;
  }

  rating.innerHTML = ratingStars;
  rating.setAttribute('aria-label', ariaLabel);
  rating.title = ariaLabel;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.setAttribute('aria-label', 'Review');
  li.appendChild(comments);

  const deleteBtn = document.createElement('button');
  deleteBtn.innerHTML = 'Delete review';
  deleteBtn.onclick = () => {
    DBHelper.deleteReview(review.id).then(() => {
      window.alert('The review has been deleted!');
      fillReviewsHTML(self.restaurant.id);
    }).catch(err => {
      console.log(err);
    });
  };
  li.appendChild(deleteBtn);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Fix load restaurant when offline
 */
fetchRestaurantFromURL((error, restaurant) => {
  if(error)
    console.log(error);
  
  self.restaurant = restaurant;
  fillBreadcrumb();
});

/********************************************************************************
 * New review form **************************************************************
 *******************************************************************************/
self.newReviewRating = 1; // Default value
const rating = document.getElementById('new-review-rating');
const stars = rating.querySelectorAll('#new-review-rating li');

/**
 * @desc Used for add a SIMPLE review returned from the API SERVER
 */
function addNewReview(review){
  const ul = document.getElementById('reviews-list');
  ul.insertBefore(createReviewHTML(review), ul.firstChild);
}

/**
 * @description Handle function for new review form on SUBMIT event.
 */
function handleNewReview(){
  event.preventDefault();

  const author = document.getElementById('new-review-author');
  const comment = document.getElementById('new-review-comment');

  const data = {};
  data.name = author.value.trim();
  data.comments = comment.value.trim();
  data.rating = self.newReviewRating;
  data.restaurant_id = self.restaurant.id;
  data.createdAt = Date.now();

  // check empty data
  if(!data.name || !data.comments){
    window.alert('Error, empty data, please fill the fields');
    return;
  }

  console.log('Data for newReview:', data);
  DBHelper.newReview(data).then(res => {

    if(res.status === 201){
      window.alert('New review has been created successfully!');
      res.json().then(review => addNewReview(review)); // Add new returned review
    }
    else if(res.status === 200){
      window.alert('Connection error, the review will be sended when the Network available');
      res.json().then(review => addNewReview(review)); // Add new returned review
      
      // Send sync request to update when conecction is available
      if('serviceWorker' in navigator && 'SyncManager' in window){
        console.log("Enviando evento sync...");
        navigator.serviceWorker.ready.then(function(reg) {
          return reg.sync.register('pending-reviews')
          .then(e=>console.log('el evento se registro con exito'));
        }).catch(function() {
          // system was unable to register for a sync,
          // this could be an OS-level restriction
          console.log("...error en el envio del evento sync");
        });
      }
    }
  })

  // Cleaning inputs
  author.value = '';
  comment.value = '';
  // restart the rating
  const stars = document.querySelectorAll("#new-review-rating li");
  stars.forEach(star => {
    if(star.dataset.rating !== '1')
      star.classList.remove('fill');
  });
  self.newReviewRating = 1;

}

/**
 * Rate selector behaviour
 */
rating.onclick = () => {
  self.newReviewRating = event.target.dataset.rating;
  for(const star of stars){
    if(star.dataset.rating <= self.newReviewRating)
      star.classList.add('fill');
    else
      star.classList.remove('fill');
  }
}
