# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 3

- The project is only tested on ***Google Chrome***.
- The format used for the images is **WebP** which is unsupported by ***Mozilla Firefox*** and [others](https://caniuse.com/#feat=webp).
- Offline capabilities are performed with IndexedDB API through [Jake Archibald's IndexedDB Promised library](https://github.com/jakearchibald/idb). This is done with the **Service Worker** in `sw.js`.

## Set Up
1. Clone or download from my repo [Project-Restaurant-Review](https://github.com/romerixo/Project-Restaurant-Review) with `git clone https://github.com/romerixo/Project-Restaurant-Review.git`.

2. Clone or download from my repo [mws-restaurant-stage-3](https://github.com/romerixo/mws-restaurant-stage-3) with `git clone https://github.com/romerixo/mws-restaurant-stage-3.git`.

3. Set up **backend Server**, go to `mws-restaurant-stage-3` folder and run `node server`.

4. In a terminal inside `Project-Restaurant-Review`, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 80` (or some other port, if port 80 is already in use.) For Python 3.x, you can use `python3 -m http.server 80`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

5. With both servers running (_Project-Restayrabt-Review_ and _backend API server_), visit the site: `http://localhost:80`. 

### Note Backend Server
You will need to use the backend server from my repository <https://github.com/romerixo/mws-restaurant-stage-3> since I modified the file `localDiskDb.db` from `.tmp` folder. You can simply replace the file in your backend server with mine (<https://github.com/romerixo/mws-restaurant-stage-3/blob/master/.tmp/localDiskDb.db>).

