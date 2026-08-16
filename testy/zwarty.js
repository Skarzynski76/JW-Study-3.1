/* ==========================================================================
   ZWARTY INTERFEJS NA MAŁYM EKRANIE

   Zrzut z telefonu: górny pasek zawinięty na trzy rzędy, pod nim pasek
   przełączania kolumn, pod nim filtry łamiące się na dwa wiersze. Zanim
   pokazała się pierwsza notatka, znikała blisko połowa ekranu — a do tego
   ikony na karteczkach leżały wprost na tekście.

   Sedno: nic nie może zniknąć. Oszczędzanie miejsca, które odbiera funkcje,
   to nie oszczędzanie, tylko chowanie. Testy pilnują obu stron: że jest ciaśniej
   i że wszystko nadal działa.
   ========================================================================== */
const {T, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const css = zrodlo("css","11-polish.css").replace(/\s+/g," ");
  const zr = zrodlo("js","41-oszczedny.js");
  const ekran = (szer, wys)=>{
    w.visualViewport = {offsetLeft:0, offsetTop:0, width:szer, height:wys,
                        addEventListener(){}, removeEventListener(){}};
    w.zastosujOszczedny();
    return d.documentElement.classList.contains("zwarty");
  };

  console.log("═══ WŁĄCZA SIĘ SAM, GDZIE TRZEBA ═══");
  T("na telefonie tak", ()=>{ w.ustawOszczedny("auto"); return ekran(430, 930); });
  T("na tablecie i komputerze nie", ()=>!ekran(1200, 900));
  T("na telefonie położonym poziomo też — tam wysokości jest jeszcze mniej", ()=>
     ekran(900, 430));
  T("granica opisana wprost", ()=>/ob\.szer <= 700 \|\| ob\.wys <= 560/.test(zr));

  console.log("═══ MOŻNA WYMUSIĆ ALBO WYŁĄCZYĆ ═══");
  T("„zawsze” działa też na dużym ekranie", ()=>{
     w.ustawOszczedny("zawsze"); return ekran(1600, 1000); });
  T("„nigdy” działa też na telefonie", ()=>{
     w.ustawOszczedny("nigdy"); return !ekran(430, 930); });
  T("wybór jest zapamiętywany", ()=>w.localStorage.getItem("jwsOszczedny")==="nigdy");
  T("nieznana wartość nie psuje ustawienia", ()=>{
     w.ustawOszczedny("bzdura");
     return w.localStorage.getItem("jwsOszczedny")==="nigdy"; });
  T("dostępne z Ustawień", ()=>{
     w.ustawOszczedny("auto");
     w.openSettings();
     const sel = d.getElementById("stOszczedny");
     return !!sel && sel.value==="auto" && sel.querySelectorAll("option").length===3; });

  console.log("═══ CIAŚNIEJ, ALE NIC NIE ZNIKA ═══");
  /* To jest ta granica, której nie wolno przekroczyć: mniej miejsca — tak,
     mniej możliwości — nie. */
  T("wszystkie szybkie filtry zostają", ()=>{
     w.ustawOszczedny("zawsze");
     return d.querySelectorAll("#quickFilters .qf").length===6; });
  T("wszystkie widoki zostają", ()=>d.querySelectorAll("#viewBar .vb").length===4);
  T("„Nowa notatka” i „Plik” zostają", ()=>
     !!d.getElementById("btnNew") && !!d.getElementById("btnMenu"));
  T("szukanie zostaje", ()=>!!d.getElementById("search"));
  T("sortowanie zostaje", ()=>!!d.getElementById("sortSel"));
  T("ustawienia zostają", ()=>!!d.getElementById("btnSettings"));
  T("filtry idą w jeden przewijany rząd, zamiast łamać się na dwa", ()=>
     /html\.zwarty #quickFilters\{ flex-wrap:nowrap; overflow-x:auto;/.test(css));
  T("schowane przyciski mają swoje miejsce gdzie indziej", ()=>{
     /* Regulacja pisma jest w Ustawieniach, kopia w menu Plik, cofanie pod
        Ctrl+Z — dlatego wolno im ustąpić z wąskiego paska. */
     return /html\.zwarty header \.fontctl, html\.zwarty header #btnBackup, html\.zwarty header #btnUndo\{ display:none; \}/.test(css)
        && /id="stFsVal"/.test(zrodlo("js","26-settings.js")); });

  console.log("═══ IKONY NIE MOGĄ LEŻEĆ NA TEKŚCIE ═══");
  /* Na zrzucie z telefonu ołówek, gwiazdka i reszta były wydrukowane wprost
     na zdaniach notatki. Na dotyku pasek pokazuje się dopiero po wydobyciu
     karteczki — a wydobycie jest o jedno dotknięcie stąd. */
  T("na dotyku pasek ikon jest schowany, póki karteczka jest mała", ()=>
     /@media \(hover:none\)\{ #noteList\.v-tablica \.ncard:not\(\.wydobyta\) \.ntools\{ opacity:0; pointer-events:none; \}/.test(css));
  T("po wydobyciu pasek jest od razu dostępny", ()=>
     /#noteList\.v-tablica \.ncard\.wydobyta \.ntools\{ opacity:1; pointer-events:auto; \}/.test(css));
  T("odzyskany zapas idzie na treść", ()=>
     /#noteList\.v-tablica \.ncard:not\(\.wydobyta\) \.ncontent\{ padding-bottom:12px; \}/.test(css));

  console.log("═══ PASKI SĄ NIŻSZE ═══");
  T("górny pasek", ()=>/html\.zwarty header\{ gap:6px; row-gap:5px;/.test(css));
  T("pasek przełączania kolumn", ()=>/html\.zwarty #mobileTabs\{ padding:4px 8px; gap:4px; \}/.test(css));
  T("pasek nad listą", ()=>/html\.zwarty #pasekListy\{ padding:5px 10px 4px;/.test(css));
  T("numer wersji ustępuje — jest w Ustawieniach", ()=>
     /html\.zwarty header \.brand-sub, html\.zwarty header \.ver\{ display:none; \}/.test(css)
     && /id="stWersja"/.test(zrodlo("js","26-settings.js")));

  console.log("═══ PASKI USTĘPUJĄ PRZY CZYTANIU ═══");
  /* Pasek kolumn i pasek widoków są potrzebne, gdy się wybiera, CO oglądać.
     Podczas czytania listy zabierają tyle miejsca, co dwie karteczki. */
  const lista = ()=>d.getElementById("noteList");
  const schowane = ()=>d.documentElement.classList.contains("paskiSchowane");
  const przewin = (naY)=>{
    const el = lista();
    Object.defineProperty(el, "scrollHeight", {value:4000, configurable:true});
    Object.defineProperty(el, "clientHeight", {value:600,  configurable:true});
    el.scrollTop = naY;
    el.dispatchEvent(new w.Event("scroll", {bubbles:false}));
  };
  w.odslonPaski();
  T("na początku paski są widoczne", ()=>!schowane());
  T("tuż pod górną krawędzią jeszcze zostają", ()=>{ przewin(40); return !schowane(); });
  T("przewijanie w dół je chowa", ()=>{ przewin(200); przewin(260); return schowane(); });
  T("ruch w górę je przywraca — ale dopiero po dłuższym powrocie", ()=>{
     /* Przy dziesięciu pikselach wracały przy najlżejszym odbiciu palca w drugą
        stronę, a przewijanie w dół rzadko bywa idealnie jednokierunkowe. */
     przewin(250);                       // drobny powrót — jeszcze nie
     const poDrobnym = schowane();
     przewin(260 - w.progPowrotu() - 20); // powrót o ponad półtora rzędu
     return (poDrobnym && !schowane())
            || `po drobnym schowane: ${poDrobnym}, po dużym: ${schowane()}`; });
  T("powrót na samą górę też", ()=>{ przewin(400); przewin(460); przewin(0); return !schowane(); });
  T("drgnięcie palca niczego nie przełącza", ()=>{
     przewin(200);                 // ustalamy punkt odniesienia
     w.odslonPaski();
     przewin(205); przewin(202); przewin(206);
     return !schowane() || "schowały się po kilku pikselach"; });
  T("przywrócenie pasków nie wyzerowuje punktu odniesienia", ()=>
     /_ostatniScroll = lista \? lista\.scrollTop : 0;/.test(zr));
  T("krótka lista nie chowa niczego", ()=>{
     w.odslonPaski();
     const el = lista();
     Object.defineProperty(el, "scrollHeight", {value:620, configurable:true});
     Object.defineProperty(el, "clientHeight", {value:600, configurable:true});
     el.scrollTop = 200;
     el.dispatchEvent(new w.Event("scroll", {bubbles:false}));
     return !schowane(); });
  T("przewijanie treści w karteczce zostawia paski w spokoju", ()=>{
     w.odslonPaski(); przewin(200); przewin(260);      // najpierw schowaj
     const przed = schowane();
     const tresc = d.querySelector("#noteList .ncontent");
     if(tresc) tresc.dispatchEvent(new w.Event("scroll", {bubbles:false}));
     return przed === schowane() || "przewinięcie treści zmieniło paski"; });
  T("chowanie działa też poza trybem zwartym", ()=>{
     /* Użytkownik poprosił wprost, żeby łagodne chowanie było na wszystkich
        urządzeniach — nie tylko tam, gdzie miejsca brakuje najbardziej. */
     w.ustawOszczedny("nigdy"); w.odslonPaski();
     przewin(300); przewin(400);
     const wynik = schowane();
     w.ustawOszczedny("auto");
     return wynik; });
  T("przerysowanie listy przywraca paski", ()=>{
     przewin(300); przewin(400);
     w.renderAll();
     return !schowane(); });

  console.log("═══ RUCH MA BYĆ PŁYNNY, A NIE SKOKOWY ═══");
  /* PRZYCZYNA szarpania: pierwsze podejście zwijało paski WYSOKOŚCIĄ. Każda
     klatka takiej animacji zmienia układ strony, więc przeglądarka przeliczała
     od nowa całą listę notatek — kilkadziesiąt kart z cieniami i przycięciami. */
  T("odstęp u góry listy jest stały, także przy schowanym pasku", ()=>{
     /* Zerowanie odstępu przy chowaniu wyglądało na oszczędność, a było usterką:
        odstęp znikał i wracał przy każdym schowaniu, więc treść skakała. W stanie
        pośrednim — pasek widoczny, lista już przewinięta — pierwszy rząd notatek
        chował się POD paskiem i nie dało się go przeczytać. */
     const lista = d.getElementById("noteList");
     w.odslonPaski();
     const zPaskiem = w.getComputedStyle(lista).paddingTop;
     przewin(200); przewin(300);                 // paski się chowają
     const bezPaska = w.getComputedStyle(lista).paddingTop;
     w.odslonPaski();
     return zPaskiem === bezPaska || `z paskiem ${zPaskiem}, bez ${bezPaska}`; });
  T("i nie ma reguły, która by go zerowała", ()=>
     !/paskiSchowane #noteList\{ padding-top:0/.test(css));
  T("rezerwa działa w KAŻDYM widoku, nie tylko w liście", ()=>{
     /* Widok tablicy ustawiał własny odstęp skrótem `padding`, co kasowało
        rezerwę nadaną regułą ogólną — przez to pierwszy rząd karteczek chował
        się pod paskiem zaraz po otwarciu aplikacji. */
     const el = d.getElementById("noteList");
     const zle = [];
     ["list","medium","compact","tablica"].forEach(v=>{
       w.setNoteView(v);
       const pt = w.getComputedStyle(el).paddingTop;
       if(!/--wysPaska/.test(pt)) zle.push(v+": "+pt);
     });
     w.setNoteView("list");
     return zle.length===0 || "bez rezerwy — "+zle.join(", "); });
  T("i jest liczona w jeden sposób, nie w dwa", ()=>{
     const ile = (css.match(/padding[^;]*calc\(10px \+ var\(--wysPaska, 0px\)\)/g)||[]).length;
     return ile>=2 || "wystąpień: "+ile; });

  T("chowanie odbywa się przesunięciem, nie wysokością", ()=>
     /html\.paskiSchowane #pasekListy\{ transform:translateY/.test(css)
     && !/paskiSchowane[^}]*max-height:0/.test(css));
  T("pasek nad listą leży NAD nią, więc jego ruch niczego nie przesuwa", ()=>
     /#pasekListy\{ position:absolute; top:0; left:0; right:0; z-index:6;/.test(css));
  T("miejsce pod pasek zarezerwowane odstępem listy", ()=>
     /#noteList\{ padding-top:calc\(10px \+ var\(--wysPaska, 0px\)\); \}/.test(css));
  T("wysokość pasków jest mierzona, a nie zgadywana", ()=>
     /function zmierzPaski\(\)/.test(zr) && /--wysPaska/.test(zr));
  T("i mierzona ponownie, gdy pasek zmieni zawartość", ()=>
     /new ResizeObserver\(\(\)=>zmierzPaski\(\)\)/.test(zr));
  T("ukryty pasek ma zerową rezerwę", ()=>
     /tabs\.offsetParent  \? tabs\.offsetHeight  : 0/.test(zr));
  T("pasek kolumn wsuwa się pod zielony pasek aplikacji", ()=>
     /html\.paskiSchowane #mobileTabs\{ transform:translateY\(calc\(-1 \* var\(--wysTabs, 0px\)\)\);/.test(css));
  T("główna część przesuwa się razem z nim", ()=>
     /html\.paskiSchowane main\{ transform:translateY\(calc\(-1 \* var\(--wysTabs, 0px\)\)\);/.test(css));
  T("karta graficzna dostaje znak, co będzie animowane", ()=>
     (css.match(/will-change:transform;/g)||[]).length >= 3);
  T("schowany pasek nie łapie dotknięć", ()=>
     /html\.paskiSchowane #pasekListy\{[^}]*pointer-events:none;/.test(css));
  T("kto nie chce ruchu, ten go nie dostaje", ()=>
     /@media \(prefers-reduced-motion: reduce\)\{ #mobileTabs, #pasekListy, main\{ transition:none; \} \}/.test(css));

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
