/* ==========================================================================
   POWRÓT DO WSZYSTKICH NOTATEK
   Jeden przycisk musi zdjąć WSZYSTKIE zawężenia naraz — zdjęcie części
   zostawiłoby listę obciętą i wyglądało, jakby nie zadziałał.
   ========================================================================== */
const {T, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const b = ()=>d.getElementById("btnWszystkie");
  const widac = ()=>b() && b().hidden===false;
  w.eval(`notes.length=0; tags.length=0; sections.length=0; secTabs.length=0; idb=null;
    tags.push({id:5,name:"Studium",ord:0});
    for(let i=0;i<8;i++) notes.push({g:"n"+i,t:"Notatka "+i,h:"<div>pokora</div>",c:"pokora",
      tg:i<3?[5]:[],b:null,ch:null,ks:null,cr:"2024-01-01",mo:"2024-01-01",del:false});
    filt.tag="all"; filt.book="all"; filt.ch=null; query=""; quickFilter="all"; renderAll();`);

  console.log("═══ PRZYCISK POKAZUJE SIĘ TYLKO, GDY JEST PO CO ═══");
  T("przy pełnej liście przycisku nie ma", ()=>!widac());
  T("po wyszukaniu przycisk się pojawia", ()=>{ w.eval('query="pokora"; renderAll();'); return widac(); });
  T("mówi, ile notatek wróci", ()=>b().querySelector(".bwN").textContent==="8");
  T("w podpowiedzi wypisane, co zdejmie", ()=>/szukanie/.test(b().title));
  T("po wejściu w etykietę też się pojawia", ()=>{ w.eval('query=""; filt.tag=5; renderAll();'); return widac(); });
  T("i po szybkim filtrze", ()=>{ w.eval('filt.tag="all"; quickFilter="fav"; renderAll();'); return widac(); });

  console.log("═══ JEDEN RUCH ZDEJMUJE WSZYSTKO NARAZ ═══");
  T("zdejmuje szukanie, etykietę, księgę, rozdział i szybki filtr", ()=>{
     w.eval('query="pokora"; filt.tag=5; filt.book="Jan"; filt.ch=3; quickFilter="fav"; renderAll();');
     w.pokazWszystkieNotatki();
     const stan = w.eval('JSON.stringify([query, filt.tag, filt.book, filt.ch, quickFilter])');
     return stan==='["","all","all",null,"all"]' || "zostało: "+stan; });
  T("pole szukania też jest czyszczone", ()=>d.getElementById("search").value==="");
  T("po powrocie widać wszystkie notatki", ()=>
     w.eval("filteredNotes().length")===8 || "widać: "+w.eval("filteredNotes().length"));
  T("przycisk sam znika, gdy nie ma z czego wracać", ()=>!widac());
  T("kliknięcie robi to samo co wywołanie funkcji", ()=>{
     w.eval('query="pokora"; renderAll();');
     b().dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
     return w.eval("query")==="" && !widac(); });

  console.log("═══ KLAWIATURA I POMOC ═══");
  T("klawisz 0 wraca do wszystkich", ()=>{
     w.eval('query="pokora"; renderAll();');
     d.dispatchEvent(new w.KeyboardEvent("keydown",{key:"0",bubbles:true}));
     return w.eval("query")===""; });
  T("skrót nie zadziała podczas pisania w polu", ()=>{
     w.eval('query="pokora"; renderAll();');
     const pole = d.getElementById("search"); pole.focus();
     pole.dispatchEvent(new w.KeyboardEvent("keydown",{key:"0",bubbles:true}));
     const zostalo = w.eval("query")==="pokora";
     pole.blur(); w.pokazWszystkieNotatki();
     return zostalo; });
  T("skrót opisany w ustawieniach", ()=>
     /<kbd>0<\/kbd><span>wszystkie notatki/.test(zrodlo("js","26-settings.js")));
  T("na wąskim pasku zostaje sama strzałka z liczbą", ()=>
     /@media \(max-width:1100px\)\{ #btnWszystkie \.bwTxt\{ display:none; \} \}/
       .test(zrodlo("css","11-polish.css").replace(/\s+/g," ")));
  T("moduł jest w aplikacji", ()=>typeof w.pokazWszystkieNotatki==="function");

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
