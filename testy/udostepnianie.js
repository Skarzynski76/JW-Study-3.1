/* ==========================================================================
   WYSŁANIE POJEDYNCZEJ ETYKIETY ALBO ZAKŁADKI NA INNE URZĄDZENIE

   Powstający plik ma być WYCINKIEM pełnej kopii — w tym samym kształcie.
   Dzięki temu po drugiej stronie wczytuje się go zwykłym „Dołącz + układ"
   i nie trzeba niczego nowego. Ten zestaw pilnuje właśnie zgodności kształtu
   oraz tego, że nie wyjedzie za dużo ani za mało.
   ========================================================================== */
const {T, TA, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  let zapisane = null, nazwaPlikuZapisu = "";
  w.saveFile = (blob, nazwa)=>{ nazwaPlikuZapisu = nazwa; return blob.text().then(t=>{ zapisane = JSON.parse(t); return true; }); };
  w.askConfirm = ()=>Promise.resolve(true);

  w.eval(`notes.length=0;tags.length=0;sections.length=0;secTabs.length=0;
    if(typeof pubTabs!=="undefined") pubTabs.length=0;
    idb=null;
    sections.push({id:1,name:"Kongresy",ord:0,open:true});
    sections.push({id:2,name:"Inna",ord:1,open:true});
    secTabs.push({id:5,sec:1,name:"Kongres 2026",ord:0});
    tags.push({id:10,name:"Wykłady",ord:0,sec:1,stb:5,color:"#b9a9d6"});
    tags.push({id:11,name:"Obca etykieta",ord:1,sec:2});
    if(typeof pubTabs!=="undefined") pubTabs.push({id:70,ks:"pt",name:"Lekcja 1",ord:0});
    const n=(g,t,tg,extra)=>Object.assign({g,t,h:"<div>"+t+"</div>",c:t,tg:tg||[],b:null,ch:null,ks:null,
      cr:"2024-01-01",mo:"2024-01-01",del:false}, extra||{});
    notes.push(n("a","Z etykiety",[10]));
    notes.push(n("b","Wprost w zakładce",[],{stb:5}));
    notes.push(n("c","Z publikacji",[10],{ptb:70,ks:"pt"}));
    notes.push(n("d","Obca",[11]));
    notes.push(n("e","W koszu",[10],{del:true}));
    renderAll();`);

  console.log("═══ WYSŁANIE ETYKIETY ═══");
  await TA("etykieta z notatkami zapisuje się do pliku", async ()=>{
    await w.wyslijEtykiete(10);
    return !!zapisane && zapisane.notes.length===2 || "notatek: "+(zapisane&&zapisane.notes.length); });
  T("nazwa pliku mówi, co w nim jest", ()=>/^jw-etykieta-Wyk/.test(nazwaPlikuZapisu) || nazwaPlikuZapisu);
  T("kształt zgodny z pełną kopią", ()=>
    ["tags","notes","sections","pubTabs","secTabs"].every(k=>Array.isArray(zapisane[k])));
  T("jedzie tylko ta jedna etykieta", ()=>zapisane.tags.length===1 && zapisane.tags[0].id===10);
  T("sekcja etykiety jedzie razem z nią", ()=>zapisane.sections.length===1 && zapisane.sections[0].id===1);
  T("zakładka publikacji przypisanej notatki też", ()=>
    zapisane.pubTabs.length===1 && zapisane.pubTabs[0].id===70);
  T("obca etykieta i jej notatka zostają", ()=>
    !zapisane.tags.some(t=>t.id===11) && !zapisane.notes.some(n=>n.g==="d"));
  T("notatki z kosza nie jadą", ()=>!zapisane.notes.some(n=>n.g==="e"));
  T("wysłane dane są niezależną kopią", ()=>{
    const przed = zapisane.notes[0].t;
    w.eval('notes[0].t="ZMIENIONE PO WYSŁANIU";');
    return zapisane.notes[0].t===przed; });

  console.log("═══ WYSŁANIE ZAKŁADKI SEKCJI ═══");
  zapisane = null;
  await TA("zakładka zapisuje się do pliku", async ()=>{
    await w.wyslijZakladke(5);
    return !!zapisane; });
  /* Zakładka pokazuje notatki wrzucone wprost ORAZ te z jej etykiet — do pliku
     ma trafić dokładnie to samo, co widać po jej kliknięciu. */
  T("jadą notatki wrzucone wprost i te z jej etykiet", ()=>
    zapisane.notes.length===3 && ["a","b","c"].every(g=>zapisane.notes.some(n=>n.g===g))
    || "notatek: "+zapisane.notes.length+" ("+zapisane.notes.map(n=>n.g).join(",")+")");
  T("zakładka jedzie razem z notatkami", ()=>zapisane.secTabs.length===1 && zapisane.secTabs[0].id===5);
  T("i jej sekcja też", ()=>zapisane.sections.length===1 && zapisane.sections[0].id===1);
  T("etykiety należące do zakładki jadą", ()=>zapisane.tags.some(t=>t.id===10));
  T("nazwa pliku wskazuje zakładkę", ()=>/^jw-zakladka-Kongres/.test(nazwaPlikuZapisu) || nazwaPlikuZapisu);

  console.log("═══ PLIK DA SIĘ WCZYTAĆ PO DRUGIEJ STRONIE ═══");
  /* Sedno pomysłu: to zwykła kopia, więc wchodzi istniejącą drogą „Dołącz". */
  T("wczytanie na czystym urządzeniu odtwarza całość", ()=>{
    const wycinek = zapisane;
    w.eval(`notes.length=0;tags.length=0;sections.length=0;secTabs.length=0;
      if(typeof pubTabs!=="undefined") pubTabs.length=0;`);
    const kopia = w.mergeBackup(w.eval("("+JSON.stringify(wycinek)+")"), true);
    const N = w.eval("notes"), G = w.eval("tags"), S = w.eval("sections"), Z = w.eval("secTabs");
    return N.length===3 && G.length===1 && S.length===1 && Z.length===1
      || `notatek ${N.length}, etykiet ${G.length}, sekcji ${S.length}, zakładek ${Z.length}`; });
  T("notatka trafia do właściwej zakładki", ()=>{
    const N = w.eval("notes"), Z = w.eval("secTabs");
    return N.some(n=>n.stb===Z[0].id); });
  T("nic nie zostało skasowane po drugiej stronie", ()=>
    /nie zostanie skasowane/.test(zrodlo("js","33-udostepnianie.js")));

  console.log("═══ PRZYPADKI BRZEGOWE ═══");
  T("pusta etykieta mówi, że nie ma czego wysłać", ()=>
    /Nie ma czego wysłać/.test(zrodlo("js","33-udostepnianie.js")));
  T("nazwa pliku bez znaków psujących zapis", ()=>{
    const f = w.nazwaPliku("etykieta", 'A/B:C*?"<>|D');
    return !/[\/:*?"<>|]/.test(f) || f; });
  T("bardzo długa nazwa jest przycinana", ()=>w.nazwaPliku("etykieta","x".repeat(200)).length < 60);
  T("podsumowanie podaje rozmiar i liczbę zdjęć", ()=>{
    const o = w.opisWycinka({notes:[{h:'<img src="x"><img src="y">'}]});
    return o.zdjec===2 && /kB|MB/.test(o.rozmiar); });

  console.log("═══ DOSTĘPNE Z MENU ═══");
  T("menu etykiety", ()=>/data-tm="wyslij"/.test(zrodlo("js","07-appearance.js")));
  T("menu zakładki sekcji", ()=>/data-zm="wyslij"/.test(zrodlo("js","30-sekcje-zakladki.js")));
  T("menu zakładki publikacji", ()=>/data-pto="wyslij"/.test(zrodlo("js","27-pubtabs.js")));

  console.log("═══ POJEDYNCZA NOTATKA ═══");
  T("jest funkcja wysyłająca jedną notatkę", ()=>typeof w.wyslijNotatke==="function");
  T("pozycja w menu karty notatki", ()=>
     /<div data-x="wyslij">\$\{ICO\.send\}Wyślij na inne urządzenie…<\/div>/.test(zrodlo("js","09-notes.js")));
  T("pozycja także w menu pod prawym przyciskiem", ()=>/data-c="wyslij"/.test(zrodlo("js","25-context-menu.js")));
  T("wycinek zawiera notatkę i jej etykietę", ()=>{
     w.eval(`notes.length=0; tags.length=0; sections.length=0; secTabs.length=0;
       sections.push({id:1,name:"Kongresy",ord:0,open:true});
       secTabs.push({id:7,sec:1,name:"Kongres 2026",ord:0});
       tags.push({id:5,name:"Studium",ord:0,sec:1,stb:7});
       notes.push({g:"n1",t:"Moja",h:"<div>x</div>",c:"x",tg:[5],stb:7,
         b:null,ch:null,ks:null,cr:"2024-01-01",mo:"2024-01-01",del:false});
       notes.push({g:"n2",t:"Obca",h:"",c:"",tg:[],b:null,ch:null,ks:null,
         cr:"2024-01-01",mo:"2024-01-01",del:false});`);
     const wyc = w.zbudujWycinek(w.eval('notes.filter(n=>n.g==="n1")'), [5], [7]);
     return (wyc.notes.length===1 && wyc.notes[0].g==="n1" && wyc.tags.length===1
             && wyc.secTabs.length===1 && wyc.sections.length===1)
            || `notatek ${wyc.notes.length}, etykiet ${wyc.tags.length}`; });
  T("sąsiednia notatka nie jedzie na gapę", ()=>{
     const wyc = w.zbudujWycinek(w.eval('notes.filter(n=>n.g==="n1")'), [5], [7]);
     return !wyc.notes.some(n=>n.g==="n2"); });
  T("plik ma nazwę po tytule notatki", ()=>
     w.nazwaPliku("notatka","Moja notatka")==="jw-notatka-Moja-notatka.json");
  T("zakładki etykiet też jadą razem", ()=>
     /tags\.forEach\(t=>\{ if\(idEtykiet\.includes\(t\.id\) && t\.stb\) idZakladek\.add\(t\.stb\); \}\)/
       .test(zrodlo("js","33-udostepnianie.js")));

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
