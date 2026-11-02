const CACHE='better-daze-v6-20261102-panda-launch-5';
const ASSETS=['./','./index.html','./app.js','./app.css','./panda-v2.png','./apple-touch-icon-v2.png','./icon-192-v2.png','./icon-512-v2.png','./manifest.webmanifest','./icon.svg','./audio/startup.mp3','./audio/today.mp3','./audio/sleep.mp3','./audio/move.mp3','./audio/work.mp3','./audio/review.mp3'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('better-daze-v6-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(async()=>{const cached=await caches.match(e.request);if(cached)return cached;if(e.request.mode==='navigate')return caches.match('./index.html');return Response.error()}))});

