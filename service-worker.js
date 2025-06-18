self.addEventListener('install', function(event) {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('fetch', function(event) {
  // Padrão: continuar carregando normal da internet
});
