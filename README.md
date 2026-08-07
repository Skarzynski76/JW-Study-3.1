# JW Study

Osobisty notatnik do studium Biblii. Działa w przeglądarce, także bez internetu,
i wymienia notatki z aplikacją JW Library.

**Wersja 1.52** · [Architektura](docs/ARCHITEKTURA.md) · [Moduły](docs/MODULY.md) ·
[Funkcje](docs/FUNKCJE.md) · [Dane](docs/DANE.md) · [Przepływ danych](docs/PRZEPLYW.md) ·
[Plan architektury](docs/PLAN-ARCHITEKTURY.md)

## Co potrafi

**Notatki.** Trzy kolumny: Księgi Biblii, Etykiety (z sekcjami) i lista notatek.
Edycja w miejscu z pełnym formatowaniem: nagłówki, cytaty, listy zadań, tabele, zdjęcia,
podświetlenia, szablony, znajdź i zamień, historia dziesięciu ostatnich wersji.

**Powiązanie z JW Library.** Notatka może wskazywać werset albo miejsce w publikacji
(symbol, wydanie, akapit). Jedno kliknięcie otwiera to miejsce wprost w JW Library.
Import notatek z pliku `.jwlibrary` i eksport z powrotem — z zachowaniem etykiet.

**Wyszukiwanie.** Na żywo, z podświetlaniem, bez ogonków (`milosc` znajdzie `miłość`),
z gwiazdką (`miłos*`), frazą w cudzysłowie, alternatywą `(kot|pies)` i zawężaniem
do pola: `tytuł:`, `etykieta:`, `werset:`.

**Porządek.** Etykiety w sekcjach, panel publikacji z podziałem na kategorie i roczniki,
przypinanie, ulubione, dziesięć trybów sortowania łącznie z własną kolejnością,
szybkie filtry, kosz z trzydziestodniowym okresem przechowywania.

**Czytnik.** Pełny ekran z typografią do czytania, spisem treści z nagłówków, szukaniem
w notatce, paskiem postępu i zapamiętanym miejscem czytania.

**Wygląd i wygoda.** Tryb dzienny, sepia i nocny, kompozycje kolorystyczne, trzy poziomy
gęstości interfejsu, regulacja animacji, dziewięć skrótów klawiszowych, menu szybkich
akcji pod prawym przyciskiem myszy i pod długim przytrzymaniem palca.

**Kopie zapasowe.** Zapis do JSON, wczytanie z wyborem: dołącz, dołącz z układem etykiet
albo zastąp wszystko. Eksport notatek do Worda i PDF, pojedynczo lub całą etykietą.

## Prywatność i prawa autorskie

Aplikacja nie ma serwera, konta ani analityki — notatki nie opuszczają urządzenia.

Treść publikacji Towarzystwa Strażnica **nie jest kopiowana ani przechowywana**.
Notatka trzyma wyłącznie własny tekst użytkownika oraz *adres* miejsca, z którego
budowany jest odnośnik do JW Library.

## Uruchomienie

Aplikację trzeba serwować przez HTTP — otwarcie `index.html` przez `file://` nie zadziała,
bo przeglądarka zablokuje Service Workera i praca offline nie ruszy.

```bash
# dowolny statyczny serwer, na przykład:
python3 -m http.server 8000
# potem otwórz http://localhost:8000
```

Docelowo: GitHub Pages albo dowolny hosting plików statycznych.

### Instalacja na iPadzie i iPhonie

1. Otwórz adres w Safari **z internetem**
2. Udostępnij → Dodaj do ekranu początkowego
3. Uruchom z ekranu początkowego i zamknij całkowicie
4. Otwórz ponownie — od tej chwili działa offline

Aktualizacja: otwórz z internetem, zamknij całkowicie, otwórz ponownie. Service Worker
podmienia zawartość przy **następnym** uruchomieniu, nie w trakcie. Numer wersji widać
w nagłówku obok nazwy.

## Struktura projektu

```
index.html                 szkielet strony, ok. 22 kB
css/01..10-*.css           style, ładowane w kolejności; ostatni nadpisuje wcześniejsze
js/01..26-*.js             26 modułów, ładowanych w kolejności z index.html
sw.js                      Service Worker — pamięć podręczna do pracy offline
manifest.webmanifest       manifest PWA
docs/                      dokumentacja
ikony (*.png, icon.svg)
```

**Numery w nazwach wyznaczają kolejność ładowania i nie wolno jej zmieniać.**
Moduły dzielą wspólny zakres globalny, więc plik może w czasie ładowania korzystać
tylko z tego, co zdefiniowano w nim samym albo w pliku o niższym numerze.
Szczegóły: [docs/ARCHITEKTURA.md](docs/ARCHITEKTURA.md).

## Dwie postacie projektu

| | Modułowa | Jednoplikowa |
|---|---|---|
| Pliki | `index.html` + `css/` + `js/` | sam `index.html` (~346 kB) |
| Do czego | rozwój, czytanie kodu, przeglądy | wgrywanie na GitHub Pages |

Wersja jednoplikowa powstaje przez sklejenie modułów w kolejności z `index.html`.
Sklejanie nie zmienia ani znaku w kodzie; obie postacie przechodzą ten sam komplet testów.

## Jak dodać funkcję

1. **Znajdź właściwy moduł** — [docs/MODULY.md](docs/MODULY.md) opisuje, co gdzie leży.
2. **Sprawdź kolejność** — jeśli nowy kod potrzebuje funkcji z późniejszego modułu,
   albo przenieś wywołanie do modułu startowego, albo zmień kolejność w `index.html`
   i w `sw.js`.
3. **Zmiana danych → `markDirty(n)`**, żeby notatka zapisała się i podbiła licznik zmian.
4. **Zmiana ekranu → `renderAll()`**; nie odświeżaj DOM ręcznie.
5. **Nowe pole na karcie → dopisz je do `noteCardSig()`**, inaczej karta się nie odświeży.
6. **Nowe ustawienie → `lsSet` / `lsGet`**, nigdy `localStorage` wprost.
7. **Dane z pliku → przez `sanitizeNote` / `sanitizeTags`.**

## Kontrola jakości

Sprawdzenia uruchamiane przed każdym wydaniem:

| Co | Czego pilnuje |
|---|---|
| analizator kolejności | żaden moduł nie używa czegoś z późniejszego pliku |
| analizator nazw | każdy używany identyfikator jest gdzieś zadeklarowany |
| wykrywacz martwego kodu | brak nieużywanych funkcji i zmiennych |
| wykrywacz martwego CSS | brak klas bez śladu w kodzie |
| 21 zestawów testów jsdom | 343 asercje: funkcje, dane brzegowe, PWA, offline |
| pomiar wydajności | brak pogorszenia względem poprzedniej wersji |

## Historia wersji

| Wersja | Czym się zajmowała |
|---|---|
| 1.26 | wygląd w stylu iOS: karty, typografia, ikony kreskowe, dialogi |
| 1.27 | refaktoryzacja: podział na moduły CSS i JS, usunięcie duplikatów |
| 1.28 | wydajność: renderowanie różnicowe, pamięć podręczna wyszukiwania, mniej zapisów |
| 1.29 | komfort pracy: ulubione, menu podręczne, własna kolejność, panel ustawień |
| 1.30 | stabilizacja: naprawa błędów, sito na dane, obsługa wyjątków, kontrola PWA |
| 1.31 | dokumentacja |
| 1.32 | plan przejścia na architekturę modułową (bez migracji) |
| 1.33 | naprawa kolizji menu podręcznego z zaznaczaniem tekstu |
| 1.34 | dopracowanie wyglądu: odstępy, typografia, cienie, przyciski, responsywność |
| 1.35 | pasek górny mieści się w oknie, kompozycje kolorów przeniesione do Ustawień |
| 1.36 | przycisk kopii zapasowej mieści ikonę i licznik zmian |
| 1.37 | zakładki w publikacjach, stała kolejność mimo edycji, linie podziału kolumn |
| 1.38 | zakładki wcięte pod publikacją, panel bez zmian, czytelne puste pozycje |
| 1.39 | kafelki z cieniem, kontrast napisów liczony z tła, pastelowa paleta |
| 1.40 | wszystkie rogi kafelków zaokrąglone, odstęp od nagłówków grup |
| 1.42 | pastelowa paleta pasków sekcji, automatyczne zakładki z rozdziałów |
| 1.43 | zakładki publikacji zapisywane w kopii JSON i odtwarzane na innym urządzeniu |
| 1.44 | czytelne okno wczytywania kopii — przyciski w pionie, czerwony napis zamiast czerwonego tła |
| 1.45 | czytnik: pełna powierzchnia czytania, rytm akapitów, znikające narzędzia |
| 1.46 | koniec migania przy zaznaczaniu, stała szerokość okna notatki, tekst nad klawiaturą |
| 1.47 | A−/A+ skalują całą aplikację (6–30 px), marginesy czytnika w Split View, strzałki nad paskiem |
| 1.48 | krzyżyk zamknięcia nie wchodzi już w tytuł notatki |
| 1.50 | naprawa panelu ustawień, białe tło czytnika, przegląd kodu, szybszy panel publikacji |
| 1.51 | przenoszenie etykiet i zakładek palcem albo kursorem |
| 1.52 | pusta notatka na pełnym ekranie zajmuje całą szerokość |
