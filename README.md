# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 3

Project made for **Udacity Mobile Web Specialist Certification Course** by **romerixo**.

### Considerations
- The project is only tested on ***Google Chrome***.
- The format used for the images is **WebP** which is unsupported by ***Mozilla Firefox*** and [others](https://caniuse.com/#feat=webp).
- Offline capabilities are performed with IndexedDB API through [Jake Archibald's IndexedDB Promised library](https://github.com/jakearchibald/idb). This is done with the **Service Worker** in `sw.js`.

## Prequisites

* Clone or download from my repo [Project-Restaurant-Review](https://github.com/romerixo/Project-Restaurant-Review).
```
git clone https://github.com/romerixo/Project-Restaurant-Review.git
```

* Clone or download from my repo [mws-restaurant-stage-3](https://github.com/romerixo/mws-restaurant-stage-3).
```
git clone https://github.com/romerixo/mws-restaurant-stage-3.git.
```

* Instal a **HTTP Server** that supports **gzip encode**, e.g [http-server]( https://www.npmjs.com/package/http-server).
```
npm install -g http-server
```

## Installing

1. Install and run the backend server API [mws-restaurant-stage-3](https://github.com/romerixo/mws-restaurant-stage-3#development-local-api-server)

2. From `Project-restaurant-Review` folder install dependencies.
```
npm i
```

3. Build the project in **develpment mode** with `gulp`.
```
gulp build
```

4. You can also to use the **production mode**.
```
gulp build:dist
```

5. Run `http-server` to start the **App**.
     - **Development mode**, from the root directory (`/`).
     ```
     http-server -p80
     ```
     - **Production mode**, inside _dist_ folder (`/dist`), note `-g` flag for enable _gzip_ encode.
     ```
     http-server -p80 -g
     ```
6. Open with _Google Chrome_ <http://localhost:80>.


### Note Backend Server
You will need to use the backend server from my repository <https://github.com/romerixo/mws-restaurant-stage-3> since I modified the file `localDiskDb.db` from `.tmp` folder. You can simply replace the file in your backend server with mine (<https://github.com/romerixo/mws-restaurant-stage-3/blob/master/.tmp/localDiskDb.db>).

