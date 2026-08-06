# Wgranie do repozytorium JW-Study_3.1

## Co było nie tak

Budowanie strony wywalało się po 15 minutach. Winne były **cztery znaki `{{`**
w komentarzach mojego kodu.

GitHub Pages przepuszcza każdy plik przez Jekylla — mechanizm, który traktuje
`{{ }}` jako własne polecenie do wykonania. Trafiał na coś takiego:

```
@returns {{stamp:string, plain:string}}
```

próbował to wykonać jako polecenie, nie umiał i przerywał budowanie. Adres
przez to nigdy nie powstawał — i nic po Twojej stronie nie mogło tego naprawić.

## Co zostało zrobione

1. Cztery komentarze przepisane tak, żeby nie zawierały `{{`
2. Do paczki dołączony plik **`.nojekyll`** — wyłącza Jekylla całkowicie.
   Aplikacja jest gotowym plikiem HTML i żadnego przetwarzania nie potrzebuje.
   Z tym plikiem GitHub tylko podaje pliki takie, jakie są.

Teraz budowanie trwa kilkanaście sekund zamiast się wywracać.

---

## Wgranie

### 1. Anuluj to, co wisi

W repozytorium zakładka **Actions** → wpis ze stanem *Queued* → „···" po prawej
→ **Cancel workflow**. Ten stary i tak by nie przeszedł.

### 2. Wgraj pliki

**Add file → Upload files** → wejdź do folderu `JW_Study_GITHUB` i zaznacz
**wszystkie pliki ze środka** (nie sam folder) → **Commit changes**.

GitHub nadpisze poprzednie wersje.

**Uwaga na `.nojekyll`:** zaczyna się od kropki, więc aplikacja Pliki na iPadzie
może go ukrywać. Jeśli go nie widzisz przy wybieraniu, załóż go wprost na
GitHubie:

**Add file → Create new file** → w polu nazwy wpisz `.nojekyll` → treść zostaw
pustą → **Commit changes**.

To jeden z dwóch kluczowych elementów tej poprawki — bez niego problem może
wrócić przy kolejnej wersji.

### 3. Poczekaj i sprawdź

Zakładka **Actions**, najnowszy wpis `pages build and deployment`.
Powinien zrobić się zielony w kilkanaście sekund.

### 4. Otwórz

```
https://skarzynski76.github.io/JW-Study_3.1/
```

Ukośnik na końcu jest potrzebny.

W Safari: **Udostępnij → Dodaj do ekranu początkowego**.

---

## Kolejne wersje

Wgrywasz `index.html` i `sw.js` (zawsze oba naraz). `.nojekyll`, ikony
i manifest zostają raz na zawsze.

Numer wersji sprawdzisz w aplikacji: **Ustawienia → Wersja aplikacji**.
Tam jest też przycisk **Pobierz najnowszą wersję**, gdyby przeglądarka
uparcie pokazywała starą.
