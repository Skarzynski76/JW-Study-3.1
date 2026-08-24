# Struktura danych

## Gdzie co leży

| Magazyn | Co przechowuje | Rozmiar | Znika przy |
|---|---|---|---|
| **IndexedDB** `jwStudyClean` | notatki, etykiety, sekcje, kosz | setki MB | wyczyszczeniu danych witryny |
| **localStorage** | ustawienia i drobne stany | ok. 5 MB | wyczyszczeniu danych witryny |
| **Cache Storage** `jwstudy-vNNN` | pliki aplikacji do pracy offline | — | zmianie wersji |

Rozdział jest celowy: localStorage zapisuje synchronicznie i ma mały limit, więc trafiają
tam wyłącznie ustawienia. Treść notatek zawsze idzie do IndexedDB.

## IndexedDB — magazyny

| Magazyn | Klucz | Zawartość |
|---|---|---|
| `notes` | `g` | wszystkie notatki, także te w koszu (`del: true`) |
| `tags` | `id` | etykiety |
| `meta` | własny | `sections`, `deletedTags`, `dataV` |
| `files` | własny | zarezerwowany na załączniki |

## Notatka (`Note`)

```js
{
  g:   "0a1b2c…",     // identyfikator (GUID); jedyne pole obowiązkowe
  t:   "Wierność",    // tytuł
  c:   "tekst…",      // treść jako zwykły tekst — po niej działa wyszukiwanie
  h:   "<b>tekst</b>",// treść jako HTML z edytora; gdy pusta, wyświetlane jest c
  tg:  [1, 4],        // identyfikatory etykiet
  cr:  "2026-01-05T10:00:00.000Z",   // utworzenie
  mo:  "2026-02-11T18:22:00.000Z",   // ostatnia zmiana
  la:  "2026-02-12T08:00:00.000Z",   // ostatnie otwarcie (lista „Ostatnio otwierane")
  ed:  true,          // notatka była edytowana w aplikacji
  pin: false,         // przypięta na górze list
  fav: true,          // ulubiona
  del: false,         // w koszu
  ord: 30,            // pozycja przy sortowaniu „własna kolejność" (numeracja co 10)
  ff:  "Georgia",     // własna czcionka notatki

  // powiązanie z Biblią
  b:   43,            // numer księgi (1–66); 0 = notatka nie jest biblijna
  ch:  3,             // rozdział
  v:   16,            // werset

  // powiązanie z publikacją
  ks:  "w",           // symbol publikacji, np. „w", „lff", „pt14"
  itn: 20260101,      // numer wydania (RRRRMMDD)
  doc: 123456,        // identyfikator dokumentu w publikacji
  par: 7,             // akapit
  pub: "Tytuł artykułu"
}
```

Notatka opisuje **miejsce** w publikacji, a nie jej treść — z pól `b/ch/v` albo
`ks/itn/doc/par` budowany jest odnośnik do JW Library. Treść publikacji nigdy nie jest
kopiowana ani przechowywana.

Pola przechodzą przez `sanitizeNote()` przy każdym wczytaniu: brak `g` odrzuca rekord,
`tg` niebędące tablicą staje się pustą tablicą, pola liczbowe są konwertowane,
a `pin`/`fav`/`del` sprowadzane do wartości logicznych.

## Etykieta (`Tag`)

```js
{
  id:    4,              // liczba, unikalna
  name:  "Studium",      // nazwa; po niej dopasowywane są etykiety przy scalaniu kopii
  color: "#c08663",      // opcjonalny kolor
  sec:   2,              // identyfikator sekcji, gdy etykieta należy do sekcji
  ord:   3,              // kolejność na liście
  nw:    true            // utworzona w aplikacji, jeszcze nieznana JW Library
}
```

## Sekcja (`Section`)

```js
{ id: 2, name: "Kongresy", color: "#6f93bd", ord: 0, open: true }
```

Sekcje grupują etykiety. Przechowywane w magazynie `meta` pod kluczem `sections`.

## localStorage — pełna lista kluczy

Wszystkie klucze mają przedrostek `jws`, poza jednym wyjątkiem (`pubOrder`).

| Klucz | Typ | Znaczenie |
|---|---|---|
| `jwsTheme` | tekst | motyw: `light`, `sepia`, `dark`, `auto` |
| `jwsFont` | liczba | rozmiar czcionki notatek i kolumn (11–24 px) |
| `jwsFsFont` | liczba | rozmiar czcionki w czytniku |
| `jwsLineH` | liczba | interlinia w czytniku |
| `jwsFsW` | 0/1/2 | szerokość czytania: wąski, komfort, pełny |
| `jwsReadFont` | tekst | krój pisma w czytniku |
| `jwsDens` | tekst | gęstość interfejsu: `zwarta`, `normalna`, `luzna` |
| `jwsAnim` | tekst | animacje: `on`, `ograniczone`, `off` |
| `jwsView` | tekst | układ listy: `list`, `compact` |
| `jwsSort` | tekst | tryb sortowania |
| `jwsFilt` | JSON | zapamiętane filtry `{book, ch, tag}` |
| `jwsCols` | JSON | które kolumny są zwinięte `{t, b}` |
| `jwsWidths` | JSON | szerokości kolumn w pikselach |
| `jwsColors` | JSON | kompozycja kolorystyczna kolumn |
| `jwsReadPos` | JSON | zapamiętane miejsce czytania per notatka |
| `jwsVersions` | JSON | historia wersji notatek (10 ostatnich, bez zdjęć, limit 200 kB) |
| `jwsRecent` | JSON | ostatnie wyszukiwania |
| `jwsDirty` | liczba | zmiany od ostatniej kopii zapasowej |
| `jwsLastBk` | data | data ostatniej kopii (RRRR-MM-DD) |
| `jwsBibleKs` | tekst | symbol przekładu Biblii wykryty przy imporcie |
| `jwsOnboarded` | „1" | okno powitalne już pokazane |
| `jwsOfflineOK` | „1" | potwierdzenie gotowości offline już pokazane |
| `pubOrder` | JSON | własna kolejność pozycji w panelu Publikacje |

Zapis i odczyt zawsze przez `lsSet` / `lsGet` / `lsSetSoon` — same łapią wyjątki
i pomijają zapis wartości, która się nie zmieniła.

## Format kopii JSON

```js
{
  v: 2,                    // wersja formatu
  date: "2026-02-11T…",    // kiedy zrobiono kopię
  notes: [ /* Note */ ],
  tags:  [ /* Tag */ ],
  sections: [ /* Section */ ]
}
```

Przy wczytywaniu sprawdzane jest kolejno: czy plik nie jest pusty, czy to poprawny JSON,
czy zawiera listy `notes` i `tags` i czy po przepuszczeniu przez sito coś zostało.
Każdy przypadek ma osobny komunikat.

## Plik `.jwlibrary`

To zwykłe archiwum ZIP zawierające `manifest.json` i bazę SQLite `userData.db`.
Aplikacja czyta z niej tabele `Note`, `Location`, `Tag` i `TagMap`.

Eksport **nie tworzy bazy od zera** — nanosi zmiany na plik wskazany przez użytkownika,
przelicza sumę kontrolną SHA-256 i aktualizuje manifest. Dzięki temu w pliku zostaje
wszystko, czego aplikacja nie obsługuje.

Daty muszą mieć format `RRRR-MM-DDTGG:MM:SS+00:00` — inaczej JW Library odrzuca plik.
Pilnuje tego `jwlDate()`.
