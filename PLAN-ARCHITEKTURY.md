# Plan przejścia na architekturę modułową

Dokument opisuje **plan**. Migracja nie została wykonana. Liczby przeliczone dla v1.33.

## Punkt wyjścia

Warto zacząć od tego, co już jest, bo część proponowanego podziału istnieje od v1.27:

| Element | Stan |
|---|---|
| `css/` | ✅ istnieje — 10 arkuszy ładowanych w kolejności |
| `js/` | ✅ istnieje — 26 modułów ładowanych w kolejności |
| `assets/` | ❌ brak — ikony leżą w katalogu głównym |
| Moduły ES (`import` / `export`) | ❌ brak — moduły to zwykłe skrypty we wspólnym zakresie |

Czyli podział na katalogi jest zrobiony. Do zrobienia zostają dwie rzeczy:
**grupowanie 26 plików w mniejszą liczbę modułów o wyraźnej odpowiedzialności**
oraz **zamiana wspólnego zakresu globalnego na jawne zależności**.

## Struktura docelowa

```
index.html
sw.js
manifest.webmanifest

assets/
  icon-192.png  icon-512.png  icon-1024.png
  icon-maskable-512.png  apple-touch-icon.png  favicon-32.png  icon.svg

css/
  01-base.css      zmienne, motywy, reset, nagłówek
  02-layout.css    kolumny, listy, sekcje, panel publikacji
  03-notes.css     karty notatek
  04-reader.css    czytnik
  05-dialogs.css   okna pytań i komunikatów
  06-editor.css    edytor, tabele, obrazy
  07-forms.css     okno nowej notatki
  08-menus.css     menu podręczne, tryb mobilny
  09-dark.css      tryb nocny
  10-redesign.css  warstwa wyglądu iOS (ładowana ostatnia)

js/
  core.js        stałe, stan, pomocniki, dostęp do localStorage
  bus.js         powiadomienia „dane się zmieniły" (nowy moduł)
  storage.js     IndexedDB, zapis, sito na dane
  search.js      wyszukiwanie i dopasowanie notatek
  actions.js     działania na notatce, cofanie, kosz
  editor.js      edycja w miejscu, obrazy, podświetlenia
  reader.js      czytnik pełnoekranowy
  settings.js    motyw, kolory, gęstość, animacje, panel ustawień
  dialogs.js     okna pytań, komunikatów i wyboru
  import.js      wczytywanie .jwlibrary
  export.js      eksport .jwlibrary, Word, PDF
  backup.js      kopie JSON i scalanie
  pwa.js         rejestracja Service Workera i stan offline
  app.js         start aplikacji, skróty klawiszowe

  ui/
    columns.js   kolumny Księgi i Etykiety
    notes.js     lista notatek i karta notatki
    publications.js  panel publikacji
    menus.js     menu podręczne, szybkie akcje
    reorder.js   własna kolejność notatek
    helpers.js   komunikaty, okna modalne, szerokość kolumn
```

## Dlaczego nie dokładnie dziesięć plików

Proponowana lista (`ui`, `editor`, `storage`, `search`, `settings`, `dialogs`, `backup`,
`import`, `export`, `pwa`) nie ma miejsca na cztery rzeczy, które w kodzie istnieją:

| Bezdomna odpowiedzialność | Co to jest | Propozycja |
|---|---|---|
| start aplikacji | wczytanie danych, scalenie, pierwsze renderowanie, skróty | `app.js` |
| działania na notatce | przypinanie, ulubione, kosz, cofanie, licznik zmian | `actions.js` |
| czytnik | pełny ekran, spis treści, szukanie w notatce | `reader.js` |
| fundament | stałe, stan, pomocniki, localStorage | `core.js` |

Dodatkowo `ui.js` zbierające wszystko, co dotyczy interfejsu, miałoby **1279 linii
i 64 kB** — więcej niż którykolwiek dzisiejszy plik. To krok w tył pod względem
czytelności, dlatego proponuję podkatalog `ui/` z sześcioma plikami po 100–450 linii.

## Mapowanie: co idzie gdzie

| Obecny moduł | Linii | Moduł docelowy |
|---|---:|---|
| `01-core.js` | 92 | `core.js` |
| `02-storage.js` | 168 | `storage.js` |
| `03-boot.js` | 109 | `app.js` |
| `04-filters.js` | 78 | `search.js` (dopasowanie) + `core.js` (ikony, menu) |
| `05-publications.js` | 293 | `search.js` (wyszukiwanie) + `ui/publications.js` (panel) |
| `06-tags.js` | 249 | `ui/columns.js` |
| `07-appearance.js` | 191 | `settings.js` + `ui/menus.js` (menu etykiety i sekcji) |
| `08-books.js` | 63 | `ui/columns.js` |
| `09-notes.js` | 461 | `ui/notes.js` |
| `10-reader.js` | 272 | `reader.js` |
| `11-theme.js` | 73 | `settings.js` |
| `12-actions.js` | 182 | `actions.js` |
| `13-editor.js` | 494 | `editor.js` + `dialogs.js` (okna pytań) |
| `14-images.js` | 357 | `editor.js` |
| `15-highlight.js` | 127 | `editor.js` |
| `16-newnote.js` | 57 | `ui/notes.js` |
| `17-files.js` | 169 | `import.js` + `ui/menus.js` (menu Plik) |
| `18-export-jwl.js` | 272 | `export.js` |
| `19-export-doc.js` | 175 | `export.js` |
| `20-backup.js` | 154 | `backup.js` |
| `21-ui-helpers.js` | 120 | `ui/helpers.js` |
| `22-search.js` | 103 | `search.js` |
| `24-reorder.js` | 73 | `ui/reorder.js` |
| `25-context-menu.js` | 99 | `ui/menus.js` |
| `26-settings.js` | 107 | `settings.js` |
| `23-shortcuts.js` | 55 | `app.js` |
| — | — | `bus.js` (nowy, ok. 40 linii) |
| — | — | `pwa.js` (wydzielony z `03-boot.js`, ok. 30 linii) |

## Rozmiary po podziale

| Moduł docelowy | Linii | Rozmiar |
|---|---:|---:|
| `ui/` (sześć plików) | 1279 | 64 kB |
| `editor.js` + `dialogs.js` | 992 | 51 kB |
| `export.js` | 454 | 23 kB |
| `search.js` | 427 | 21 kB |
| `settings.js` | 384 | 20 kB |
| `reader.js` | 281 | 15 kB |
| `actions.js` | 199 | 11 kB |
| `app.js` | 174 | 9 kB |
| `import.js` | 169 | 9 kB |
| `storage.js` | 168 | 8 kB |
| `backup.js` | 159 | 8 kB |
| `core.js` | 92 | 5 kB |

## Dwa warianty do wyboru

Sam podział na pliki to jedno; drugie pytanie brzmi, **jak moduły mają się widzieć**.

### Wariant A — moduły ES (`import` / `export`)

```html
<script type="module" src="./js/app.js"></script>
```

**Za:** zależności są jawne i sprawdzalne, zniknie ukryta umowa o kolejności ładowania,
narzędzia rozumieją taki kod, łatwiej dopisać testy jednostkowe.

**Przeciw:** wersja jednoplikowa na GitHub Pages przestaje powstawać przez zwykłe
sklejenie plików — potrzebny prawdziwy bundler (esbuild lub rollup), czyli **build step**
i zależność od Node przy każdym wydaniu. Do tego moduły ES nie działają z `file://`,
więc podgląd lokalny wymaga serwera (dziś też, przez Service Workera, ale bez niego
aplikacja przynajmniej się otwierała).

### Wariant B — zwykłe skrypty, ale z porządkiem

Zostajemy przy `<script src>` i wspólnym zakresie, ale wprowadzamy warstwy z regułą:
moduł niższej warstwy nigdy nie woła wyższej. Kontroluje to analizator, który już istnieje.

**Za:** zero zmian w sposobie budowania, sklejanie dalej działa, brak build stepu,
migracja sprowadza się do przenoszenia funkcji między plikami.

**Przeciw:** zależności nadal są niejawne — trzeba ich pilnować analizatorem,
a nie składnią języka.

**Moja rekomendacja: wariant B na start, wariant A dopiero gdy pojawi się potrzeba
testów jednostkowych albo współpracy z kimś jeszcze.** Powód jest praktyczny: dziś
wydanie polega na skopiowaniu dwóch plików na GitHuba. Wariant A zamienia to w proces
z narzędziami, które trzeba mieć zainstalowane i utrzymywać.
