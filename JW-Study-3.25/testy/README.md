# Testy regresji 3.24

Wymagany Node.js 20 lub nowszy. Nie trzeba instalować pakietów ani pobierać danych z sieci.

Z katalogu aplikacji:

```bash
bash testy/uruchom.sh ./index.html
```

Można także uruchomić `node testy/regresja.js`.

Testy obejmują:

- składnię skryptów, wersję i kompletność plików offline;
- niedostępność bazy, oczekiwanie na zatwierdzenie transakcji i jej przerwanie;
- odzyskiwanie szkiców ze zmienionym formatowaniem lub ilustracją;
- odczyt rzeczywistego, generowanego w teście PDF-a przez dołączony PDF.js;
- konwersję rzeczywistego, generowanego w teście DOCX-a przez dołączony Mammoth: polski tekst, nagłówki, tabela i ilustracja;
- odczyt obrazu `fixtures/ocr.png` przez dołączony silnik WebAssembly i polski model OCR;
- łączenie fragmentów tekstu PDF, zwalnianie dokumentów po błędzie i zachowanie obrazu przy awarii OCR;
- anulowanie, limit czasu rozpoznawania oraz zamykanie spóźnionego workera;
- konfigurację lokalnego workera zgodną z polityką CSP aplikacji;
- zachowanie sekcji przy podziale Worda oraz porównywanie duplikatów z uwzględnieniem ilustracji;
- atomowy import i obsługę przycisku dodawania: wybór, zmiana tytułu, brak duplikatów i powrót do podglądu po błędzie;
- oddzielne kopie stron aplikacji i OneNote, odrzucanie HTTP 404 oraz zachowanie cache innych aplikacji.

## Zakres i ograniczenia

Konwersja PDF/DOCX i rozpoznawanie obrazu używają rzeczywistych bibliotek z paczki. Transakcje IndexedDB, Cache Storage i zdarzenia interfejsu są symulowane. `dom-testowy.js` udostępnia ograniczony adapter DOM z parsera zawartego w Mammoth, używany tylko w testach Node. OCR jest uruchamiany w osobnym procesie, aby odizolować środowisko WebAssembly.

Ten zestaw nie zastępuje pełnych testów interfejsu na iPhonie, iPadzie, Androidzie i komputerze. W środowisku przygotowania paczki zdalna przeglądarka blokowała lokalny adres aplikacji, dlatego pełnego przebiegu ekranowego nie wykonano.

PDF.js może wypisać ostrzeżenie o standardowej czcionce w Node i komunikat podczas próby odczytu celowo uszkodzonego PDF-a. O wyniku decydują asercje testów i końcowy licznik.
