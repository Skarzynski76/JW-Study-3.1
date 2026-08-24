/* ==========================================================================
   POWIĄZANE NOTATKI

   Przy ośmiu tysiącach notatek najtrudniej dowiedzieć się, że coś już się
   kiedyś zapisało. Wyszukiwanie odpowiada na pytanie zadane wprost; tutaj
   chodzi o przypomnienie, którego nikt nie szukał.

   Testy pilnują trzech rzeczy: że kolejność powiązań ma sens (ten sam werset
   przed tą samą publikacją), że każdy wiersz podaje POWÓD — lista bez
   uzasadnienia to wróżenie — i że liczenie nie zwalnia przy tysiącach notatek.
   ========================================================================== */
const {T, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const zr = zrodlo("js","44-powiazane.js");
  const N = (g, o)=>Object.assign({g, t:"", h:"", c:"", tg:[], b:null, ch:null, v:null,
    ks:null, itn:0, doc:0, par:0, cr:"2024-01-01", mo:"2024-01-01", del:false}, o);

  w.eval(`notes.length=0; tags.length=0; idb=null;
    tags.push({id:1,name:"Studium",ord:0});`);
  const ustaw = (lista)=>{
    w.eval('notes.length=0; notes.push(...'+JSON.stringify(lista)+'); unieaktualnijPowiazane();');
  };
  const pow = (g, ile)=>w.eval(
    'powiazaneNotatki(notes.find(n=>n.g==="'+g+'")'+(ile?','+ile:'')+').map(x=>x.n.g).join(",")');
  const powody = (g)=>JSON.parse(w.eval(
    'JSON.stringify(powiazaneNotatki(notes.find(n=>n.g==="'+g+'")).map(x=>({g:x.n.g, p:x.powody})))'));

  console.log("═══ CO ZNACZY POWIĄZANIE ═══");
  T("ten sam werset jest najmocniejszym związkiem", ()=>{
     ustaw([
       N("ja",    {t:"Moja", b:43, ch:3, v:16, ks:"nwtsty"}),
       N("werset",{t:"Ten sam werset", b:43, ch:3, v:16, ks:"nwtsty"}),
       N("rozdz", {t:"Ten sam rozdział", b:43, ch:3, v:2, ks:"nwtsty"}),
       N("publ",  {t:"Ta sama publikacja", ks:"nwtsty"})
     ]);
     return pow("ja")==="werset,rozdz,publ" || "kolejność: "+pow("ja"); });
  T("ten sam artykuł przed samym wydaniem", ()=>{
     ustaw([
       N("ja",   {t:"Moja", ks:"w", itn:20260100, doc:111}),
       N("art",  {t:"Ten sam artykuł", ks:"w", itn:20260100, doc:111}),
       N("wyd",  {t:"To samo wydanie", ks:"w", itn:20260100, doc:222}),
       N("pub",  {t:"Ta sama publikacja", ks:"w", itn:20250100, doc:333})
     ]);
     return pow("ja")==="art,wyd,pub" || "kolejność: "+pow("ja"); });
  T("wspólna etykieta też łączy", ()=>{
     ustaw([N("ja",{t:"Moja", tg:[1]}), N("inna",{t:"Z tą samą etykietą", tg:[1]}),
            N("obca",{t:"Bez etykiety"})]);
     return pow("ja")==="inna" || "znalezione: "+pow("ja"); });
  T("notatka nie jest powiązana sama ze sobą", ()=>{
     ustaw([N("ja",{t:"Moja", b:43, ch:3, v:16})]);
     return pow("ja")===""; });
  T("skasowane notatki nie są proponowane", ()=>{
     ustaw([N("ja",{t:"Moja", b:43, ch:3, v:16}),
            N("kosz",{t:"W koszu", b:43, ch:3, v:16, del:true})]);
     return pow("ja")===""; });

  console.log("═══ RZADKIE SŁOWA WYCIĄGAJĄ TO, CO ZAPOMNIANE ═══");
  /* To jest sedno pomysłu: notatka sprzed dwóch lat, bez wspólnego wersetu
     i bez wspólnej etykiety, ale o tym samym. */
  T("wspólne rzadkie słowo łączy notatki bez innych związków", ()=>{
     ustaw([
       N("ja",    {t:"Dziś", c:"Rozmawialiśmy o akrobacjach i zaufaniu."}),
       N("dawna", {t:"Dwa lata temu", c:"Notatka o akrobacjach na kongresie.", mo:"2022-01-01"}),
       N("obca",  {t:"O czym innym", c:"Zupełnie inny temat bez wspólnych wyrazów."})
     ]);
     return pow("ja")==="dawna" || "znalezione: "+pow("ja"); });
  T("słowo pospolite nie tworzy powiązań", ()=>{
     /* Wyraz z wielu notatek nic o żadnej z nich nie mówi — a to on kosztowałby
        najwięcej przy liczeniu. */
     const lista = [N("ja",{t:"Moja", c:"jehowa jehowa"})];
     for(let i=0;i<60;i++) lista.push(N("n"+i,{t:"N"+i, c:"jehowa"}));
     ustaw(lista);
     return pow("ja")==="" || "powiązano po pospolitym słowie: "+pow("ja"); });
  T("krótkie wyrazy są pomijane", ()=>{
     ustaw([N("ja",{t:"", c:"tak nie ale"}), N("inna",{t:"", c:"tak nie ale"})]);
     return pow("ja")==="" || "powiązano po krótkich: "+pow("ja"); });
  T("progi zapisane wprost", ()=>
     /const POW_MIN_DLUGOSC  = 5;/.test(zr) && /const POW_MAX_NOTATEK  = 40;/.test(zr));

  console.log("═══ KAŻDY WIERSZ PODAJE POWÓD ═══");
  T("powód jest przy każdej pozycji", ()=>{
     ustaw([N("ja",{t:"Moja", b:43, ch:3, v:16, tg:[1]}),
            N("inna",{t:"Inna", b:43, ch:3, v:16, tg:[1]})]);
     const p = powody("ja");
     return p.length===1 && p[0].p.length>0 || JSON.stringify(p); });
  T("powody się sumują, gdy związków jest kilka", ()=>{
     const p = powody("ja")[0].p.join(" | ");
     return /ten sam werset/.test(p) && /wspólna etykieta/.test(p) || "powody: "+p; });
  T("przy wspólnych słowach powód je wymienia", ()=>{
     ustaw([N("ja",{t:"", c:"akrobacje gimnastyka zaufanie"}),
            N("inna",{t:"", c:"akrobacje gimnastyka"})]);
     const p = powody("ja")[0].p.join(" | ");
     return /wspólne słowa: /.test(p) && /akrobacje/.test(p) || "powody: "+p; });
  T("nazwa etykiety jest w powodzie, nie sam numer", ()=>{
     ustaw([N("ja",{tg:[1]}), N("inna",{tg:[1]})]);
     return /Studium/.test(powody("ja")[0].p.join(" ")); });

  console.log("═══ SZYBKOŚĆ PRZY DUŻYM ZBIORZE ═══");
  /* Porównywanie każdej notatki z każdą to przy ośmiu tysiącach sześćdziesiąt
     cztery miliony par. Skorowidz rzadkich słów ma to obejść. */
  T("skorowidz powstaje raz i przeżywa do zmiany notatek", ()=>
     /_skorowidzNieaktualny/.test(zr) && /function unieaktualnijPowiazane/.test(zr));
  T("zapis notatki unieważnia skorowidz", ()=>
     /unieaktualnijPowiazane/.test(zrodlo("js","02-storage.js")));
  T("liczenie przy 4000 notatek trwa krócej niż pół sekundy", ()=>{
     const lista = [N("ja",{t:"Moja", c:"akrobacje zaufanie pokora"})];
     for(let i=0;i<4000;i++) lista.push(N("m"+i,{t:"Notatka "+i,
       c:"Zdanie o czymś numer "+i+" oraz kilka wyrazow wypelniajacych tresc"}));
     lista.push(N("cel",{t:"Szukana", c:"akrobacje i zaufanie"}));
     ustaw(lista);
     const start = Date.now();
     const wynik = pow("ja");
     const czas = Date.now() - start;
     return (czas < 500 && /cel/.test(wynik)) || `czas ${czas} ms, wynik ${wynik}`; });
  T("drugie wywołanie korzysta z gotowego skorowidza", ()=>{
     const start = Date.now();
     w.eval('powiazaneNotatki(notes.find(n=>n.g==="ja"))');
     return (Date.now()-start) < 300 || "drugie liczenie: "+(Date.now()-start)+" ms"; });
  T("lista jest ograniczona, żeby nie zalać czytnika", ()=>{
     const lista = [N("ja",{tg:[1]})];
     for(let i=0;i<40;i++) lista.push(N("x"+i,{tg:[1]}));
     ustaw(lista);
     return pow("ja").split(",").length===8 || "pozycji: "+pow("ja").split(",").length; });

  console.log("═══ BLOK JEST ZWINIĘTY, DOPÓKI GO NIE OTWORZĘ ═══");
  /* Rozwinięty zajmował nawet jedną trzecią strony pod KAŻDĄ notatką, a
     powiązania są potrzebne od czasu do czasu. Liczba w nagłówku wystarczy,
     żeby wiedzieć, czy warto zaglądać. */
  T("domyślnie zwinięty", ()=>{
     try{ w.localStorage.removeItem("jwsPowOtw"); }catch(e){}
     ustaw([N("ja",{t:"Moja", b:43, ch:3, v:16}), N("inna",{t:"Inna", b:43, ch:3, v:16})]);
     w.eval('renderAll(); openFs(notes.find(n=>n.g==="ja"));');
     const b = d.querySelector("#fsWrap details.powiazane");
     return (!!b && !b.open) || (b ? "otwarty od razu" : "brak bloku"); });
  T("liczba powiązań widoczna bez rozwijania", ()=>{
     const ile = d.querySelector("#fsWrap .powIle");
     return !!ile && ile.textContent==="1" || "licznik: "+(ile&&ile.textContent); });
  T("lista wysuwa się po rozwinięciu", ()=>{
     const b = d.querySelector("#fsWrap details.powiazane");
     b.open = true;
     b.dispatchEvent(new w.Event("toggle", {bubbles:false}));
     return d.querySelectorAll("#fsWrap .powLista [data-pow]").length===1; });
  T("wybór jest zapamiętywany", ()=>w.localStorage.getItem("jwsPowOtw")==="1");
  T("i przywracany przy następnej notatce", ()=>{
     w.eval('closeFs(); openFs(notes.find(n=>n.g==="inna"));');
     const b = d.querySelector("#fsWrap details.powiazane");
     return (!!b && b.open) || "nie przywrócono stanu"; });
  T("zwinięcie też jest zapamiętywane", ()=>{
     const b = d.querySelector("#fsWrap details.powiazane");
     b.open = false;
     b.dispatchEvent(new w.Event("toggle", {bubbles:false}));
     return w.localStorage.getItem("jwsPowOtw")==="0"; });
  T("nagłówek daje się obsłużyć klawiaturą i czytnikiem ekranu", ()=>{
     /* Dlatego jest to <details>/<summary>, a nie własny przełącznik z klasą:
        przeglądarka robi to za nas i robi to poprawnie. */
     const b = d.querySelector("#fsWrap details.powiazane");
     return !!b && b.tagName==="DETAILS" && !!b.querySelector("summary"); });
  T("strzałka obraca się przy otwarciu", ()=>
     /details\.powiazane\[open\] \.powStrzalka\{ transform:rotate\(90deg\); \}/
       .test(zrodlo("css","11-polish.css").replace(/\s+/g," ")));
  T("kto nie chce ruchu, ten go nie dostaje", ()=>
     /@media \(prefers-reduced-motion: reduce\)\{ details\.powiazane\[open\] \.powLista\{ animation:none; \}/
       .test(zrodlo("css","11-polish.css").replace(/\s+/g," ")));

  console.log("═══ W CZYTNIKU ═══");
  T("blok pojawia się pod notatką", ()=>{
     ustaw([N("ja",{t:"Moja", b:43, ch:3, v:16}), N("inna",{t:"Inna", b:43, ch:3, v:16})]);
     w.eval('renderAll(); openFs(notes.find(n=>n.g==="ja"));');
     return !!d.querySelector("#fsWrap .powiazane"); });
  T("każda pozycja jest przyciskiem do otwarcia", ()=>{
     const b = d.querySelector("#fsWrap details.powiazane");
     if(b) b.open = true;
     return d.querySelectorAll("#fsWrap .powiazane [data-pow]").length===1; });
  T("dotknięcie otwiera powiązaną notatkę", ()=>{
     d.querySelector("#fsWrap .powiazane [data-pow]").dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
     return w.eval("fsGuid")==="inna" || "otwarto: "+w.eval("fsGuid"); });
  T("bez powiązań blok w ogóle się nie pokazuje", ()=>{
     ustaw([N("sam",{t:"Jedyna", c:"Zupelnie osobna tresc bez zadnych zwiazkow"})]);
     w.eval('renderAll(); openFs(notes[0]);');
     return !d.querySelector("#fsWrap .powiazane"); });
  T("nic nie opuszcza urządzenia", ()=>{
     /* Sprawdzamy zachowanie, nie treść pliku: w wersji jednoplikowej „zr" to
        cały index.html, w którym sieć jest używana zupełnie gdzie indziej
        i słusznie. Tutaj liczy się to, czy LICZENIE POWIĄZAŃ o nią zaczepia. */
     let siec = 0;
     const bylFetch = w.fetch, bylXHR = w.XMLHttpRequest, bylBeacon = w.navigator.sendBeacon;
     w.fetch = ()=>{ siec++; return Promise.resolve(); };
     w.XMLHttpRequest = function(){ siec++; this.open=()=>{}; this.send=()=>{}; };
     try{ w.navigator.sendBeacon = ()=>{ siec++; return true; }; }catch(e){}
     ustaw([N("ja",{t:"Moja", b:43, ch:3, v:16, c:"akrobacje zaufanie"}),
            N("inna",{t:"Inna", b:43, ch:3, v:16, c:"akrobacje"})]);
     w.eval('powiazaneNotatki(notes.find(n=>n.g==="ja"))');
     w.eval('htmlPowiazanych(notes.find(n=>n.g==="ja"))');
     w.fetch = bylFetch; w.XMLHttpRequest = bylXHR;
     try{ w.navigator.sendBeacon = bylBeacon; }catch(e){}
     return siec===0 || "sięgnięto do sieci "+siec+" razy"; });

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
