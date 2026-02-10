const CACHE_NAME = 'private-notes-v1.0.1';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    'https://unpkg.com/lucide@latest'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.map((key) => key !== CACHE_NAME && caches.delete(key))
        ))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((res) => {
                const resClone = res.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    const url = event.request.url;
                    const isHttp = url.startsWith('http://') || url.startsWith('https://');
                    if (event.request.method === 'GET' && isHttp && !url.includes('google')) {
                        cache.put(event.request, resClone);
                    }
                });
                return res;
            })
            .catch(() => caches.match(event.request).then((res) => res))
    );
});
