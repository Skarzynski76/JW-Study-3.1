# Raport migracji — plan przejścia na architekturę modułową

Analiza i plan. Migracja nie została wykonana — liczby przeliczone dla v1.33.
Pełny opis struktury docelowej: [docs/PLAN-ARCHITEKTURY.md](docs/PLAN-ARCHITEKTURY.md).

## Co pokazała analiza

Przepuściłem wszystkie 26 modułów przez parser i policzyłem, kto z kogo korzysta.
Wynik jest ważniejszy niż sam podział na pliki.

### Sprzężenia wzajemne

Przy proponowanym podziale na dwanaście modułów powstaje **16 par, które zależą od
siebie nawzajem** — moduł A używa czegoś z B, a B używa czegoś z A:

```
editor ⟷ storage      storage ⟷ ui        actions ⟷ storage    search ⟷ ui
settings ⟷ ui         actions ⟷ ui        editor ⟷ ui          reader ⟷ ui
export ⟷ ui           import ⟷ ui         search ⟷ settings    actions ⟷ settings
export ⟷ settings     backup ⟷ settings   actions ⟷ editor     export ⟷ import
```

Przy zwykłych skryptach we wspólnym zakresie to nie przeszkadza — wszystko widzi
wszystko. Przy modułach ES każda taka para to cykl importów, który wprawdzie zadziała
(deklaracje funkcji są wyciągane na górę), ale zamienia „jawne zależności" w plątaninę
niewiele lepszą od dzisiejszej.

### Dobra wiadomość: większość sprzężeń jest pozorna

Sprawdziłem, **co konkretnie** krzyżuje się w każdej parze. W większości przypadków są
to wspólne drobiazgi, a nie prawdziwa współpraca modułów:

| Para | Co krzyżuje |
|---|---|
| `search ⟷ ui` | `esc`, `ICO`, `norm`, `issueLabel`, `pubFullName` — same pomocniki |
| `settings ⟷ ui` | `ICO`, `_svg`, `TAGCOLORS`, `closeModal` — pomocniki i stałe |
| `export ⟷ ui` | `ICO`, `esc`, `download`, `openModal`, `isIOS` — pomocniki |
| `import ⟷ ui` | to samo plus `renderAll` |
| `actions ⟷ editor` | `askConfirm` w jedną stronę, `markDirty` w drugą |

Policzyłem, ile par zniknie po dwóch krokach porządkowych:

| Krok | Par wzajemnych |
|---|---:|
| stan obecny | **16** |
| po przeniesieniu wspólnych pomocników do `core.js` | **14** |
| po dodaniu warstwy powiadomień (`bus.js`) | **7** |
| po rozbiciu `ui` na podkatalog i przeniesieniu paneli | **0–2** *(szacunek)* |

Przeniesienie pomocników to około 45 nazw: `esc`, `norm`, `squash`, `ICO`, `IC_*`,
`_svg`, `shade`, `desat`, `openModal`, `closeModal`, `toast*`, `download`, `refLabel`,
`finderUrl`, `hilite`, `issueLabel`, `pubFullName`, `isIOS`, `BOOKS`, `PUB_NAMES`
i podobne. Żadna z nich nie należy logicznie do modułu, w którym dziś leży.

### Co to jest warstwa powiadomień

Dziś `saveNote()` w razie błędu woła `showInfo()` z interfejsu, a `markDirty()` woła
`renderAll()`. Warstwa danych zna warstwę widoku — stąd połowa cykli.

W docelowej architekturze moduł niskiego poziomu tylko ogłasza fakt:

```js
// storage.js — nie wie, kto go słucha
bus.emit("zapis:blad", { blad: e, czego: "notatka" });
bus.emit("dane:zmiana", { notatka: n });

// ui/notes.js — decyduje, co z tym zrobić
bus.on("dane:zmiana", () => renderAll());
bus.on("zapis:blad", ({ blad, czego }) => reportSaveError(blad, czego));
```

To około 40 linii kodu i najważniejsza pojedyncza zmiana w całej migracji: rozcina
sprzężenia `storage ⟷ ui`, `actions ⟷ ui`, `storage ⟷ actions` i `editor ⟷ storage`.

## Etapy

Każdy etap kończy się działającą aplikacją i przechodzącym kompletem testów.
Nic nie jest robione „na raz".

| Etap | Zakres | Ryzyko | Testy |
|---|---|---|---|
| **1. `assets/`** | przeniesienie 7 ikon, aktualizacja `manifest`, `index.html`, `sw.js` | niskie | kontrola PWA (23 asercje) sprawdza istnienie każdej ikony |
| **2. `core.js`** | przeniesienie ~45 wspólnych pomocników i stałych | niskie | analizator kolejności + pełna regresja |
| **3. `bus.js`** | warstwa powiadomień, przepięcie `renderAll`, `reportSaveError`, `bumpDirty` | **średnie** | pełna regresja + ręczne sprawdzenie zapisu i błędów zapisu |
| **4. `dialogs.js`** | wydzielenie `askText`, `askConfirm`, `showInfo`, `askChoice` z edytora | niskie | zestawy `hlp`, `flow`, `fix` |
| **5. `pwa.js`** | wydzielenie rejestracji Service Workera ze startu | niskie | kontrola PWA i offline |
| **6. scalanie** | połączenie 26 plików w 12 modułów wg tabeli mapowania | niskie *(przenoszenie bez zmian treści)* | porównanie drzew składniowych przed i po |
| **7. `ui/`** | rozbicie interfejsu na sześć plików | niskie | pełna regresja |
| **8. sprzątanie** | usunięcie resztek sprzężeń, aktualizacja dokumentacji | niskie | komplet: 343 asercje |

Etapy 1–2 i 4–7 są mechaniczne: przenoszą kod bez zmiany treści, więc po każdym z nich
można porównać drzewa składniowe i udowodnić, że nic się nie zmieniło.
**Jedyny etap wymagający uwagi to trzeci** — tam kod naprawdę się zmienia.

## Ryzyka

| Ryzyko | Skala | Zabezpieczenie |
|---|---|---|
| Zepsucie kolejności ładowania | wysoka szkodliwość, łatwe do wykrycia | analizator kolejności; wykrył już taki błąd przy refaktoryzacji v1.27 |
| Warstwa powiadomień gubi wywołanie | średnia | etap 3 osobno, z ręcznym sprawdzeniem zapisu, błędu zapisu i licznika zmian |
| Wersja jednoplikowa przestaje się składać | wysoka przy wariancie z modułami ES | wariant B nie rusza sposobu składania; przy wariancie A potrzebny bundler |
| Rozjazd wersji modułowej i jednoplikowej | średnia | oba warianty przechodzą ten sam komplet testów przed każdym wydaniem |
| Przeniesienie ikon psuje instalację na iOS | niska | kontrola PWA sprawdza, czy każda ikona z manifestu istnieje; po wydaniu jedno otwarcie z internetem |
| Utrata notatek | krytyczna, ale nierealna | migracja nie dotyka formatu danych ani IndexedDB; mimo to przed startem kopia JSON |

## Czego migracja **nie** zmienia

- formatu notatek, etykiet i sekcji,
- kluczy `localStorage`,
- zawartości IndexedDB,
- wyglądu i zachowania aplikacji,
- sposobu wgrywania na GitHub Pages (przy wariancie B).

Użytkownik nie powinien zauważyć niczego poza numerem wersji.

## Nakład

| Etap | Szacunek |
|---|---|
| 1. `assets/` | 15 min |
| 2. `core.js` | 1 h |
| 3. `bus.js` | 2 h *(najwięcej uwagi)* |
| 4. `dialogs.js` | 30 min |
| 5. `pwa.js` | 20 min |
| 6. scalanie do 12 modułów | 1,5 h |
| 7. podkatalog `ui/` | 1 h |
| 8. sprzątanie i dokumentacja | 1 h |
| **Razem** | **ok. 7–8 h pracy** |

## Wycofanie

Każdy etap to osobne wydanie z własnym numerem i własną nazwą pamięci podręcznej.
Powrót do poprzedniego stanu polega na wgraniu poprzedniego `index.html` i `sw.js` —
tak samo jak każda inna zmiana wersji. Dane użytkownika leżą w IndexedDB i nie zależą
od tego, na ile plików podzielony jest kod.

## Do decyzji przed rozpoczęciem

1. **Wariant A (moduły ES z bundlerem) czy B (skrypty z warstwami)?**
   Rekomendacja: B, bo nie wprowadza build stepu do procesu, który dziś sprowadza się
   do skopiowania dwóch plików.
2. **Czy warstwa powiadomień od razu, czy dopiero po scaleniu plików?**
   Rekomendacja: od razu (etap 3), bo bez niej scalanie utrwali sprzężenia.
3. **Czy `ui/` jako podkatalog, czy jeden duży `ui.js`?**
   Rekomendacja: podkatalog — pojedynczy plik miałby 1254 linie.
