# Dziennik zmian

Najnowsze na górze. Każdy wpis podaje **przyczynę**, nie tylko listę poprawek —
bez niej po miesiącu nie wiadomo, dlaczego coś wygląda tak, a nie inaczej.

---

## v2.41 — koniec z dwoma dotknięciami; w edycji znów da się zaznaczyć słowo

Dwa zgłoszenia, jedna przyczyna.

**Gest dwóch dotknięć usunięty.** Otwierał notatkę na pełnym ekranie, ale gestów
na karteczce zrobiło się za dużo: dotknięcie podnosi, dotknięcie obok odkłada,
przeciągnięcie przenosi, przewinięcie czyta — a drugie dotknięcie miało znaczyć
coś jeszcze, zależnie od odstępu czasu. Za każdym razem trzeba było zgadywać,
co się właśnie stanie. Pełny ekran otwiera się przyciskiem ⛶ na pasku karteczki,
dotknięciem tytułu w widoku listy albo z menu pod przytrzymaniem palca — trzy
drogi wystarczą.

**PRZYCZYNA drugiej usterki: „przy edycji na pełnym ekranie zaznaczam słowo
i nic się nie dzieje".** To ten sam gest. NA DOTYKU DWA STUKNIĘCIA W SŁOWO
ZNACZĄ „ZAZNACZ SŁOWO" — to zachowanie systemu, nie aplikacji. Nasłuch
przechwytywał drugie stuknięcie, zatrzymywał je (`preventDefault`) i budował
notatkę od nowa. Zaznaczenie ginęło w tej samej chwili, w której powstawało.
Stąd wrażenie, że aplikacja „nie wie, co zrobić" — wiedziała aż za dobrze,
tylko robiła coś innego. Po usunięciu gestu zaznaczanie wraca do systemu,
a stan przycisków B / I / U na pasku edycji nadąża za kursorem jak dotąd.

Przy okazji tryb edycji zapisuje `contenteditable` również jako atrybut, nie
tylko jako własność. W przeglądarce jedno pociąga drugie, ale po tym atrybucie
obsługa rysika rozpoznaje, że ma NIE przechwytywać zaznaczania — a na takiej
rzeczy lepiej nie polegać milcząco. Test sprawdza to wprost: w polu edycji
`trescDoZaznaczania` musi zwrócić `null`.

Testy pilnują teraz, żeby gest nie wrócił tylnymi drzwiami: w kodzie nie może
zostać po nim ślad, dwa stuknięcia w treść czytnika nie mogą go zamknąć, nikt
nie ma prawa zatrzymać drugiego stuknięcia, a zaznaczenie w polu edycji musi
przeżyć dotknięcia.

---

## v2.40 — karteczka A-6 przestała wystawać dołem

Podniesiona karteczka sięgała samej krawędzi listy: pasek ikon lądował na
granicy albo poza nią i nie dało się go dotknąć.

**PRZYCZYNA.** Wysokość karty liczyłem od pełnej wysokości listy. Karta zaczyna
się jednak POD paskiem nad listą, więc miejsca w pionie jest tyle, ile zostaje
po odjęciu rezerwy na ten pasek — na iPadzie to blisko sto pikseli. O tyle karta
była za wysoka i o tyle wystawała poza dolną krawędź.

Wysokość uwzględnia teraz rezerwę, a do tego z góry i z dołu zostaje oddech
dwudziestu pikseli, żeby karteczka nie kleiła się do krawędzi. Pasek ikon jest
w całości widoczny.

Test sprawdza to na wymiarach iPada trzymanego poziomo: karta musi zmieścić się
między dolną krawędzią paska a dolną krawędzią listy, z zapasem po obu stronach.
Wymiary docelowe nadawane są w następnej klatce — inaczej ruch nie miałby od
czego się zacząć — więc sprawdzenie na nią czeka, zamiast pytać za wcześnie.

---

## v2.39 — podniesiona karteczka jest stabilna: przewijanie jej nie zamyka

Wycofuję rozwiązanie z v2.18. Wtedy przewinięcie listy odkładało podniesioną
karteczkę — miało znaczyć „szukam czegoś dalej" i brzmiało to rozsądnie.
W praktyce wyszło inaczej: gdy tekst w karteczce dochodził do końca albo mieścił
się w całości, palec przewijał listę pod spodem, a karteczka znikała dokładnie
w chwili, gdy chciało się tylko doczytać zdanie. Nie dało się na tym polegać,
a od narzędzia do czytania trzeba wymagać przewidywalności.

**Teraz karteczkę odkłada wyłącznie świadome działanie:**

- dotknięcie jej samej — wraca do rzędu,
- dotknięcie obok,
- klawisz Escape.

Przewijanie należy do czytania i niczego nie zamyka. Dwa szybkie dotknięcia
nadal otwierają pełny ekran — odstęp między nimi rozstrzyga, czy chodziło
o „pokaż większe", czy o „odłóż".

Paski nad listą chowają się przy przewijaniu bez zmian: one nie trzymają treści,
tylko zabierają miejsce, więc ich zniknięcie niczego nie przerywa.

---

## v2.38 — w miniaturze się nie pisze, a paski wracają spokojniej

**1. Edycja przeniesiona z karteczki na pełny ekran.** Karteczka reaguje na
dotknięcia — podnosi się, odkłada, przewija treść — więc pisanie w niej było
walką gestów: próba przesunięcia kursora zwijała kartę i tekst uciekał.

Dotknięcie ✎ na karteczce otwiera teraz notatkę na pełnym ekranie i tam włącza
edycję. Nie odbieram działania, tylko przenoszę je w miejsce, gdzie nic nie
zabiera gestów. Pasek edycji nie pokazuje się już na karteczce, a jej tekst
zostaje tylko do czytania — nawet gdyby coś próbowało włączyć tam tryb pisania.

W widoku listy, średnim i zwartym edycja w miejscu zostaje bez zmian: tam karta
nie reaguje na dotknięcia i nie ma z czym walczyć. Czytnik, podkreślanie
i kolory — nietknięte.

**2. Paski wracają dopiero po półtora rzędu notatek.** Znikanie przy przewijaniu
w dół było w porządku, ale powrót następował już po dziesięciu pikselach ruchu
w drugą stronę — a przewijanie rzadko bywa idealnie jednokierunkowe, więc paski
wyskakiwały przy najlżejszym odbiciu palca.

Próg powrotu liczy się teraz z wysokości karty: półtora jej rzędu. Rośnie więc
razem z wybraną wielkością karteczek i sam dopasowuje się do widoku, zamiast być
liczbą wpisaną na sztywno. Gdy nie ma czego zmierzyć, bierzemy rozsądny zapas.
Znikanie zostaje szybkie jak dotąd — spokojniejszy ma być tylko powrót.

---

## v2.37 — powiązane notatki zwinięte, wysuwają się na życzenie

Blok powiązań był rozwinięty pod każdą notatką i zajmował nawet jedną trzecią
strony. Powiązania są potrzebne od czasu do czasu, a nie zawsze — więc miejsca
domagały się codziennie za coś, z czego korzysta się rzadziej.

**Teraz jest zwinięty do jednego wiersza**, a w nim liczba: „Powiązane notatki
(5)". Tyle wystarczy, żeby wiedzieć, czy warto zaglądać. Dotknięcie rozwija
listę z krótkim wysunięciem, strzałka obraca się w bok.

**Wybór jest zapamiętywany** — kto z powiązań korzysta, chce je widzieć od razu
przy każdej notatce; kto nie, nie chce ich w ogóle. Zapamiętujemy jednak tylko
świadomą zmianę, a nie ustawienie początkowe przy rysowaniu.

Pod spodem jest to `<details>`, a nie własny przełącznik z klasą: przeglądarka
sama obsługuje klawiaturę i czytnik ekranu, a stan „otwarte / zamknięte" jest
w niej prawdziwy, a nie udawany. Kto ma wyłączone animacje w systemie, dostaje
rozwinięcie bez ruchu.

---

## v2.36 — dwa dotknięcia działają wszędzie, menu jest osiągalne z każdej postaci

Gest z v2.35 zrobiłem za wąsko: **działał tylko na tablicy**, bo tam powstał.
To był błąd. Gest ma znaczyć wszędzie to samo — inaczej trzeba pamiętać,
w którym widoku działa, a wtedy nie działa nigdzie. Dwa dotknięcia otwierają
teraz notatkę na pełnym ekranie w każdym z czterech widoków, a w czytniku
zamykają go tak jak dotąd.

**Menu było nieosiągalne z miniatury.** Na tablicy pasek ikon jest schowany,
dopóki karteczka jest mała — to celowe, bo inaczej ikony leżą na tekście.
Zostawało długie przytrzymanie palcem, ale ono z kolei było blokowane na treści
notatki, żeby nie przeszkadzać w zaznaczaniu. Dwie rozsądne osobno decyzje dały
razem stan, w którym z miniatury nie dało się dostać do niczego.

Na tablicy treść karteczki jest przycięta i nie służy do zaznaczania, więc
przytrzymanie palcem otwiera tam teraz menu. W karteczce podniesionej do A6
i w pozostałych widokach zostaje po staremu: tam tekst się czyta i zaznacza.

**Pasek w karteczce A6 przestał być do przeoczenia.** Na dotyku był
półprzezroczysty i wtopiony w treść. Ma teraz własne tło w kolorze karteczki,
kreskę oddzielającą od tekstu i większe przyciski pod palec — bo to z niego
prowadzi droga do pełnego ekranu, edycji i menu.

---

## v2.35 — dwa dotknięcia otwierają notatkę na pełnym ekranie

Powiększona karteczka ma pasek ikon przy dolnej krawędzi, ale na telefonie jest
mały i łatwo go przeoczyć — a to przez niego prowadziła jedyna droga do pełnego
ekranu.

**Teraz wystarczy dotknąć notatki jeszcze raz.** Pierwsze dotknięcie podnosi
karteczkę, drugie — zaraz po nim, w to samo miejsce — otwiera ją na pełnym
ekranie. Karteczka wraca przy tym równo do rzędu. W czytniku dwa dotknięcia
zamykają go i wracasz do miniatur.

Kilka rzeczy, które musiały zadziałać, żeby to nie przeszkadzało:

- **Palcowi wolno drgnąć** — drugie dotknięcie liczy się, gdy trafi w promieniu
  28 px i w niecałe pół sekundy. Mysz jest dokładniejsza, palec nie musi.
- **Dotknięcia rozdzielone w czasie nic nie otwierają** — po przerwie pierwsze
  z nich przestaje się liczyć.
- **Dwie różne karteczki to nie dwuklik** — nawet gdy dotknięcia padły szybko
  po sobie.
- **Przyciski, odnośniki i uchwyty zachowują swoje działanie**, a zaznaczanie
  tekstu nie jest przechwytywane — dwa dotknięcia to także sposób na zaznaczenie
  słowa i nie odbieramy go.

Jedna rzecz warta odnotowania z budowy: rozpoznanie drugiego dotknięcia siedzi
w TYM SAMYM nasłuchu, który podnosi karteczkę. Osobny nasłuch nigdy by go nie
zobaczył — tamten działa w fazie przechwytywania i zatrzymuje zdarzenie. Jedno
miejsce decyduje więc, co znaczy dotknięcie.

---

## v2.34 — powiększona karteczka nie chowa się pod paskiem

Powiększenie karteczki z pierwszego rzędu wsuwało jej początek pod pasek
z filtrami i pierwsze zdania znikały.

**PRZYCZYNA.** Powiększona karta jest ustawiana względem pola wypełnienia listy.
„Samą górą" jest tam miejsce POD paskiem — bo to właśnie odstęp u góry listy
trzyma dla niego rezerwę. Ograniczenie położenia liczyło jednak od zera, czyli
od miejsca schowanego za paskiem. Karta z drugiego i dalszych rzędów wychodziła
dobrze, z pierwszego — nie, i tylko tam problem było widać.

Górna granica uwzględnia teraz rezerwę: karta zaczyna się poniżej paska,
niezależnie od tego, z którego rzędu ją podnosisz.

**Przy okazji — porządek warstw sprawdzony jako całość.** Jest ich jedenaście
i każda nowa rzecz dokładała swoją liczbę „na oko". Nowy zestaw
`testy/warstwy.js` ustala jeden porządek i go pilnuje. Reguła wynika z tego, do
czego rzeczy służą: im bardziej coś wymaga uwagi TERAZ, tym wyżej. Okno
dialogowe przerywa pracę, więc jest ponad wszystkim; pasek błędu jeszcze wyżej,
żeby komunikat dotarł także przy otwartym oknie. Pasek nad listą jest nisko —
ale wciąż nad samą listą, bo karty mają pod nim przepływać przy przewijaniu,
i pod nagłówkiem, bo pod niego się wsuwa przy chowaniu.

Powiększona karteczka zeszła przy tym pod pasek w sensie warstwy: gdyby kiedyś
jednak sięgnęła jego obszaru, to pasek ma zostać dostępny, a nie zniknąć pod
kartą. O to, żeby do tego nie doszło, dba samo obliczanie położenia.

Sprawdzone też, że każde z dziesięciu okien i menu rozwijane mają ograniczoną
wysokość — żadne nie wychodzi poza ekran w żadnym z czterech widoków.

---

## v2.33 — panel publikacji przenosi się tym samym chwytem co reszta

Kolejność w kolumnie Publikacje dawała się zmieniać, ale własnym, słabszym
mechanizmem — jedynym, który został po przebudowie przenoszenia z v1.96.

**Na czym polegała jego słabość.** Nasłuchy siedziały na samym uchwycie ⠿
i polegały na przechwyceniu wskaźnika. Gdy przechwycenie przepadało — a na
tablecie zdarza się to przy każdym przerysowaniu panelu, czyli po każdej zmianie
filtra albo dojściu notatki — wiersz przestawał iść za palcem, a puszczenie nie
docierało tam, gdzie zapisywana jest nowa kolejność. Przeciągnięcie wyglądało
więc na udane i wracało po odświeżeniu.

Do tego nie było widać, co się dzieje: żadnej etykietki przy palcu, żadnej linii
pokazującej miejsce.

**Teraz publikacje, roczniki i wydania chwyta się tak samo jak etykiety,
zakładki i notatki**: pozycja przykleja się do palca, gruba linia pokazuje, gdzie
stanie, a nasłuch siedzi na dokumencie — nie ma czego zgubić. Kolejność zapisuje
się od razu, a obok tytułu kolumny pojawia się ↺ do przywrócenia domyślnej.

Stary mechanizm usunięty w całości — dwa naraz biłyby się o palec.

---

## v2.32 — sekcja przy nowej notatce i „Usuń" zawsze na widoku

**1. Nowa notatka trafiała do ogólnego zbioru, bo nie było gdzie jej przypisać.**
Pole wyboru w oknie nowej notatki pokazywało wyłącznie ZAKŁADKI. Sekcję bez
zakładek pomijało, a gdy żadna sekcja jeszcze ich nie miała — całe pole znikało.
Kto dopiero co utworzył sekcję, nie miał więc jak wrzucić do niej notatki.

Lista pokazuje teraz KAŻDĄ sekcję jako grupę, a w niej jej zakładki oraz pozycję
**„＋ nowa zakładka w tej sekcji…"**. Nazwę podajesz przy zapisie notatki, więc
nic nie powstaje po cichu — ciche utworzenie zakładki o zmyślonej nazwie byłoby
gorsze niż brak możliwości, bo znalazłbyś u siebie coś, czego nie zakładałeś.
Rezygnacja z nazwy nie tworzy ani zakładki, ani notatki.

Pole chowa się teraz dopiero wtedy, gdy nie ma ŻADNEJ sekcji — czyli gdy
naprawdę nie ma czego wybierać.

**2. „Usuń notatkę" bywało poza ekranem.** Menu ⋯ przy notatce ma siedemnaście
pozycji i na tablecie nie mieści się w całości — trzeba je przewijać. Usuwanie
jest ostatnie, a w jego okolicy leżą pozycje otwierające INNE menu („Zakładka
publikacji…"). Stąd zgłoszenie, że zamiast usunięcia pojawia się przypisanie do
publikacji: palec trafiał w sąsiada.

Pozycja usuwania trzyma się teraz dolnej krawędzi menu niezależnie od
przewinięcia — jest widoczna zawsze i nie sposób pomylić jej z sąsiadem, bo
sąsiedzi odjeżdżają, a ona zostaje. Ma nieprzezroczyste tło i kreskę oddzielającą
od reszty.

Nowy zestaw `testy/nowa-notatka.js` — 16 sprawdzeń obu spraw.

---

## v2.31 — pierwszy rząd karteczek już się nie chowa pod paskiem

Poprzednia poprawka ustaliła stałą rezerwę na pasek u góry listy. Nie
zadziałała w widoku, w którym problem był widoczny — i to jest sedno tej
wersji.

**PRZYCZYNA.** Widok tablicy ma własny odstęp wokół siatki, zapisany skrótem
`padding: 10px 14px 40px`. Skrót ustawia WSZYSTKIE cztery strony, więc kasował
odstęp górny nadany wcześniej regułą ogólną — czyli dokładnie tę rezerwę.
Reguła ogólna nadal wyglądała poprawnie, tyle że w tym widoku nie miała nic do
powiedzenia. Pierwszy rząd karteczek chował się pod paskiem zaraz po otwarciu
aplikacji, jeszcze przed jakimkolwiek przewinięciem.

Odstęp w widoku tablicy zawiera teraz rezerwę: `calc(10px + var(--wysPaska))`.
Test nie sprawdza już samej reguły ogólnej, tylko przechodzi po **wszystkich
czterech widokach** i wymaga, żeby w każdym z nich odstęp górny uwzględniał
wysokość paska. Drugie sprawdzenie pilnuje, żeby rezerwa była liczona w jeden
sposób — dwie prawdy o tej samej rzeczy to prosta droga do powtórki tej usterki.

---

## v2.30 — brak sieci przestał wyglądać jak awaria aplikacji

Z dziennika błędów: `Script https://…/sw.js load failed`, dwa razy, przy pracy
z ekranu głównego. Wyglądało groźnie, a nie było usterką aplikacji.

**Co się działo.** Obsługa pracy offline (`sw.js`) jest odświeżana przy starcie
i po każdym powrocie do aplikacji. Bez połączenia przeglądarka nie ma skąd
pobrać tego pliku i zgłasza do okna błąd „Script … load failed". Aplikacja
działała przez cały czas — notatki, zapis, wszystko — bo do tego sieć nie jest
potrzebna. Czerwony pasek straszył więc czymś, na co nikt nie ma wpływu i co
samo mija po powrocie sieci.

**Trzy poprawki.**

- **Nie próbujemy na pusto.** Przy braku połączenia rejestracja i sprawdzanie
  nowej wersji są odkładane, a nie wykonywane w nadziei. Po powrocie sieci
  aplikacja sama próbuje ponownie.
- **Awarie sieci są ciche, ale nie bez śladu.** Nie zapalają czerwonego paska,
  za to trafiają do dziennika jako „brak sieci" — przy zgłoszeniu widać, że coś
  się działo.
- **Wyciszenie nie rozlewa się na prawdziwe usterki.** Zwykły błąd aplikacji
  nadal zapala alarm, a błąd sieciowy przy DZIAŁAJĄCEJ sieci też — bo wtedy
  znaczy, że brakuje pliku albo serwer go nie oddaje, i jest o czym mówić.
  Pilnują tego osobne sprawdzenia, żeby cisza nie zamieniła się w ukrywanie.

**Dziennik pokazuje teraz ślady także wtedy, gdy nie było błędu.** Część rzeczy
nie jest usterką, a i tak warto wiedzieć, co się działo, gdy coś wygląda nie
tak. „Wyczyść" czyści przy okazji jedno i drugie — wcześniej kasował tylko
połowę.

---

## v2.29 — powiązane notatki + pierwszy rząd nie chowa się pod paskiem

**Powiązane notatki.** Przy ośmiu tysiącach notatek najtrudniej dowiedzieć się,
że coś już się kiedyś zapisało. Wyszukiwanie odpowiada na pytanie zadane wprost;
tutaj chodzi o przypomnienie, którego nikt nie szukał.

Pod otwartą notatką pojawia się lista innych, które jej dotyczą — najwyżej osiem,
od najmocniej związanych. **Powód jest zawsze wypisany**, bo lista bez
uzasadnienia to wróżenie: „ten sam werset", „ten sam artykuł", „wspólna
etykieta: Studium", „wspólne słowa: akrobacje, gimnastyka". Dotknięcie otwiera
powiązaną notatkę w tym samym czytniku.

Siła związku, od najmocniejszego: ten sam werset, ten sam artykuł, ten sam
rozdział, to samo wydanie, wspólna etykieta, ta sama publikacja. Do tego
**rzadkie wspólne słowa** — i to one wyciągają notatkę sprzed dwóch lat, która
nie ma z bieżącą ani wspólnego wersetu, ani wspólnej etykiety.

Rzadkie znaczy: wyraz z co najwyżej czterdziestu notatek. Słowo z pięciuset
niczego o żadnej z nich nie mówi, a to właśnie takie słowa kosztowałyby przy
liczeniu najwięcej.

O szybkości, bo przy tej liczbie notatek to nie drobiazg: porównywanie każdej
z każdą to sześćdziesiąt cztery miliony par. Dlatego rzadkie słowa mają swój
skorowidz — słowo wskazuje notatki, w których wystąpiło. Powstaje raz i przeżywa
aż do zmiany notatek; unieważnia go zapis notatki, w jednym miejscu, przez które
przechodzi każdy z nich. Test wymaga, żeby liczenie przy czterech tysiącach
notatek zmieściło się poniżej pół sekundy.

Wszystko dzieje się na urządzeniu — osobne sprawdzenie pilnuje, że w tym module
nie ma niczego, co wysyła dane.

**Naprawione przy okazji: pierwszy rząd notatek chował się pod paskiem.**
Odstęp u góry listy był zerowany, gdy pasek się chował. Wyglądało to na
oszczędność, a było usterką: odstęp znikał i wracał przy każdym schowaniu, więc
treść skakała o jego wysokość, a w stanie pośrednim — pasek widoczny, lista już
przewinięta — pierwszego rzędu po prostu nie dało się przeczytać. Odstęp jest
teraz stały i nic nie kosztuje: przy samej górze pasek i tak go wypełnia,
a niżej jest już przewinięty.

---

## v2.28 — szablony notatek

W notatkach z zebrań powtarza się ten sam szkielet: data, nazwisko mówcy,
„Komentarze", „Omówienie". Wpisywanie go od nowa przy każdej notatce to
kilkanaście sekund i kilka pomyłek tygodniowo — a przy notowaniu na bieżąco
liczy się każda z nich.

**Szablon powstaje z Twojej notatki, nie z gotowca.** Otwierasz notatkę
o dobrym układzie, wybierasz **⋯ → „Zapisz jako szablon…"**, nadajesz nazwę.
Nie ma tu wzorców wymyślonych przeze mnie, bo układ notatki to sprawa osobista
— a Twój jest już dopracowany.

**W oknie nowej notatki** doszedł pasek z szablonami: dotknięcie wstawia.
Przy każdym „⋯" do zmiany nazwy albo usunięcia. Gdy szablonów jeszcze nie ma,
pasek tłumaczy, skąd się biorą, zamiast świecić pustką.

**Trzy wstawki** zamieniane przy tworzeniu notatki:

- `{data}` — dzisiejsza data,
- `{godzina}` — bieżąca godzina,
- `{kursor}` — miejsce, w którym ma stanąć kursor po wstawieniu.

Zestaw jest świadomie skromny: każda kolejna wstawka to kolejna rzecz do
zapamiętania, a te trzy pokrywają wszystko, co w notatce z zebrania zmienia się
co tydzień.

**Dwie rzeczy, których szablon nie zrobi.** Nie nadpisze tytułu, który już
wpisałeś, a napisaną treść **doklei zamiast skasować** — wybór szablonu po
rozpoczęciu pisania nie może zjeść zdań, które już powstały. To strata nie do
odzyskania, więc pilnuje tego osobne sprawdzenie.

**Szablony jadą z kopią zapasową** na drugie urządzenie. Przy wczytywaniu
dokładają się po nazwie: powtórki nie mają sensu, a nadpisanie cudzą wersją
tego, co u siebie poprawiłeś, byłoby stratą. Uszkodzone wpisy są pomijane.

Nowy zestaw `testy/szablony.js` — 27 sprawdzeń.

---

## v2.27 — przegląd całości: dwie usterki znalezione i naprawione

Przegląd wszystkich funkcji na życzenie użytkownika. Dwie rzeczy nie działały
tak, jak powinny — obie takie, których nie widać z ekranu.

**1. Notatki z publikacji szły do JW Library BEZ MIEJSCA.** Eksport przypisywał
miejsce tylko notatkom biblijnym (księga i rozdział). Notatka z artykułu — czyli
większość tego, co powstaje na zebraniach — trafiała do bazy z pustym
`LocationId`. Taka notatka nie ma się gdzie pokazać: nie wisi przy żadnym
akapicie i nie widać jej w publikacji. Wychodziło to dopiero po przywróceniu
kopii na urządzeniu, gdy nic już nie dało się zrobić.

Miejsce w publikacji opisują symbol (np. „w"), numer wydania i numer dokumentu.
Eksport szuka teraz istniejącego wiersza po tej trójce, a gdy go nie ma —
dopisuje nowy, w tej samej postaci, w jakiej robi to JW Library. Notatka wisi
przy swoim akapicie.

Sprawdzenie nie polega już na czytaniu kodu: nowy zestaw `testy/jwlibrary.js`
buduje prawdziwą kopię `.jwlibrary` (te same tabele co JW Library), przepuszcza
przez nią eksport, po czym **rozpakowuje gotowy plik i odpytuje bazę SQL tak,
jak zrobi to JW Library** — 34 sprawdzenia: budowa archiwum, odcisk bazy, daty
w wymaganym formacie, treść bez znaczników HTML, brak pustych treści, powiązania
etykiet, brak osieroconych wpisów i kontrola spójności SQLite.

**2. Dwa okna nie mieściły się na ekranie.** `#askModal` i `#msgModal` nie miały
ŻADNEGO ograniczenia wysokości. Przy dłuższej treści — liście artykułów do
wyboru, raporcie błędów, opisie importu — okno rosło poza ekran, a że nie miało
własnego przewijania, dolnej części nie dało się zobaczyć ani dosięgnąć: przyciski
„OK" i „Anuluj" bywały poza zasięgiem. Teraz środek okna przewija się, a nagłówek
i przyciski zostają na widoku. Wiersz odpowiedzi też się przewija, gdy jest ich
wiele.

Reszta przeglądu bez zastrzeżeń: czytnik, edycja tekstu, wszystkie dziesięć okien,
wyszukiwanie (dziesięć postaci zapytania: słowo, fraza w cudzysłowie, gwiazdka,
alternatywa, zawężenia `tytuł:`, `etykieta:`, `werset:`, wiele słów naraz, tekst
bez ogonków i zapytanie bez wyników).

---

## v2.26 — rysik zaznacza od pierwszego ruchu

Zgłoszenie: „rysik nie od razu reaguje, gdy podczas czytania chcę coś zaznaczyć".

**To nie było opóźnienie w kodzie.** Na iPadzie rysik domyślnie PRZEWIJA tak
samo jak palec. Żeby zaznaczyć, trzeba go najpierw przytrzymać albo dwukrotnie
stuknąć w słowo — i właśnie ten obowiązkowy wstęp odbiera się jako „nie
reaguje". Aplikacja może to zmienić i uznałem, że powinna: przy czytaniu
przewijanie rysikiem jest mało przydatne, bo palec ma się zawsze pod ręką,
a zaznaczanie odwrotnie — rysik trafia dokładnie między litery.

**W treści notatki ruch rysikiem od razu zaznacza tekst**, a po puszczeniu
pojawia się pasek kolorów. Rozpoznanie idzie po rodzaju dotknięcia
(`touchType === "stylus"`, które Safari podaje wprost dla Apple Pencil), a nie
po zgadywaniu z prędkości czy nacisku.

Trzy granice, których zmiana nie przekracza:

- **Palec przewija jak dotąd.** Gdyby zaznaczanie objęło palec, przewinięcie
  długiej notatki stałoby się niemożliwe.
- **W trybie edycji rysik należy do Scribble**, czyli do pisania po tekście.
  To funkcja, której nie da się zastąpić niczym innym.
- **Przewijanie jest odbierane dopiero wtedy, gdy rysik naprawdę zaznacza** —
  po przekroczeniu pięciu pikseli. Samo stuknięcie działa jak zawsze.

Zaznaczanie nie wychodzi też poza jedną notatkę: ruch w bok nie zagarnia
sąsiednich karteczek.

---

## v2.25 — zdjęcia w miniaturach zachowują proporcje

Na tablicy zdjęcia wychodziły spłaszczone — z fotografii robił się pasek.

**PRZYCZYNA.** Zdjęcie wstawione do notatki dostaje wpisaną w atrybucie
szerokość, na przykład 45% — tak działa jego regulacja w edytorze i tak ma być.
Wpis w atrybucie bije jednak każdą regułę arkusza stylów. W miniaturze
szerokość zostawała więc duża, a przycinana była sama wysokość (do 70 px).
Obraz był ściskany w pionie, zamiast zmniejszać się proporcjonalnie.

W widokach miniaturowych wpisana szerokość ustępuje teraz na rzecz proporcji:
wysokość ogranicza rozmiar, a szerokość idzie za nią. `object-fit` pilnuje
kształtu nawet wtedy, gdyby coś jeszcze narzuciło oba wymiary. Zdjęcie nie
opływa też tekstu — w karteczce szerokiej na dwieście pikseli oblewanie robiło
z tekstu wąskie paski po bokach.

W wydobytej karteczce podgląd jest większy (150 px), bo jest na niego miejsce.

---

## v2.24 — chowanie pasków płynne i na każdym urządzeniu

Zgłoszenie: „aplikacja na telefonie skacze, zrób płynniejszy ruch; tę opcję
łagodnego chowania możesz dać na wszystkich urządzeniach".

**Skakanie miało konkretną przyczynę.** Pierwsze podejście zwijało paski
WYSOKOŚCIĄ. Każda klatka takiej animacji zmienia układ strony, więc przeglądarka
przy każdej z nich przeliczała od nowa całą listę notatek — kilkadziesiąt kart
z cieniami i przycinaniem tekstu. Na telefonie dawało to szarpany ruch, i to
akurat w chwili, gdy użytkownik przewija.

**Teraz chowanie odbywa się wyłącznie przesunięciem.** Pasek nad listą leży NAD
nią (warstwą), a nie przed nią, a miejsce pod niego jest zarezerwowane raz —
odstępem u góry listy. Podczas chowania i pokazywania nie zmienia się nic
w układzie strony: rusza się tylko obraz, czym zajmuje się karta graficzna.
Wysokość pasków jest mierzona, a nie zgadywana, i mierzona ponownie, gdy pasek
zmieni zawartość.

Pasek przełączania kolumn wsuwa się przy tym **pod zielony pasek aplikacji**,
a główna część przesuwa się razem z nim — jednym ruchem, bez animowania
wysokości.

**Działa na każdym urządzeniu**, nie tylko na małym ekranie. Tryb zwarty
z v2.22 zostaje osobnym ustawieniem i dotyczy gęstości pasków, a nie ich
chowania.

---

## v2.23 — paski ustępują, gdy zaczynasz czytać

Pasek przełączania kolumn i pasek z widokami oraz filtrami są potrzebne wtedy,
gdy się wybiera, CO oglądać. Podczas przeglądania listy tylko zabierają miejsce —
na telefonie tyle, co dwie karteczki.

**Przewijanie w dół je chowa, ruch w górę przywraca.** Bez przycisku, bez
ustawienia: przewijasz dalej, więc czytasz; cofasz, więc czegoś szukasz. Na
samej górze listy paski są widoczne zawsze, bo tam nikt niczego nie czyta.

Kilka rzeczy, które musiały zadziałać, żeby to nie irytowało:

- **Drgnięcie palca niczego nie przełącza.** Ruch jest zbierany w jedną stronę
  i dopiero po przekroczeniu progu paski ustępują (26 px w dół) albo wracają
  (10 px w górę — powrót ma być natychmiastowy).
- **Przewijanie treści wewnątrz karteczki zostawia paski w spokoju.** Zdarzenie
  przewijania nie bąbelkuje, więc patrzymy wprost na to, co się przewinęło.
- **Krótka lista nie chowa niczego** — nie ma czego czytać dalej.
- **Chowamy wysokością, a nie przesunięciem**, dzięki czemu lista rośnie w górę
  płynnie i nic nie przeskakuje. Schowany pasek nie łapie dotknięć.
- **Przerysowanie listy przywraca paski** — nowa lista zaczyna się od góry.

Działa w trybie zwartym, czyli tam, gdzie miejsca faktycznie brakuje. Na dużym
ekranie paski zostają na miejscu.

Przy okazji poprawka w samym mechanizmie: przywrócenie pasków zerowało punkt
odniesienia, przez co pierwsze kolejne zdarzenie wyglądało jak gwałtowne
przewinięcie w dół o całą bieżącą pozycję — i paski chowały się natychmiast po
tym, jak wróciły. Punkt odniesienia bierzemy teraz z listy.

---

## v2.22 — na telefonie interfejs ustępuje miejsca notatkom

Ze zrzutu z telefonu: górny pasek zawinięty na trzy rzędy, pod nim pasek
przełączania kolumn, pod nim filtry łamiące się na dwa wiersze. Zanim pokazała
się pierwsza notatka, znikała blisko połowa ekranu. Do tego ikony na
karteczkach były wydrukowane wprost na zdaniach.

Na komputerze te same elementy mieszczą się w jednym rzędzie i nikomu nie wadzą.
Nie chodziło więc o usuwanie, tylko o to, żeby zachowywały się stosownie do
miejsca, jakie mają.

**Zwarty interfejs** włącza się sam poniżej 700 px szerokości — albo gdy
wysokości jest mniej niż 560 px, czyli na telefonie położonym poziomo, gdzie
oszczędzanie liczy się jeszcze bardziej. W Ustawieniach można to wymusić
(„zawsze") albo wyłączyć („nigdy").

Co się zmienia: niższy pasek górny bez podtytułu i numeru wersji, mniejsze
przyciski, filtry w **jednym przewijanym w bok rzędzie** zamiast łamania się na
dwa, niższy pasek przełączania kolumn i pasek nad listą.

**Nic nie znika.** Wszystkie sześć filtrów, cztery widoki, szukanie, sortowanie,
„Nowa notatka", „Plik" i Ustawienia zostają na miejscu — pilnuje tego osobna
grupa sprawdzeń, bo oszczędzanie miejsca, które odbiera funkcje, to nie
oszczędzanie, tylko chowanie. Z paska ustępują tylko trzy rzeczy, które mają
swoje miejsce gdzie indziej: regulacja pisma (Ustawienia), zapis kopii (menu
Plik) i cofanie (Ctrl+Z).

**Ikony zeszły z tekstu.** Na urządzeniu dotykowym pasek ikon karteczki jest
schowany, dopóki karteczka jest mała — a wydobycie jej jest o jedno dotknięcie
stąd i tam pasek czeka gotowy. Odzyskany zapas pod tekstem poszedł na treść:
to kolejne dwie linijki na każdej karteczce.

---

## v2.21 — „Script error." na telefonie: znaleziony i zamknięty

Zgłoszenie z dziennika błędów: `v2.19 · przeglądarka · 430×721 · Script error.`
Sam komunikat nie mówi nic — przeglądarka podaje go, gdy nie chce zdradzić
szczegółów: bez pliku, bez numeru wiersza. Ale wystarczył jako trop.

**PRZYCZYNA.** Kilka nasłuchów pilnuje CAŁEJ strony (zamykanie menu po
kliknięciu obok, chowanie paska zdjęcia, odkładanie wydobytej karteczki).
Wszystkie sięgały po `e.target.closest(...)`. Celem kliknięcia bywa jednak sam
dokument, a nie element — a `document` nie ma metody `closest`. Zwykłe
dotknięcie tła wywracało wtedy nasłuch, a błąd zgłoszony z fazy przechwytywania
trafia do okna właśnie jako gołe „Script error.".

Poprawione w siedmiu miejscach: motyw, edytor, zdjęcia, zaznaczanie, plik,
pomocniki interfejsu i wydobycie karteczki. Zamiast sprawdzać zapis w kodzie,
test **wysyła na dokument** te zdarzenia, które aplikacja nasłuchuje globalnie —
kliknięcie, puszczenie myszy, wskaźnik, przeciąganie, menu podręczne,
przewijanie — i wymaga ciszy. Sprawdzanie po treści kodu myliło się na
nasłuchach podpiętych do pojedynczych elementów, gdzie cel zawsze jest elementem.

**Diagnostyka przestała być bezradna wobec takich zgłoszeń.** Dziennik zapisuje
teraz kilkanaście ostatnich kroków użytkownika — dotknięcia, zmiany widoku,
obrót ekranu, zmianę rozmiaru okna — więc nawet gdy treść błędu przepadnie,
widać, co się działo tuż przed nim. Dołączany jest też stos błędu, jeśli
przeglądarka go udostępni. W śladach nie ma treści notatek: dziennik bywa
wklejany w zgłoszeniu i nie ma prawa nieść tego, co napisałeś.

---

## v2.20 — wydobyta karteczka zawsze większa od tej w rzędzie

Przy dwóch albo trzech karteczkach w rzędzie karty są szerokie, a kartka A6 jest
wąska — po kliknięciu notatka wychodziła WĘŻSZA, niż była. Powiększenie wyglądało
jak pomyłka.

**Kolejność zasad się odwróciła.** Kształt A6 zostaje tym, do czego dążymy, ale
ważniejsze jest, żeby karteczka urosła: liczymy A6, sprawdzamy, czy wyszła większa
od tej z rzędu (o co najmniej 12%), a gdy nie — rośnie, nawet kosztem odejścia od
proporcji. Lepiej mieć nieco inny kształt niż karteczkę mniejszą po powiększeniu.

Gdy karta zajmuje prawie całą listę i nie ma już dokąd rosnąć, zostaje przynajmniej
w swoim rozmiarze — nigdy poniżej.

**Kartka dostała 30% zapasu**, bo w praniu okazała się odrobinę za mała do
wygodnego czytania.

Na wąskim telefonie proporcja ustępuje z rozmysłem: trzymanie A6 na 360 px
szerokości oznaczałoby kartkę o połowę węższą od ekranu i zmarnowane miejsce.
Karteczka bierze całą dostępną szerokość i zostaje pionowa.

---

## v2.19 — odnośnik w wydobytej karteczce przestał zagłuszać treść

Wiersz z pochodzeniem notatki — przycisk odnośnika do publikacji, plakietka
symbolu i data — jest pomyślany dla szerokiej listy. Na kartce A6 zajmował
trzecią część powierzchni: sam odnośnik łamał się na dwa wiersze i był
większy niż akapit tekstu pod nim. Zagłuszał dokładnie to, po co się karteczkę
wydobywa.

W wydobytej karteczce wszystko z tego wiersza jest teraz o połowę mniejsze,
a nazwa publikacji mieści się w jednej linii. Nic nie ginie: pełna nazwa
zostaje w podpowiedzi i po otwarciu notatki, a odnośnik działa tak samo.

---

## v2.18 — wydobyta karteczka to kartka A6, a przewinięcie listy ją odkłada

**Kształt zamiast proporcji ekranu.** „Jedna trzecia okna" brzmiała rozsądnie,
a wychodziła różnie: na szerokim ekranie przysadzisty prostokąt, na wąskim coś
zupełnie innego. Wydobyta karteczka ma teraz kształt **arkusza A6 postawionego
pionowo** — ten sam na każdym urządzeniu. Zmienia się tylko jej wielkość, i to
wyłącznie wtedy, gdy inaczej nie zmieściłaby się na ekranie; kształt zostaje.

**Przewinięcie listy odkłada karteczkę.** Gdy zaczynasz przewijać w poszukiwaniu
czegoś dalej, to znak, że ta karteczka jest już przeczytana — sama wraca na swoje
miejsce.

Przewijanie treści **w środku** karteczki to co innego: wtedy właśnie ją czytasz
i zamknięcie w połowie zdania byłoby wrogie. Rozróżnienie nie jest zgadywaniem —
zdarzenie przewijania nie bąbelkuje, więc patrzymy wprost na to, co się
przewinęło: lista czy treść karteczki.

---

## v2.17 — karteczka wydobywa się na wierzch

**Treść da się przewinąć do końca.** Pasek ikon leży NAD treścią, więc zasłaniał
ostatnie zdanie: tekst się kończył, a widać go nie było. Pod tekstem jest teraz
zapas na wysokość paska plus trzy linijki.

**Kolor karteczki sięga pod pasek ikon.** Pasek brał szarość panelu, więc pod
kolorową karteczką świeciła obca belka i całość wyglądała na obciętą. Teraz
bierze kolor notatki, gdy jest ustawiony.

**Dotknięcie karteczki wyjmuje ją na wierzch.** Powiększa się mniej więcej do
jednej trzeciej okna aplikacji; drugie dotknięcie odkłada ją równo z pozostałymi.
Odkłada też dotknięcie obok i klawisz Escape.

O ruchu, bo to on decyduje, czy wygląda dobrze: karta na czas powiększenia
przechodzi w położenie bezwzględne, ale w siatce zostaje po niej **podkładka**
o dokładnie tych samych wymiarach — bez niej pozostałe karteczki przeskakiwałyby
w górę i całość wyglądałaby na zepsutą. Animujemy krawędzie (góra, lewo,
szerokość, wysokość), a nie skalę: dzięki temu tekst nie rozmazuje się, a
w powiększeniu widać go WIĘCEJ, a nie po prostu większy. Środek powiększonej
karty zostaje tam, gdzie był środek małej, więc wzrok nie ucieka w inne miejsce.

W powiększeniu wracają szczegóły, które na małej karteczce ustąpiły miejsca:
odnośnik, publikacja i data, tytuł w trzech wierszach, pasek ikon od razu
dostępny. Kto ma wyłączone animacje w systemie, dostaje zmianę bez ruchu.

Przyciski, odnośniki i uchwyty w karteczce działają po swojemu — powiększanie ich
nie przechwytuje. Zaznaczony tekst też nie zwija karteczki w połowie zdania.
Przerysowanie listy odkłada karteczkę, zanim cokolwiek zbuduje od nowa, więc nie
zostaje po niej osierocona podkładka.

Nowy zestaw `testy/wydobycie.js` — 28 sprawdzeń.

---

## v2.16 — koniec z belką grup i pływającym tytułem

**Belka z nazwą grupy zniknęła.** Przy sortowaniu wg publikacji wstawiała się
nad listą belka z nazwą wydania. Trzy podejścia do jej ułożenia dały niewiele,
a przy okazji stało się jasne, że problem leży gdzie indziej: ta sama informacja
jest w kolumnie po lewej, gdzie widać, w której publikacji się właśnie jest.
Dwa źródła tej samej wiadomości, z których jedno zabierało miejsce i przykrywało
karteczki. Zostało jedno. Sortowanie działa bez zmian — znikł tylko podpis.

Kod i style belki usunięte w całości, razem z funkcją budującą jej napis.

**Tytuł notatki na pełnym ekranie przestał pływać.** Nagłówek był przyklejony
do góry (`position:sticky`): przy czytaniu wisiał nad tekstem i zabierał miejsce,
a przy edycji nachodził na pasek narzędzi. Tytuł to podpis notatki, a nie pasek
sterowania — należy do początku dokumentu i przewija się teraz razem z treścią.

Krzyżyk zamknięcia odjeżdżałby wtedy razem z tytułem, więc przeniósł się do rogu
okna, gdzie jest dostępny niezależnie od przewinięcia. Ten w nagłówku zniknął —
byłby drugim takim samym — a nagłówek odzyskał odstęp, który wcześniej trzymał
na niego rezerwę.

---

## v2.15 — belka z nazwą sekcji ma własne miejsce

Poprzednia poprawka zdjęła przyklejanie, ale to nie wystarczyło. Karteczki mają
`position:relative` (potrzebne, żeby pasek ikon mógł leżeć nad treścią), a belka
grupy została zwykłym elementem bez pozycjonowania. W takim układzie karta maluje
się NAD nią — więc dalej ją przykrywała.

Trzy rzeczy naraz:

- **Belka stoi nad kartami.** `position:relative` z warstwą wyżej: zostaje
  w układzie, więc niczego nie zasłania i nic nie zasłania jej, ale maluje się
  jako pierwsza.
- **Notatki zeszły niżej.** Odstęp pod belką bierze się teraz z niej samej
  (12 px), a nie tylko z odstępu siatki. Karteczki mają cień, który wcześniej
  dotykał napisu.
- **Napis przestał się rozmywać.** Belka miała rozmycie tła (`backdrop-filter`) —
  przydatne, gdy była przyklejona i przepływały pod nią karty, a szkodliwe, gdy
  karta stoi tuż przy niej: napis robił się papkowaty. Tło jest teraz
  nieprzezroczyste.

---

## v2.14 — nagłówek grupy stoi NAD karteczkami, a nie na nich

Na tablicy pasek z nazwą publikacji zwężał się do cienkiej wstęgi i wchodził na
karteczki — z długiej nazwy zostawał nieczytelny skrawek.

**PRZYCZYNA.** Nagłówek ma `position:sticky`, żeby przy przewijaniu zwykłej listy
zostawał na wierzchu. W siatce sticky przykleja się jednak do WŁASNEGO wiersza,
a ten ma wysokość samego napisu. Nagłówek zostawał więc uwięziony w pasku
wysokości jednej linijki i nachodził na wiersz karteczek pod sobą. W układzie
kafelkowym przyklejanie i tak nie ma sensu — nagłówek stoi teraz na swoim
miejscu, przez całą szerokość tablicy, z odstępem od karteczek. W zwykłej liście
przyklejanie zostaje bez zmian.

**Długa nazwa jest czytelna.** Nazwy w rodzaju „Kurs Służby Pionierskiej ·
Lekcja 2 (a) | Rób dobry użytek z Przekładu Nowego Świata (część 1)" bywają
dłuższe niż kolumna. Ucinanie wielokropkiem zostawiało sam początek, po którym
nie dało się rozpoznać, czego dotyczy grupa. Teraz nazwa zawija się do dwóch
wierszy — we wszystkich widokach.

---

## v2.13 — wielkość karteczek i okienka, które nie chowają się za klawiaturą

**Wielkość karteczek, osobno od liczby w rzędzie.** Liczba w rzędzie decydowała
o szerokości, ale nie o tym, ile treści się mieści. Obok niej jest teraz wybór
wielkości w pięciu stopniach: bardzo małe, małe, średnie, duże, bardzo duże.
Wysokość karteczki idzie za wyborem, a przy dopasowaniu automatycznym razem
z nią rośnie też jej szerokość — bardzo małe mieszczą się gęściej, bardzo duże
dostają więcej miejsca. Ustawienie jest zapamiętywane.

**Okienka przy edycji przestały znikać.** Zaznaczasz tekst, wybierasz z menu
kolor albo cytat, a okienko wyboru ląduje za klawiaturą albo za dolną krawędzią
ekranu. Na tablecie dotkliwie, bo klawiatura zabiera tam nawet połowę wysokości.

PRZYCZYNA: wszystkie okienka układały się względem `innerHeight`. Ta wartość
**nie zmienia się**, gdy wyskoczy klawiatura ekranowa — okno zostaje tej samej
wysokości, tylko dolna część jest zasłonięta. Menu „mieściło się na ekranie"
według liczb i jednocześnie nie było go widać.

Powstała jedna wspólna miara — `widocznyObszar()` — oparta na `visualViewport`,
czyli na wycinku, który użytkownik faktycznie widzi. Korzystają z niej wszystkie
okienka: menu rozwijane, pasek kolorów zaznaczenia, okienko paska edycji, pasek
zdjęcia, menu kolorów kolumn, okienko czytnika, menu spod przytrzymania palca
i wybór zapisu. Pasek kolorów dodatkowo szuka miejsca: gdy pod zaznaczeniem go
brak, idzie nad nie, a w ostateczności przypina się do dolnej krawędzi
widocznego obszaru — zamiast zniknąć.

Nowy zestaw `testy/okienka.js` — 19 sprawdzeń, w tym udawany tablet z klawiaturą
(okno 1000 px, widoczne 600 px) i wymóg, żeby menu zmieściło się w tych 600 px.
Osobne sprawdzenie pilnuje, żeby w żadnym z siedmiu miejsc nie wróciło liczenie
z samego `innerHeight`.

---

## v2.12 — treść karteczki da się przewinąć na miejscu

Karteczka pokazuje osiem–dziesięć linijek, a notatka bywa dłuższa. Żeby zerknąć
na koniec, trzeba było otwierać ją na pełnym ekranie i wracać.

**Teraz treść przewija się wewnątrz karteczki.** Palcem albo kółkiem myszy,
bez otwierania czegokolwiek. Dojechanie do końca tekstu nie pociąga już całej
tablicy — przewijanie zatrzymuje się na karteczce. To samo działa w widoku
średnim.

**Poświata mówi, gdzie jest jeszcze tekst.** Stała poświata u dołu myliła:
wyglądała identycznie przy końcu notatki i w jej środku. Teraz zapala się z tej
strony, z której coś zostało — u dołu na początku, z obu stron w środku, u góry
na końcu. Gdy notatka mieści się w całości, nie ma jej wcale, więc od razu
widać, że to już wszystko.

Jeden nasłuch obsługuje wszystkie karteczki naraz — zdarzenie przewijania nie
bąbelkuje, więc przechwytujemy je na dokumencie, zamiast podpinać się do każdej
karty z osobna.

---

## v2.11 — na karteczce widać treść, a nie nagłówek

Tablica z v2.10 pokazywała to, czego akurat nie trzeba. Pod tytułem stał wiersz
z przyciskiem „Przypisz werset", plakietkami publikacji i datą — zajmował dwie
trzecie karteczki i na treść zostawała **jedna ucięta linijka**.

**Mój błąd był dosłowny.** Regułą chowałem klasę `.nmeta`, a karty notatek
używają `.nmeta2`. Reguła nie trafiała w nic i karteczka wyglądała dokładnie
tak, jakbym jej nie napisał. Test sprawdzał obecność reguły, a nie to, czy ma
w co trafić — teraz sprawdza jedno i drugie: odczytuje klasę z kodu kart
i wymaga, żeby chowała ją właśnie ta klasa.

Na karteczce zostają więc **tytuł i treść**. Odnośnik, werset, publikacja i data
są w każdym innym widoku i po otwarciu notatki — tutaj ustępują miejsca temu,
po co się na karteczkę patrzy.

Pasek ikon też przestał zabierać miejsce: leży teraz NAD treścią, przy dolnej
krawędzi, i pokazuje się dopiero, gdy karteczka jest pod kursorem. Póki jest
niewidoczny, nie przechwytuje też dotknięć. Na urządzeniach dotykowych, gdzie
nie ma najechania, zostaje widoczny, ale półprzezroczysty.

Karteczki są przy tym nieco wyższe (200–260 px zamiast 170–230), a tytuł
zajmuje najwyżej dwie linijki. W praktyce zamiast jednej linijki treści widać
jej osiem–dziesięć.

---

## v2.10 — tablica z karteczkami i własne tło każdej notatki

Odchudzenie pasków dało więcej miejsca, ale lista i tak układa notatki jedna pod
drugą — więcej niż kilka się nie zmieści, choćby marginesy były zerowe.

**Czwarty widok: Tablica.** Notatki leżą obok siebie jak karteczki przyklejone
do tablicy korkowej. Na jednym ekranie widać kilkanaście, a przewijanie ciągnie
się dalej tak samo. Karteczka pokazuje tytuł (najwyżej dwie linijki) i początek
treści, która delikatnie zanika u dołu — widać, że jest jej więcej. Szczegóły
i pasek ikon pojawiają się dopiero pod kursorem, żeby nie zabierały miejsca.

Obok przełącznika widoku jest wybór **ile karteczek w rzędzie**: auto (dopasuje
się do szerokości ekranu) albo na sztywno 2–5. Ustawienie jest zapamiętywane.

**Własne tło każdej notatki.** Menu ⋯ → „Tło notatki…" — dziewięć gotowych barw
karteczek albo **dowolny kolor** z próbnika. Kolor napisu liczy się z jasności
tła, więc karteczka zostaje czytelna zarówno w jasnym pastelu, jak i w mocnym
odcieniu. Tło jedzie z notatką w kopii zapasowej na inne urządzenie.

Data zmiany notatki zostaje przy tym nietknięta — pomalowanie karteczki to
wygląd, nie treść; inaczej samo dobranie koloru przestawiałoby notatkę
w sortowaniu „ostatnio zmienione".

**Przy okazji — luka, którą sam bym wpuścił.** Tło trafia do atrybutu `style`,
a wartość mogła przyjść z wczytanej kopii. Zapis z cudzysłowem pozwoliłby wyjść
z atrybutu i dopisać własny. Sito na wejściu sprawdza teraz kolor tła i wysokość
karty tak samo jak pozostałe pola idące do atrybutów — i to zawsze, nie tylko
przy plikach z obcego źródła, bo kopia potrafi krążyć między urządzeniami
i wrócić do nas.

Nowy zestaw `testy/tablica.js` — 34 sprawdzenia, w tym próba wstrzyknięcia kodu
w miejsce koloru i to, że na ciemnym tle napis robi się jasny.

---

## v2.09 — więcej notatek na ekranie

Na iPadzie widać było trzy notatki. Zanim zaczynała się pierwsza, stało nad nią
PIĘĆ pasków: górny pasek aplikacji w dwóch wierszach, ukryte kolumny, „Widok",
szybkie filtry i licznik notatek. Każdy z osobna wyglądał niewinnie, razem
zjadały ponad połowę wysokości ekranu.

**Jeden pasek zamiast czterech.** Ukryte kolumny, przełącznik widoku, szybkie
filtry i licznik siedzą teraz w jednym wierszu i zawijają się dopiero wtedy, gdy
naprawdę brakuje miejsca. Nic nie zniknęło — wszystkie sześć filtrów, oba
przełączniki i licznik działają jak dotąd; pilnuje tego osobny zestaw testów,
żeby oszczędzanie miejsca nie zamieniło się w chowanie funkcji.

**Górny pasek w jednym wierszu.** „Nowa notatka" i „Plik" spadały do drugiego
wiersza, bo pole szukania i lista sortowania nie chciały ustąpić ani piksela.
Teraz oba ustępują pierwsze, a sam pasek jest niższy.

**Trzeci widok: średni.** Dwa dotychczasowe były skokiem z jednej skrajności
w drugą — albo cała treść (trzy notatki na ekranie), albo ucięcie tak mocne, że
trzeba było otwierać każdą. Średni pokazuje kilka pierwszych linijek: dość, by
rozpoznać notatkę, a mieści ich kilkanaście. Treść zanika u dołu, więc widać,
że jest jej więcej. Własna wysokość notatki (v2.08) przebija widok — jedną kartę
można mieć rozwiniętą pośród przyciętych.

**Karta bez zbędnego powietrza.** Mniejszy odstęp między kartami, niższa belka
tytułu i niższy pasek ikon. Ikony zostały na tyle duże, żeby trafiać w nie
palcem.

Razem daje to około 180 px odzyskanych na samych paskach, plus ~20 px na każdej
karcie. W widoku średnim zamiast trzech notatek widać ich kilkanaście.

---

## v2.08 — każda notatka ma własną wysokość

Widok listy pokazywał każdą kartę w całości, widok zwarty przycinał wszystkie do
trzech linijek. Jedno i drugie dotyczyło CAŁEJ listy naraz, a notatki są różne:
jedna ma dwa zdania i zajmuje pół ekranu na darmo, druga ma dwie strony i chce
się ją mieć w całości pod ręką.

**Teraz decydujesz osobno dla każdej notatki.** Dwie drogi:

- **Uchwyt na dolnej krawędzi karty** — chwytasz i przeciągasz, tak jak okno.
  Działa palcem, rysikiem i myszą. Na dotyku uchwyt jest widoczny od razu, na
  komputerze pokazuje się pod kursorem. Dwuklik w uchwyt przywraca ustawienie
  z widoku.
- **Menu ⋯ → „Wysokość notatki…"** z gotowymi rozmiarami: bardzo mała, mała,
  średnia, duża, cała notatka. Widać ✓ przy wybranym.

Treść przewija się wtedy wewnątrz karty, a nie rozpycha listy, i delikatnie
zanika u dołu — żeby było widać, że jest jej więcej. Wybór „cała notatka"
przebija także widok zwarty, więc jedną notatkę można mieć rozwiniętą pośród
przyciętych.

Wysokość zapisuje się przy notatce, przeżywa zamknięcie aplikacji i jedzie
razem z kopią zapasową na inne urządzenie. **Data zmiany notatki zostaje
nietknięta** — przesunęła się karta, a nie treść; inaczej samo zmniejszenie
przestawiałoby notatkę w sortowaniu „ostatnio zmienione".

Nowy zestaw `testy/wysokosc.js` — 24 sprawdzenia, w tym wartości skrajne
(nie da się zmniejszyć do zera ani rozdmuchać bez granic) i to, że ustawienie
jednej notatki nie rusza pozostałych.

---

## v2.07 — OneNote na telefonie, dwa wąskie gardła i szybsze odświeżanie

**Kopia z OneNote nie była rozpoznawana na telefonie — i teraz wiem dlaczego.**
Strona `onenote.html` oddawała plik jedną drogą: linkiem z atrybutem `download`.
Safari na iPhonie i iPadzie ignoruje go dla danych z pamięci — plik albo nie
powstaje wcale, albo otwiera się jako tekst w nowej karcie i po zapisaniu ląduje
jako strona HTML. Aplikacja słusznie odmawiała potem wczytania: to nie był plik
kopii, tylko strona. Sprawdzenie od końca do końca (strona → import) przechodzi
na komputerze bez zarzutu, więc usterka była niewidoczna z tej strony.

Teraz na telefonie strona nie próbuje pobierać pliku, tylko daje trzy drogi:
**📤 Udostępnij plik** (AirDrop, Pliki, Mail), **📋 Kopiuj do schowka** oraz
**👁 Pokaż treść** do ręcznego zaznaczenia. Najprostsza to schowek — a potem
w JW Study *Plik → Wczytaj kopię → 📋 Wklej treść*. Żaden plik nie jest wtedy
potrzebny, więc nie ma czego zgubić ani źle zapisać.

**Dwa wąskie gardła odświeżania.**

Liczniki zakładek: `secTabCount` przelatywał CAŁĄ listę notatek osobno dla
każdej zakładki, a przy każdej notatce jeszcze raz po jej etykietach. Przy
trzech tysiącach notatek i dwudziestu zakładkach — ponad sto tysięcy porównań
przy każdym przerysowaniu kolumny. Teraz liczymy wszystkie zakładki naraz,
jednym przebiegiem, a wynik trzymamy do końca przerysowania. Wyniki co do
jednego takie same — pilnuje tego test porównujący ze starym sposobem.

Opisy przycisków dla czytnika ekranu: przy każdym przerysowaniu sięgaliśmy po
`textContent` każdego przycisku z podpowiedzią. Przyciski z widocznym napisem
nigdy nie dostają `aria-label`, więc wracały do tej pętli w nieskończoność —
sześćset elementów, po kilkanaście razy na minutę. Element rozpatrzony dostaje
teraz znacznik i wypada z selektora na dobre. Przeglądamy też tylko te cztery
kolumny, które właśnie odrysowaliśmy, zamiast całego dokumentu.

Nowy zestaw `testy/wydajnosc.js` — 11 sprawdzeń pilnujących, że praca jest
wykonywana raz, a wyniki się nie zmieniły.

---

## v2.06 — telefon: koniec z cichymi porażkami

Audyt kodu nie wskazał niczego, co wywala aplikację na starcie, więc poszedłem
za objawem: „większość działa, nie działają niektóre rzeczy", aplikacja
uruchamiana z ikony na ekranie głównym.

**Sedno: w trybie samodzielnym iOS NIE POBIERA plików.** Kliknięcie w link
z atrybutem `download` nie robi zupełnie nic i nie zgłasza błędu — tak działa
system i nie da się tego obejść od środka. Nasz `saveFile` kończył właśnie na
tym i ZAWSZE zwracał sukces. Dotykałeś „Zapisz", nie działo się nic, a aplikacja
melduła „Zapisano". Dotyczyło to kopii zapasowej, wysyłania notatki i zakładki
oraz eksportu do Worda i PDF.

Teraz `saveFile` mówi prawdę: najpierw próbuje okna udostępniania (AirDrop,
Pliki, Mail), a gdy się nie uda i działamy z ekranu głównego — tłumaczy, co się
stało i co zrobić (otworzyć aplikację w Safari pod jej adresem). Komunikat
„Zapisano" pojawia się wyłącznie wtedy, gdy plik naprawdę wyszedł z aplikacji.

**Wczytanie kopii bez wybierania pliku.** W oknie wczytywania jest teraz
przycisk **„📋 Wklej treść"**. Wkleja się całą zawartość pliku `.json` —
to ta sama droga i te same zabezpieczenia co przy wyborze pliku, tylko inne
wejście. Rozwiązuje przenoszenie notatek z OneNote na telefonie, gdzie plik
trzeba było zapisać, odszukać i wskazać, a każdy z tych kroków mógł zawieść.
Dla `.jwlibrary` wklejanie jest wyłączone z wyjaśnieniem — to spakowane
archiwum, nie tekst.

**Błędy przestały być niewidzialne.** Na telefonie nie ma konsoli, więc każda
usterka kończyła się słowem „nie działa" i zgadywaniem po obu stronach. Aplikacja
łapie teraz błędy wykonania i odrzucone obietnice, pokazuje pasek z treścią
i pozwala skopiować szczegóły — z wersją, trybem uruchomienia i rozmiarem
ekranu. Ostatnie dwadzieścia wpisów zostaje w pamięci urządzenia i można je
obejrzeć w Ustawieniach → Dziennik błędów.

Nowy zestaw `testy/telefon.js` — 20 sprawdzeń, w tym to najważniejsze: zapis
w trybie samodzielnym bez okna udostępniania musi zgłosić porażkę, a nie sukces.

---

## v2.05 — aplikacja mogła przestać reagować na dotyk (poważna usterka)

Zgłoszenie brzmiało: „na telefonie nie działa więcej funkcji, np. wgranie
notatek z OneNote". Import nie miał z tym nic wspólnego.

**Przyczyna.** Przenoszenie elementów (v1.96) zakładało na `<body>` klasę
`wTrakcieChwytu`, a nasłuch w fazie przechwytywania POŁYKAŁ KAŻDE kliknięcie
w całej aplikacji, dopóki ta klasa tam była. Zdejmowaliśmy ją wyłącznie
w obsłudze `pointerup`. Wystarczyło więc, żeby to zdarzenie raz nie doszło —
a na telefonie zdarza się to często: przerysowanie listy zabiera element spod
palca, gest przejmuje system, przeglądarka odbiera zdarzenie karcie. Klasa
zostawała na zawsze. Aplikacja wyglądała na żywą, ale nie reagowała na nic:
ani ustawienia, ani przyciski, ani okno wyboru pliku z kopią — stąd wrażenie,
że „nie działa wgranie notatek z OneNote".

**Jak jest teraz.** Blokowane jest DOKŁADNIE JEDNO kliknięcie, i to tylko przez
400 ms po zakończonym przenoszeniu. Po przerwanym geście nie blokujemy nic.
Nawet gdyby coś poszło nie tak, po chwili wszystko działa normalnie — trwałe
zablokowanie strony przestało być możliwe.

Do tego cztery niezależne drogi sprzątania, bo telefon potrafi zgubić każdą
z osobna: utrata okna, przerwanie gestu przez system, schowanie aplikacji w tło
oraz strażnik czasowy, który po pięciu sekundach bez żadnego ruchu wskaźnika
sam odpuszcza trzymany element.

**Drugi drobiazg z v2.04.** Zabezpieczenie menu przed drgnięciem listy
porównywało tożsamość węzła. Menu bywa jednak przerysowywane między dotknięciem
a puszczeniem palca i wtedy ten sam wiersz jest już innym węzłem — dotknięcie
przepadało bez powodu. Teraz porównujemy polecenie, nie węzeł.

Nowy zestaw `testy/klikalnosc.js` — 15 sprawdzeń, w tym to najważniejsze:
po zgubionym `pointerup` zwykły przycisk w aplikacji nadal musi działać.

---

## v2.04 — na telefonie menu trafiało w inną pozycję, niż dotknięta

Zgłoszenie: „gdy próbuję wysłać notatkę, pokazuje mi przypisz do publikacji".
Tylko na telefonie. Przyczyny były dwie i obie biorą się stąd, że menu
`#dropdown` jest JEDNYM elementem na całą aplikację i bywa przewijane
(max-height 76vh).

**1. Przewinięcie zostawało po poprzednim menu.** Nigdzie nie zerowaliśmy
`scrollTop`, więc następne menu otwierało się w połowie listy i pod palcem stała
inna pozycja, niż się wydawało. Na komputerze niewidoczne, bo tam menu mieści
się na ekranie w całości. Teraz każde otwarcie zaczyna się od góry.

**2. Lista potrafiła drgnąć między dotknięciem a puszczeniem palca** — przez
odruchowe przewinięcie albo przez dosuwanie menu do krawędzi ekranu. Wtedy
`click` trafiał w wiersz, który dopiero wjechał pod palec. Teraz działa ta
pozycja, na której palec WYLĄDOWAŁ; jeśli przy puszczeniu jest pod nim inna,
nie dzieje się nic i pojawia się komunikat „Lista drgnęła — dotknij jeszcze
raz". Lepiej, żeby dotknięcie przepadło, niż żeby wykonało cudze polecenie.
Zabezpieczenie obejmuje wszystkie menu aplikacji, nie tylko notatek.

**Przy okazji: „Wyślij na inne urządzenie…" przeniosło się wyżej.** Stało
w grupie „Eksport notatki", czyli na dole długiego menu — na telefonie trzeba
było do niego przewijać. Wysyłanie to działanie główne, nie format pliku, więc
siedzi teraz zaraz po „Kopiuj odnośnik".

Nowy zestaw `testy/menu-dotyk.js` — 10 sprawdzeń, w tym to najważniejsze:
dotknięcie „Wyślij" i puszczenie nad „Miejsce w publikacji" nie może wykonać
niczego.

---

## v2.03 — miejsce w publikacji ustawiane ręcznie i chronione przed importem

Notatka przysłana z innego urządzenia albo napisana od zera nie ma numerów
z JW Library, więc w sortowaniu „Kolejność w publikacji" lądowała na końcu
swojej publikacji i nie dało się z tym nic zrobić.

**Menu ⋯ przy notatce → „Miejsce w publikacji…"** Trzy kroki: publikacja
i wydanie, potem artykuł, potem numer akapitu. Listy biorą się z notatek, które
już masz, więc wskazujesz prawdziwy artykuł, a nie zgadujesz numer dokumentu.

**Ten wybór zostaje.** Notatka dostaje znacznik „miejsce ustawione ręcznie",
a import kopii z JW Library takich notatek nie rusza. Bez tego zabezpieczenia
zmiana z v2.01 skasowałaby wybór przy najbliższym wczytaniu kopii. Ta sama
ochrona objęła ręcznie przypisany werset. Zabezpieczenie jest celowo wąskie:
notatki BEZ znacznika nadal dostają świeże numery przy każdym imporcie.

---

## v2.02 — wysłanie pojedynczej notatki na inne urządzenie

Dało się wysłać całą etykietę albo zakładkę, ale nie jedną notatkę — a to
najczęstszy przypadek. **Menu ⋯ przy notatce → „Wyślij na inne urządzenie…"**

Notatka zabiera ze sobą swoje etykiety, a przez nie sekcje i zakładki — inaczej
po drugiej stronie wylądowałaby luzem, bo przypisania do nieznanych etykiet są
odrzucane. Sąsiednie notatki zostają na miejscu.

---

## v2.01 — „Kolejność w publikacji" zgodna z JW Library

**1. O kolejności artykułów decydował ich TYTUŁ, alfabetycznie.** Porównywarka
sprawdzała: symbol publikacji → numer wydania → tytuł artykułu → numer dokumentu
→ akapit. Tytuł stał przed numerem dokumentu, więc artykuły w jednej Strażnicy
ustawiały się alfabetycznie. Tytuł to etykieta, nie pozycja — teraz decydują
cztery liczby: KeySymbol, IssueTagNumber, DocumentId, BlockIdentifier.

Notatki bez numeru dokumentu idą na koniec swojej publikacji, a nie na początek.
Zero nie znaczy „pierwszy", tylko „nie wiadomo gdzie".

**2. Import nigdy nie poprawiał położenia notatek, które kiedyś zmieniłeś.**
Notatka ze znacznikiem „zmieniona w aplikacji" była pomijana w całości — razem
z numerami publikacji, wydania, artykułu i akapitu. Położenie jest teraz
odświeżane zawsze; to nie dane użytkownika, tylko fakt z JW Library.

---

## v2.00 — lista przewija się sama, gdy niesiesz notatkę do krawędzi

Przeniesienie notatki o dwadzieścia wierszy było niewykonalne: cel leżał poza
ekranem, a lista nie jechała, bo palec trzymał element, nie listę. Teraz przy
zbliżeniu do krawędzi lista jedzie sama, tym szybciej, im bliżej brzegu.

Po każdym przesunięciu miejsce wstawienia jest przeliczane na nowo, żeby linia
szła za treścią, która wjechała na ekran.

**Przy okazji — usterka w kontroli jakości.** Zestaw `import-atomowy` co trzeci
przebieg kończył się bez podsumowania z kodem 0, czyli meldował sukces.
Podstawiona baza zawiadamiała o końcu zapisu przez `setTimeout(...,0)`, który
ścigał się z przypisaniem `tx.oncomplete`. Teraz idzie to mikrozadaniem, a
zestaw, który zamilkł w połowie, zgłasza głośny błąd.

---

## v1.99 — jeden przycisk z powrotem do wszystkich notatek

Powrót do pełnej listy wymagał czterech ruchów po całym ekranie. **W górnym
pasku jest teraz „Wszystkie notatki"** — zdejmuje naraz szukanie, etykietę,
księgę, rozdział i szybki filtr. Pokazuje się tylko wtedy, gdy jest po co.
Z klawiatury: 0.

---

## v1.98 — zwinięte kolumny znikają, zamiast zostawiać szare paski

Zwinięcie zostawiało słupek 42 px z obróconym napisem; przy trzech zwiniętych
ekran zaczynał się od trzech szarych pasków bez treści. Teraz kolumna znika
zupełnie razem z uchwytem szerokości, a powrót to jedna cienka linijka bladych
pastylek nad listą notatek.

---

## v1.97 — notatki przenosisz tak samo, a własna kolejność się trzyma

Karty notatek chwyta się tak jak etykiety. **Własna kolejność przestała się
gubić:** numery nadawało się przelatując po kartach NA EKRANIE, a lista pokazuje
tylko pierwszą porcję i tylko notatki z bieżącego filtra — te same liczby
lądowały u wielu notatek naraz. Teraz przestawienie działa na pełnej liście.

---

## v1.96 — przenoszenie „przyklejone do palca": gdziekolwiek, nie o jedno miejsce

Stary mechanizm pilnował `data-grupa`: pozycja mogła się przesuwać wyłącznie
w obrębie własnej sekcji i nie wolno jej było przeskoczyć nagłówka. Nie było
też widać nic, więc wyglądało to jak zawieszenie.

Teraz element przykleja się do palca, gruba linia pokazuje miejsce wstawienia,
a upuszczenie w innej sekcji przenosi tam etykietę albo zakładkę na stałe.

---

## v1.95 — wysłanie jednej etykiety albo zakładki na inne urządzenie

Kopia zapasowa przenosi wszystko. Czasem trzeba przenieść jedną rzecz:
etykietę „Kongres 2026" razem z jej sześćdziesięcioma notatkami, bez ruszania
reszty.

**Menu ⋯ przy etykiecie i przy zakładce → „Wyślij na inne urządzenie…"**

Przed zapisem widzisz, co dokładnie pojedzie: ile notatek, ile zdjęć, jaki
rozmiar. Na iPadzie i iPhonie zapis otwiera okno udostępniania, więc plik
wysyłasz przez **AirDrop** wprost na drugie urządzenie.

**Po drugiej stronie nie trzeba niczego nowego.** Plik ma dokładnie ten sam
kształt co pełna kopia — jest po prostu jej wycinkiem. Wczytujesz go zwykłym
**„Dołącz + układ"**, a notatki trafiają na miejsce razem z etykietą, sekcją
i zakładką. Nic tam nie zostaje skasowane.

### Co jedzie razem z notatkami
- etykieta albo zakładka, o którą chodzi
- **sekcja**, do której należy — bez niej wszystko wylądowałoby luzem
- zakładki publikacji, do których przypisano wysyłane notatki
- przy zakładce sekcji: notatki wrzucone do niej wprost **oraz** te, które
  należą do niej przez swoje etykiety — dokładnie to, co widać po jej kliknięciu

Notatki z kosza nie jadą. Wysłane dane są niezależną kopią: późniejsza zmiana
notatki nie zmienia tego, co już zapisane do pliku.

### Usterka wyłapana przy okazji
Test pokazał, że dołączanie kopii **nie dopasowywało zakładek sekcji**.
Numery zakładek na dwóch urządzeniach są niezależne, więc notatka z drugiego
urządzenia mogła trafić do przypadkowej zakładki. Teraz zakładki dopasowywane
są po parze (sekcja, nazwa), tak samo jak od dawna etykiety i zakładki
publikacji, a przypisania notatek i etykiet są przenumerowywane. Wskazanie
zakładki, której u odbiorcy nie ma, jest zdejmowane, a nie zgadywane.

Dotyczy to każdej kopii zawierającej zakładki sekcji, nie tylko tej nowej
możliwości.

`testy/udostepnianie.js` — **26 asercji**, w tym pełna droga: wysłanie,
wczytanie na czystym urządzeniu i sprawdzenie, że notatka wylądowała
we właściwej zakładce.

## v1.94 — koniec z pobieraniem kodu z obcego serwera

Do tej wersji aplikacja pobierała dwie biblioteki (JSZip i sql.js) z cdnjs —
**od pierwszej wersji, po cichu**. Były potrzebne wyłącznie do otwarcia archiwum
`.jwlibrary`. W v1.77 doszło pytanie o zgodę, ale to tylko przenosiło decyzję
na użytkownika, zamiast usuwać przyczynę.

**Teraz biblioteki są częścią aplikacji.** Leżą w katalogu `lib/` i wgrywa się je
razem z nią — raz, przez właściciela strony. Użytkownicy nie pobierają nic
i o nic nie są pytani.

### Co się zmieniło w praktyce
- **Aplikacja nie potrafi już sięgnąć na zewnątrz.** Polityka bezpieczeństwa
  treści dopuszcza wyłącznie własny adres: `script-src 'self'`, `connect-src 'self'`.
  Nie ma tam żadnego obcego adresu, także cdnjs.
- Pytanie o zgodę zniknęło razem z powodem, dla którego istniało.
- Import z JW Library działa **bez internetu** — pliki są zapisywane do pracy
  offline razem z resztą aplikacji.

### Skąd pochodzą pliki
Z oficjalnego rejestru npm, wprost od autorów: **JSZip 3.10.1** i **sql.js 1.14.1**,
obie o otwartym kodzie. `lib/README.md` podaje ich sumy kontrolne i polecenie,
którym można je sprawdzić u siebie.

Razem 784 kB, z czego 644 kB to silnik bazy danych.

### Dlaczego to warto było zrobić
Taki kod wykonuje się **z dostępem do wszystkich notatek** — musi, żeby odczytać
archiwum. Podmiana pliku na serwerze albo po drodze oznaczałaby dostęp do nich.
Prawdopodobieństwo niewielkie, ale w czerwcu 2024 zdarzyło się to naprawdę innemu
serwisowi tego typu: polyfill.io zaczął podsyłać złośliwy kod ponad 110 000 stron.

Plik u siebie nie ma tego problemu w ogóle.

`testy/import-limity.js` — asercje pilnują, że w kodzie ładującym biblioteki
**nie ma żadnego obcego adresu**, że silnik bazy też jest brany z katalogu obok,
że pliki faktycznie są w paczce i że polityka bezpieczeństwa nie zawiera
zewnętrznych adresów.

## v1.93 — przenoszenie notatek i zakładek palcem

Prosiłeś o to wcześniej i nie zrobiłem tego jak trzeba.

**Karta notatki miała uchwyt do przeciągania, ale oparty na mechanizmie
przeglądarki, który nie reaguje na dotyk.** Na iPadzie i telefonie nie dawało
się przeciągnąć niczego — zostawało menu ⋯ i przesuwanie „o jeden krok w górę".
Na Macu myszą działało, więc problem był niewidoczny z mojej strony.

### Notatki
Uchwyt ⠿ w belce notatki obsługuje teraz **wskaźnik**: palec, rysik i mysz
tak samo. Łapiesz notatkę i upuszczasz tam, gdzie ma trafić:

- **na zakładkę sekcji** → notatka wpada do tej zakładki
- **na zakładkę publikacji** → to samo po tamtej stronie
- **na etykietę** → notatka dostaje tę etykietę

Cel podświetla się pod palcem, więc widać, gdzie się upuszcza. Pozycje
„Wszystkie" i „Bez etykiety" nie są celami — to nie miejsca, tylko widoki.
Ta sama etykieta upuszczona drugi raz nie dubluje się.

### Zakładki
Kolejność wewnątrz sekcji zmieniasz przeciąganiem za uchwyt — bez ograniczenia
do jednego kroku. Doszło też **„Przenieś do innej sekcji…"** w menu ⋯:
przeciąganie między sekcjami byłoby niepewne, gdy sekcja docelowa jest zwinięta
albo poza ekranem, a menu działa zawsze. Etykiety przypisane do zakładki idą
razem z nią — inaczej zostałyby w starej sekcji, wskazując zakładkę, której
tam już nie ma.

`testy/przenoszenie.js` — **18 asercji**, w tym pierwsza pilnująca przyczyny:
obsługa ma być oparta na wskaźniku, nie na mechanizmie przeglądarki. Dzięki
temu ta usterka nie wróci niezauważona przy kolejnej zmianie.

## v1.92 — naprawa odstępów w notatkach już wczytanych

Porządkowanie z v1.89 działa tylko na treści przenoszonej **od nowa**.
Notatki, które są już w aplikacji, zostawały ze starymi odstępami — a powtarzanie
całej drogi przez Graph Explorer to żadne rozwiązanie.

**Ustawienia → Porządki w notatkach → „Uporządkuj odstępy w treści"**

Przechodzi po wszystkich notatkach i usuwa to, czego nikt nie pisał: wcięcia
i podziały wierszy pochodzące z pliku źródłowego, puste akapity, zbitki przerw
oraz przerwy stojące między akapitami (każdy akapit i tak zaczyna nowy wiersz —
przerwa obok niego daje pustą linię). Zdejmuje też sztywne szerokości tabel.

Przed wykonaniem podaje, **ilu notatek dotyczy i ile ubędzie**, i przypomina
o kopii zapasowej — zmiana dotyczy treści i nie da się jej cofnąć.

### Czego NIE rusza
- tekstu, list, tabel, wyróżnień, podświetleń i zdjęć
- **przerw wpisanych ręcznie w środku zdania** — te są Twoje i zostają
- notatek, w których nie ma czego poprawiać (zostają bajt w bajt)
- notatek w koszu

### Skąd w ogóle ten problem
Treść notatki wyświetlana jest z zachowaniem spacji, żeby Twoje własne wcięcia
wyglądały tak, jak je wpisałeś. Ma to drugą stronę: treść z innego programu
niesie wcięcia z samego pliku źródłowego i **one też są widoczne**, choć nikt
ich nie pisał. Stąd tekst rozstrzelony po całej karcie.

Ta sama poprawka trafiła do strony przenoszenia, więc przy kolejnych importach
problem nie wróci.

`testy/porzadki.js` — **20 asercji**: co znika, co zostaje (osobno sprawdzana
przerwa wpisana ręcznie), działanie na całym zbiorze z pominięciem kosza, oraz
zgodność z filtrem treści aplikacji.

## v1.91 — nowa notatka wprost do zakładki

Notatka tworzona „w sekcji" trafiała poza nią i trzeba jej było szukać wśród
wszystkich — mimo że intencja wynikała wprost z tego, gdzie użytkownik był.

Okno nowej notatki ma teraz pole **„Zakładka w sekcji"**: lista pogrupowana po
sekcjach, z pozycją „brak" dla notatek, które nigdzie nie mają trafiać.

**Najważniejsze jest to, czego nie trzeba wybierać.** Gdy masz właśnie otwartą
zakładkę — czyli lista jest do niej zawężona — jest ona podpowiadana od razu.
Wchodzisz w „Kongres 2026", tworzysz notatkę, naciskasz „Utwórz" i notatka jest
na miejscu. Potwierdzenie mówi wprost: „Notatka dodana do zakładki
„Kongres 2026"".

Gdy w aplikacji nie ma jeszcze żadnej zakładki, pole się nie pokazuje — nie ma
sensu pytać o wybór z pustej listy.

`testy/sekcje.js` — siedem nowych asercji, w tym ta najważniejsza: po utworzeniu
notatki przy otwartej zakładce widać ją od razu po wejściu w tę zakładkę.

## v1.90 — powtórny import nic nie zmieniał

Poprawka układu z v1.89 była dobra, ale nie miała jak wejść.

**Dlaczego.** Dołączanie kopii nadpisuje notatkę tylko wtedy, gdy ta z pliku ma
**nowszą** datę zmiany. Przy przenoszeniu z OneNote data pochodzi ze źródła
i przy powtórnym przenoszeniu jest identyczna — więc wszystkie notatki zostały
uznane za „takie same" i pominięte. Aplikacja zachowała się dokładnie tak, jak
zaprojektowano (nie kasować cudzej pracy nowszym-ale-takim-samym plikiem),
tyle że w tym przypadku był to skutek odwrotny do zamierzonego.

**Co doszło.** Trzecia możliwość w oknie wczytywania kopii:
**„Dołącz + nadpisz istniejące"** — notatki, które już masz, dostają treść
z pliku niezależnie od dat. Data utworzenia zostaje nietknięta, więc kolejność
i sortowanie po utworzeniu się nie psują.

Dotychczasowe zachowanie zostaje bez zmian: zwykłe „Dołącz" nadal nie rusza
tego, co masz.

**Podpowiedź w podsumowaniu.** Gdy import pominął wszystko i nic nie
zaktualizował, aplikacja mówi wprost, dlaczego i co zrobić — zamiast zostawić
z suchą liczbą „zachowanych bez zmian: 150".

`testy/import-atomowy.js` — pięć nowych asercji: bez nadpisania notatka o tej
samej dacie zostaje, z nadpisaniem treść wchodzi, data utworzenia przetrwa,
a obie rzeczy są dostępne z okna wyboru.

## v1.89 — treść z OneNote układana według stylu aplikacji

Notatki przenosiły się poprawnie, ale wyglądały na porozrzucane: przypadkowe
marginesy, puste akapity, przerwy w środku zdania.

### Skąd to się brało
Dwie przyczyny, obie po stronie tego, jak OneNote zapisuje stronę.

**Każdy blok tekstu to osobny kontener na sztywnych współrzędnych:**

```
<div data-id="…" style="position:absolute;left:48px;top:115px;width:624px">
```

Po usunięciu samych stylów zostawał po nich stos pustych zagnieżdżeń.

**Druga, mniej oczywista:** wcięcia i podziały wierszy z samego pliku OneNote
trafiały do notatki jako tekst. Treść notatki wyświetlana jest z zachowaniem
spacji, więc **każde wcięcie ze źródła widać na ekranie** jako puste miejsce.
To odpowiadało za większość bałaganu.

### Co się zmieniło
Treść nie jest już czyszczona wyrażeniami na napisie, tylko **budowana od nowa**:
strona przechodzi drzewo dokumentu i przepisuje wyłącznie to, co niesie
znaczenie — akapity, wyróżnienia, listy, tabele, obrazy. Kontenery od układu
znikają razem ze współrzędnymi. Dodatkowo:

- puste akapity usuwane
- zbitki przerw sprowadzane do jednej
- wcięcia i podziały wierszy ze źródła usuwane
- sztywne szerokości tabel zdejmowane, żeby mieściły się w kolumnie notatek

Na próbce odpowiadającej rzeczywistej stronie z OneNote: **385 znaków
rozrzuconych po pustych akapitach → 226 znaków czystej treści**, przy zachowanych
pogrubieniach, podświetleniach, liście i tabeli.

**Wybór należy do Ciebie.** Domyślnie treść jest porządkowana; pole
„zachowaj oryginalny układ z OneNote" daje wierne odwzorowanie razem z przerwami.

Przy okazji przepisanie na drzewo dokumentu zamiast wyrażeń na napisie jest
bezpieczniejsze: nie da się go oszukać nietypowym zapisem znacznika.

`testy/onenote-strona.js` — **58 asercji**; jedenaście nowych sprawdza samo
porządkowanie, w tym to, że wersja uporządkowana jest krótsza od wiernej,
a treść i wyróżnienia zostają nietknięte.

## v1.88 — większa dopuszczalna kopia danych

Limit wczytywanej kopii JSON podniesiony z **200 MB do 300 MB** — tyle samo,
ile dla archiwum `.jwlibrary`.

Powód praktyczny: kopia z osadzonymi zdjęciami rośnie szybko, a przeniesienie
notatek z OneNote potrafi dołożyć naraz sto kilkadziesiąt obrazów.

Uwaga, która nie zmienia limitu, ale warto ją znać: plik tej wielkości jest
wczytywany do pamięci w całości i tam przetwarzany. Na komputerze to bez
znaczenia, na starszym telefonie karta może się zamknąć przy pliku bliskim
górnej granicy. Przy tak dużych kopiach lepiej wczytywać je na komputerze,
a między urządzeniami przenosić już po zapisaniu.

## v1.87 — konta z dużą liczbą sekcji

Microsoft odpowiedział wprost, co jest nie tak:

> Przekroczono maksymalną liczbę sekcji dla tego żądania. Aby pobrać strony kont
> z dużą liczbą sekcji, zalecamy jednoczesne pobieranie stron dla jednej sekcji.

Zapytanie o **wszystkie strony naraz** (`~/onenote/pages`) działa tylko na kontach
z niewielką liczbą sekcji. Przy większej liczbie — a taką masz — jest odrzucane
bez względu na to, jak uprościć jego parametry. Poprzednia poprawka próbowała
coraz prostszych wariantów tego samego zapytania, więc nie mogła pomóc.

**Drogą podstawową jest teraz przejście sekcja po sekcji**, dokładnie tak, jak
zaleca Microsoft. Zalety poza samym działaniem:

- nazwy notesu i sekcji przychodzą wprost ze spisu sekcji, bez dodatkowych
  parametrów, na które ten interfejs bywa wybredny
- postęp pokazuje, przy której sekcji jesteś: „Sekcja 3 z 12: Betel"
- **awaria jednej sekcji nie przerywa całości** — reszta przenosi się normalnie

Zapytanie zbiorcze zostaje jako droga zapasowa, gdyby spis sekcji był
niedostępny.

`testy/onenote-strona.js` — **47 asercji**. Nowe odtwarzają dokładnie ten
przypadek: atrapa odrzuca zapytanie zbiorcze tym samym komunikatem co Microsoft,
udaje konto z trzema sekcjami w dwóch notesach i psuje jedną z nich. Test wymaga,
żeby pozostałe notatki przeszły, każda znała swój notes i sekcję, a struktura
odwzorowała się mimo awarii.

## v1.86 — odporność na odrzucone zapytanie (błąd 400)

Po zdobyciu uprawnienia przenoszenie kończyło się komunikatem
„Serwer Microsoftu odpowiedział błędem 400". To nie była wina konta ani
uprawnień — **Microsoft nie przyjął zapytania, które budowała moja strona**.

Interfejs OneNote jest wybredny co do połączeń parametrów zapytania i odrzuca
niektóre z nich zależnie od rodzaju konta. Prosiłem naraz o wybór pól
i o dołączenie nazw notesu oraz sekcji — działa to na części kont, na innych nie.

### Co zmienione
**Zamiast upierać się przy jednym zapisie, strona próbuje po kolei** — od
najbogatszego zapytania do zupełnie prostego, bez żadnych dodatków. Ostatni
wariant zadziała zawsze. Gdy nazwy notesów i sekcji nie przyjdą razem ze
stronami, dobierane są osobnym zapytaniem o spis sekcji, więc podział na sekcje
i zakładki zostaje zachowany.

Rozróżniamy przy tym rodzaj niepowodzenia: **odrzucone zapytanie** (400) każe
spróbować prościej, każdy inny błąd przerywa od razu — bo powtarzanie go nic
nie da, a tylko wydłuża czekanie.

**Komunikat pokazuje teraz, co Microsoft naprawdę odpowiedział.** Sam numer
błędu nie mówi nic; treść z serwera zwykle wskazuje przyczynę wprost.

`testy/onenote-strona.js` — **44 asercje**. Nowe sprawdzają nie tylko obecność
wariantów, ale i działanie: atrapa odrzuca dwa pierwsze zapytania błędem 400
i test wymaga, żeby trzecie się udało, a kolejne próby były coraz prostsze.

## v1.85 — właściwa kolejność kroków w Graph Explorer

Na liście uprawnień nie było `Notes.Read`, więc nie dało się nadać zgody.
Nie brakowało jej — szukaliśmy w złym momencie.

**Lista uprawnień w Graph Explorer dotyczy zapytania wpisanego w pasku adresu.**
Przy `/me` pokazuje wyłącznie `User.Read` i pokrewne. `Notes.Read` pojawia się
tam dopiero wtedy, gdy w pasku stoi adres do notatek. Moja instrukcja kazała
nadać zgodę **przed** wpisaniem adresu — czyli w chwili, gdy tej pozycji
fizycznie nie ma na liście.

Kolejność poprawiona: zaloguj się → wpisz adres notatek → **dopiero teraz**
Modify Permissions → Consent → Run query.

**Drugi trop z tego samego zrzutu:** napis u góry zmienił się z „Tenant: Personal"
na **„Tenant: Sample"**. To znaczy, że sesja Graph Explorera wygasła w trakcie —
łatwo przeoczyć, bo strona wygląda tak samo. Instrukcja mówi teraz, żeby ten napis
sprawdzać, i wyjaśnia, co oznacza.

Doszły też dwa wyjaśnienia w sekcji rozwiązywania problemów: „na liście nie ma
w ogóle Notes.Read" i „u góry widnieje Sample".

`testy/onenote-strona.js` — **37 asercji**; trzy nowe pilnują kolejności kroków,
bo to trzecia poprawka tej samej instrukcji.

## v1.84 — OneNote zgłasza 401 tam, gdzie reszta Graph zgłasza 403

Logowanie się udało (`/me` zwracało 200 OK z danymi konta), a mimo to zapytanie
o notesy dalej kończyło się błędem **401**. Instrukcja odsyłała wtedy do
ponownego logowania — czyli w złą stronę.

**Właściwa przyczyna:** OneNote, inaczej niż reszta Microsoft Graph, zwraca
**401** także wtedy, gdy użytkownik jest zalogowany, ale token nie zawiera
uprawnienia do odczytu notatek. Reszta Graph zwróciłaby w tej sytuacji 403,
więc komunikat prowadzi na manowce.

**Drugi szczegół, istotny przy kontach osobistych** (outlook, hotmail, icloud):
takie konta nie mogą korzystać z uprawnień z końcówką `.All`. Token zostanie
wydany, ale Graph go nie przyjmie. Potrzebne jest dokładnie `Notes.Read`.

### Co zmienione
- nadanie uprawnienia to teraz **osobny, ponumerowany krok** instrukcji, a nie
  wzmianka w rozwiązywaniu problemów: Modify Permissions → `Notes.Read` → Consent
- wyraźne ostrzeżenie, żeby nie brać wariantu `.All`, z podaniem powodu
- wskazanie, że adres wpisuje się w **wąski pasek u góry**, a nie w duże pole
  „Request Body" poniżej — łatwo je pomylić, bo drugie jest znacznie większe
- komunikat błędu w aplikacji wymienia obie przyczyny 401 zamiast zakładać,
  że ciąg wygasł
- osobny komunikat dla 404: „konto nie ma notatek OneNote"

`testy/onenote-strona.js` — **34 asercje**; nowe pilnują, żeby instrukcja
zawierała krok z uprawnieniem, ostrzegała przed `.All` i wskazywała właściwe
pole na adres.

## v1.83 — jaśniejsza instrukcja logowania do OneNote

Pierwsza próba przeniesienia skończyła się czerwonym **„Unauthorized 401"**.
Przyczyna nie leżała w kodzie, tylko w mojej instrukcji.

**Napisałem „Sign in w lewym górnym rogu" — przycisk jest po prawej.**
Poprawione.

**Graph Explorer wysyła zapytanie także wtedy, gdy nikt nie jest zalogowany**,
a napis „Tenant: Personal" u góry widnieje w obu przypadkach. Łatwo więc uznać,
że sesja jest aktywna, choć nie jest. Instrukcja mówi teraz wprost: zanim
skopiujesz ciąg, musisz zobaczyć zielone **200 OK** i listę swoich notesów.

Doszło rozwijane wyjaśnienie **„Widzę czerwone Unauthorized 401"** —
z rozróżnieniem dwóch różnych sytuacji, które łatwo pomylić:

- **401** — brak zalogowania; awatar w prawym górnym rogu, wyloguj i zaloguj ponownie
- **403** — jesteś zalogowany, ale brakuje zgody na odczyt notatek;
  zakładka Modify Permissions → `Notes.Read` → Consent

Te same dwa przypadki rozróżnia teraz komunikat w samej aplikacji: zamiast
suchego „Serwer odpowiedział błędem 401" mówi, co dokładnie zrobić.

`testy/onenote-strona.js` — **31 asercji**; sześć nowych pilnuje, żeby instrukcja
nie rozjechała się znowu z tym, co użytkownik widzi na ekranie.

## v1.82 — prywatność przeniesienia z OneNote, na piśmie i w testach

Pytanie było zasadne: strona dostaje ciąg uprawniający do odczytu **wszystkich**
notatek z OneNote. Warto wiedzieć, co się z nimi dzieje.

**Odpowiedź: nie opuszczają Twojego urządzenia.** Notatki wędrują z serwera
Microsoftu prosto do przeglądarki i lądują jako plik na dysku. Nie przechodzą
przez żaden pośredni serwer.

To nie jest obietnica w opisie, tylko reguła wpisana w nagłówek strony:
`connect-src https://graph.microsoft.com`. Przeglądarka **zablokuje** próbę
połączenia z jakimkolwiek innym adresem, nawet gdyby kod tego chciał.
W całym pliku jest dokładnie jedno miejsce, które cokolwiek pobiera.

### Co doszło
- **Wyjaśnienie na samej stronie** — rozwijana sekcja „Kto zobaczy moje notatki?",
  z podaniem reguły do sprawdzenia, a nie samym zapewnieniem
- **Pole z ciągiem czyszczone** zaraz po zakończeniu przenoszenia; ciąg nigdy nie
  trafiał do pamięci przeglądarki ani ciasteczek i wygasa sam po około godzinie
- **Uczciwe zastrzeżenia**: powstały plik leży na urządzeniu jak każdy inny,
  a strony należy używać pod adresem, który sam opublikowałeś — cudza kopia
  to cudzy kod

### Test
`testy/onenote-strona.js` — **25 asercji**, w tym siedem pilnujących samej
prywatności: że dozwolony jest **wyłącznie** adres Microsoftu, że w kodzie nie ma
żadnego obcego adresu, że pobieranie odbywa się w jednym jedynym miejscu,
że nie ma innych dróg wysyłki danych, i że ciąg nie jest nigdzie zapisywany.

Reszta sprawdza samo przenoszenie: odwzorowanie struktury, zachowane daty,
pogrubienia i podświetlenia, odrzucenie obcego kodu oraz to, że powtórzony import
nie zdubluje notatek.

## v1.81 — poprawki widoczne po imporcie z OneNote

Sprawdzenie, jak przeniesione notatki wyglądają w aplikacji naprawdę — a nie
jak sobie wyobrażałem — wyciągnęło dwie rzeczy.

**Sekcja z samymi zakładkami pokazywała „0".** Licznik przy nagłówku sekcji
liczył wyłącznie etykiety. Po przeniesieniu z OneNote sekcje składają się
z samych zakładek, więc każda wyświetlała zero, mając w środku kilkadziesiąt
notatek. Teraz podaje, ile ma zakładek i ile notatek razem: `2 zakł. · 3`.

**Przyciski na kartach przez chwilę nie miały nazwy dla czytnika ekranu.**
Nadawał je obserwator zmian w treści strony, ale dopiero po oddaniu sterowania.
Przy 150 notatkach naraz ta chwila robi się zauważalna. Nazwy nadawane są teraz
od razu po przerysowaniu listy; obserwator zostaje dla elementów dokładanych
później.

## v1.80 — przeniesienie notatek z OneNote

Nowa strona **`onenote.html`**, publikowana razem z aplikacją. Otwierasz ją
w przeglądarce obok aplikacji i przenosisz wszystkie notatki z OneNote
**naraz** — bez instalowania czegokolwiek, bez terminala, bez eksportowania
strony po stronie.

Trzy kroki: zaloguj się do OneNote w przeglądarce i skopiuj ciąg uprawniający
do odczytu → wklej go na stronie → naciśnij „Przenieś wszystko". Powstaje plik
kopii, który wczytujesz w aplikacji przez „Dołącz + układ".

**Odwzorowanie struktury** — porządek z OneNote przenosi się jeden do jednego,
zamiast wysypywać się jako sto pięćdziesiąt luźnych notatek:

| OneNote | JW Study |
|---|---|
| notes | sekcja |
| sekcja | zakładka w sekcji |
| strona | notatka w zakładce |

Przycisk **„Pokaż, co mam w OneNote"** wypisuje najpierw drzewo wszystkich
notesów z liczbą notatek — widać, co powstanie, zanim cokolwiek się pobierze.

**Co przenosi:** daty utworzenia i zmiany każdej strony, pogrubienia, kursywę,
podkreślenia, listy, tabele, obrazy (osadzone w notatce) oraz **podświetlenia** —
OneNote trzyma je jako styl fragmentu tekstu, więc są zamieniane na najbliższy
z siedmiu kolorów podświetlania JW Study.

**Czego nie przeniesie:** rysunków odręcznych, plików osadzonych w stronie,
tagów OneNote ani podstron jako podstron (trafią na ten sam poziom).

Strona ma własną politykę bezpieczeństwa treści i czyści pobrany kod, zanim
zapisze plik: skrypty, ramki, obiekty i odnośniki wykonujące kod odpadają
razem z zawartością. Aplikacja przepuszcza to potem przez swój filtr po raz
drugi. Sprawdzone: żaden ładunek nie przechodzi, formatowanie zostaje.

W repozytorium są też skrypty dla wiersza poleceń — `narzedzia/onenote/` —
w tym droga przez eksport do Worda, gdy wolisz nie logować się do niczego.

### Przy okazji: wybór pliku na Androidzie i Windowsie
Okno wyboru pliku ograniczało rozszerzenia do `.jwlibrary` i `.json`. Android
i część systemów Windows nie zna rozszerzenia `.jwlibrary` — przy takim
ograniczeniu **po prostu ukrywa plik**, a użytkownik widzi pusty wybór i nie wie
dlaczego. Ograniczenie zdjęte; zawartość i tak sprawdzamy po otwarciu (archiwum,
obecność `userData.db`, nagłówek bazy SQLite).

## v1.79 — zakładki sekcji: ikona i kolory

### Ten „niepełny kwadrat"
Ikonę zakładki rysowałem **krawędziami samego elementu**: ramka z pominiętą
dolną krawędzią miała sugerować kształt zakładki. W praktyce wyglądało to jak
niedokończony prostokąt — bo nim było.

Teraz to zwykły, zamknięty kształt zakładki narysowany w SVG, tej samej rodziny
co pozostałe ikony w aplikacji.

### Kolory zakładek
W menu ⋯ przy zakładce doszła paleta — ta sama, co przy etykietach. Kolor niesie
**ikona i lewa krawędź wiersza**, a tło zostaje jasne, żeby napis pozostał
czytelny przy każdym odcieniu. Dopiero wybrana zakładka wypełnia się kolorem
w całości.

Kolor wchodzi do kopii zapasowej i — jak wszystkie kolory w aplikacji — jest
sprawdzany wzorcem przy wczytywaniu cudzego pliku.

`testy/sekcje.js` urósł do **34 asercji**; nowe pilnują, żeby ikona nigdy nie
wróciła do rysowania krawędziami, a kolor dał się nadać, zobaczyć i zdjąć.

## v1.78 — Windows i Android

Przegląd pod kątem systemów innych niż Apple. Trzy rzeczy sprawdzone, jedna
naprawiona.

### Czcionki — naprawione
Lista 26 krojów opierała się na tym, co jest wbudowane w iOS i macOS: Iowan Old
Style, Optima, Avenir Next, Hoefler Text, American Typewriter. **Na Windowsie
i Androidzie większości z nich po prostu nie ma.** Wybór działał, ale system po
cichu podstawiał coś innego — użytkownik wybierał Optimę, dostawał Segoe UI
i nie wiedział, dlaczego notatka wygląda inaczej niż na drugim urządzeniu.

Aplikacja sprawdza teraz, czy krój faktycznie jest w systemie (porównaniem
szerokości tekstu z krojem zapasowym). Brakujące zostają na liście — wybór
zrobiony na innym urządzeniu trzeba uszanować — ale są oznaczone dopiskiem
**„(zastępcza)"**. Widać więc od razu, że tutaj zobaczysz coś innego.
Pomiar wykonuje się raz na krój i jest zapamiętywany.

### Co działa tak samo wszędzie
- **import z JW Library** — pole wyboru pliku nie ogranicza rozszerzeń, więc
  `.jwlibrary` da się wskazać także na Androidzie i Windowsie
- **praca offline, instalacja na ekranie początkowym** — na Androidzie
  (Chrome) i Windowsie (Chrome, Edge) pełne wsparcie, bez ograniczeń
  charakterystycznych dla iOS
- klawiatura ekranowa, przeciąganie palcem, kolumny, czytnik

### Co zależy od przeglądarki, nie od systemu
**Nadpisywanie jednego pliku kopii** wymaga uprawnienia do zapisu we wskazanym
pliku. Mają je Chrome, Edge, Brave i Arc **na komputerze** — czyli także na
Windowsie. Nie ma go Chrome na Androidzie ani Safari. Tam kopia pobiera się
jak dotąd, jako nowy plik. Aplikacja sama rozpoznaje, co potrafi przeglądarka,
i pokazuje przycisk tylko tam, gdzie ma to sens.

### Przy okazji
Środowisko testowe nie ma rysowania na płótnie i zgłaszało to jako błąd przy
każdym mierzonym kroju. Sprawdzenie odbywa się teraz raz, a harness pomija ten
konkretny komunikat — z podanym powodem, żeby nie zamiatać niczego innego.

## v1.77 — import z JW Library znów działa

### Co się stało
Wersja 1.71 zablokowała pobieranie bibliotek do odczytania pliku `.jwlibrary`,
dopóki nie ma ich w katalogu `lib/` albo nie wpisano sumy kontrolnej. Sum nie
mogłem policzyć — środowisko, w którym pracuję, nie ma dostępu do sieci, a
zmyślone hasze zablokowałyby import na głucho.

Skutek: na urządzeniach bez katalogu `lib/` import przestał działać w ogóle,
z komunikatem „Brak biblioteki JSZip". Zabezpieczenie zamieniło się w ścianę.

### Jak jest teraz
Zamiast blokady — **świadomy wybór, raz**:

> Plik .jwlibrary to archiwum z bazą w środku. Do jego otwarcia potrzebne są
> dwie biblioteki, których nie ma w aplikacji. Można je pobrać z cdnjs — to duży,
> powszechnie używany serwer, ale **obcy**. Pobrany kod działa z dostępem do
> Twoich notatek, dlatego pytam, zamiast robić to po cichu.

Zgoda jest zapamiętywana i można ją cofnąć w **Ustawieniach → Import z JW Library**.
Tam też widać, skąd aplikacja bierze biblioteki.

Pierwotny zamysł zostaje w mocy: obcy kod nie wykonuje się bez wiedzy
użytkownika. Zmieniło się tylko to, że pytanie zastąpiło ścianę.

**Bezpieczniejsza droga nadal jest zalecana**: trzy polecenia z `lib/README.md`
wgrywają biblioteki obok aplikacji. Wtedy import działa bez internetu i bez
zaufania komukolwiek, a pytanie w ogóle nie pada.

### Przy okazji — migotliwe testy
Trzy najstarsze zestawy czekały na wczytanie aplikacji **sztywne 2,6 sekundy**.
Plik urósł do 524 kB i ten czas przestał wystarczać: te same testy raz
przechodziły, raz nie, zależnie od obciążenia. Migotliwy test jest gorszy niż
jego brak, bo uczy ignorowania czerwonego wyniku. Wszystkie zestawy czekają
teraz na faktyczne wczytanie ostatniego modułu, nie na zegarek.

## v1.76 — sortowanie po utworzeniu i zakładki w sekcjach

### Sortowanie po dacie utworzenia — było, ale wyglądało na zepsute
Opcje „Ostatnio utworzone" i „Najdawniej utworzone" istniały w liście sortowania
od dawna i **działały poprawnie**. Problem był gdzie indziej: karta notatki
pokazywała zawsze datę ostatniej **zmiany**. Po włączeniu sortowania według
utworzenia widoczne daty wyglądały więc na przypadkowe — i słusznie, bo nie były
tymi, według których lista się układała.

Karta pokazuje teraz tę datę, według której aktualnie sortujesz, z dopiskiem
„utw.", a w podpowiedzi obie daty naraz.

### Zakładki wewnątrz sekcji
Sekcja grupowała dotąd wyłącznie etykiety. Doszedł poziom niżej: **zakładka** —
nazwane miejsce w sekcji, do którego wrzucasz notatki **albo** etykiety, jak
wolisz. Przykład: sekcja „Kongres 2026", a w niej „Wykłady",
„Punkty do przemyślenia", „Materiały".

- tworzysz przez ⋯ przy nazwie sekcji → **Nowa zakładka w tej sekcji**
- notatkę wrzucasz z jej menu → **Zakładka w sekcji…**
- etykietę przypisujesz z jej menu ⋯ albo przeciągając ją na zakładkę
- zakładka pokazuje notatki wrzucone wprost **oraz** wszystkie noszące
  którąkolwiek z jej etykiet — nie trzeba wybierać jednego sposobu na starcie
- kliknięcie zakładki filtruje listę, drugie kliknięcie zdejmuje filtr
- zmiana nazwy, kolejność (także przeciąganiem) i usunięcie przez ⋯ przy zakładce
- **usunięcie zakładki nie kasuje niczego** — notatki i etykiety wracają do sekcji

Zakładki sekcji wchodzą do kopii zapasowej, więc podział przenosi się na drugie
urządzenie. Przy dołączaniu kopii dokładane są tylko te, których jeszcze nie ma.

### Przy okazji
Trzy zestawy testów wskazywały ścieżkę **poza repozytorium** (`/tmp/t137/…`) —
pozostałość po środowisku, w którym powstawały. Po przeniesieniu do repozytorium
przestawały działać, choć wyglądały na obecne. Teraz biblioteka jsdom jest
szukana po kolei w kilku miejscach, a domyślną ścieżką pliku jest `./index.html`.
Wyszło to, bo `uruchom.sh` uruchamia komplet, a nie pojedyncze zestawy.

`testy/sekcje.js` — **27 asercji**: sortowanie po utworzeniu odróżnione od
sortowania po zmianie (daty celowo w odwrotnej kolejności, żeby błąd było widać),
data na karcie, tworzenie i kolejność zakładek, notatki i etykiety w zakładce,
filtrowanie, oraz to, że usunięcie zakładki niczego nie kasuje.

Do tego zabezpieczenie w `uruchom.sh`: gdy port jest zajęty przez inny serwer,
skrypt **staje i mówi o tym**, zamiast badać cudzy katalog. Wyszło to na jaw,
gdy zestawy nagle „przestały przechodzić" — a badały pliki z zupełnie innego
miejsca. Fałszywy alarm w narzędziu jest gorszy niż jego brak, bo każe szukać
usterki tam, gdzie jej nie ma.

Komplet: **392 asercje w czternastu zestawach**.

## v1.75 — dostępność i testy scenariuszowe

**Moduły ES — świadomie odłożone.** Aplikacja jedzie jako jeden plik, a zysk
z modułów ES jest głównie narzędziowy. Migracja 29 plików dzieliłaby dziś jedną
przestrzeń nazw na ponad 400 jawnych powiązań i unieważniła wszystkie asercje
naraz — bez przeglądarki do weryfikacji to zbyt duże ryzyko wobec zysku.
`esbuild` jest już sprawdzony i gotowy, gdyby wrócić do tematu.

**Prawdziwe E2E nie było możliwe i nie udaję, że jest.** Playwright i Puppeteer
potrzebują binariów przeglądarki, których środowisko nie wpuszcza. Zamiast
nazwać E2E czegoś, co nim nie jest, powstały **testy scenariuszowe**: całe
ścieżki użytkownika w jsdom, od kliknięcia po zapis i ponowne odczytanie.
Łapią usterki na styku modułów — tam, gdzie każdy krok osobno działa,
a razem już nie.

### Dostępność — co było nie tak
Badanie silnikiem axe-core (tym samym, którego używają narzędzia przeglądarkowe)
w sześciu stanach aplikacji pokazało:

- **45 przycisków bez nazwy dla czytnika ekranu.** Miały podpowiedź w atrybucie
  `title`, ale czytniki traktują ją niepewnie — część pomija zupełnie.
- **Wyszukiwarka i wybór sortowania** opierały się wyłącznie na `title`.
- **Dziewięć z dziesięciu okien** nie miało roli „dialog". Dla czytnika ekranu
  okno bez tej roli to zwykły kawałek strony: nie zapowiada się, nie odcina tła,
  a klawiszem Tab dawało się wyjść poza nie i klikać w niewidoczne przyciski.
- **Rozwijane menu** nie miały ról pozycji.
- **Kompozycja „Piasek"** dawała pasek górny o kontraście poniżej progu WCAG.
- **Brak reguły `prefers-reduced-motion`** — system pozwala poprosić o mniej
  animacji, bywa to ustawienie zdrowotne, nie estetyczne.

### Co zrobiono
- nazwy dla czytnika nadawane automatycznie z podpowiedzi, także przyciskom
  dokładanym później (menu, paski narzędzi, karty)
- wszystkie okna z rolą „dialog", powiązane z własnym nagłówkiem, ukrywane
  dla czytnika po zamknięciu
- **ognisko** przenoszone do okna przy otwarciu i oddawane tam, skąd okno
  otwarto; klawisz Tab nie wyprowadza poza otwarte okno
- role pozycji, podpisów i separatorów w rozwijanych menu
- kolor paska górnego przyciemniany **stopniowo, aż napis przekroczy próg
  czytelności** — zamiast jednej zgadywanej wartości
- pełne poszanowanie ustawienia „ogranicz ruch"

### Testy
- `testy/dostepnosc.js` — **33 asercje**: axe-core w sześciu stanach, nazwy dla
  czytnika, role i ognisko w oknach, obsługa z klawiatury, oraz kontrast liczony
  dla **każdego** koloru z palety aplikacji. Reguły wyłączone mają podany powód —
  wyłączanie bez powodu to oszukiwanie siebie.
- `testy/scenariusze.js` — **30 asercji** w ośmiu ścieżkach: nowa notatka od zera,
  formatowanie i zapis, etykieta i filtr, wyszukiwanie (też bez polskich znaków),
  kopia i powrót, kosz, czytnik, ustawienia. Każda ścieżka sprawdza również,
  co **naprawdę trafiło do bazy**, a nie tylko co widać na ekranie.

Komplet: **365 asercji w trzynastu zestawach**.

## v1.74 — porządek w wersjonowaniu, dokumentacji i wydawaniu

**Numer wersji miał dwa miejsca i potrafił się rozjechać.** Żył w `index.html`
(napis obok nazwy) oraz w `sw.js` (nazwa pamięci podręcznej). To drugie decyduje,
czy przeglądarka pobierze pliki od nowa — rozjazd oznaczał, że użytkownik wgrywa
nową wersję, a widzi starą. Zdarzyło się to naprawdę.

Teraz numer jest w jednym pliku `WERSJA`, a `narzedzia/wersja.js` rozprowadza go
i sprawdza zgodność. Analiza statyczna pilnuje tego przy każdym uruchomieniu.

**Narzędzia mieszkały poza repozytorium.** Skrypt budujący wersję jednoplikową
istniał tylko w katalogu tymczasowym i przepadał razem ze środowiskiem — dokładnie
jak wcześniej testy. Jest teraz w `narzedzia/buduj.js`.

**Wydanie było dziewięcioma krokami z pamięci.** `narzedzia/wydaj.sh` robi je po
kolei i zatrzymuje się przy pierwszym niepowodzeniu, więc nie powstanie paczka
z wersją, która nie przeszła testów. Wymaga też wpisu w tym dzienniku — bez opisu
zmiany wydanie się nie odbędzie.

**Dwa pliki `index.html` o tym samym numerze.** Pomyłka między wersją roboczą
(24 kB, szuka katalogów `js/` i `css/`) a wersją do publikacji (500 kB, wszystko
w środku) kosztowała pół dnia szukania. Skrypt budujący zostawia teraz plik
ostrzegawczy w katalogu roboczym i potwierdzający w katalogu do publikacji,
oba z rzeczywistymi rozmiarami.

**Dokumentacja.** Dwanaście plików `RAPORT-*`, `ZMIANY-*` i `POPRAWKA-*` leżało
w katalogu głównym. Przeniesione do `docs/archiwum/`, a bieżący opis zmian
zebrany tutaj. `docs/WYDANIE.md` opisuje proces wydawniczy.

## v1.73 — kompozycje obejmują cały interfejs
Pasek górny zostawał butelkowo-zielony niezależnie od wybranej kompozycji, bo brał
kolor ze zmiennej `--accent`, której kompozycja nie ruszała. Teraz idzie za nią —
razem z przyciskiem „Nowa notatka", podświetleniami i zakładkami na telefonie.
Kolumna Publikacje nie była kolorowana w ogóle (doszła później niż mechanizm
kompozycji). Kolory kolumn zniknęły z okna ustawień — były tam i pod ikoną palety.

## v1.72 — testy wróciły do repozytorium
Zestawy testów żyły w katalogu tymczasowym i przepadały między sesjami; README
opisywało kontrolę jakości, której w repozytorium nie było. 243 asercje
w dziewięciu zestawach plus analiza statyczna, jedno polecenie `./testy/uruchom.sh`.

## v1.71 — limity importu i koniec z niesprawdzonym kodem z sieci
Każdy wskazany plik był wczytywany w całości bez pytania o rozmiar; archiwum
mogło rozpakować się do rozmiaru tysiące razy większego. Biblioteki JSZip i sql.js
pobierały się z cdnjs bez żadnego sprawdzenia — podmieniony plik wykonałby się
z dostępem do wszystkich notatek. Teraz szukane najpierw w `lib/`, a z sieci
wyłącznie z sumą kontrolną. Dołożona polityka bezpieczeństwa treści.

## v1.70 — „Zastąp wszystko" nie może zostawić pustki
Czyszczenie bazy i zapis nowych danych były osobnymi transakcjami. Gdy drugi krok
padł, zostawała pusta baza: stare notatki skasowane, nowych nie ma. Teraz jedna
transakcja, ekran podmieniany dopiero po potwierdzonym zapisie, zapis sprawdzany
odczytem.

## v1.69 — luka przy wczytywaniu kopii
Pole `h` notatki to gotowy HTML wstawiany przez `innerHTML`, ale droga wczytywania
kopii JSON pomijała filtr treści. Podłożony plik wykonywał obcy kod. Druga dziura:
kolor etykiety trafiał wprost do atrybutu stylu.

## v1.68 — okno powitalne znikało po sekundzie
Nie znikało — przeładowywała się cała strona. Przeładowanie po podmianie wersji
padało też przy pierwszym uruchomieniu, gdy obsługa offline dopiero przejmuje
stronę i niczego nie zastępuje.

## v1.67 — tytuł nie walczy z paskiem narzędzi
W pełnym ekranie do górnej krawędzi przyklejały się dwie rzeczy naraz.
W trybie edycji przykleja się teraz wyłącznie pasek narzędzi.

## v1.66 — kopia nadpisuje jeden plik
Codzienna kopia zostawiała na dysku kolejny plik. Przeglądarka nie może nadpisać
pobranego pliku, ale może dostać wskazanie konkretnego i pisać do niego dalej.

## v1.65 — publikacja na GitHub Pages
Cztery znaki `{{` w komentarzach kodu. Jekyll traktuje je jako polecenie
i przerywał budowanie strony po piętnastu minutach.

## v1.64 — GitHub pokazywał starą wersję
Trzy niezależne przyczyny, każda wystarczyłaby sama: plik obsługi offline brany
z pamięci przeglądarki, „świeże" pobranie w tle dostające stary plik, oraz strona
brana najpierw z zapisanej kopii.

## v1.63 – v1.27
Wcześniejsze wydania opisane w `docs/archiwum/`.
