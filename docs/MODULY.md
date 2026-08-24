# Moduły logiczne

Moduły ładowane są w kolejności podanej w `index.html` i dzielą wspólny zakres globalny.
Plik może korzystać tylko z tego, co zdefiniowano w nim samym albo we wcześniejszym module.

| # | Moduł | Rola | Linii | Funkcji |
|---|---|---|---:|---:|
| 1 | `01-core.js` | Fundament | 92 | 6 |
| 2 | `02-storage.js` | Trwałe dane | 168 | 18 |
| 3 | `03-boot.js` | Start | 119 | 2 |
| 4 | `04-filters.js` | Filtry i ikony | 78 | 6 |
| 5 | `05-publications.js` | Publikacje i wyszukiwanie | 324 | 20 |
| 6 | `06-tags.js` | Kolumna Etykiety | 260 | 19 |
| 7 | `07-appearance.js` | Kolory | 191 | 17 |
| 8 | `08-books.js` | Kolumna Księgi | 63 | 3 |
| 9 | `09-notes.js` | Lista notatek | 504 | 26 |
| 10 | `10-reader.js` | Czytnik | 281 | 18 |
| 11 | `11-theme.js` | Motyw i czcionka | 73 | 7 |
| 12 | `12-actions.js` | Działania na notatkach | 199 | 28 |
| 13 | `13-editor.js` | Edytor | 494 | 24 |
| 14 | `14-images.js` | Obrazy i edycja w miejscu | 371 | 14 |
| 15 | `15-highlight.js` | Kolorowanie | 127 | 5 |
| 16 | `16-newnote.js` | Nowa notatka | 57 | 3 |
| 17 | `17-files.js` | Menu Plik i import | 169 | 6 |
| 18 | `18-export-jwl.js` | Eksport do JW Library | 279 | 5 |
| 19 | `19-export-doc.js` | Eksport do Word i PDF | 175 | 16 |
| 20 | `20-backup.js` | Kopia zapasowa | 159 | 4 |
| 21 | `21-ui-helpers.js` | Pomocnicze interfejsu | 120 | 12 |
| 22 | `22-search.js` | Podpowiedzi wyszukiwania | 103 | 5 |
| 23 | `24-reorder.js` | Własna kolejność | 73 | 2 |
| 24 | `25-context-menu.js` | Szybkie akcje | 99 | 4 |
| 25 | `26-settings.js` | Ustawienia | 120 | 6 |
| 26 | `23-shortcuts.js` | Skróty i uruchomienie | 55 | 0 |


## Opis szczegółowy

### `01-core.js` — Fundament

Stałe (nazwy ksiąg, klucze pamięci), zmienne stanu aplikacji, skrót $ oraz bezpieczna obsługa localStorage.

**Zależy od:** niczego (moduł podstawowy)  
**Rozmiar:** 92 linii

**Funkcje (6):** `lsSet`, `lsGet`, `lsSetSoon`, `lsFlush`, `setText`, `setHtml`

**Stan modułu:** `BOOKS`, `DBNAME`, `KP`, `notes`, `tags`, `filt`, `query`, `sortMode`, `visibleCount`, `expandedBook`, `idb`, `$`, `_lsLast`, `_lsTimers` … (15 łącznie)

### `02-storage.js` — Trwałe dane

IndexedDB, zapis notatek i etykiet, ochrona przed brakiem miejsca, sito na uszkodzone dane.

**Zależy od:** `01-core.js`, `09-notes.js`, `12-actions.js`, `13-editor.js`, `14-images.js`, `21-ui-helpers.js`  
**Rozmiar:** 168 linii

**Funkcje (18):** `idbOpen`, `idbAll`, `idbPut`, `idbDelKey`, `idbGet`, `idbBulk`, `idbBulkChunked`, `idbCount`, `isQuotaError`, `reportSaveError`, `saveNote`, `checkSpaceForImage`, `commitLiveEdit`, `saveTags`, `sanitizeNote`, `liczbaLubZero`, `sanitizeNotes`, `sanitizeTags`

**Stan modułu:** `storageFull`

### `03-boot.js` — Start

Wczytanie danych z trzech źródeł, scalenie, odtworzenie ustawień, rejestracja Service Workera.

**Zależy od:** `01-core.js`, `02-storage.js`, `06-tags.js`, `07-appearance.js`, `09-notes.js`, `12-actions.js`, `16-newnote.js`, `21-ui-helpers.js`  
**Rozmiar:** 119 linii

**Funkcje (2):** `decodeEmbedded`, `boot`

### `04-filters.js` — Filtry i ikony

Dopasowanie notatki do wybranej księgi, rozdziału i etykiety; zestaw ikon kreskowych; pozycjonowanie menu.

**Zależy od:** `01-core.js`, `05-publications.js`  
**Rozmiar:** 78 linii

**Funkcje (6):** `offlineReady`, `placeDropdown`, `showStorageInfo`, `noteMatchesTag`, `noteMatchesBook`, `pubKeyOf`

**Stan modułu:** `svgIc`, `IC_GRIP`, `IC_PIN`, `IC_BOOK`, `IC_PENCIL`, `IC_CLOCK`, `IC_EXT`, `IC_STAR`, `IC_DOTS`

### `05-publications.js` — Publikacje i wyszukiwanie

Panel publikacji (kategorie, roczniki, wydania) oraz cały mechanizm wyszukiwania z pamięcią podręczną tekstów.

**Zależy od:** `01-core.js`, `04-filters.js`, `09-notes.js`, `11-theme.js`, `21-ui-helpers.js`  
**Rozmiar:** 324 linii

**Funkcje (20):** `pubCatOf`, `pubYearOf`, `loadPubOrder`, `savePubOrder`, `pubOrderKey`, `applyPubOrder`, `setPubOrder`, `clearPubOrder`, `initPubDrag`, `renderPubPanel`, `groupHeaderFor`, `pubKeyLabel`, `noteMatchesCh`, `plainOf`, `noteSearchStamp`, `searchTextOf`, `parseQuery`, `noteFieldText`, `squash`, `noteMatchesQuery`

**Stan modułu:** `PUB_CATS`, `pubView`, `pubOrder`, `_searchCache`, `qComp`, `qHl`, `qFields`, `_qNorm`, `_qSquash`, `QFIELD_MAP`

### `06-tags.js` — Kolumna Etykiety

Układ listy notatek, etykiety, sekcje etykiet, szybkie filtry, wyliczanie bazy notatek.

**Zależy od:** `01-core.js`, `02-storage.js`, `04-filters.js`, `05-publications.js`, `07-appearance.js`, `09-notes.js`, `11-theme.js`, `12-actions.js`, `13-editor.js`, `21-ui-helpers.js`  
**Rozmiar:** 260 linii

**Funkcje (19):** `applyNoteView`, `setNoteView`, `initViewBar`, `matchesQuick`, `baseNotes`, `filteredNotes`, `renderQuickFilters`, `renderTags`, `saveSections`, `nextSecId`, `createSection`, `toggleSection`, `renameSection`, `deleteSection`, `moveSection`, `setTagSection`, `sectionMenu`, `applyPreset`, `shade`

**Stan modułu:** `noteView`, `savedView`, `quickFilter`, `_QF_WEEK`, `dragTagId`, `sections`, `SECCOLORS`, `TAGCOLORS`, `PASTELS`

### `07-appearance.js` — Kolory

Kompozycje kolorystyczne kolumn, menu etykiety i sekcji, paleta barw.

**Zależy od:** `01-core.js`, `02-storage.js`, `04-filters.js`, `05-publications.js`, `06-tags.js`, `09-notes.js`, `11-theme.js`, `12-actions.js`, `13-editor.js`, `19-export-doc.js`, `21-ui-helpers.js`  
**Rozmiar:** 191 linii

**Funkcje (17):** `hexA`, `desat`, `glassGrad`, `loadColorCfg`, `buildColorCSS`, `applyColors`, `openColorMenu`, `tagItem`, `cmpTags`, `sortTags`, `ensureOrd`, `moveTag`, `tagMenu`, `createTag`, `saveDeletedTags`, `deleteTag`, `renameTag`

**Stan modułu:** `deletedTagNames`

### `08-books.js` — Kolumna Księgi

Lista ksiąg Biblii z licznikami i rozwijanymi rozdziałami.

**Zależy od:** `01-core.js`, `04-filters.js`, `05-publications.js`, `09-notes.js`, `11-theme.js`, `21-ui-helpers.js`  
**Rozmiar:** 63 linii

**Funkcje (3):** `renderBooks`, `bookItem`, `bookBlock`

### `09-notes.js` — Lista notatek

Sortowanie, renderowanie listy z pamięcią podręczną kart, budowa karty notatki, przypinanie i ulubione.

**Zależy od:** `01-core.js`, `04-filters.js`, `05-publications.js`, `06-tags.js`, `07-appearance.js`, `08-books.js`, `10-reader.js`, `12-actions.js`, `13-editor.js`, `14-images.js`, `17-files.js`, `18-export-jwl.js`, `19-export-doc.js`, `21-ui-helpers.js`  
**Rozmiar:** 504 linii

**Funkcje (26):** `sortNotes`, `togglePin`, `toggleFav`, `toggleReading`, `pubFullName`, `issueLabel`, `refLabel`, `finderUrl`, `isIOS`, `hilite`, `contentHtml`, `emptyStateEl`, `bumpTagsVer`, `noteCardSig`, `noteCardFor`, `pruneCardCache`, `syncChildren`, `renderNotes`, `norm`, `noteCardHead`, `noteCardRef`, `noteCardMeta`, `noteCardChips`, `noteCardTools`, `noteCard`, `renderAll`

**Stan modułu:** `crOf`, `moOf`, `SORTERS`, `PUB_NAMES`, `MONTHS_PL`, `MONTHS_PL_D`, `bibleKs`, `_cardCache`, `_tagsVer`, `_moreObserver`, `_svg`, `ICO`

### `10-reader.js` — Czytnik

Pełny ekran: typografia, spis treści, szukanie w notatce, pasek postępu, zapamiętane miejsce czytania.

**Zależy od:** `01-core.js`, `02-storage.js`, `09-notes.js`, `11-theme.js`, `21-ui-helpers.js`  
**Rozmiar:** 281 linii

**Funkcje (18):** `openFs`, `renderFs`, `readStats`, `buildToc`, `clearFsFind`, `runFsFind`, `markCurrentHit`, `stepFsFind`, `readPosAll`, `saveReadPos`, `restoreReadPos`, `closeFs`, `fsGo`, `updateFsNav`, `updateFsProgress`, `acquireWake`, `releaseWake`, `openReadPop`

**Stan modułu:** `fsGuid`, `fsNavList`, `fsListDirty`, `fsFindHits`, `fsFindIdx`, `READPOS_KEY`, `_progRaf`, `_progLast`, `wakeLock`

### `11-theme.js` — Motyw i czcionka

Tryb dzień/sepia/noc/system, rozmiar czcionki, szerokość czytania, zapamiętywanie filtrów.

**Zależy od:** `01-core.js`, `06-tags.js`, `07-appearance.js`, `09-notes.js`, `20-backup.js`, `21-ui-helpers.js`  
**Rozmiar:** 73 linii

**Funkcje (7):** `applyTheme`, `setTheme`, `applyReading`, `applyFsFont`, `applyFs`, `applyFsWidth`, `persistFilt`

**Stan modułu:** `themeMode`, `mqDark`, `LHS`, `RFONTS`, `lineH`, `readFont`, `fsNoteFs`, `noteFs`, `FSW`, `fsWidth`

### `12-actions.js` — Działania na notatkach

Oznaczanie zmian, kopiowanie, kosz, cofanie, stan kopii zapasowej.

**Zależy od:** `01-core.js`, `02-storage.js`, `07-appearance.js`, `09-notes.js`, `13-editor.js`, `21-ui-helpers.js`  
**Rozmiar:** 199 linii

**Funkcje (28):** `bumpDirty`, `clearDirty`, `backupDaysAgo`, `backupStale`, `backupStatusHtml`, `updateBackupBadge`, `deepCopy`, `cloneNote`, `cloneTags`, `pushUndo`, `updateUndoBtn`, `doUndo`, `touchAccess`, `markDirty`, `copyNote`, `downloadMd`, `delNote`, `trashList`, `daysLeft`, `purgeOldTrash`, `restoreNote`, `purgeNote`, `emptyTrash`, `renderTrash`, `openTrash`, `untag`, `addTag`, `dropOnTag`

**Stan modułu:** `undoStack`, `TRASH_DAYS`

### `13-editor.js` — Edytor

Pasek narzędzi, wstawianie (werset, cytat, lista zadań, tabela, szablon), znajdź i zamień, historia wersji, okna dialogowe.

**Zależy od:** `01-core.js`, `02-storage.js`, `04-filters.js`, `09-notes.js`, `12-actions.js`, `14-images.js`, `15-highlight.js`, `21-ui-helpers.js`  
**Rozmiar:** 494 linii

**Funkcje (24):** `buildEditbar`, `updateEditbarState`, `openEbPop`, `restoreSel`, `insertNodeAtRange`, `askText`, `showInfo`, `askChoice`, `askConfirm`, `parseRef`, `refText`, `autolinkRefs`, `insertVerseRef`, `insertUrlLink`, `insertTaskList`, `insertTable`, `insertTemplate`, `openReplace`, `versionsAll`, `stripImagesForVersion`, `saveVersion`, `openHistory`, `blockOf`, `autoformat`

**Stan modułu:** `EDIT_FONTS`, `edSavedRange`, `REF_RX`, `NOTE_TEMPLATES`, `VER_KEY`

### `14-images.js` — Obrazy i edycja w miejscu

Włączanie edycji notatki, czyszczenie HTML, obsługa zdjęć: rozmiar, oblewanie tekstem, wstawianie dotykiem.

**Zależy od:** `01-core.js`, `02-storage.js`, `09-notes.js`, `12-actions.js`, `13-editor.js`, `21-ui-helpers.js`  
**Rozmiar:** 371 linii

**Funkcje (14):** `showImgBar`, `positionHandles`, `hideImgBar`, `caretRangeFromPoint`, `startImgMoveFor`, `startImgMove`, `cancelImgMove`, `insertImageUrl`, `placeImgAt`, `captureRange`, `compressImage`, `toggleEdit`, `sanitize`, `htmlToPlain`

**Stan modułu:** `selImg`, `suppressImgClick`, `movePending`, `lpTimer`, `lpImg`, `lpXY`

### `15-highlight.js` — Kolorowanie

Podświetlanie zaznaczonego fragmentu w notatce.

**Zależy od:** `01-core.js`, `09-notes.js`, `10-reader.js`, `12-actions.js`, `13-editor.js`, `14-images.js`, `21-ui-helpers.js`  
**Rozmiar:** 127 linii

**Funkcje (5):** `showHlBar`, `saveContentEl`, `applyMark`, `wrapTag`, `unwrapMarks`

**Stan modułu:** `hlBar`, `touchUI`, `selTimer`

### `16-newnote.js` — Nowa notatka

Okno tworzenia notatki wraz z wyborem etykiet i powiązaniem z wersetem.

**Zależy od:** `01-core.js`, `02-storage.js`, `06-tags.js`, `07-appearance.js`, `09-notes.js`, `12-actions.js`, `21-ui-helpers.js`  
**Rozmiar:** 57 linii

**Funkcje (3):** `buildStatic`, `renderNnTags`, `nnCreateTag`

### `17-files.js` — Menu Plik i import

Menu główne, doładowywanie bibliotek z CDN, wybór pliku, import kopii .jwlibrary.

**Zależy od:** `01-core.js`, `02-storage.js`, `04-filters.js`, `07-appearance.js`, `09-notes.js`, `12-actions.js`, `13-editor.js`, `18-export-jwl.js`, `20-backup.js`, `21-ui-helpers.js`  
**Rozmiar:** 169 linii

**Funkcje (6):** `loadScript`, `getLibs`, `openFilePicker`, `handleImportFile`, `importFromDb`, `openUrlJWL`

**Stan modułu:** `SQL`

### `18-export-jwl.js` — Eksport do JW Library

Nanoszenie notatek i etykiet na bazę SQLite i złożenie pliku .jwlibrary.

**Zależy od:** `01-core.js`, `02-storage.js`, `07-appearance.js`, `09-notes.js`, `12-actions.js`, `13-editor.js`, `17-files.js`, `19-export-doc.js`, `21-ui-helpers.js`  
**Rozmiar:** 279 linii

**Funkcje (5):** `startExport`, `applyChangesToDb`, `buildJwlibraryBlob`, `exportOneNoteJwl`, `assignVerse`

### `19-export-doc.js` — Eksport do Word i PDF

Szkielet dokumentu, wspólny arkusz stylów, zapis albo udostępnienie pliku.

**Zależy od:** `01-core.js`, `09-notes.js`, `21-ui-helpers.js`  
**Rozmiar:** 175 linii

**Funkcje (16):** `exportDocHtml`, `exportMetaLine`, `exportNoteBody`, `noteExportHtml`, `exportFileName`, `saveFile`, `canShareFiles`, `chooseSaveOrShare`, `exportNoteWord`, `exportNotePdf`, `tagNotesSorted`, `exportNoteSection`, `notesExportHtml`, `safeName`, `exportTagWord`, `exportTagPdf`

**Stan modułu:** `EXPORT_CSS_BASE`, `EXPORT_CSS_ONE`, `EXPORT_CSS_MANY`

### `20-backup.js` — Kopia zapasowa

Zapis i wczytanie kopii JSON, scalanie z danymi w aplikacji.

**Zależy od:** `01-core.js`, `02-storage.js`, `06-tags.js`, `07-appearance.js`, `09-notes.js`, `12-actions.js`, `13-editor.js`, `19-export-doc.js`, `21-ui-helpers.js`  
**Rozmiar:** 159 linii

**Funkcje (4):** `shareBackup`, `exportJson`, `mergeBackup`, `handleJsonFile`

### `21-ui-helpers.js` — Pomocnicze interfejsu

Komunikaty, okna modalne, pobieranie plików, zwijanie i szerokość kolumn, pole wyszukiwania.

**Zależy od:** `01-core.js`, `05-publications.js`, `09-notes.js`, `22-search.js`  
**Rozmiar:** 120 linii

**Funkcje (12):** `esc`, `toast`, `toastOk`, `toastErr`, `flashOk`, `openModal`, `closeModal`, `download`, `mobileShow`, `setCollapsed`, `applyColWidths`, `saveColWidths`

**Stan modułu:** `searchTimer`

### `22-search.js` — Podpowiedzi wyszukiwania

Podpowiedzi etykiet, publikacji, pól i ostatnich wyszukiwań; wybór trybu sortowania.

**Zależy od:** `01-core.js`, `05-publications.js`, `09-notes.js`, `21-ui-helpers.js`  
**Rozmiar:** 103 linii

**Funkcje (5):** `recentSearches`, `pushRecent`, `hideSearchSug`, `showSearchSug`, `applySug`

**Stan modułu:** `SUG_KEY`, `sugIdx`

### `24-reorder.js` — Własna kolejność

Przeciąganie kart notatek, gdy wybrano sortowanie własne.

**Zależy od:** `01-core.js`, `02-storage.js`, `12-actions.js`, `21-ui-helpers.js`  
**Rozmiar:** 73 linii

**Funkcje (2):** `reorderActive`, `saveNoteOrder`

**Stan modułu:** `_dragCard`

### `25-context-menu.js` — Szybkie akcje

Menu pod prawym przyciskiem myszy i pod długim przytrzymaniem palca.

**Zależy od:** `01-core.js`, `07-appearance.js`, `09-notes.js`, `10-reader.js`, `12-actions.js`, `14-images.js`, `17-files.js`, `21-ui-helpers.js`  
**Rozmiar:** 99 linii

**Funkcje (4):** `noteContextMenu`, `placeMenuAt`, `openContextMenu`, `_lpStop`

**Stan modułu:** `_lpTimer`, `_lpX`, `_lpY`, `_lpCel`

### `26-settings.js` — Ustawienia

Panel: wielkość czcionki, gęstość interfejsu, animacje, wygląd, ściąga ze skrótami.

**Zależy od:** `01-core.js`, `06-tags.js`, `11-theme.js`, `21-ui-helpers.js`  
**Rozmiar:** 120 linii

**Funkcje (6):** `applyDensity`, `setDensity`, `applyAnim`, `setAnim`, `optionGroup`, `openSettings`

**Stan modułu:** `DENSITIES`, `density`, `animMode`

### `23-shortcuts.js` — Skróty i uruchomienie

Skróty klawiszowe oraz wywołanie boot() — ładowany jako ostatni.

**Zależy od:** `01-core.js`, `03-boot.js`, `06-tags.js`, `09-notes.js`, `10-reader.js`, `12-actions.js`, `14-images.js`, `26-settings.js`  
**Rozmiar:** 55 linii

