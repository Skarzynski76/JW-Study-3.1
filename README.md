# JW Study

Osobiste notatki do studium Biblii. Działa offline, wczytuje kopie z JW Library
i odsyła notatki z powrotem.

Aplikacja **nie zawiera i nie kopiuje treści publikacji** — przechowuje wyłącznie
Twoje własne notatki oraz odnośniki do miejsc w JW Library.

---

## Szybki start

```bash
npm install jsdom          # tylko do testów
./testy/uruchom.sh         # kontrola jakości
./narzedzia/wydaj.sh --sprawdz
```

Podgląd aplikacji: `python3 -m http.server 8137`, potem `http://localhost:8137`.

---

## Co gdzie leży

```
WERSJA              jedyne miejsce z numerem wersji
index.html          szkielet strony, kolejność wczytywania modułów
sw.js               praca offline i wykrywanie nowych wersji
manifest.webmanifest  dane do zainstalowania na ekranie początkowym

css/                11 arkuszy, warstwami — patrz docs/ARCHITEKTURA.md
js/                 29 modułów, kolejność ma znaczenie
lib/                biblioteki importu z JW Library (opcjonalne)

testy/              10 zestawów + analiza statyczna
narzedzia/          numer wersji, budowanie, wydawanie
docs/               dokumentacja
docs/archiwum/      raporty z wcześniejszych wydań
CHANGELOG.md        dziennik zmian z przyczynami
```

---

## Dokumentacja

| Plik | O czym |
|---|---|
| `docs/ARCHITEKTURA.md` | warstwy stylów, podział na moduły, zasady |
| `docs/MODULY.md` | co robi każdy z 29 modułów |
| `docs/PRZEPLYW.md` | droga danych od kliknięcia do zapisu |
| `docs/DANE.md` | budowa notatki, etykiety, zakładki, pamięć urządzenia |
| `docs/FUNKCJE.md` | spis funkcji z zależnościami |
| `docs/WYDANIE.md` | **proces wydania i wgrywania na GitHub** |
| `testy/README.md` | kontrola jakości, jak dopisać test |
| `CHANGELOG.md` | dziennik zmian |
| `lib/README.md` | biblioteki importu, sumy kontrolne |

---

## Dwie wersje

| Katalog | `index.html` | Do czego |
|---|---:|---|
| ten (roboczy) | ~24 kB | praca nad kodem |
| `JW_Study_publikacja` | ~500 kB | **to wgrywasz na GitHub** |

Wersję do publikacji buduje `node narzedzia/buduj.js`. Szczegóły w `docs/WYDANIE.md`.

---

## Dane

Notatki, etykiety i zakładki leżą w bazie IndexedDB **na urządzeniu** — nie
w repozytorium i nie w chmurze. Między urządzeniami przenosisz je plikiem JSON
(przycisk kopii zapasowej w pasku górnym).

Adres strony wyznacza miejsce na dane: notatki spod jednego adresu nie pojawią
się pod innym. Przy zmianie adresu zrób kopię i wczytaj ją w nowym miejscu.

---

## Zasady, które warto znać przed zmianami w kodzie

1. **Kolejność modułów ma znaczenie.** Stałe nie są windowane — użycie przed
   deklaracją wywraca aplikację. Pilnuje tego `testy/audyt.js`.
2. **Numer wersji podnoś skryptem.** `sw.js` musi dostać ten sam numer, inaczej
   przeglądarka nie zauważy aktualizacji.
3. **Treść notatki z zewnątrz przechodzi przez `sanitize()`.** Pole `h` trafia
   do `innerHTML`; kopia JSON może pochodzić skądkolwiek.
4. **Żadnych znaków `{{` ani `{%`** w plikach — Jekyll na GitHub Pages przerwie
   budowanie strony.
5. **Test zapisuje przyczynę, nie objaw.** Zasada opisana w `testy/README.md`.
