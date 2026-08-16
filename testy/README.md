# Kontrola jakości

~500 asercji w szesnastu zestawach plus analiza statyczna. Jedno polecenie:

```bash
npm install jsdom axe-core
./testy/uruchom.sh
```

Skrypt sam podnosi serwer, uruchamia analizę i wszystkie zestawy, po czym
sprząta. Kod wyjścia 1 = coś nie przeszło.

Pojedynczy zestaw:

```bash
python3 -m http.server 8137 &
node testy/edytor.js ./index.html 8137
```

Ten sam komplet działa na wersji jednoplikowej — wystarczy wskazać jej `index.html`.

---

## Co sprawdza który zestaw

| Zestaw | Asercji | Czego pilnuje |
|---|---:|---|
| `audyt.js` | 10 kontroli | analiza statyczna, bez uruchamiania aplikacji |
| `regres.js` | 22 | czy aplikacja stoi i czy nic nie wypadło z interfejsu |
| `edytor.js` | 24 | styl akapitu, interlinia, cofanie, czcionki, menu |
| `kolumny.js` | 32 | cztery kolumny, chowanie, telefon i tablet |
| `czytnik.js` | 20 | tytuł, pasek narzędzi, przycisk zamknięcia |
| `wyglad.js` | 25 | gotowe kompozycje, brak powtórzeń między oknami |
| `aktualizacja.js` | 26 | wykrywanie nowej wersji, praca offline, pierwszy start |
| `kopia.js` | 19 | nadpisywanie jednego pliku kopii |
| `bezpieczenstwo.js` | 46 | wstrzykiwanie kodu przez plik kopii |
| `import-atomowy.js` | 18 | „Zastąp wszystko" jako operacja niepodzielna |
| `import-limity.js` | 36 | limity rozmiaru, uszkodzone archiwa, kod z sieci, CSP |
| `wydanie.js` | 34 | narzędzia, numer wersji, dokumentacja, kolejność kroków |
| `scenariusze.js` | 30 | osiem całych ścieżek użytkownika, od kliknięcia po bazę |
| `dostepnosc.js` | 33 | axe-core w sześciu stanach, klawiatura, ognisko, kontrast |
| `sekcje.js` | 34 | sortowanie po utworzeniu, zakładki w sekcjach |
| `onenote-strona.js` | 58 | przeniesienie z OneNote: prywatność i poprawność |
| `porzadki.js` | 20 | usuwanie odstępów z pliku źródłowego w notatkach |

### Analiza statyczna
Łapie to, czego testy w przeglądarce nie zobaczą:

1. składnia każdego modułu i pliku obsługi offline
2. równowaga nawiasów w arkuszach stylów
3. **kolejność modułów** — użycie stałej przed jej deklaracją; funkcje są
   windowane, stałe nie, więc taka pomyłka wywraca aplikację dopiero u użytkownika
4. martwe deklaracje — funkcje i stałe, do których nikt nie sięga
5. **znaki `{{` i `{%`** — Jekyll na GitHub Pages traktuje je jako polecenia
   i przerywa budowanie strony; sprawdzany jest też plik `.nojekyll`
6. atrybuty z kodem (`onclick=`) w treści strony
7. `JSON.parse` bez zabezpieczenia
8. klasy CSS bez pokrycia w kodzie *(podpowiedź)*
9. ten sam selektor w dwóch arkuszach podstawowych *(podpowiedź)*
10. zgodność numeru wersji między `index.html` a `sw.js`

Punkty 8 i 9 bywają fałszywym alarmem, więc nie blokują wydania — reszta tak.

---

## Zasada: test zapisuje przyczynę, nie objaw

Każdy zestaw powstał z konkretnej usterki. Asercja jest tak napisana, żeby nie
dało się jej spełnić obejściem — sprawdza **mechanizm**, nie napis. Kilka
przykładów z komentarzami w kodzie:

- **styl akapitu zacinał się trzykrotnie.** Przyczyną było użycie listy
  `<select>`, która nie wysyła zdarzenia przy wyborze tej samej pozycji.
  Test klika tę samą pozycję dwa razy i wymaga **dwóch wywołań**, a osobna
  asercja pilnuje, żeby kontrolka nigdy nie wróciła do postaci listy.
- **cofanie cofało całą stronę.** Test podstawia atrapę `execCommand`
  i sprawdza, że **ani razu** nie dostała polecenia undo — także przy pustej
  historii, bo to właśnie wtedy przeglądarka przejmowała polecenie.
- **wstrzykiwanie kodu.** Każdy z 20 ładunków jest naprawdę wstawiany do
  strony, a licznik pilnuje, czy obcy kod się wykonał. Nie sprawdzamy napisu.
- **pierwsze uruchomienie przeładowywało stronę.** Test wywołuje reakcję na
  przejęcie strony w obu sytuacjach i wymaga przeładowania tylko przy podmianie.

---

## Przed każdym wydaniem

1. `./testy/uruchom.sh` na wersji modułowej
2. zbudowanie wersji jednoplikowej
3. `./testy/uruchom.sh` na wersji jednoplikowej
4. podniesienie numeru wersji w `index.html` **i** nazwy pamięci w `sw.js`
   (analiza statyczna sprawdza, czy się zgadzają)
5. opis zmian z **przyczyną**, nie tylko listą poprawek

---

## Dodanie nowego testu

Zestawy korzystają ze wspólnego szkieletu `wspolne-testy.js`:

```js
const {T, TA, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  T("opis po polsku", ()=> warunek === true);
  T("z powodem niepowodzenia", ()=> warunek || "co zastano zamiast tego");
  await TA("gdy trzeba zaczekać", async ()=> await coś() === true);
});
```

`w` to okno aplikacji, `d` dokument, `errors` błędy wykonania, `zrodlo("js","13-editor.js")`
podaje treść pliku źródłowego (w wersji jednoplikowej — całego `index.html`).

Zwrócenie napisu zamiast `false` wypisze go przy błędzie — warto z tego
korzystać, bo „nie przeszło" bez powodu zmusza do zgadywania.

Nowy zestaw dopisz do tablicy `ZESTAWY` w `uruchom.sh`.


---

## Czego tu NIE ma

**Prawdziwego E2E.** Wymaga przeglądarki z rzeczywistym układem strony, obsługą
offline i bazą IndexedDB — Playwright albo Puppeteer. `scenariusze.js` przechodzi
całe ścieżki użytkownika, ale w jsdom, więc nie zobaczy usterek układu ani
zachowania samej przeglądarki. Nazywanie tego E2E byłoby naciąganiem.

Gdyby dołożyć E2E: `npm install playwright && npx playwright install chromium`,
a potem te same osiem ścieżek co w `scenariusze.js`, tyle że w prawdziwej
przeglądarce.

**Kontrastu liczonego z arkuszy stylów.** jsdom nie wylicza kolorów z CSS, więc
reguła `color-contrast` w axe jest wyłączona — z podanym powodem. W zamian
`dostepnosc.js` liczy kontrast dla każdego koloru z palety aplikacji własnym
sprawdzeniem, tą samą funkcją, której używa aplikacja.
