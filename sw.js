const CACHE = 'jwstudy-v292';
/* Rdzeń: dokument + wszystkie arkusze i moduły — bez nich aplikacja nie ruszy offline.

   TA LISTA JEST WYPISYWANA PRZEZ NARZĘDZIE. Nie dopisuj do niej ręcznie.

   Przyczyna: przez kilka wydań lista była pisana ręcznie i zostawała w tyle.
   Nie było w niej ANI JEDNEGO arkusza stylów, a moduły kończyły się na 44 —
   45..49 dopisano do index.html i nikt nie wrócił tutaj. Bez sieci aplikacja
   wstawała wtedy naga: bez układu, bez kolorów, bez podmenu notatki, bez
   przypomnień i bez paska powtórek. Nie było tego widać przy sprawdzaniu, bo
   przez pierwsze ~10 minut po wizycie te pliki podaje własna pamięć
   przeglądarki — usterka pokazywała się dopiero u użytkownika.

   Odświeżenie listy:   node narzedzia/offline.js
   Pilnuje jej:         testy/audyt.js (kontrola „pamięć offline") */
const CORE = [
  './', './index.html'
];
/* Dodatki: ikony, manifest i biblioteki importu (jeśli wgrane do lib/).
   Brak któregokolwiek nie może zablokować zapisu offline — stąd osobna lista.

   Jest tu też onenote.html. Sama strona bez sieci niczego nie przeniesie,
   bo rozmawia z serwerem Microsoftu — ale zapisana otwiera się i mówi, co
   robić. Niezapisana daje błąd przeglądarki, z którego nie wynika, że rzecz
   po prostu wymaga internetu. */
const EXTRA = [
  './lib/jszip.min.js', './lib/sql-wasm.js', './lib/sql-wasm.wasm',
  './jszip.min.js', './sql-wasm.js', './sql-wasm.wasm',
  './manifest.webmanifest',
  './onenote.html',
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
      /* Nie wywołujemy skipWaiting automatycznie: kolejna wersja czeka, aż
         użytkownik zatwierdzi aktualizację w aplikacji. */
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
