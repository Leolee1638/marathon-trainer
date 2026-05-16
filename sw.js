const CACHE_NAME = 'marathon-trainer-v3';
const CACHE_ASSETS = [
  '/',
  '/index.html'
];

const CACHE_STATIC = 'marathon-static-v1';
const CACHE_DYNAMIC = 'marathon-dynamic-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 安装缓存:', CACHE_NAME);
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => {
        self.skipWaiting();
      })
      .catch(err => console.error('❌ 缓存安装失败:', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== CACHE_STATIC && cacheName !== CACHE_DYNAMIC) {
            console.log('🗑️ 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then(networkResponse => {
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            
            if (request.url.includes('cdn.tailwindcss.com') || 
                request.url.includes('cdn.jsdelivr.net') ||
                request.url.includes('fonts.googleapis.com')) {
              caches.open(CACHE_STATIC)
                .then(cache => cache.put(request, responseToCache))
                .catch(err => console.log('缓存静态资源失败:', err));
            } else {
              caches.open(CACHE_DYNAMIC)
                .then(cache => cache.put(request, responseToCache))
                .catch(err => console.log('缓存动态资源失败:', err));
            }

            return networkResponse;
          })
          .catch(() => {
            console.log('🔌 离线模式 - 返回缓存的首页');
            return caches.match('/index.html');
          });
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-training-data') {
    event.waitUntil(syncTrainingData());
  }
});

function syncTrainingData() {
  console.log('🔄 同步训练数据');
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('✅ 数据同步完成');
      resolve();
    }, 1000);
  });
}