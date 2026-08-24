/* ==========================================================================
   PRZENOSZENIE NOTATEK I ZAKŁADEK

   Karta notatki miała uchwyt oparty na mechanizmie przeglądarki, który NIE
   działa dotykiem — na iPadzie nie dało się przeciągnąć nic. Zostawało menu
   i przesuwanie „o jeden krok". Ten zestaw pilnuje, żeby przenoszenie działało
   wskaźnikiem: palcem, rysikiem i myszą tak samo.
   ========================================================================== */
const {T, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const N = ()=>w.eval("notes"), Z = ()=>w.eval("secTabs");
  w.eval(`notes.length=0;tags.length=0;sections.length=0;secTabs.length=0;idb=null;
    sections.push({id:1,name:"Kongresy",ord:0,open:true});
    sections.push({id:2,name:"Studium",ord:1,open:true});
    secTabs.push({id:7,sec:1,name:"Kongres 2026",ord:0});
    tags.push({id:3,name:"Do przemyślenia",ord:0,sec:null});
    notes.push({g:"n1",t:"Notatka",h:"<div>x</div>",c:"x",tg:[],b:null,ch:null,ks:null,
      cr:"2024-01-01",mo:"2024-01-01",del:false});
    renderAll();`);

  /** Przeciąga notatkę wskaźnikiem na wskazany cel i mówi, czy był podświetlony. */
  const przeciagnij = (celSel)=>{
    const cel = d.querySelector(celSel);
    const u = d.querySelector("#noteList .ncard .drag");
    if(!cel || !u) return null;
    d.elementFromPoint = ()=>cel;
    u.dispatchEvent(new w.PointerEvent("pointerdown",{bubbles:true,pointerId:1,clientX:5,clientY:5}));
    u.dispatchEvent(new w.PointerEvent("pointermove",{bubbles:true,pointerId:1,clientX:50,clientY:50}));
    const podswietlony = cel.classList.contains("dropTarget");
    u.dispatchEvent(new w.PointerEvent("pointerup",{bubbles:true,pointerId:1,clientX:50,clientY:50}));
    return podswietlony;
  };

  console.log("═══ PRZECIĄGANIE DZIAŁA WSKAŹNIKIEM ═══");
  /* Sedno: dotyk. Mechanizm przeglądarki (draggable) nie reaguje na palec. */
  T("obsługa oparta na wskaźniku, nie na mechanizmie przeglądarki", ()=>{
     /* Gest przeniesiono do 34-chwytanie.js (jeden nasłuch zamiast dwóch bijących
        się o palec), ale przyczyna zostaje ta sama: ma działać DOTYKIEM. */
     const z = zrodlo("js","34-chwytanie.js") + zrodlo("js","32-przenoszenie.js");
     return /pointerdown/.test(z) && /elementFromPoint/.test(z); });
  T("uchwyt nie przechwytuje przewijania palcem", ()=>
     /\.ncard \.drag\{ cursor:grab; touch-action:none/.test(zrodlo("css","11-polish.css").replace(/\s+/g," ")));
  T("karta notatki ma uchwyt", ()=>!!d.querySelector("#noteList .ncard .drag"));

  console.log("═══ GDZIE MOŻNA UPUŚCIĆ ═══");
  T("na zakładkę sekcji — cel się podświetla", ()=>przeciagnij("#tagList .stbItem")===true);
  T("i notatka tam trafia", ()=>N()[0].stb===7 || "stb: "+N()[0].stb);
  T("na etykietę — cel się podświetla", ()=>przeciagnij('#tagList .item[data-k="3"]')===true);
  T("i notatka dostaje etykietę", ()=>N()[0].tg.indexOf(3)>=0 || "etykiety: "+JSON.stringify(N()[0].tg));
  T("ta sama etykieta drugi raz nie dubluje", ()=>{
     przeciagnij('#tagList .item[data-k="3"]');
     return N()[0].tg.filter(x=>x===3).length===1; });

  console.log("═══ GDZIE UPUŚCIĆ NIE MOŻNA ═══");
  T("pozycja Wszystkie nie jest miejscem do wrzucania", ()=>przeciagnij('#tagList .item[data-k="all"]')===false);
  T("pozycja Bez etykiety też nie", ()=>przeciagnij('#tagList .item[data-k="none"]')===false);
  T("po upuszczeniu nic nie zostaje podświetlone", ()=>d.querySelectorAll(".dropTarget").length===0);

  console.log("═══ ZAKŁADKA DO INNEJ SEKCJI ═══");
  /* Przeciąganie porządkuje w obrębie sekcji; przeniesienie do innej sekcji
     musi działać także wtedy, gdy tamta jest zwinięta albo poza ekranem. */
  T("menu zakładki ma przeniesienie do innej sekcji", ()=>{
     w.secTabMenu({target:d.body}, Z()[0]);
     return !!d.querySelector('#dropdown [data-zm="sek"]'); });
  T("jest funkcja przenosząca", ()=>typeof w.przeniesZakladkeDoSekcji==="function");
  T("etykiety zakładki idą razem z nią", ()=>
     /tags\.forEach\(t=>\{ if\(t\.stb===id\) t\.sec = z\.sec; \}\)/.test(zrodlo("js","32-przenoszenie.js")));
  T("zakładka ląduje na końcu listy w nowej sekcji", ()=>
     /z\.ord = secTabsFor\(z\.sec\)\.length/.test(zrodlo("js","32-przenoszenie.js")));

  console.log("═══ KOLEJNOŚĆ WEWNĄTRZ SEKCJI ═══");
  T("zakładki mają uchwyt do przeciągania", ()=>{
     w.eval('secTabs.push({id:8,sec:1,name:"Kongres 2025",ord:1}); renderAll();');
     return d.querySelectorAll("#tagList .stbItem .dragOrd").length===2; });
  /* Dawniej stało tu, że ruch jest OGRANICZONY do jednej sekcji. To był błąd:
     dokładnie przez to nie dało się przenieść etykiety kilka poziomów dalej.
     Swobodne przenoszenie ma własny zestaw — testy/chwytanie.js. */
  T("swobodne przenoszenie ma osobny moduł", ()=>
     /34-chwytanie\.js/.test(zrodlo(".","index.html")));

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
