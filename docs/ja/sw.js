const CACHE_NAME="2025-04-06 01:35",urlsToCache=["/plot-icon/","/plot-icon/ja/","/plot-icon/index.js","/plot-icon/mp3/boyon1.mp3","/plot-icon/mp3/pa1.mp3","/plot-icon/mp3/papa1.mp3","/plot-icon/mp3/levelup1.mp3","/plot-icon/favicon/favicon.svg"];self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(e=>e.addAll(urlsToCache)))}),self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(t=>t||fetch(e.request)))}),self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(e=>Promise.all(e.filter(e=>e!==CACHE_NAME).map(e=>caches.delete(e)))))})