# Przeniesienie notatek z OneNote

Oba skrypty robią to samo: zamieniają notatki z OneNote na **plik kopii JW Study**,
który wczytujesz w aplikacji przyciskiem kopii → **„Dołącz + układ"**.

Struktura przenosi się jeden do jednego:

| OneNote | JW Study |
|---|---|
| notes (notebook) | sekcja |
| sekcja | zakładka w sekcji |
| strona | notatka przypisana do zakładki |

---

## Droga 1: eksport do Worda — prostsza

**W OneNote** (Mac i Windows): `File → Export → Word Document`, osobno dla każdej
sekcji.

**Masz kilka notesów?** Zrób podkatalog na każdy i wrzuć do niego jego pliki:

```
onenote-export/
  Studium osobiste/        ← sekcja w JW Study
    Betel.docx             ← zakładka
    Kursy.docx             ← zakładka
  Kongresy/                ← sekcja
    Kongres 2026.docx      ← zakładka
```

Bez podkatalogów cały katalog jest jedną sekcją.

```bash
npm install mammoth
node narzedzia/onenote/z-worda.js ~/Desktop/onenote-export
```

Powstanie `onenote-do-jwstudy.json` w tym samym katalogu.

**Przenosi:** pogrubienia, kursywę, listy, tabele, obrazy (osadzone w notatce).
**Nie przenosi:** podświetleń ani dat utworzenia — w eksporcie do Worda ich nie ma.
Wszystkie notatki dostaną datę dzisiejszą.

Dodatkowo `--bez-obrazow`, gdy zależy Ci na małym pliku.

---

## Droga 2: Microsoft Graph — wierniejsza

Zachowuje **podświetlenia** oraz **prawdziwe daty** utworzenia i zmiany każdej strony.

1. wejdź na <https://developer.microsoft.com/graph/graph-explorer>
2. zaloguj się swoim kontem Microsoft (Sign in, lewy górny róg)
3. w polu zapytania wpisz `https://graph.microsoft.com/v1.0/me/onenote/pages`
   i naciśnij **Run query** — to nada uprawnienie do odczytu notatek
4. zakładka **Access token** → skopiuj token

**Najpierw zobacz, co powstanie** — sam spis, bez pobierania treści, kilka sekund:

```bash
node narzedzia/onenote/z-graph.js <token> --spis
```

Wypisze drzewo: każdy notes jako sekcja, każda sekcja OneNote jako zakładka,
z liczbą notatek. Dopiero potem, gdy się zgadza:

```bash
node narzedzia/onenote/z-graph.js <token> ~/Desktop
```

Chcesz tylko wybrane notesy?

```bash
node narzedzia/onenote/z-graph.js <token> ~/Desktop --notes "Studium,Kongresy"
```

Wystarczy fragment nazwy — dopasowanie nie zważa na wielkość liter.

Token żyje około godziny — na 150 stron wystarcza z zapasem. Skrypt **niczego nie
wysyła**: wyłącznie pobiera i zapisuje plik na dysku.

Obrazy z OneNote wymagają tokenu, więc skrypt wciąga je do notatek jako osadzone —
kopia jest samodzielna i działa offline. Obrazy powyżej 4 MB są pomijane.

---

## Po przeniesieniu

W JW Study: przycisk kopii zapasowej → wskaż plik → **„Dołącz + układ"**.
Wybierz dołączanie, nie „Zastąp wszystko" — inaczej stracisz to, co masz.

Import można powtórzyć: identyfikator notatki liczony jest ze źródła i tytułu,
więc te same strony nie zdublują się przy drugim podejściu.

Notatki wchodzą przez ten sam filtr treści co każda inna kopia — zostają dozwolone
znaczniki, reszta odpada. Nic z OneNote nie wykona się w aplikacji.

---

## Czego nie przeniesie żaden ze skryptów

- **rysunków odręcznych** (ink) — OneNote trzyma je jako osobną warstwę, nie jako tekst
- **osadzonych plików** (PDF, Word wewnątrz strony) — zostanie sam odnośnik albo nic
- **tagów OneNote** (gwiazdki, „do zrobienia") — w eksporcie są zwykłym tekstem
- **zagnieżdżonych podstron** — trafią jako zwykłe strony na tym samym poziomie
