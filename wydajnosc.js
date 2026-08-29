/* ==========================================================================
   WYDAJNOŚĆ ODŚWIEŻANIA

   Przerysowanie kolumn zdarza się po każdej zmianie filtra, każdej edycji
   i każdym przeniesieniu. Dwa miejsca robiły przy tym pracę wielokrotnie:

   1. secTabCount przelatywał CAŁĄ listę notatek osobno dla każdej zakładki.
   2. nazwijPrzyciskiIkonowe przy każdym przerysowaniu sięgało po textContent
      każdego przycisku z podpowiedzią. Przyciski z widocznym napisem nigdy nie
      dostają aria-label, więc wracały do tej pętli w nieskończoność.

   Testy pilnują, że praca jest wykonywana RAZ — i że wyniki się nie zmieniły.
   ========================================================================== */
const {T, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  w.eval(`notes.length=0; tags.length=0; sections.length=0; secTabs.length=0; idb=null;
    for(let i=0;i<4;i++) sections.push({id:i+1,name:"Sekcja "+i,ord:i,open:true});
    for(let i=0;i<8;i++) secTabs.push({id:i+1,sec:(i%4)+1,name:"Zakładka "+i,ord:i});
    for(let i=0;i<20;i++) tags.push({id:i+1,name:"Etykieta "+i,ord:i*10,sec:(i%4)+1,stb:(i%8)+1});
    for(let i=0;i<400;i++) notes.push({g:"n"+i,t:"N"+i,h:"<div>T</div>",c:"T",tg:[(i%20)+1],
      stb:(i%8)+1,b:null,ch:null,v:null,ks:"w",itn:1,doc:1,par:1,pub:"A",
      cr:"2024-01-01",mo:"2024-01-01",del:false});
    renderAll();`);

  console.log("═══ LICZNIKI ZAKŁADEK: JEDEN PRZEBIEG, TEN SAM WYNIK ═══");
  /* Sposób liczenia sprzed zmiany — wynik musi się zgadzać co do jednego. */
  w.eval(`window.__stary = function(){
    return secTabs.map(z=>{
      const etykiety = tags.filter(t=>t.stb===z.id).map(t=>t.id);
      let ile=0;
      for(const n of notes){ if(n.del) continue;
        if(n.stb===z.id || (etykiety.length && n.tg.some(t=>etykiety.includes(t)))) ile++; }
      return ile; });
  };`);
  T("wyniki identyczne jak przy liczeniu po kolei", ()=>{
     w.resetLicznikowZakladek();
     const nowe = w.eval("secTabs.map(z=>secTabCount(z.id))");
     const stare = w.eval("__stary()");
     return JSON.stringify(nowe)===JSON.stringify(stare)
            || "nowe "+JSON.stringify(nowe)+" ≠ stare "+JSON.stringify(stare); });
  T("notatka w zakładce wprost i przez etykietę liczy się raz", ()=>{
     w.eval(`notes.length=0; tags.length=0; secTabs.length=0;
       secTabs.push({id:1,sec:1,name:"Z",ord:0});
       tags.push({id:5,name:"E",ord:0,sec:1,stb:1});
       tags.push({id:6,name:"F",ord:10,sec:1,stb:1});
       notes.push({g:"a",t:"",h:"",c:"",tg:[5,6],stb:1,b:null,ch:null,ks:null,
         cr:"2024-01-01",mo:"2024-01-01",del:false});
       resetLicznikowZakladek();`);
     return w.secTabCount(1)===1 || "policzono: "+w.secTabCount(1); });
  T("skasowane notatki nie są liczone", ()=>{
     w.eval(`notes[0].del=true; resetLicznikowZakladek();`);
     return w.secTabCount(1)===0 || "policzono: "+w.secTabCount(1); });
  T("liczniki są unieważniane przy każdym przerysowaniu", ()=>
     /resetLicznikowZakladek\(\)/.test(zrodlo("js","09-notes.js")));
  T("liczone jednym przebiegiem, nie po jednym na zakładkę", ()=>{
     /* Pętla po notatkach ma wystąpić RAZ, a secTabCount ma być samym odczytem
        z policzonej mapy — bez własnego przelotu po notatkach. */
     const z = zrodlo("js","30-sekcje-zakladki.js");
     const licz = (z.match(/function licznikiZakladek\(\)[\s\S]*?\n\}/)||[""])[0];
     const czyt = (z.match(/function secTabCount\(id\)[\s\S]*?\n\}/)||[""])[0];
     const ilePetli = (licz.match(/for\s*\(const n of notes\)/g)||[]).length;
     return (ilePetli===1 && !/for\s*\(const n of notes\)/.test(czyt))
            || `pętli po notatkach: ${ilePetli}, w secTabCount: ${/notes/.test(czyt)}`; });

  console.log("═══ OPISY PRZYCISKÓW: PRACA RAZ, NIE W KÓŁKO ═══");
  const SEL = "button[title]:not([aria-label]):not([data-opisany])";
  T("po pierwszym przerysowaniu nie zostaje nic do opisania", ()=>{
     w.eval(`notes.length=0;
       for(let i=0;i<40;i++) notes.push({g:"m"+i,t:"N"+i,h:"<div>T</div>",c:"T",tg:[],
         b:null,ch:null,ks:null,cr:"2024-01-01",mo:"2024-01-01",del:false});
       renderAll();`);
     return d.querySelectorAll(SEL).length===0 || "zostało: "+d.querySelectorAll(SEL).length; });
  T("kolejne przerysowanie też nie zostawia zaległości", ()=>{
     w.renderAll();
     return d.querySelectorAll(SEL).length===0 || "zostało: "+d.querySelectorAll(SEL).length; });
  T("przyciski z napisem dostają znacznik i wypadają z pętli", ()=>
     /b\.setAttribute\("data-opisany","txt"\)/.test(zrodlo("js","21-ui-helpers.js")));
  T("przyciski bez napisu nadal dostają nazwę dla czytnika ekranu", ()=>{
     const bezNazwy = [...d.querySelectorAll("#noteList button[title]")]
       .filter(b=>!b.textContent.trim() && !b.getAttribute("aria-label"));
     return bezNazwy.length===0 || "bez nazwy: "+bezNazwy.length; });
  T("przeglądamy kolumny, nie cały dokument", ()=>
     /\["tagList","bookList","noteList","pubList"\]/.test(zrodlo("js","09-notes.js")));

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
