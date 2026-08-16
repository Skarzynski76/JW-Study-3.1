# JW Study v1.36 — przycisk kopii zapasowej

## Skąd się wzięło ucięcie

To moja pomyłka z wersji 1.34. Porządkując przyciski nadałem wszystkim ikonowym stałą
szerokość 34 × 34 px, żeby były równe. Przycisk kopii jest jednak jedyny, który mieści
**dwie rzeczy naraz**: ikonę dyskietki i plakietkę z liczbą niezapisanych zmian.
Stała szerokość ucinała plakietkę — na Twoim zrzucie widać to jako przyciętą „12".

## Poprawka

- przycisk kopii **rośnie razem z zawartością** (`width:auto`), zachowując minimum 34 px,
  gdy plakietki nie ma,
- zapas po bokach 9 px i odstęp 6 px między ikoną a liczbą,
- plakietka nie ściska się ani nie zawija, ma minimalną szerokość 18 px, więc mieści
  także liczbę trzycyfrową (128),
- cyfry o równej szerokości — przycisk nie drga przy zmianie liczby,
- **na bursztynowym tle ostrzegawczym plakietka dostała ciemniejsze tło** (`#6b4e10`
  z jasnym tekstem), bo wcześniej zielona plakietka na żółtym tle była mało czytelna;
  w trybie nocnym odwrotnie — jasna plakietka na ciemnym tekście,
- na dotyku i na małych telefonach osobne proporcje, żeby nigdzie nie było ciasno.

Pozostałe przyciski ikonowe zostają kwadratowe — zmiana dotyczy tylko tego jednego.

## Sprawdzenie

Nowy zestaw `kopia.js` — 14 kontroli, w tym stany: bez zmian (sama ikona), z liczbą 12,
z liczbą 128, tło ostrzegawcze i nocne. Do tego pełna regresja: 387 asercji w 24 zestawach,
w wersji modułowej i jednoplikowej.
