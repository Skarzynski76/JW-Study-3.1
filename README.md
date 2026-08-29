# JW Study 2.79

Gotowa, jednoplikowa wersja aplikacji do publikacji przez GitHub Pages.

## Publikacja

Wgraj **całą zawartość tego katalogu** do głównego katalogu gałęzi używanej
przez GitHub Pages. Najważniejsze pliki to `index.html`, `sw.js`,
`manifest.webmanifest`, `.nojekyll`, ikony oraz cały katalog `lib/`.

Instrukcja wydania i ustawienia GitHub Pages: [docs/WYDANIE.md](docs/WYDANIE.md).
Historia zmian: [CHANGELOG.md](CHANGELOG.md). Testy: [testy/README.md](testy/README.md).

## Dwie wersje projektu

- katalog roboczy zawiera mały `index.html` oraz osobne katalogi `js/` i `css/`;
- katalog `JW_Study_publikacja` zawiera duży, samodzielny `index.html` i to jego
  zawartość należy publikować.

Ta paczka jest wersją publikacyjną. Nie zmieniaj nazwy `index.html` — GitHub
Pages, manifest i tryb offline odwołują się dokładnie do tej nazwy.

## Zasady zmian w kodzie

Kolejność modułów ma znaczenie. Po każdej zmianie uruchom:

```bash
bash testy/uruchom.sh ./index.html
```

Numer wersji musi być zgodny w `WERSJA`, `index.html` i `sw.js`. Plik `sw.js`
należy publikować razem z `index.html`, aby urządzenia pobrały aktualny kod.

Biblioteki w `lib/` obsługują import `.jwlibrary` lokalnie; aplikacja nie musi
pobierać ich z zewnętrznego CDN.
