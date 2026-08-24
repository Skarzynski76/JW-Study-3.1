/* ==========================================================================
   AKTUALIZACJA I PRACA OFFLINE — dlaczego po wgraniu na GitHub widać nową wersję.
   ========================================================================== */
const {T, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const sw   = zrodlo("sw.js");
  const boot = zrodlo("js","03-boot.js");
  const css  = zrodlo("css","11-polish.css").replace(/\s+/g," ");

  console.log("═══ POBIERANIE Z POMINIĘCIEM PAMIĘCI PRZEGLĄDARKI ═══");
  /* GitHub Pages pozwala trzymać pliki ~10 minut. Bez tego „świeże" pobranie
     w tle dostawało stary plik i zapisywało go z powrotem jako nowy. */
  T("pobieranie odświeżające omija pamięć przeglądarki", ()=>/cache: 'no-store'/.test(sw));
  T("pierwszy zapis do pamięci też omija", ()=>/CORE\.map\(\(a\) => pobierzSwieze\(a\)/.test(sw));
  T("odświeżanie modułów w tle też omija", ()=>/const fromNet = pobierzSwieze\(req\)/.test(sw));
  T("nie został zwykły fetch przy odświeżaniu", ()=>!/const fromNet = fetch\(/.test(sw));

  console.log("═══ DOKUMENT: NAJPIERW SIEĆ ═══");
  T("strona brana najpierw z sieci", ()=>/najpierw sieć/.test(sw));
  T("limit czasu, żeby offline nie czekało", ()=>/3500\)/.test(sw));
  T("bez sieci wraca zapisana kopia", ()=>/caches\.match\('\.\/index\.html'\)\.then\(\(c\) => c \|\| fetch\(req\)\)/.test(sw));

  console.log("═══ WYKRYWANIE NOWEJ WERSJI ═══");
  T("plik obsługi offline nie z pamięci przeglądarki", ()=>/updateViaCache: "none"/.test(boot));
  T("rejestracja naprawdę przekazuje tę opcję", ()=>{
     w.zarejestrujSW();
     const o=w.navigator.serviceWorker._opcje;
     return (!!o && o.updateViaCache==="none") || "przekazano: "+JSON.stringify(o); });
  T("sprawdzanie po powrocie do aplikacji", ()=>/visibilitychange[\s\S]{0,80}sprawdz\(\)/.test(boot));
  T("nasłuch na nową wersję", ()=>/addEventListener\("updatefound"/.test(boot));
  T("pasek z propozycją odświeżenia", ()=>/function pokazNowaWersje/.test(boot) && /Jest nowsza wersja aplikacji/.test(boot));
  T("pasek ma styl", ()=>/#nowaWersja\{ position:fixed/.test(css));
  T("obsługa offline reaguje na polecenie podmiany", ()=>/SKIP_WAITING'\) self\.skipWaiting\(\)/.test(sw));

  console.log("═══ PIERWSZE URUCHOMIENIE BEZ PRZEŁADOWANIA ═══");
  /* Historia: na pierwszym starcie obsługa offline przejmuje stronę i padało
     to samo zdarzenie co przy podmianie — aplikacja przeładowywała się po sekundzie
     i zdmuchiwała okno powitalne. */
  T("stan sprawdzany przed nasłuchem", ()=>/const bylaObsluga = !!navigator\.serviceWorker\.controller/.test(boot));
  T("pierwsze przejęcie nie przeładowuje", ()=>w.przejeloObsluge(false)===false);
  T("podmiana wersji nadal przeładowuje", ()=>/_przeladowano = true;\s*location\.reload\(\)/.test(boot));
  T("znacznik powitania po zamknięciu, nie po otwarciu", ()=>
     /obserwuj\.disconnect\(\)/.test(boot) && !/openModal\("modalHelp"\),400\); lsSet/.test(boot));
  T("otwarcie powitania nie stawia znacznika", ()=>{
     w.localStorage.removeItem("jwsOnboarded");
     w.openModal("modalHelp");
     return w.localStorage.getItem("jwsOnboarded")===null; });

  console.log("═══ AWARYJNE ODŚWIEŻENIE ═══");
  T("jest pełne odświeżenie", ()=>typeof w.wymusAktualizacje==="function");
  T("kasuje pamięć i wyrejestrowuje obsługę", ()=>/caches\.delete\(k\)/.test(boot) && /r\.unregister\(\)/.test(boot));
  T("przycisk w ustawieniach", ()=>{ w.openSettings(); return !!d.querySelector('#setBody [data-act="odswiez"]'); });
  T("ustawienia pokazują numer wersji", ()=>{
     const v=d.getElementById("stWersja");
     return (v && /v\d+\.\d+/.test(v.textContent)) || "pokazano: "+(v&&v.textContent); });
  T("opis uspokaja co do notatek", ()=>/zostają nietknięte/.test(d.getElementById("setBody").innerHTML));

  console.log("═══ PUBLIKACJA NA GITHUB PAGES ═══");
  T("brak ciągów psujących budowanie strony", ()=>{
     const caly=zrodlo("index.html");
     return caly.indexOf("{{")<0 && caly.indexOf("{%")<0; });

  T("brak błędów wykonania", ()=>errors.length===0 || errors.join(" "));
});
