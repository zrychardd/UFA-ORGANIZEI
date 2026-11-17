/* UFA Organizei: service worker
   - Deixa o app instalável e abre mesmo sem internet (mostra a interface; dados precisam de conexão).
   - NUNCA guarda respostas do Supabase nem de qualquer outro domínio: só arquivos do próprio site.
   - Para publicar uma versão nova, o navegador detecta que este arquivo mudou; o app avisa o usuário. */
const VERSION = 'ufa-v1'
const SHELL_CACHE = `${VERSION}-shell`
const ASSET_CACHE = `${VERSION}-assets`
const SHELL_URLS = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS.map((url) => new Request(url, { cache: 'reload' }))))
      .catch(() => { /* se falhar, o app continua funcionando online */ })
  )
  // Sem skipWaiting automático: o app mostra "Nova versão disponível" e o usuário escolhe quando atualizar
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return   // Supabase, fontes, APIs: sempre direto da rede
  if (url.pathname === '/sw.js') return

  // Navegação: tenta a rede; sem internet, abre a última interface guardada
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request)
        if (fresh.ok) {
          const cache = await caches.open(SHELL_CACHE)
          cache.put('/', fresh.clone())
        }
        return fresh
      } catch {
        const cached = await caches.match('/')
        return cached || new Response('Sem conexão. Abra o app novamente quando estiver online.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
      }
    })())
    return
  }

  // Arquivos com hash no nome (JS/CSS/imagens gerados no build): nunca mudam, então cache primeiro
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith((async () => {
      const cache = await caches.open(ASSET_CACHE)
      const hit = await cache.match(request)
      if (hit) return hit
      const response = await fetch(request)
      if (response.ok) cache.put(request, response.clone())
      return response
    })())
    return
  }

  // Ícones, manifesto e afins: mostra o guardado e atualiza em segundo plano
  event.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE)
    const cached = await cache.match(request)
    const network = fetch(request).then((response) => {
      if (response.ok) cache.put(request, response.clone())
      return response
    }).catch(() => cached)
    return cached || network
  })())
})

// Lembretes: ao tocar na notificação, abre/foca o app na aba certa
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const tab = event.notification.data && event.notification.data.tab
  event.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of list) {
      if ('focus' in client) {
        await client.focus()
        if (tab) client.postMessage({ type: 'OPEN_TAB', tab })
        return
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(tab ? `/?tab=${tab}` : '/')
  })())
})
