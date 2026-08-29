# JW Study v1.28 — raport z optymalizacji

Wszystkie zmiany dotyczą wyłącznie sposobu działania kodu. Wygląd, funkcje i struktura
modułów z v1.27 pozostały nietknięte.

## Warunki pomiarów

Testy w środowisku jsdom na komplecie **1200 notatek** (co dwunasta biblijna, reszta
z publikacji, sześć etykiet). Każdy pomiar wykonany na tym samym zestawie danych,
raz dla v1.27, raz dla v1.28.

| Miara | v1.27 | v1.28 | Zmiana |
|---|---:|---:|---|
| pierwsze pełne renderowanie | 243 ms | 105 ms | **2,3× szybciej** |
| 30× odświeżenie bez żadnej zmiany | 3692 ms | 163 ms | **22× szybciej** |
| 20× drobna zmiana (przypnij / odepnij) | 2406 ms | 229 ms | **10× szybciej** |
| wpisanie 8 znaków w wyszukiwarce | 1223 ms | 999 ms | 1,2× szybciej |
| 50× filtrowanie i sortowanie (bez DOM) | 13,9 ms | 14,5 ms | bez różnicy |
| zapisów do localStorage przy 25 kliknięciach filtra | 25 | 0 | **−100%** |
| zapisów przy 40× tej samej wartości | 40 | 1 | **−98%** |

Osobny pomiar na 800 notatkach, 60 odświeżeń przy jednej zmienianej notatce:

| Miara | v1.27 | v1.28 |
|---|---:|---:|
| kart notatek zbudowanych od zera | 3600 | **60** |
| niezwolnionych obserwatorów przewijania | 61 | **1** |
| węzłów DOM na ekranie | 5061 | 5061 |

## 1. Renderowanie interfejsu

**Lista notatek przestała być przebudowywana w całości.** Wcześniej każde odświeżenie
zaczynało się od `innerHTML = ""` i budowało wszystkie karty od nowa — nawet gdy zmieniła
się jedna notatka. Teraz dla każdej notatki liczony jest krótki „odcisk" tego, co widać
na karcie (tytuł, treść, etykiety, przypięcie, werset, publikacja, fraza wyszukiwania).
Gdy odcisk się nie zmienił, gotowa karta jest tylko przestawiana w kolejności.
Stąd 3600 → 60 budowanych kart.

Zabezpieczenie: po imporcie albo scaleniu kopii notatka o tym samym identyfikatorze bywa
już innym obiektem, więc oprócz odcisku sprawdzana jest tożsamość obiektu — inaczej
przyciski na karcie wskazywałyby na poprzedni egzemplarz.

**Kolumny Etykiety, Księgi i Publikacje nie przepisują DOM bez powodu.** Wynikowy HTML jest
porównywany z obecnym; identyczny oznacza brak jakiejkolwiek operacji na drzewie dokumentu
(a przy okazji zachowany stan przewijania kolumny).

**Liczniki i nagłówki** aktualizowane są przez `setText` / `setHtml`, które najpierw
sprawdzają, czy wartość faktycznie się zmieniła.

## 2. Wydajność JavaScriptu

**Pamięć podręczna tekstu do wyszukiwania.** Przy każdym wciśniętym klawiszu przeszukiwane
są wszystkie notatki. Wcześniej dla każdej z nich liczono od nowa `plainOf()` (a w środku
`refLabel`, `pubFullName`, `issueLabel`) oraz normalizację ogonków. Teraz wynik jest liczony
raz na notatkę i odświeżany dopiero, gdy notatka się zmieni. Użyto `WeakMap`, więc wpis
znika razem z notatką i nie może zostać w pamięci.

**Zapytanie normalizowane raz.** `norm(query)` i `squash(query)` liczone są w `parseQuery`,
a nie osobno dla każdej z 1200 notatek.

**Jeden przebieg zamiast sześciu.** Lista i liczniki nad listą korzystały z tego samego
zestawu notatek, ale każde liczyło go osobno; liczniki dodatkowo robiły cztery oddzielne
przebiegi. Teraz zestaw powstaje raz, a liczniki wypełnia jedna pętla.

**Porównywarki sortowania** budowane są raz przy starcie, a nie przy każdym sortowaniu
(wcześniej powstawał obiekt z ośmioma funkcjami za każdym razem).

## 3. localStorage

Dodano `lsSet` (pomija zapis, gdy wartość się nie zmieniła) i `lsSetSoon` (skleja serie
zmian w jeden zapis). Objęto nimi ustawienia zmieniane najczęściej: filtry kolumn, rozmiar
czcionki, pozycję czytania, licznik niezapisanych zmian, szerokości kolumn, tryb sortowania,
motyw i podpowiedzi wyszukiwania. localStorage zapisuje się synchronicznie na dysk, więc
każdy pominięty zapis to zdjęta blokada z głównego wątku.

Odroczone zapisy są dociągane przy chowaniu i zamykaniu karty (`pagehide`,
`visibilitychange`), więc opóźnienie nigdy nie oznacza utraty ustawienia.

## 4. Ładowanie aplikacji

Kolejność ładowania modułów została zachowana; ciężkie biblioteki (`sql.js`, `JSZip`) tak
jak wcześniej pobierane są dopiero przy imporcie lub eksporcie, a nie przy starcie.
Pierwsze renderowanie jest 2,3× szybsze dzięki punktom 1–2.

## 5. Zużycie pamięci

**Wyciek obserwatorów przewijania naprawiony.** Każde odświeżenie listy tworzyło nowy
`IntersectionObserver` (do doładowywania kolejnych notatek) i nie zwalniało poprzedniego —
po 60 odświeżeniach zostawało 61 działających obserwatorów. Teraz jest jeden, a stary jest
odłączany przed utworzeniem nowego.

**Karty spoza listy są usuwane z pamięci podręcznej** przy każdym odświeżeniu, więc cache
nie rośnie w nieskończoność.

**Usunięty martwy kod** — pozostałości po wycofanej funkcji podkreśleń i nieużywane
pomocniki: `marks`, `pubMarks`, `showMarks`, `groupMarks`, `markGroupKey`, `markGroupRowEl`,
`markLabel`, `markColor`, `markFinderUrl`, `groupLabel`, `renderMarksSection`, `openInJWL`,
`pubGroupOf`, `pubGroupLabel`, `metalStyle`, `colGrad`, `insertNodeAtSel`, `cycleFsWidth`,
`LHN`, `FSWN`. Weryfikacja: analizator zgłasza zero nieużywanych deklaracji najwyższego
poziomu i zero odwołań do nieistniejących nazw.

## 6. Animacje

**Pasek postępu czytania** rysowany jest przez `transform: scaleX()` zamiast zmiany
`width`. Zmiana szerokości przy każdym piknięciu przewijania zmuszała przeglądarkę do
przeliczania układu strony; skalowanie wykonuje karta graficzna. Dodatkowo pasek
aktualizuje się najwyżej raz na klatkę i tylko gdy przesunął się o co najmniej 0,5%.

**Rozmycie tła ograniczone na dotyku.** Na urządzeniach bez kursora (`@media (hover:none)`)
przyciemnione tło okien ma rozmycie 3 px zamiast 6, a dymki i menu podręczne nie mają go
wcale — to najdroższy efekt na telefonach.

Pozostałe animacje już wcześniej korzystały wyłącznie z `transform` i `opacity`.

## 7. Service Worker

**Obce adresy nie trafiają już do pamięci podręcznej.** Wcześniej przechwytywane były
wszystkie żądania GET, więc biblioteki z CDN i odwołania do jw.org lądowały w cache jako
nieprzejrzyste odpowiedzi — zajmowały miejsce, a i tak nie dawały się użyć offline.
Teraz obsługiwane są tylko adresy z tego samego serwera.

**Strategia dla modułów: „z pamięci, aktualizacja w tle".** Plik CSS/JS oddawany jest
natychmiast z pamięci (zero czekania na sieć), a równolegle sprawdzana jest nowsza wersja,
która trafia do pamięci na następne uruchomienie. Wcześniej moduł z pamięci nigdy się nie
odświeżał aż do zmiany numeru cache.

**Do pamięci trafiają tylko udane odpowiedzi** (`res.ok`) — błąd 404 lub 500 nie zapisze się
już jako „gotowy" plik.

Nazwa pamięci podręcznej: `jwstudy-v128`.

## 8. Zgodność

- 18 zestawów testów, 262 asercje — wszystkie przechodzą.
- Wygenerowany HTML listy notatek, karty, kolumn oraz obu eksportów jest identyczny
  z wersją sprzed refaktoryzacji (poza białymi znakami).
- Analizator kolejności modułów: brak odwołań do rzeczy zdefiniowanych w późniejszych plikach.
- Analizator nazw: każdy używany identyfikator jest gdzieś zadeklarowany.

## Czego nie zmieniono

Sortowanie i filtrowanie samo w sobie (bez DOM) zajmuje ok. 14 ms na 1200 notatek w obu
wersjach — to nie jest wąskie gardło i nie było powodu tego ruszać. Wpisywanie w wyszukiwarce
przyspieszyło tylko 1,2×, bo przy zmianie frazy zmienia się podświetlenie w każdej karcie,
więc karty i tak muszą powstać na nowo. To koszt nieusuwalny bez zmiany wyglądu.
