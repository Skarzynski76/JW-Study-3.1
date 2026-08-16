/* ==========================================================================
   MIEJSCE NOTATKI W PUBLIKACJI
   Import odświeża położenie każdej notatki (v2.01). Bez wyjątku dla znacznika
   `pw` skasowałby ręczny wybór przy najbliższym wczytaniu kopii. Testy pilnują
   OBU brzegów: że znacznik chroni wybór i że nie chroni niczego ponadto.
   ========================================================================== */
const {T, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const zi = zrodlo("js","17-files.js");
  const zm = zrodlo("js","36-miejsce.js");
  w.eval(`notes.length=0; tags.length=0; sortMode="pub";
    notes.push({g:"a",t:"Z publikacji",h:"",c:"",tg:[],b:null,ch:null,v:null,
      ks:"w",itn:20240100,doc:1102024101,par:5,pub:"Artykuł pierwszy",cr:"2024-01-01",mo:"2024-01-01",del:false});
    notes.push({g:"b",t:"Drugi artykuł",h:"",c:"",tg:[],b:null,ch:null,v:null,
      ks:"w",itn:20240100,doc:1102024201,par:2,pub:"Artykuł drugi",cr:"2024-01-01",mo:"2024-01-01",del:false});
    notes.push({g:"c",t:"Przysłana",h:"",c:"",tg:[],b:null,ch:null,v:null,
      ks:"",itn:0,doc:0,par:0,pub:"",cr:"2024-01-01",mo:"2024-01-01",del:false});
    renderAll();`);

  console.log("═══ SKĄD BIERZE SIĘ LISTA WYBORU ═══");
  T("publikacje brane z notatek, które już są", ()=>{
     const p = w.dostepnePublikacje();
     return p.length===1 && p[0][0]==="w|20240100" || JSON.stringify(p); });
  T("artykuły posortowane numerem dokumentu", ()=>{
     const a = w.artykulyPublikacji("w|20240100");
     return a.length===2 && a[0][0]===1102024101 && a[1][0]===1102024201 || JSON.stringify(a); });
  T("notatki biblijne nie trafiają na listę publikacji", ()=>{
     w.eval(`notes.push({g:"bib",t:"",h:"",c:"",tg:[],b:40,ch:5,v:3,ks:"nwt",cr:"2024-01-01",mo:"2024-01-01",del:false});`);
     return w.dostepnePublikacje().length===1; });
  T("bez żadnej publikacji okno tłumaczy, dlaczego", ()=>/Miejsce można wskazać dopiero wtedy/.test(zm));

  console.log("═══ USTAWIONE MIEJSCE DZIAŁA W SORTOWANIU ═══");
  T("przysłana notatka trafia tam, gdzie ją wskazano", ()=>{
     w.eval(`const n=notes.find(x=>x.g==="c"); n.ks="w"; n.itn=20240100; n.doc=1102024101; n.par=1; n.pw=true;`);
     const kol = w.eval('sortNotes(notes.filter(n=>!n.b)).map(n=>n.g).join(",")');
     return kol==="c,a,b" || "otrzymano: "+kol; });
  T("bez wskazania szłaby na koniec publikacji", ()=>{
     w.eval(`const n=notes.find(x=>x.g==="c"); n.doc=0; n.par=0;`);
     const kol = w.eval('sortNotes(notes.filter(n=>!n.b)).map(n=>n.g).join(",")');
     return kol==="a,b,c" || "otrzymano: "+kol; });

  console.log("═══ IMPORT NIE MOŻE ZDEPTAĆ RĘCZNEGO WYBORU ═══");
  T("import pomija położenie notatek ze znacznikiem pw", ()=>/if\(!ex\.pw\) polozenie\.forEach/.test(zi));
  T("znacznik nadawany przy wskazaniu miejsca", ()=>/n\.pw = true;/.test(zm));
  T("i przy ręcznym przypisaniu wersetu", ()=>/n\.itn=0; n\.pw=true;/.test(zrodlo("js","18-export-jwl.js")));
  T("usunięcie przypisania zdejmuje też znacznik", ()=>
     /n\.pw=false;/.test(zrodlo("js","18-export-jwl.js")) && /n\.pw=false;/.test(zm));
  T("notatki BEZ znacznika nadal dostają świeże położenie", ()=>{
     const blok = zi.slice(zi.indexOf("const polozenie ="), zi.indexOf("if(ex.ed||ex.tgd)"));
     return /if\(!ex\.pw\)/.test(blok) && !/if\(ex\.ed\)/.test(blok); });
  T("po imporcie widać, ilu miejsc nie ruszono", ()=>/Nietknięte miejsca ustawione ręcznie/.test(zi));

  console.log("═══ DOSTĘPNE Z MENU ═══");
  T("pozycja w menu karty notatki", ()=>/data-x="miejsce"/.test(zrodlo("js","09-notes.js")));
  T("menu pokazuje, że miejsce ustawiono ręcznie", ()=>
     /n\.pw\?' <span class="ddZnak">✓<\/span>':""/.test(zrodlo("js","09-notes.js")));
  T("publikacja i werset wykluczają się wzajemnie", ()=>/n\.b = 0; n\.ch = null; n\.v = null;/.test(zm));
  T("da się cofnąć", ()=>/pushUndo\(\{type:"note", label:"miejsce w publikacji"/.test(zm));
  T("moduł jest w aplikacji", ()=>typeof w.ustawMiejsceWPublikacji==="function");

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
