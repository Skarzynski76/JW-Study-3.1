# Aktualizacja do JW Study 3.25

1. W obecnej aplikacji zakończ edycję notatek i zapisz kopię przez **Plik → Zapisz kopię danych (JSON)**.
2. Rozpakuj paczkę. Wgraj zawartość folderu `JW-Study-3.25-GitHub` w to samo miejsce, z którego korzysta obecna aplikacja. Zachowaj dotychczasowy adres strony.
3. Podmień razem `index.html`, `sw.js`, `search-worker.js` oraz cały katalog `lib/`. Pozostałe pliki aplikacji i ikony także znajdują się w paczce.
4. Po zakończeniu publikacji otwórz stronę z połączeniem internetowym. Jeżeli pojawi się pytanie o aktualizację, zatwierdź je po zapisaniu edycji. Sprawdź oznaczenie **v3.25** przy nazwie aplikacji.
5. Otwórz **Plik → Inteligentny import**, wybierz dokument i przejdź do podglądu. Rozwiń **Pokaż treść notatki**, sprawdź treść i tytuł, a następnie wybierz **Dodaj wybrane notatki**.

Aktualizacja nie zmienia nazwy bazy IndexedDB (`jwStudyClean`), identyfikatorów notatek ani formatu istniejących danych. Nie trzeba czyścić danych przeglądarki. Wyczyszczenie ich usunęłoby lokalne notatki.

## PDF i Word

- PDF z tekstem jest zamieniany na edytowalną treść. Można utworzyć jedną notatkę z dokumentu albo osobną notatkę z każdej strony.
- Skan PDF można rozpoznać po polsku przez OCR. Opcja zachowania obrazów pozostawia również obraz strony; przy błędzie OCR obraz stanowi zachowaną treść zamiast pustej notatki.
- Word: obsługiwane są pliki **DOCX**. Zachowywane są obsługiwane nagłówki, podstawowe formatowanie, listy, tabele i ilustracje rastrowe. Zaawansowany układ dokumentu może zostać uproszczony.
- Starszy format **DOC** wymaga zapisania w Wordzie lub LibreOffice jako DOCX albo PDF. PDF chroniony hasłem wymaga kopii bez hasła.
- Dokumenty są przetwarzane lokalnie. OCR wymaga całego katalogu `lib/smart-import/`, w tym polskiego modelu językowego.
- Po zapisaniu aplikacja pokazuje etykietę z importowanymi notatkami, usuwając wcześniejsze zawężenia wyszukiwania.

## Pierwsza publikacja

W ustawieniach repozytorium GitHub wybierz **Pages** i gałąź/katalog, do których wgrano aplikację. `index.html` musi znajdować się bezpośrednio w publikowanym katalogu. Nie wgrywaj samego ZIP-a.

Katalogi `testy/` i `docs/` zawierają materiały pomocnicze; nie są potrzebne do działania aplikacji i można je pominąć podczas publikowania.
