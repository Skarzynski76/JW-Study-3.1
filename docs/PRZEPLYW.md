# Przepływ danych

## Skąd biorą się notatki

Przy każdym uruchomieniu dane pochodzą z trzech źródeł, które `boot()` scala w jedną listę.

```mermaid
flowchart LR
    IDB[("IndexedDB<br/>zapis z tego urządzenia")] --> B{boot}
    EMB["Paczka wbudowana<br/>w index.html<br/>base64 + gzip"] --> B
    JSON["Kopia JSON<br/>wybrana przez użytkownika"] -.na żądanie.-> MB[mergeBackup]
    JWL["Plik .jwlibrary<br/>z JW Library"] -.na żądanie.-> IMP[import]
    B --> SAN["sanitizeNotes<br/>sanitizeTags"]
    SAN --> ST["notes[] i tags[]<br/>w pamięci"]
    MB --> ST
    IMP --> ST
    ST --> RA["renderAll()"]
    ST --> IDB
```

Pierwszeństwo ma zawsze zapis z urządzenia. Paczka wbudowana służy do uzupełnienia
braków — jeśli notatka jest w paczce, a nie ma jej w pamięci przeglądarki, zostaje dodana.
Nic nie jest nadpisywane bez pytania.

## Od kliknięcia do ekranu

```mermaid
flowchart TB
    U["Kliknięcie / wpisanie tekstu"] --> AKT["Funkcja działania<br/>togglePin, toggleFav, toggleEdit…"]
    AKT --> MD["markDirty(n)"]
    MD --> SN["saveNote → IndexedDB"]
    MD --> BD["bumpDirty → licznik zmian"]
    AKT --> RA["renderAll()"]
    RA --> RT["renderTags()"]
    RA --> RB["renderBooks()"]
    RA --> RN["renderNotes()"]
    RT --> RP["renderPubPanel()"]
    RN --> BN["baseNotes()<br/>filtry kolumn + wyszukiwarka"]
    BN --> QF["renderQuickFilters()<br/>liczniki z tej samej listy"]
    BN --> FN["filteredNotes()<br/>+ szybki filtr"]
    FN --> SO["sortNotes()"]
    SO --> SIG{"noteCardSig<br/>odcisk się zmienił?"}
    SIG -->|nie| REU["karta z pamięci podręcznej"]
    SIG -->|tak| NEW["noteCard() — nowa karta"]
    REU --> SYNC["syncChildren()<br/>przestawienie węzłów"]
    NEW --> SYNC
```

Kluczowy jest romb na dole: karta powstaje od nowa tylko wtedy, gdy zmieniło się coś,
co na niej widać. Przy zmianie jednej notatki spośród tysiąca budowana jest jedna karta.

## Wyszukiwanie

```mermaid
sequenceDiagram
    participant U as Użytkownik
    participant S as pole szukania
    participant P as parseQuery
    participant C as searchTextOf
    participant R as renderAll
    U->>S: wpisuje znak
    S->>P: parseQuery(tekst)
    Note over P: raz liczy wyrażenia regularne<br/>oraz _qNorm i _qSquash
    S->>S: odczekanie 130 ms
    S->>R: renderAll()
    R->>C: dla każdej notatki
    alt notatka niezmieniona
        C-->>R: gotowe teksty z pamięci podręcznej
    else notatka zmieniona
        C->>C: plainOf + norm + squash
        C-->>R: policzone i zapamiętane
    end
```

Bez pamięci podręcznej każdy wciśnięty klawisz przeliczałby `plainOf()` dla wszystkich
notatek, a w środku `refLabel`, `pubFullName` i `issueLabel`.

## Wymiana z JW Library

```mermaid
flowchart LR
    subgraph Import
        F1[".jwlibrary"] --> Z1["JSZip — rozpakowanie"]
        Z1 --> DB1["sql.js — odczyt userData.db"]
        DB1 --> N1["notatki + etykiety + lokalizacje"]
        N1 --> ST1["notes[] i tags[]"]
    end
    subgraph Eksport
        ST2["notes[] i tags[]"] --> AC["applyChangesToDb"]
        BASE[".jwlibrary jako podstawa"] --> AC
        AC --> DB2["zmieniona baza SQLite"]
        DB2 --> MAN["manifest.json + suma SHA-256"]
        MAN --> Z2["JSZip — spakowanie"]
        Z2 --> F2["gotowy plik .jwlibrary"]
    end
```

Eksport zawsze potrzebuje pliku podstawowego z JW Library — aplikacja nie tworzy bazy
od zera, tylko nanosi zmiany na istniejącą. Dzięki temu plik zachowuje wszystko,
czego aplikacja nie obsługuje.

## Zapis ustawień

```mermaid
flowchart LR
    Z["Zmiana ustawienia"] --> D{"zmienia się<br/>seriami?"}
    D -->|tak| SS["lsSetSoon<br/>sklejenie w jeden zapis"]
    D -->|nie| LS["lsSet"]
    SS --> T["odczekanie 250–500 ms"]
    T --> LS
    LS --> P{"wartość<br/>taka sama?"}
    P -->|tak| X["pomijamy zapis"]
    P -->|nie| W["localStorage.setItem"]
    PH["pagehide / ukrycie karty"] --> FL["lsFlush — dopisanie kolejki"]
    FL --> LS
```
