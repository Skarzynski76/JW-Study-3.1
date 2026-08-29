# JW Study v1.34 — dopracowanie wyglądu

Zmiany wyłącznie w warstwie stylów. Żaden plik JavaScript nie został tknięty —
sprawdzone porównaniem bajt po bajcie z v1.33.

Całość siedzi w jednym nowym arkuszu `css/11-polish.css` (252 linie), ładowanym jako
ostatni. Dzięki temu cofnięcie zmian sprowadza się do usunięcia jednego odwołania.

## Odstępy

Wprowadzona skala `--sp-1` … `--sp-5` (4, 8, 12, 16, 24 px) mnożona przez `--dens`,
więc ustawienie gęstości interfejsu działa jak dotąd. Odstępy w karcie notatki układają
się teraz w rytm: tytuł → 8 px → metadane → 4 px → etykiety → 8 px → treść → 8 px →
pasek narzędzi. Wcześniej każdy z nich był ustawiany osobno i nie tworzył wzoru.

## Typografia

- tytuł notatki: ciaśniejszy odstęp liter (−0,016 em), wiersz 1,28 i `text-wrap: balance`,
  żeby ostatnia linia nie zostawała z jednym słowem,
- treść: interlinia 1,62 i łamanie długich adresów zamiast rozpychania kolumny,
- nagłówki kolumn: jeden rozmiar 11 px zamiast trzech zbliżonych,
- **wszystkie liczniki mają cyfry o równej szerokości** — kolumny przestały drgać
  przy zmianie liczb,
- pigułki i chipy sprowadzone do jednego rozmiaru.

## Cienie

Trzy poziomy zamiast wartości dobieranych na oko, każdy dwuwarstwowy (bliski styk plus
miękkie rozejście), z osobnym zestawem dla trybu nocnego:

| Poziom | Gdzie |
|---|---|
| `--cien-1` | kolumny, karta pod kursorem |
| `--cien-2` | menu podręczne, dymki, komunikat |
| `--cien-3` | okna dialogowe, przeciągana karta |

Karty notatek zostają płaskie — cień pojawia się dopiero pod kursorem.

## Przyciski

Jedna wysokość (34 px), jeden promień, jeden rytm reakcji. Przyciski ikonowe są kwadratowe.
Na dotyku pola trafienia rosną do 38–40 px, a ikony w karcie do 36 × 34 px — tyle zaleca
Apple. Doszedł stan wyłączony i **widoczne obramowanie przy poruszaniu się klawiaturą**,
którego wcześniej nie było wcale.

## Animacje

Wspólny rytm: `--dur-szybko` 0,14 s dla reakcji na dotyk, `--dur` 0,2 s dla przejść,
jedna krzywa `cubic-bezier(.32,.72,.35,1)`. Wszystkie animacje korzystają wyłącznie
z `transform` i `opacity`, więc nie zmuszają przeglądarki do przeliczania układu strony.
Ustawienie „Animacje: ograniczone" zostawia teraz samo wygaszanie okien.

## Dialogi

Stały rytm tytuł → opis → przyciski, promień 16 px, przyciski o wysokości 46 px
z reakcją na naciśnięcie. Okno ma limit wysokości `min(88vh, 900px)` i zatrzymuje
przewijanie w środku, żeby nie przewijało strony pod spodem. Pasek przewijania w długich
oknach (pomoc, powitanie) odsunięty od krawędzi.

## Naprawiona uciążliwość na iPhonie

Pole wyszukiwania miało czcionkę 15 px. Safari na iPhonie **przybliża stronę** w chwili
wejścia w pole mniejsze niż 16 px i użytkownik ląduje w powiększonym widoku, z którego
musi się wycofywać ręcznie. Wszystkie pola tekstowe mają teraz 16 px.

## iPad

- **pion (768–1180 px):** kolumny boczne zwężone do 190 i 196 px, mniejsze odstępy —
  lista notatek dostała ok. 90 px więcej szerokości,
- **poziom (od 1181 px):** większe odstępy, więcej powietrza,
- **wąski pasek Split View:** kolumny przestają się zwężać poniżej sensownej granicy.

## Telefony

- bezpieczne marginesy przy „uchu" iPhone'a w poziomie,
- komunikat i przycisk czytnika nie wchodzą już pod pasek gestu na dole ekranu,
- pasek kolorów ograniczony do szerokości ekranu,
- osobne reguły dla małych telefonów (SE, mini): krótsze podpisy, mniej powietrza,
- telefon w poziomie: niższy nagłówek, żeby na treść zostało więcej z płaskiego ekranu.

## Sprawdzenie

- żaden plik JavaScript nie zmieniony (porównanie bajt po bajcie),
- 358 asercji w 22 zestawach — wszystkie przechodzą, w wersji modułowej i jednoplikowej,
- kontrola PWA i offline: 23 asercje bez zmian,
- wszystkie 11 arkuszy zbalansowanych i zarejestrowanych w `index.html` oraz `sw.js`,
- brak klas CSS bez pokrycia w kodzie.
