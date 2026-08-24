/* ==========================================================================
   KOLEJNOŚĆ W PUBLIKACJI
   1. Porównywarka brała TYTUŁ artykułu przed numerem dokumentu — artykuły
      w jednym wydaniu ustawiały się alfabetycznie.
   2. Import pomijał w całości notatki zmienione w aplikacji, razem z ich
      położeniem, więc zostawały ze starymi numerami na zawsze.
   ========================================================================== */
const {T, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const zr = zrodlo("js","09-notes.js");
  const zi = zrodlo("js","17-files.js");
  const N = (g, ks, itn, doc, par, tytul, cr)=>({
    g, t:tytul, c:"", h:"", tg:[], b:null, ch:null, v:null,
    ks, itn, doc, par, pub:tytul, cr:cr||"2024-01-01", mo:"2024-01-01", del:false});
  const uloz = (lista)=>{
    w.eval('notes.length=0; sortMode="pub"; notes.push(...'+JSON.stringify(lista)+');');
    return w.eval('sortNotes(notes.slice()).map(n=>n.g).join(",")');
  };

  console.log("═══ TYTUŁ ARTYKUŁU NIE USTAWIA KOLEJNOŚCI ═══");
  T("decyduje numer dokumentu, nie alfabet", ()=>{
     const wynik = uloz([
       N("b1","w",20240100,1102024201,5,"Bądź odważny"),
       N("z1","w",20240100,1102024101,3,"Zachowuj czujność")]);
     return wynik==="z1,b1" || "otrzymano: "+wynik; });
  T("w kodzie tytuł jest dopiero po numerze akapitu", ()=>{
     const ciało = (zr.match(/pub:\(a,b\)=>\{[\s\S]*?\n    \},/)||[""])[0];
     return ciało.indexOf("a.par") < ciało.indexOf("a.pub") || "tytuł nadal przed akapitem"; });

  console.log("═══ POZOSTAŁE STOPNIE PO KOLEI ═══");
  T("starsze wydanie wyżej", ()=>{
     const wynik = uloz([N("nowe","w",20240300,1102024101,1,"A"), N("stare","w",20240100,1102024101,1,"B")]);
     return wynik==="stare,nowe" || "otrzymano: "+wynik; });
  T("w jednym artykule decyduje numer akapitu", ()=>{
     const wynik = uloz([N("p9","w",20240100,1102024101,9,"Ten sam"), N("p2","w",20240100,1102024101,2,"Ten sam")]);
     return wynik==="p2,p9" || "otrzymano: "+wynik; });
  T("notatki biblijne na końcu", ()=>{
     const wynik = uloz([N("pub1","w",20240100,1102024101,1,"Artykuł"),
       {g:"bib", t:"", c:"", h:"", tg:[], b:40, ch:5, v:3, ks:"nwt", cr:"2024-01-01", mo:"2024-01-01", del:false}]);
     return wynik==="pub1,bib" || "otrzymano: "+wynik; });

  console.log("═══ NOTATKA BEZ NUMERU ARTYKUŁU IDZIE NA KONIEC ═══");
  T("brak numeru dokumentu to koniec publikacji, nie początek", ()=>{
     const wynik = uloz([N("reczna","w",20240100,0,0,"Moja notatka"), N("zksiazki","w",20240100,1102024101,1,"Artykuł")]);
     return wynik==="zksiazki,reczna" || "otrzymano: "+wynik; });
  T("tak też jest zapisane w kodzie", ()=>/a\.doc\|\|Infinity/.test(zr));

  console.log("═══ IMPORT ODŚWIEŻA POŁOŻENIE ═══");
  T("położenie odświeżane osobno od treści", ()=>
     /const polozenie = \["b","ch","v","pub","ks","doc","itn","par"\]/.test(zi));
  T("dotyczy także notatek zmienionych przez użytkownika", ()=>
     /if\(ex\.ed\|\|ex\.tgd\)\{ if\(ruszone\) changed\.push\(ex\); skipped\+\+; \}/.test(zi));
  T("poprawione położenia trafiają do bazy", ()=>/if\(ruszone\) changed\.push\(ex\)/.test(zi));
  T("użytkownik dowiaduje się, ilu notatek to dotyczyło", ()=>/Poprawiono położenie w publikacji u/.test(zi));
  T("treść notatki zostaje nietknięta", ()=>{
     const lista = (zi.match(/const polozenie = \[[^\]]*\]/)||[""])[0];
     return !/"t"|"c"|"h"|"tg"/.test(lista) || "w liście jest treść: "+lista; });

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
