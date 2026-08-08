const CACHE = 'jwstudy-v175';
/* Rdzeń: dokument + wszystkie moduły CSS i JS — bez nich aplikacja nie ruszy offline. */
const CORE = [
  './', './index.html',
  './css/01-base.css',
  './css/02-layout.css',
  './css/03-notes.css',
  './css/04-reader.css',
  './css/05-dialogs.css',
  './css/06-editor.css',
  './css/07-forms.css',
  './css/08-menus.css',
  './css/09-dark.css',
  './css/10-redesign.css',
  './css/11-polish.css',
  './js/01-core.js',
  './js/02-storage.js',
  './js/03-boot.js',
  './js/04-filters.js',
  './js/05-publications.js',
  './js/06-tags.js',
  './js/07-appearance.js',
  './js/08-books.js',
  './js/09-notes.js',
  './js/10-reader.js',
  './js/11-theme.js',
  './js/12-actions.js',
  './js/13-editor.js',
  './js/14-images.js',
  './js/15-highlight.js',
  './js/16-newnote.js',
  './js/17-files.js',
  './js/18-export-jwl.js',
  './js/19-export-doc.js',
  './js/20-backup.js',
  './js/21-ui-helpers.js',
  './js/22-search.js',
  './js/23-shortcuts.js',
  './js/24-reorder.js',
  './js/25-context-menu.js',
  './js/26-settings.js',
  './js/27-pubtabs.js',
  './js/28-keyboard.js',
  './js/29-dragorder.js'
];
/* Dodatki: ikony, manifest i biblioteki importu (jeśli wgrane do lib/).
   Brak któregokolwiek nie może zablokować zapisu offline — stąd osobna lista. */
const EXTRA = [
  './lib/jszip.min.js', './lib/sql-wasm.js', './lib/sql-wasm.wasm',
  './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png',
  './apple-touch-icon.png', './favicon-32.png'
];

/* Pobranie z pominięciem pamięci podręcznej przeglądarki.
   GitHub Pages podaje pliki z nagłówkiem pozwalającym trzymać je ~10 minut.
   Bez tego „świeże" pobranie w tle dostawało STARY plik z pamięci przeglądarki
   i zapisywało go z powrotem — aplikacja potrafiła nigdy się nie zaktualizować. */
function pobierzSwieze(req) {
  return fetch(new Request(req, { cache: 'no-store' }));
}

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(CORE.map((a) => pobierzSwieze(a).then((r) => c.put(a, r))))
        .then(() => Promise.allSettled(EXTRA.map((a) => pobierzSwieze(a).then((r) => c.put(a, r))))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  /* Obce adresy (biblioteki z CDN, linki do jw.org) zostawiamy przeglądarce.
     Wcześniej trafiały do naszej pamięci podręcznej jako nieprzejrzyste odpowiedzi —
     zajmowały miejsce, a i tak nie dało się ich sensownie użyć offline. */
  if (new URL(req.url).origin !== self.location.origin) return;

  /* Dokument: najpierw sieć, z krótkim limitem czasu, potem pamięć podręczna.
     Wcześniej było odwrotnie i po wgraniu nowej wersji na serwer aplikacja
     uparcie pokazywała starą. Limit 3,5 s sprawia, że przy słabym zasięgu
     albo bez sieci start jest natychmiastowy — z zapisanej kopii. */
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      new Promise((resolve) => {
        let rozstrzygniete = false;
        const zKopii = () => caches.match('./index.html').then((c) => c || fetch(req));
        const licznik = setTimeout(() => {
          if (!rozstrzygniete) { rozstrzygniete = true; resolve(zKopii()); }
        }, 3500);
        pobierzSwieze(req).then((res) => {
          if (!res || !res.ok) throw new Error('zła odpowiedź');
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy)).catch(() => {});
          clearTimeout(licznik);
          if (!rozstrzygniete) { rozstrzygniete = true; resolve(res); }
        }).catch(() => {
          clearTimeout(licznik);
          if (!rozstrzygniete) { rozstrzygniete = true; resolve(zKopii()); }
        });
      })
    );
    return;
  }

  /* Moduły CSS/JS i ikony: oddajemy wersję z pamięci od razu (zero czekania na sieć),
     a w tle sprawdzamy, czy na serwerze nie ma nowszej — trafi do pamięci na następny raz. */
  e.respondWith(
    caches.match(req).then((cached) => {
      const fromNet = pobierzSwieze(req).then((res) => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
      return cached || fromNet;
    })
  );
});
