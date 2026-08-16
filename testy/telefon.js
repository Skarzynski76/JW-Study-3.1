/* ==========================================================================
   TELEFON: PWA Z EKRANU GŁÓWNEGO

   Zgłoszenie: „większość działa, ale niektóre rzeczy nie" — m.in. wgranie
   notatek przeniesionych z OneNote. Aplikacja uruchomiona z ikony na ekranie
   głównym działa w trybie samodzielnym, a tam iOS NIE POBIERA plików:
   kliknięcie w <a download> nie robi zupełnie nic i nie zgłasza błędu.
   Nasz kod kończył właśnie na tym i meldował sukces — użytkownik dotykał
   „Zapisz", nie działo się nic i wyglądało to na zepsutą aplikację.

   Zestaw pilnuje, żeby: (1) zapis nigdy nie udawał sukcesu, (2) istniała droga
   wczytania kopii bez wybierania pliku, (3) błędy były widoczne bez konsoli.
   ========================================================================== */
const {T, TA, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const ze = zrodlo("js","19-export-doc.js");
  const zf = zrodlo("js","17-files.js");
  const zd = zrodlo("js","37-diagnostyka.js");

  console.log("═══ ZAPIS PLIKU NIE MOŻE UDAWAĆ SUKCESU ═══");
  T("aplikacja rozpoznaje tryb z ekranu głównego", ()=>
     typeof w.trybSamodzielny==="function" &&
     /navigator\.standalone/.test(ze) && /display-mode: standalone/.test(ze));
  await TA("w trybie samodzielnym bez okna udostępniania zapis zgłasza porażkę", async ()=>{
     w.eval('navigator.__standalone_test=true;');
     Object.defineProperty(w.navigator, "standalone", {value:true, configurable:true});
     Object.defineProperty(w.navigator, "userAgent",
       {value:"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", configurable:true});
     delete w.navigator.canShare;
     let opis = "";
     w.showInfo = (t, h)=>{ opis = t + " " + h; return Promise.resolve(); };
     const wynik = await w.saveFile(new w.Blob(["x"],{type:"text/plain"}), "a.json", "test");
     return (wynik===false && /nie może pobierać plików/.test(opis))
            || `wynik ${wynik}, komunikat: ${opis.slice(0,80)}`; });
  T("komunikat mówi, co zrobić zamiast tego", ()=>/otwórz aplikację w Safari/i.test(ze));
  T("rezygnacja z udostępniania nie jest błędem ani sukcesem", ()=>
     /if\(err && err\.name==="AbortError"\) return false;/.test(ze));
  T("wysyłanie notatki nie melduje zapisu, gdy nic nie wyszło", ()=>
     /if\(wyszlo\) toastOk\("Zapisano: "\+plik\)/.test(zrodlo("js","33-udostepnianie.js")));

  console.log("═══ WCZYTANIE KOPII BEZ WYBIERANIA PLIKU ═══");
  /* Na telefonie plik bywa nieosiągalny, a przeniesienie z OneNote i tak kończy
     się tekstem, który łatwiej wkleić niż zapisać i odszukać. */
  T("jest przycisk wklejenia treści", ()=>!!d.getElementById("mfWklej"));
  T("jest wspólna droga wczytania z tekstu", ()=>typeof w.wczytajKopieZTekstu==="function");
  T("wklejenie przechodzi przez to samo sprawdzanie co plik", ()=>
     /wczytajKopieZTekstu\(tekst\)/.test(zf) && /sanitizeNotes\(data\.notes/.test(zrodlo("js","20-backup.js")));
  await TA("pusta treść nie psuje aplikacji", async ()=>{
     let kom = ""; w.toastErr = (m)=>{ kom = m; };
     await w.wczytajKopieZTekstu("   ");
     return /Nie wczytano kopii/.test(kom) || "komunikat: "+kom; });
  await TA("treść, która nie jest kopią, jest odrzucana z wyjaśnieniem", async ()=>{
     let kom = ""; w.toastErr = (m)=>{ kom = m; };
     await w.wczytajKopieZTekstu('{"cos":"innego"}');
     return /brakuje listy notatek/.test(kom) || "komunikat: "+kom; });
  T("dla .jwlibrary wklejanie jest wyłączone z wyjaśnieniem", ()=>
     /Kopii z JW Library nie da się wkleić/.test(zf));

  console.log("═══ BŁĘDY SĄ WIDOCZNE BEZ KONSOLI ═══");
  T("aplikacja łapie błędy wykonania", ()=>/addEventListener\("error"/.test(zd));
  T("i odrzucone obietnice", ()=>/addEventListener\("unhandledrejection"/.test(zd));
  T("pasek błędu pojawia się na ekranie", ()=>{
     w.zapiszBlad("testowy błąd", "plik.js:1");
     const p = d.getElementById("pasekBledu");
     return !!p && p.style.display==="flex" && /testowy błąd/.test(p.textContent); });
  T("da się go zamknąć", ()=>{
     d.querySelector("#pasekBledu .pbZam").click();
     return d.getElementById("pasekBledu").style.display==="none"; });
  T("raport zawiera wersję i tryb uruchomienia", ()=>{
     const r = w.diagRaport();
     return /testowy błąd/.test(r) && /(ekranu głównego|przeglądarka)/.test(r) || "raport: "+r.slice(0,120); });
  T("dziennik trzyma najwyżej dwadzieścia wpisów", ()=>{
     for(let i=0;i<30;i++) w.zapiszBlad("błąd "+i, "x");
     return JSON.parse(w.localStorage.getItem("jwsBledy")).length===20; });
  T("da się wyczyścić — razem ze śladami", ()=>{
     w.diagWyczysc();
     return w.diagRaport()==="Brak zapisanych błędów."
            || "zostało: "+w.diagRaport().slice(0,80); });
  T("dostępne z ustawień", ()=>/id="stBledy"/.test(zrodlo("js","26-settings.js")));

  console.log("═══ GOŁY KOMUNIKAT BŁĘDU MA COŚ MÓWIĆ ═══");
  /* Przeglądarka podaje gołe „Script error." bez pliku i wiersza, gdy nie chce
     zdradzić szczegółów. Sam komunikat nie mówi nic — dlatego zapisujemy kilkanaście
     ostatnich kroków użytkownika i stos błędu, jeśli tylko jest dostępny. */
  T("zapisujemy ślady ostatnich działań", ()=>/const _slady = \[\]/.test(zd) && /function slad\(co\)/.test(zd));
  T("nie więcej niż kilkanaście kroków", ()=>{
     for(let i=0;i<30;i++) w.slad("krok "+i);
     w.zapiszBlad("Script error.", "");
     const l = JSON.parse(w.localStorage.getItem("jwsBledy"));
     const ost = l[l.length-1];
     return ost.slady.length===14 || "kroków: "+(ost.slady && ost.slady.length); });
  T("ślady trafiają do raportu", ()=>/ostatnie kroki/.test(w.diagRaport()));
  T("dotknięcia są zapisywane same z siebie", ()=>
     /addEventListener\("click"[\s\S]{0,200}slad\("dotknięcie: "/.test(zd));
  T("w śladach nie ma treści notatek", ()=>{
     /* Dziennik błędów bywa wklejany w zgłoszeniu — nie ma prawa nieść tego,
        co użytkownik napisał. */
     const f = (zd.match(/slad\("dotknięcie: "[^;]*;/)||[""])[0];
     return !/textContent|innerText|\.value/.test(f) || "w śladzie jest treść: "+f; });
  T("stos błędu dołączany, gdy jest dostępny", ()=>
     /e\.error && e\.error\.stack/.test(zd));
  T("zmiana widoku i obrót ekranu też zostawiają ślad", ()=>
     /widok listy: /.test(zd) && /obrót ekranu/.test(zd));

  console.log("═══ BRAK SIECI TO NIE USTERKA APLIKACJI ═══");
  /* Przy braku połączenia przeglądarka zgłasza do okna „Script … load failed" —
     najczęściej przy próbie odświeżenia obsługi offline. Czerwony pasek z takim
     komunikatem straszy użytkownika czymś, na co nikt nie ma wpływu i co samo
     mija po powrocie sieci. */
  const pasek = ()=>{ const p = d.getElementById("pasekBledu"); return p && p.style.display==="flex"; };
  const bezSieci = (v)=>{ try{ Object.defineProperty(w.navigator, "onLine", {value:v, configurable:true}); }catch(e){} };
  T("offline: nieudane wczytanie sw.js nie zapala alarmu", ()=>{
     w.diagWyczysc(); bezSieci(false);
     w.dispatchEvent(Object.assign(new w.Event("error"), {}));
     const e = new w.ErrorEvent("error", {message:"Script https://przyklad/sw.js load failed"});
     w.dispatchEvent(e);
     return !pasek() || "pokazano alarm przy braku sieci"; });
  T("ale ślad zostaje, żeby było widać przy zgłoszeniu", ()=>
     /brak sieci/.test(w.diagRaport()) || "w raporcie: "+w.diagRaport().slice(0,120));
  T("offline: odrzucona obietnica sieciowa też jest cicha", ()=>{
     w.diagWyczysc();
     w.dispatchEvent(new w.ErrorEvent("error", {message:"Failed to fetch"}));
     return !pasek(); });
  T("sw.js jest cichy nawet przy działającej sieci", ()=>{
     /* Rejestracja obsługi offline potrafi zawieść z powodów przejściowych.
        To nie jest coś, z czym użytkownik może cokolwiek zrobić. */
     w.diagWyczysc(); bezSieci(true);
     w.dispatchEvent(new w.ErrorEvent("error", {message:"Script /sw.js load failed"}));
     return !pasek(); });
  T("ale zwykły błąd aplikacji NADAL zapala alarm", ()=>{
     /* Wyciszanie nie może się rozlać na prawdziwe usterki — inaczej dziennik
        przestałby być do czegokolwiek przydatny. */
     w.diagWyczysc(); bezSieci(true);
     w.dispatchEvent(new w.ErrorEvent("error", {message:"TypeError: coś jest undefined"}));
     return pasek() || "prawdziwy błąd został wyciszony"; });
  T("i błąd sieci przy DZIAŁAJĄCEJ sieci też jest pokazywany", ()=>{
     w.diagWyczysc(); bezSieci(true);
     w.dispatchEvent(new w.ErrorEvent("error", {message:"Failed to fetch obrazek.png"}));
     return pasek() || "wyciszono błąd, choć sieć działa"; });
  T("bez sieci nie próbujemy rejestrować obsługi offline na pusto", ()=>
     /if\(navigator\.onLine === false\)\{/.test(zrodlo("js","03-boot.js"))
     && /addEventListener\("online", \(\)=>zarejestrujSW\(\), \{once:true\}\)/.test(zrodlo("js","03-boot.js")));
  T("ani sprawdzać nowej wersji", ()=>
     /const sprawdz = \(\)=>\{ if\(navigator\.onLine === false\) return;/.test(zrodlo("js","03-boot.js")));
  T("po powrocie sieci próbujemy ponownie", ()=>
     (zrodlo("js","03-boot.js").match(/addEventListener\("online"/g)||[]).length >= 2);

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
