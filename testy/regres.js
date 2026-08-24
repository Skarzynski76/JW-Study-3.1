/* ==========================================================================
   REGRESJA — czy aplikacja w ogóle stoi i czy nic nie wypadło z interfejsu.
   Najszerszy zestaw: uruchamiany pierwszy, bo jego wywrotka unieważnia resztę.
   ========================================================================== */
const {T, uruchom, zrodlo} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors})=>{

  console.log("═══ START BEZ WYWROTKI ═══");
  T("brak błędów wykonania", ()=>errors.length===0 || errors.join(" "));
  T("wszystkie moduły wczytane", ()=>d.querySelectorAll("script[src]").length>=29 || d.querySelectorAll("script").length>=29);
  T("kluczowe funkcje istnieją", ()=>{
     const brak=["renderAll","renderNotes","renderTags","renderBooks","renderPubPanel","buildEditbar",
       "openEbPop","sanitize","sanitizeNote","exportJson","toggleEdit","histStart","kolorBezpieczny"]
       .filter(f=>typeof w[f]!=="function");
     return brak.length===0 || "brakuje: "+brak.join(", "); });

  console.log("═══ SZKIELET INTERFEJSU ═══");
  T("cztery kolumny w ustalonej kolejności", ()=>
     [...d.querySelectorAll("main .col")].map(c=>c.id).join(",")==="colBooks,colTags,colPubs,colNotes");
  T("sześć szybkich filtrów", ()=>d.querySelectorAll("#quickFilters .qf").length===6);
  T("lista sortowania niepusta", ()=>d.querySelectorAll("#sortSel option").length>=8);
  T("pasek wyszukiwania", ()=>!!d.getElementById("search"));
  T("przyciski paska górnego", ()=>
     ["btnNew","btnMenu","btnSettings","btnTheme","btnColors","btnBackup","btnCols","fMinus","fPlus"]
       .every(id=>!!d.getElementById(id)));
  T("okna dialogowe na miejscu", ()=>
     ["modalFile","modalNew","modalExport","modalTrash","modalInfo","modalHelp","modalSettings"]
       .every(id=>!!d.getElementById(id)));

  console.log("═══ RYSOWANIE ═══");
  w.eval(`
    notes.length=0; tags.length=0; sections.length=0;
    for(let i=0;i<40;i++) notes.push({g:"n"+i,t:"Notatka "+i,h:"<div>Treść "+i+"</div>",c:"Treść "+i,
      tg:[(i%3)+1],b:(i%2?((i%66)+1):null),ch:(i%20)+1,ks:(i%2?"":"pt"),
      cr:"2025-01-0"+(i%9+1),mo:"2025-02-0"+(i%9+1),del:false,ptb:null});
    for(let i=1;i<=3;i++) tags.push({id:i,name:"Etykieta "+i,ord:i,sec:null,color:""});
    renderAll();
  `);
  T("karty notatek narysowane", ()=>d.querySelectorAll("#noteList .ncard").length>0);
  T("etykiety narysowane", ()=>d.querySelectorAll("#tagList .item").length>=5);
  T("księgi narysowane", ()=>d.querySelectorAll("#bookList .item").length>0);
  T("licznik notatek pokazuje liczbę", ()=>/\d/.test(d.getElementById("counts").textContent));
  T("karta ma komplet przycisków", ()=>{
     const rzad=d.querySelector("#noteList .ncard .btnrow");
     return rzad && rzad.querySelectorAll("button,a").length>=5; });

  console.log("═══ FILTROWANIE I SORTOWANIE ═══");
  T("filtr etykiety zawęża listę", ()=>{
     const przed=w.baseNotes().length;
     w.eval('filt.tag=1; renderAll()');
     const po=w.baseNotes().length;
     w.eval('filt.tag="all"; renderAll()');
     return po>0 && po<przed; });
  T("wyszukiwanie zawęża listę", ()=>{
     w.parseQuery("Notatka 7");
     const po=w.baseNotes().length;
     w.parseQuery("");
     return po>0 && po<40; });
  T("wyszukiwanie bez wyników nie wywraca", ()=>{
     w.parseQuery("zzzzzzz");
     const po=w.baseNotes().length;
     w.parseQuery("");
     return po===0; });
  T("szybki filtr działa", ()=>{
     w.eval('notes[0].pin=true; quickFilter="pin"; renderNotes()');
     const po=w.filteredNotes().length;
     w.eval('quickFilter="all"; renderNotes()');
     return po===1; });

  console.log("═══ TRWAŁOŚĆ USTAWIEŃ ═══");
  T("wielkość pisma zapisywana i ograniczana", ()=>{
     const min=w.eval("FS_MIN"), max=w.eval("FS_MAX");
     return min===6 && max===30; });
  T("skala interfejsu policzona", ()=>{
     w.applyFs();
     return parseFloat(d.documentElement.style.getPropertyValue("--ui"))>0; });

  console.log("═══ ZAPIS TREŚCI ═══");
  T("filtr treści zostawia dozwolone znaczniki", ()=>{
     const wynik=w.sanitize('<div><b>a</b><i>b</i><mark class="hl3">c</mark></div>');
     return /<b>/.test(wynik) && /hl3/.test(wynik); });
  T("filtr treści usuwa resztę", ()=>!/script|onerror/i.test(w.sanitize('<script>x<\/script><img src=y onerror="z">')));
});
