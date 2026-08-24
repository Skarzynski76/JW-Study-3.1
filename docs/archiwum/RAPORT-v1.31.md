# JW Study v1.31 — raport dokumentacji

Żadnej zmiany w działaniu. Dowód poniżej.

## Co powstało

| Plik | Rozmiar | Zawartość |
|---|---:|---|
| `README.md` | 6,0 kB | przegląd, uruchomienie, instalacja na iOS, struktura, zasady dopisywania funkcji, historia wersji |
| `docs/ARCHITEKTURA.md` | 3,8 kB | warstwy, zasady kodu, kolejność ładowania, dwie postacie projektu |
| `docs/MODULY.md` | 15,0 kB | wszystkie 26 modułów: rola, zależności, wykaz funkcji i stanu |
| `docs/FUNKCJE.md` | 5,9 kB | najważniejsze funkcje z podziałem na zadania + graf zależności |
| `docs/DANE.md` | 5,9 kB | model notatki, etykiety i sekcji; pełna lista kluczy localStorage; format kopii i `.jwlibrary` |
| `docs/PRZEPLYW.md` | 4,0 kB | pięć diagramów przepływu danych |

Razem 40,6 kB dokumentacji.

## Diagramy

Pięć diagramów w składni Mermaid, którą GitHub rysuje bezpośrednio w podglądzie:

1. **Warstwy aplikacji** — widok, logika, dane, PWA (ARCHITEKTURA.md)
2. **Skąd biorą się notatki** — trzy źródła danych i ich scalanie
3. **Od kliknięcia do ekranu** — pełna ścieżka renderowania z rombem decyzyjnym
   „czy odcisk karty się zmienił"
4. **Wyszukiwanie** — diagram sekwencji z pamięcią podręczną tekstów
5. **Wymiana z JW Library** — import i eksport obok siebie
6. **Zapis ustawień** — kiedy zapis jest odraczany, a kiedy pomijany
7. **Graf zależności funkcji** — kto kogo woła (FUNKCJE.md)

## Komentarze w kodzie

36 opisów w formacie `/** */` nad kluczowymi funkcjami, z parametrami, typami zwracanymi
i — co ważniejsze — **powodem**, dla którego dana funkcja wygląda tak, a nie inaczej.
Przykłady:

- `lsSet` — dlaczego pomijamy zapis tej samej wartości (localStorage zapisuje
  synchronicznie na dysk),
- `noteCardFor` — dlaczego oprócz odcisku sprawdzana jest tożsamość obiektu
  (po imporcie notatka o tym samym identyfikatorze bywa innym obiektem),
- `sanitizeNote` — skąd biorą się dane i czemu im nie ufamy,
- `mergeBackup` — dlaczego dopasowanie idzie po nazwach, a nie po identyfikatorach,
- `applyChangesToDb` — dlaczego daty muszą przejść przez `jwlDate`,
- `saveNoteOrder` — dlaczego numeracja idzie co 10.

Objęte moduły: `01-core`, `02-storage`, `03-boot`, `04-filters`, `05-publications`,
`06-tags`, `09-notes`, `10-reader`, `12-actions`, `14-images`, `18-export-jwl`,
`20-backup`, `21-ui-helpers`, `24-reorder`, `25-context-menu`, `26-settings`.

## Opis struktury localStorage

Wszystkie 23 klucze opisane w tabeli: nazwa, typ, znaczenie. Przy okazji udokumentowana
zasada, że dostęp idzie wyłącznie przez `lsSet` / `lsGet` / `lsSetSoon`, oraz jedyny
wyjątek od przedrostka `jws` — klucz `pubOrder`.

## Dowód, że nic się nie zmieniło

Dokumentacja to komentarze i osobne pliki `.md`, ale „nie zmieniaj działania aplikacji"
warto potwierdzić, a nie zadeklarować:

- **Porównanie drzew składniowych.** Każdy z 26 modułów przepuszczony przez parser
  w wersji 1.30 i 1.31, z pominięciem pozycji znaków. Wynik: drzewa identyczne.
  Komentarze nie istnieją na poziomie drzewa składniowego, więc to twardy dowód,
  że kod wykonywalny jest ten sam.
- **Arkusze CSS.** Porównanie bajt po bajcie — identyczne.
- **Testy.** 343 asercje w 21 zestawach, w wersji modułowej i sklejonej — wszystkie
  przechodzą, tak samo jak w v1.30.
- **PWA i offline.** 23 kontrole symulatora Service Workera — bez zmian.

Zmienił się wyłącznie numer wersji w nagłówku (v1.31) i nazwa pamięci podręcznej
(`jwstudy-v131`), żeby urządzenia pobrały nową zawartość.

## Co dokumentacja ułatwia

Trzy rzeczy, na których łatwo się potknąć przy dopisywaniu kodu, są teraz opisane wprost:

1. **Kolejność ładowania modułów jest częścią kontraktu** — moduł nie może w czasie
   ładowania używać funkcji z późniejszego pliku. To była przyczyna jednego z błędów
   wykrytych przy refaktoryzacji.
2. **Nowe pole widoczne na karcie trzeba dopisać do `noteCardSig()`** — inaczej karta
   nie odświeży się po zmianie tego pola.
3. **Dwa wąskie gardła:** każda zmiana treści przechodzi przez `markDirty()`, każde
   odświeżenie ekranu przez `renderAll()`. To najlepsze miejsca na pułapkę przy
   szukaniu błędu.
