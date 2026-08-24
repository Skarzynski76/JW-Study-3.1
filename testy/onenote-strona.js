/* ==========================================================================
   STRONA PRZENIESIENIA Z ONENOTE — prywatność i poprawność.

   Ta strona dostaje ciąg uprawniający do odczytu WSZYSTKICH notatek
   użytkownika. Asercje pilnują, żeby nie mogła ich nigdzie wysłać —
   nie na zasadzie obietnicy w opisie, tylko sprawdzalnej reguły w kodzie.
   ========================================================================== */
const fs=require("fs"), path=require("path");
const {wyjdz}=require("./wspolne-testy.js");
const {JSDOM, VirtualConsole} = (()=>{
  for(const k of [path.join(__dirname,"..","node_modules","jsdom"), "jsdom", "/tmp/node_modules/jsdom"]){
    try{ return require(k); }catch(e){}
  }
  throw new Error("Brak jsdom");
})();

const plikStrony = path.join(__dirname, "..", "onenote.html");
let zdane=0, niezdane=0; const bledy=[];
const T=(o,fn)=>{ try{ const w=fn(); if(w===true) zdane++; else { niezdane++; bledy.push(o+(typeof w==="string"?" → "+w:"")); } }
  catch(e){ niezdane++; bledy.push(o+" → "+e.message); } };

if(!fs.existsSync(plikStrony)){ console.log("⚠ brak onenote.html — pomijam"); process.exit(0); }
const zrodlo = fs.readFileSync(plikStrony, "utf8");

console.log("═══ DOKĄD STRONA MOŻE SIĘ ŁĄCZYĆ ═══");
T("polityka bezpieczeństwa obecna", ()=>/Content-Security-Policy/.test(zrodlo));
T("połączenia dozwolone WYŁĄCZNIE do Microsoftu", ()=>{
   const m = zrodlo.match(/connect-src ([^;"]+)/);
   if(!m) return "brak reguły connect-src";
   const cele = m[1].trim().split(/\s+/);
   return (cele.length===1 && cele[0]==="https://graph.microsoft.com") || "dozwolone: "+cele.join(", "); });
T("żaden inny adres nie występuje w kodzie", ()=>{
   const adresy = [...new Set((zrodlo.match(/https?:\/\/[a-z0-9.-]+/gi)||[]))]
     .filter(a=>!/microsoft\.com$/i.test(a));
   return adresy.length===0 || "obce adresy: "+adresy.join(", "); });
T("dokładnie jedno miejsce cokolwiek pobiera", ()=>{
   const ile = (zrodlo.match(/\bfetch\s*\(/g)||[]).length;
   return ile===1 || "wywołań fetch: "+ile; });
T("brak innych dróg wysyłki danych", ()=>
   !/sendBeacon|new WebSocket|XMLHttpRequest|<form|action=/.test(zrodlo));
T("obrazy tylko z tej strony i osadzone", ()=>/img-src 'self' data:/.test(zrodlo));
T("brak ramek i obiektów", ()=>/object-src 'none'/.test(zrodlo));

console.log("═══ CO SIĘ DZIEJE Z CIĄGIEM UPRAWNIAJĄCYM ═══");
T("nie trafia do pamięci przeglądarki", ()=>
   !/localStorage|sessionStorage|indexedDB|document\.cookie/.test(zrodlo));
T("pole czyszczone po zakończeniu", ()=>/\$\("token"\)\.value = "";/.test(zrodlo));
T("nie ląduje w adresie strony", ()=>!/location\.(href|search|hash)\s*=/.test(zrodlo));
T("użytkownik dowiaduje się, jak to działa", ()=>/Kto zobaczy moje notatki/.test(zrodlo));
T("wyjaśnienie mówi o regule w nagłówku, nie tylko obiecuje", ()=>
   /connect-src https:\/\/graph\.microsoft\.com<\/code>/.test(zrodlo));

console.log("═══ STRONA DZIAŁA ═══");
const vc = new VirtualConsole(); const bl=[];
vc.on("jsdomError", e=>bl.push(String(e.detail&&e.detail.message||e.detail)));
const dom = new JSDOM(zrodlo, {runScripts:"dangerously", url:"https://przyklad.test/onenote.html", virtualConsole:vc});
setTimeout(async ()=>{
  const w = dom.window, d = w.document;
  T("wczytuje się bez błędów", ()=>bl.length===0 || bl.slice(0,1).join());
  T("trzy kroki dla użytkownika", ()=>d.querySelectorAll(".krok").length===3);
  T("odsyła do właściwej strony Microsoftu", ()=>
     !!d.querySelector('a[href^="https://developer.microsoft.com/graph/graph-explorer"]'));
  T("przycisk podglądu przed pobraniem", ()=>!!d.getElementById("btnSpis"));
  T("pobieranie zablokowane, dopóki nie ma podglądu", ()=>d.getElementById("btnPobierz").disabled===true);

  console.log("═══ POMOC PRZY BŁĘDACH LOGOWANIA ═══");
  /* Pierwsza próba skończyła się błędem 401, bo Graph Explorer wysyła zapytanie
     także wtedy, gdy użytkownik nie jest zalogowany — a napis „Tenant: Personal"
     u góry sugeruje, że jest. Instrukcja musi to rozstrzygać. */
  T("instrukcja wskazuje właściwy róg ekranu", ()=>/prawym górnym rogu/.test(zrodlo));
  T("każe poczekać na potwierdzenie, zanim skopiuje ciąg", ()=>/200 OK/.test(zrodlo));
  T("jest osobne wyjaśnienie błędu 401", ()=>/Unauthorized 401|Unauthorized „401|Widzę czerwone/.test(zrodlo));
  T("mówi, że napis Tenant nie jest dowodem zalogowania", ()=>/nie jest dowodem/.test(zrodlo));
  T("instrukcja zawiera nadanie uprawnienia Notes.Read", ()=>/Modify Permissions/.test(zrodlo) && /Notes\.Read/.test(zrodlo));
  /* Lista uprawnień w Graph Explorer dotyczy zapytania wpisanego w pasku adresu.
     Przy /me nie ma tam Notes.Read w ogóle — kolejność kroków musi to uwzględniać. */
  T("adres wpisywany PRZED otwarciem listy uprawnień", ()=>{
     const iAdres = zrodlo.indexOf("Wpisz adres notatek");
     const iZgoda = zrodlo.indexOf("Nadaj prawo do odczytu notatek");
     return (iAdres>0 && iZgoda>iAdres) || "kolejność kroków odwrotna"; });
  T("wyjaśnia, czemu lista bywa bez Notes.Read", ()=>
     /Na li[sś]cie uprawnie[nń] nie ma w og[oó]le/.test(zrodlo) &&
     /uprawnienia <b>do bie[zż]/.test(zrodlo));
  T("uczy rozpoznawać wylogowanie po napisie Tenant", ()=>/Tenant: Personal/.test(zrodlo) && /Sample/.test(zrodlo));
  T("ostrzega przed wariantem .All przy koncie osobistym", ()=>
     /bez<\/b> końcówki|bez końcówki/.test(zrodlo) && /\.All/.test(zrodlo));
  T("tłumaczy, że OneNote zgłasza 401 mimo zalogowania", ()=>/Zalogowany, a i tak 401/.test(zrodlo));
  T("wskazuje właściwe pole na adres", ()=>/wąskim pasku na samej górze|wąski pasek u góry/.test(zrodlo));
  T("komunikat w aplikacji też podpowiada, co zrobić", ()=>
     /Modify Permissions → Notes\.Read \(bez \.All\)/.test(zrodlo) &&
     /Brakuje zgody na odczyt notatek/.test(zrodlo));

  console.log("═══ PRZEROBIENIE TREŚCI ═══");
  const wynik = w.zbudujKopie([
    {notes:"Notes", sekcja:"Sekcja", tytul:"Strona", klucz:"1",
     utworzono:"2024-03-11T07:42:00Z", zmieniono:"2025-11-02T19:05:00Z",
     html:`<html><body><p><span style="font-weight:bold">Pogrubione</span>
       <span style="background-color:#ffff00">podświetlone</span></p>
       <script>alert(1)<\/script><img src=x onerror="alert(1)">
       <iframe src="javascript:alert(1)"></iframe>
       <a href="javascript:alert(1)">odnośnik</a></body></html>`}
  ]);
  const h = wynik.notes[0].h;
  T("struktura odwzorowana", ()=>wynik.sections.length===1 && wynik.secTabs.length===1 && wynik.notes.length===1);
  T("notatka trafia do zakładki", ()=>wynik.notes[0].stb===wynik.secTabs[0].id);
  T("daty zachowane", ()=>wynik.notes[0].cr.startsWith("2024-03-11") && wynik.notes[0].mo.startsWith("2025-11-02"));
  T("pogrubienie zachowane", ()=>/<b>Pogrubione<\/b>/.test(h));
  T("podświetlenie zamienione na kolor aplikacji", ()=>/<mark class="hl\d">/.test(h));
  T("obcy kod odrzucony", ()=>!/<script|onerror|<iframe|javascript:/i.test(h) || "zostało: "+h.slice(0,120));
  T("tekst do wyszukiwania powstaje", ()=>wynik.notes[0].c.indexOf("Pogrubione")>=0);
  T("powtórny import nie zdubluje notatki", ()=>{
     const drugi = w.zbudujKopie([{notes:"Notes", sekcja:"Sekcja", tytul:"Strona", klucz:"1", html:"<p>x</p>"}]);
     return drugi.notes[0].g === wynik.notes[0].g; });

  console.log("═══ PORZĄDKOWANIE UKŁADU Z ONENOTE ═══");
  /* OneNote zapisuje każdy blok jako kontener na sztywnych współrzędnych, a między
     nimi wstawia puste akapity i wcięcia. Treść notatki wyświetlana jest
     z zachowaniem spacji, więc wszystko to widać na ekranie. */
  const zOneNote = `<html><body data-absolute-enabled="true">
    <div data-id="_default" style="position:absolute;left:48px;top:120px;width:624px">
      <div style="position:absolute;left:0px;top:0px;width:600px">
        <p style="margin-top:0pt"><span style="font-weight:bold">Główna myśl:</span> zaufanie.</p>
        <p>&nbsp;</p>
        <p><span style="background-color:#ffff00">Przysłów 3:5</span> — nie polegaj.</p>
        <p>&nbsp;</p><p>&nbsp;</p>
        <ul><li>Punkt</li></ul>
        <br><br><br>
        <table width="620"><tr><td width="300">Werset</td></tr></table>
      </div></div></body></html>`;
  const upor = w.oczysc(zOneNote, true);
  const wierny = w.oczysc(zOneNote, false);
  T("kontenery od pozycjonowania rozpakowane", ()=>!/position:absolute|data-id/.test(upor));
  T("puste akapity usunięte", ()=>!/<div><\/div>/.test(upor));
  T("wcięcia i podziały wierszy ze źródła usunięte", ()=>!/\n\s{2,}/.test(upor) || "zostały odstępy");
  T("zbitki przerw sprowadzone do jednej", ()=>(upor.match(/<br>/g)||[]).length<=1);
  T("sztywne szerokości tabel usunięte", ()=>!/width=/.test(upor));
  T("uporządkowane jest krótsze od wiernego", ()=>upor.length < wierny.length || upor.length+" vs "+wierny.length);
  T("treść i wyróżnienia zachowane", ()=>
     /<b>Główna myśl:<\/b>/.test(upor) && /<mark class="hl\d">Przysłów/.test(upor) &&
     /<ul><li>Punkt<\/li><\/ul>/.test(upor) && /<table>/.test(upor));
  T("wierne odwzorowanie nadal dostępne", ()=>wierny.length>0 && /<b>/.test(wierny));
  T("użytkownik może wybrać", ()=>!!d.getElementById("zachowajUklad"));
  T("domyślnie porządkujemy", ()=>d.getElementById("zachowajUklad").checked===false);
  T("wybór opisany przy polu", ()=>/układana od nowa według stylu aplikacji/.test(zrodlo));

  console.log("═══ KONTO Z DUŻĄ LICZBĄ SEKCJI ═══");
  /* Microsoft odrzuca zapytanie o wszystkie strony naraz, gdy sekcji jest dużo:
     „Przekroczono maksymalną liczbę sekcji dla tego żądania". Sam zaleca
     pobieranie sekcja po sekcji — i to jest droga podstawowa. */
  T("droga podstawowa idzie po sekcjach", ()=>/async function spisPoSekcjach/.test(zrodlo));
  T("zapytanie zbiorcze zostaje jako zapasowe", ()=>{
     const iPo = zrodlo.indexOf("return await spisPoSekcjach()");
     const iZb = zrodlo.indexOf("return await spisZbiorczy()");
     return (iPo>0 && iZb>iPo) || "kolejność odwrotna"; });
  T("pyta o strony konkretnej sekcji", ()=>/onenote\/sections\/"\+sek\.id\+"\/pages/.test(zrodlo));
  T("nazwy notesu i sekcji bierze wprost ze spisu sekcji", ()=>
     /st\.parentSection = \{id: sek\.id, displayName: nazwaSekcji\}/.test(zrodlo));
  T("niepowodzenie jednej sekcji nie przerywa reszty", ()=>
     /catch\(e\)\{ break; \}\s*\/\/ jedna sekcja/.test(zrodlo));
  T("pokazuje postęp sekcja po sekcji", ()=>/"Sekcja "\+\(i\+1\)\+" z "\+sekcje\.length/.test(zrodlo));

  await (async ()=>{
    /* Atrapa udaje konto z trzema sekcjami w dwóch notesach; zapytanie zbiorcze
       odrzucamy tak, jak robi to Microsoft przy dużej liczbie sekcji. */
    const zapytania = [];
    w.fetch = async (url)=>{
      const u = String(url); zapytania.push(u.replace("https://graph.microsoft.com/v1.0/me/onenote",""));
      const odp = (d)=>({ok:true, status:200, text:async()=>JSON.stringify(d)});
      if(/\/pages\?/.test(u) && !/sections\//.test(u))
        return {ok:false, status:400, text:async()=>JSON.stringify({error:{message:"Przekroczono maksymalną liczbę sekcji dla tego żądania."}})};
      if(/\/sections\?/.test(u)) return odp({value:[
        {id:"s1", displayName:"Betel", parentNotebook:{displayName:"Studium"}},
        {id:"s2", displayName:"Kursy", parentNotebook:{displayName:"Studium"}},
        {id:"s3", displayName:"Kongres 2026", parentNotebook:{displayName:"Kongresy"}}
      ]});
      if(/sections\/s1\/pages/.test(u)) return odp({value:[
        {id:"p1", title:"Ufaj mądrości", createdDateTime:"2024-03-11T07:00:00Z", lastModifiedDateTime:"2025-01-01T00:00:00Z"},
        {id:"p2", title:"Cierpliwość", createdDateTime:"2024-05-02T07:00:00Z", lastModifiedDateTime:"2024-05-02T08:00:00Z"}
      ]});
      if(/sections\/s2\/pages/.test(u)) return odp({value:[
        {id:"p3", title:"Lekcja 7A", createdDateTime:"2023-09-04T07:00:00Z", lastModifiedDateTime:"2023-09-04T08:00:00Z"}
      ]});
      if(/sections\/s3\/pages/.test(u)) return {ok:false, status:500, text:async()=>"awaria"};
      return odp({value:[]});
    };
    let wynik=null, blad=null;
    try{ wynik = await w.spis(); }catch(e){ blad = e; }
    T("konto z wieloma sekcjami przechodzi", ()=>
       (!blad && wynik && wynik.length===3) || "błąd: "+(blad&&blad.message)+" · stron: "+(wynik&&wynik.length));
    T("każda strona wie, z jakiego notesu i sekcji pochodzi", ()=>
       wynik.every(s=>s.parentSection && s.parentSection.displayName && s.parentNotebook.displayName));
    T("awaria jednej sekcji nie gubi pozostałych", ()=>
       wynik.filter(s=>s.parentNotebook.displayName==="Studium").length===3);
    T("struktura odwzorowana mimo awarii", ()=>{
       const k = w.zbudujKopie(wynik.map(s=>({
         notes:s.parentNotebook.displayName, sekcja:s.parentSection.displayName,
         tytul:s.title, klucz:s.id, html:"<p>x</p>",
         utworzono:s.createdDateTime, zmieniono:s.lastModifiedDateTime})));
       return k.sections.length===1 && k.secTabs.length===2 && k.notes.length===3; });
  })();

  wyjdz(niezdane?1:0, "\n════ "+zdane+" OK, "+niezdane+" błędów ════\n"
                     + bledy.map(b=>"  ❌ "+b+"\n").join(""));
}, 900);
