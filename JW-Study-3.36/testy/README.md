# Testy 3.36

`node testy/regresja.js` — 26 testów, Node.js 20 lub nowszy, bez instalowania pakietów. Testy obejmują składnię, wersję, rzeczywiste PDF/DOCX/OCR, zapis, anulowanie, cache, integralność wbudowanych bibliotek i poprawkę modelu językowego.

`python3 testy/proba-przegladarki.py` — otwórz http://127.0.0.1:8766/test-browser.html i kliknij TEST IMPORT. Skrypt serwera celowo blokuje katalog lib oraz zewnętrzny JSZip. Próba tworzy notatki TESTOWE wyłącznie pod lokalnym adresem. Oczekiwany wynik: PASS dla PDF, DOCX, zdjęcia, skanu PDF, ilustracji DOCX, edycji i zapisu. Serwer zatrzymasz Ctrl+C. Port 8766 musi być wolny.

Próba nie zastępuje sprawdzenia na fizycznym iPadzie. Schowek systemowy wymaga osobnego testu i uprawnień przeglądarki.
