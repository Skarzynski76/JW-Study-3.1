# JW Study

Osobiste notatki do studium Biblii. Działa offline, wczytuje kopie z JW Library
i odsyła notatki z powrotem.

Wersja jednoplikowa — cała aplikacja siedzi w `index.html`.

## Pliki

| Plik | Do czego |
|---|---|
| `index.html` | cała aplikacja: układ, style, kod |
| `sw.js` | praca offline i wykrywanie nowych wersji |
| `manifest.webmanifest` | dane do zainstalowania na ekranie początkowym |
| `icon-*.png`, `apple-touch-icon.png`, `favicon-32.png`, `icon.svg` | ikony |

Wszystkie muszą leżeć **obok siebie**, w tym samym miejscu.

## Uruchomienie

Ustawienia repozytorium → **Pages** → Source: *Deploy from a branch*,
branch `main`, folder `/ (root)`.

Adres: `https://TWOJA-NAZWA.github.io/NAZWA-REPOZYTORIUM/`

## Dane

Notatki, etykiety i zakładki leżą w bazie IndexedDB na urządzeniu — nie w tym
repozytorium i nie w chmurze. Kopię przenosisz między urządzeniami plikiem JSON
(przycisk kopii zapasowej na górze aplikacji).

## Prawa autorskie

Aplikacja **nie zawiera i nie kopiuje** treści publikacji. Przechowuje wyłącznie
Twoje własne notatki oraz odnośniki do miejsc w JW Library.
