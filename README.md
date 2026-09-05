# JW Study 3.14

Gotowa, jednoplikowa wersja aplikacji do publikacji przez GitHub Pages.

## Publikacja

Wgraj **całą zawartość tego katalogu** do głównego katalogu gałęzi używanej
przez GitHub Pages. Najważniejsze pliki to `index.html`, `sw.js`, `search-worker.js`,
`manifest.webmanifest`, `.nojekyll`, ikony oraz cały katalog `lib/`.

Instrukcja wydania i ustawienia GitHub Pages: [docs/WYDANIE.md](docs/WYDANIE.md).
Historia zmian: [CHANGELOG.md](CHANGELOG.md). Testy: [testy/README.md](testy/README.md).

Ta paczka jest wersją publikacyjną z dużym, samodzielnym `index.html`. Nie
zmieniaj nazwy `index.html` — GitHub
Pages, manifest i tryb offline odwołują się dokładnie do tej nazwy.

W repozytorium roboczym narzędzie wydania może tworzyć dwa katalogi:
`JW_Study_zrodla` służy do dalszej pracy nad kodem, a `JW_Study_publikacja`
jest gotową zawartością do wgrania na GitHub. Ten katalog jest już wersją
publikacyjną — wgrywa się jego zawartość, bez tworzenia dodatkowego `index 3`
lub `index 5`.

## Zasady zmian w kodzie

Kolejność modułów ma znaczenie. Po każdej zmianie uruchom:

```bash
bash testy/uruchom.sh ./index.html
```

Numer wersji musi być zgodny w `WERSJA`, `index.html` i `sw.js`. Plik `sw.js`
należy publikować razem z `index.html`, aby urządzenia pobrały aktualny kod.

Biblioteki w `lib/` obsługują import `.jwlibrary` lokalnie; aplikacja nie musi
pobierać ich z zewnętrznego CDN.

## Centrum Studium 3.06

Centrum jest teraz osobistą przestrzenią pracy. Projekty łączą notatki z
różnych wersetów i publikacji, kolejka „Do przeczytania” odkłada materiały na
później, a „Do opracowania” zbiera luźne pomysły. Przypisanie wykonuje się w
notatce przez `Więcej → Centrum Studium`.

Przycisk `Dostosuj` pozwala ukryć lub przestawić sześć dużych bloków pulpitu.
Zmiana układu nie usuwa notatek. Projekty są zapisane jako etykiety, a kolejki
jako pola notatki, dlatego przechodzą do kopii i uzgadniania między urządzeniami.

### Wygląd Warsztatu 3.07

Warsztat ma teraz wyraźną hierarchię zamiast czterech równych kolumn. Projekty
zajmują osobny rząd, dwie kolejki są szersze, a „Warto wrócić” tworzy spokojny
pas poniżej. Układ automatycznie składa się do jednej kolumny na telefonie i
wąskim iPadzie; zmiana wyglądu nie wpływa na dane ani przypisania notatek.

### Boczna nawigacja 3.08

Centrum ma pełny boczny wybór: Centrum, Projekty, Do przeczytania, Do
opracowania, Ostatnie i Bezpieczeństwo. Każdy przycisk otwiera osobny widok,
a wybór jest pamiętany na urządzeniu. W wąskim panelu i na telefonie menu jest
zwijane, żeby nie odbierało miejsca treści.
