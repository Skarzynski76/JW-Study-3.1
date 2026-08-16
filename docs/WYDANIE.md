# Proces wydania

## Jednym poleceniem

```bash
./narzedzia/wydaj.sh --podnies     # 1.73 → 1.74
./narzedzia/wydaj.sh 2.0           # numer wprost
./narzedzia/wydaj.sh --sprawdz     # sama kontrola, bez wydawania
```

Sześć kroków po kolei, zatrzymanie przy pierwszym niepowodzeniu:

| Krok | Co się dzieje | Kiedy przerywa |
|---|---|---|
| 1 | testy i analiza statyczna wersji roboczej | cokolwiek nie przeszło |
| 2 | podniesienie numeru i rozprowadzenie do `index.html` i `sw.js` | numer się rozjeżdża |
| 3 | sprawdzenie wpisu w `CHANGELOG.md` | brak wpisu dla nowej wersji |
| 4 | zbudowanie wersji jednoplikowej | błąd budowania albo znaki `{{` |
| 5 | testy wersji zbudowanej | cokolwiek nie przeszło |
| 6 | spakowanie obu wersji | błąd pakowania |

Paczka nie powstanie z wersji, która nie przeszła testów.

## Numer wersji

Jedno źródło prawdy: plik **`WERSJA`** w katalogu głównym.

```bash
node narzedzia/wersja.js            # pokaż
node narzedzia/wersja.js --podnies  # 1.73 → 1.74
node narzedzia/wersja.js 2.0        # ustaw wprost
node narzedzia/wersja.js --sprawdz  # kontrola zgodności
```

Numer trafia w dwa miejsca:

- `index.html` — napis obok nazwy aplikacji, po nim poznajesz, co masz uruchomione
- `sw.js` — nazwa pamięci podręcznej; **jej zmiana każe przeglądarce pobrać
  wszystko od nowa**

Rozjazd między nimi oznacza, że wgrywasz nową wersję, a przeglądarka podaje starą.
Analiza statyczna sprawdza to przy każdym uruchomieniu.

## Dwie wersje, dwa katalogi

| Katalog | `index.html` | Do czego |
|---|---:|---|
| roboczy (ten) | ~24 kB | praca nad kodem; szuka `js/` i `css/` |
| `JW_Study_publikacja` | ~500 kB | **to wgrywasz na GitHub** |

Skrypt budujący zostawia `NIE-WGRYWAJ-NA-GITHUB.txt` w katalogu roboczym
i `WGRYWAJ-TEN-KATALOG.txt` w katalogu do publikacji — oba z rzeczywistymi
rozmiarami. Pomyłka między tymi plikami zdarzyła się i kosztowała pół dnia.

## Wgranie na GitHub

1. **Add file → Upload files** — cała zawartość katalogu `JW_Study_publikacja`,
   **prosto do repozytorium, nie do podkatalogu**
2. `index.html` **zawsze razem z** `sw.js` — to `sw.js` decyduje, co aplikacja
   pokaże po uruchomieniu
3. plik `.nojekyll` musi tam być; bez niego GitHub przepuszcza pliki przez Jekylla,
   który potrafi przerwać budowanie strony
4. **Settings → Pages** → Deploy from a branch → `main`, folder `/ (root)`
5. po 1–3 minutach sprawdź **Actions** — zielony znaczek przy
   `pages build and deployment`

Gdy po wgraniu widać starą wersję: **Ustawienia → Wersja aplikacji → Pobierz
najnowszą wersję**. Kasuje zapisaną kopię plików i wczytuje wszystko od nowa.
Notatki zostają nietknięte — są w osobnej bazie na urządzeniu.

## Dziennik zmian

Wpis jest **wymagany** — bez niego wydanie się nie odbędzie. Opisuje
**przyczynę**, nie samą listę poprawek. Po miesiącu to jedyne, co pozwala
zrozumieć, dlaczego coś wygląda tak, a nie inaczej.

Wzór:

```markdown
## v1.74 — krótki tytuł

**Co było nie tak.** Objaw widziany przez użytkownika.

**Dlaczego.** Prawdziwa przyczyna w kodzie.

**Co zrobiono.** Poprawka i test, który pilnuje, żeby nie wróciła.
```
