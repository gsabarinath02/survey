// Service Worker for Nurse Survey PWA
// Enables offline functionality and background sync

const CACHE_NAME = 'nurse-survey-v1';
const STATIC_CACHE = 'nurse-survey-static-v1';
const DYNAMIC_CACHE = 'nurse-survey-dynamic-v1';

// Files to cache for offline use
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
];

// API routes to handle specially
const API_ROUTES = [
    '/api/questions',
    '/api/sessions',
    '/api/responses',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );

    // Activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );

    // Take control of all pages immediately
    self.clients.claim();
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests (let them go to network)
    if (request.method !== 'GET') {
        return;
    }

    // Handle API requests differently
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }

    // For page navigations, try network first, fall back to cache
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache the response for offline use
                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // If network fails, try cache
                    return caches.match(request).then((cached) => {
                        return cached || caches.match('/');
                    });
                })
        );
        return;
    }

    // For other assets, try cache first, fall back to network
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) {
                return cached;
            }

            return fetch(request).then((response) => {
                // Cache successful responses
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            });
        })
    );
});

// Handle API requests - cache GET, queue POST when offline
async function handleApiRequest(request) {
    const url = new URL(request.url);

    // For questions API, cache the response
    if (url.pathname === '/api/questions' || url.pathname.startsWith('/api/sessions')) {
        try {
            const response = await fetch(request);
            if (response.ok) {
                const cache = await caches.open(DYNAMIC_CACHE);
                cache.put(request, response.clone());
            }
            return response;
        } catch (error) {
            // If offline, return cached response
            const cached = await caches.match(request);
            if (cached) {
                return cached;
            }
            throw error;
        }
    }

    // For other API requests, just pass through
    return fetch(request);
}

// Background sync for queued responses
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync triggered:', event.tag);

    if (event.tag === 'sync-responses') {
        event.waitUntil(syncPendingResponses());
    }
});

// Sync pending responses from IndexedDB
async function syncPendingResponses() {
    console.log('[SW] Syncing pending responses...');

    // This will be handled by the storage.ts utilities
    // Just notify clients that sync is happening
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
        client.postMessage({
            type: 'SYNC_STATUS',
            status: 'syncing'
        });
    });
}

// Push notification support (for future use)
self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);

    const data = event.data?.json() || {};

    const options = {
        body: data.body || 'New notification from Nurse Survey',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [100, 50, 100],
        data: data.data || {},
        actions: data.actions || []
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Nurse Survey', options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);

    event.notification.close();

    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((clients) => {
            // Focus existing window if available
            for (const client of clients) {
                if (client.url.includes('/') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open new window
            if (self.clients.openWindow) {
                return self.clients.openWindow('/');
            }
        })
    );
});

// Message handler for client communication
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data.type === 'CACHE_QUESTIONS') {
        // Pre-cache questions for offline use
        caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put('/api/questions?role=nurse', new Response(JSON.stringify(event.data.questions)));
        });
    }
});
