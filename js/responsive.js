/**
 * ServiceWorker registration
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
 * btn-show-map toogle to hidden
 */
function mapToggleHidden(){
  const mapContainer = document.getElementById('map-container-restaurant');
  mapContainer.classList.toggle('hidden-map');
}


/**
 * Fixed on top when element off screen on scrolling
 */
function keepOnTop(elm, nextElm, fullWidth){
  // top position of the element on CLIENT (< 0 begin no visible)
  const elementTop = elm.offsetTop;
  const __check = function(){
    const elementClientTop = elm.getBoundingClientRect().top;

    // checking if isn't full visible
    if(elementClientTop < 0){
      elm.classList.add('fixed');
      nextElm.classList.add('fixed-margined');
    }
    if((window.innerWidth >= 600 && !fullWidth) || window.scrollY < elementTop){
      elm.classList.remove('fixed');
      nextElm.classList.remove('fixed-margined');
    }
  }

  window.onscroll = __check;
  window.onresize = __check;
}

const filters = document.getElementById('filters');
const nextToFilters = document.getElementById('map-container');

const breadcrumb = document.getElementById('breadcrumb');
const nextToBreadcrumb = document.getElementById('maincontent-restaurant');

if(filters)
  keepOnTop(filters, nextToFilters);
if(breadcrumb)
  keepOnTop(breadcrumb, nextToBreadcrumb, true);

/**
 * Auxiliar class to help control focus
 */
class Focus{
  constructor(){
    this._query = `
            a[href]:not([tabindex='-1']),
            area[href]:not([tabindex='-1']),
            input:not([disabled]):not([tabindex='-1']),
            select:not([disabled]):not([tabindex='-1']),
            textarea:not([disabled]):not([tabindex='-1']),
            button:not([disabled]):not([tabindex='-1']),
            iframe:not([tabindex='-1']),
            [tabindex]:not([tabindex='-1']),
            [contentEditable=true]:not([tabindex='-1'])
        `;

    this.reload = false; // reload focusables on every event
    this._loadFocusables(); // storaged on: this.focusables
    this.focIndex = 0; // actual focus index
    this.removedElements = [];

    this.callback = function(evt){
      if(evt.keyCode != 9) // check tab key
        return;

      if(this.reload)
        this._loadFocusables();

      const ascendant = evt.shiftKey;
      let target = evt.target;

      this.focIndex = this.focusables.indexOf(target);
      target = this.nextFocusable(ascendant);

      for(let i = 0; i < this.focusables.length; i++){
        if(this._wasRemoved(target))
          target = this.nextFocusable(ascendant);
        else{
          target.focus();
          break;
        }
      }

      evt.preventDefault();
    }
  }

  // return next focusable element (could be a removed element)
  //     asc: ascendant or not
  nextFocusable(asc){
    this.focIndex = asc ? this.focIndex-1 : this.focIndex+1;

    if(this.focIndex < 0)
      this.focIndex = this.focusables.length - 1;

    if(this.focIndex >= this.focusables.length)
      this.focIndex = 0;

    return this.focusables[this.focIndex];
  }

  _loadFocusables(){
    this.focusables = Array.from(document.querySelectorAll(this._query))
      .filter(elm => {
        const css = window.getComputedStyle(elm);
        return css.display != "none" && css.visibility != "hidden";});

    // .filter(): remove from focusables or add to removes elements with 
    // display:none and visibility hidden (computedStyles)
  }
  // was removed from focus 
  _wasRemoved(target){
    return !this.removedElements.every(
      elm => !elm.contains(target) && elm != target);
  }

  remove(elm){
    if(Array.isArray(elm))
      this.removedElements.push(...elm);
    else
      this.removedElements.push(elm); 
  }

  start(){
    this._loadFocusables();
    document.addEventListener('keydown', this.callback.bind(this));
  }

  stop(){
    document.removeEventListener('keydown', this.callback);
  }
}


/**
 * @desc Controlling the FOCUS
 */
const focus = new Focus();
focus.reload = true;
focus.remove(document.getElementById('map'));
focus.start();

/**
 * @desc Handling offline state on the App
 */
function handleOffline(){
  const offline = document.getElementById('offline');
  offline.classList.add('offline');
  window.alert('Network is not available!');
}

window.addEventListener('offline', handleOffline);

window.addEventListener('online', function(){
    const offline = document.getElementById('offline');
    offline.classList.remove('offline');
});

