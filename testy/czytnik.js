/* ==========================================================================
   CZYTNIK NA PEŁNYM EKRANIE — tytuł, pasek narzędzi, przycisk zamknięcia.
   ========================================================================== */
const {T, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const css = zrodlo("css","11-polish.css").replace(/\s+/g," ");
  const js  = zrodlo("js","10-reader.js");

  console.log("═══ TYTUŁ NOTATKI ═══");
  T("rozmiar tytułu nie zależy od szerokości okna", ()=>{
     const wszystkie=[...css.matchAll(/#fsWrap \.ntitle\{[^{}]*font-size:\s*(clamp\([^;}]+\))/g)];
     if(!wszystkie.length) return "brak reguły rozmiaru";
     const r=wszystkie[wszystkie.length-1][1];
     if(/vw/.test(r)) return "wciąż skaluje się z oknem: "+r;
     const gora=r.match(/(\d+)px\s*\)\s*$/);
     return (gora && +gora[1]<=26) || "górna granica za duża: "+r; });
  T("tytuł nie wchodzi pod przycisk zamknięcia", ()=>
     /#fsWrap \.nhead\{[^}]*padding-right:calc\(clamp\(4px, 2vw, 20px\) \+ 46px\)/.test(css));
  T("długi tytuł się łamie", ()=>/#fsWrap \.ntitle\{ padding-right:2px; overflow-wrap:anywhere/.test(css));

  console.log("═══ PASEK NARZĘDZI NIE WCHODZI W TYTUŁ ═══");
  T("poza edycją pasek ustępuje belce", ()=>/#fsWrap \.editbar\{ top:calc\(var\(--nheadH, 0px\) \+ 4px\)/.test(css));
  T("w edycji belka przestaje być przyklejona", ()=>/#fsWrap \.ncard\.editing \.nhead\{ position:static/.test(css));
  T("w edycji pasek trzyma się krawędzi", ()=>/#fsWrap \.ncard\.editing \.editbar\{ top:0/.test(css));
  T("pasek nad belką tytułu", ()=>{
     const a=css.match(/#fsWrap \.editbar\{[^}]*z-index:(\d+)/);
     const b=css.match(/#fsWrap \.nhead\{[^}]*z-index:(\d+)/);
     return (a && b && +a[1] > +b[1]) || "warstwy: pasek "+(a&&a[1])+" belka "+(b&&b[1]); });
  T("pasek edycji nad resztą listy", ()=>/#noteList \.editbar\{ z-index:11/.test(css));
  T("pasek nieprzezroczysty", ()=>/\.editbar\{ background:var\(--panel\)/.test(css));

  console.log("═══ TYTUŁ NIE PŁYWA NAD TREŚCIĄ ═══");
  /* Nagłówek notatki był przyklejony do góry. Przy czytaniu wisiał nad tekstem
     i zabierał miejsce, a przy edycji nachodził na pasek narzędzi. Tytuł to
     podpis notatki, nie pasek sterowania — należy do początku dokumentu. */
  T("nagłówek przewija się razem z treścią", ()=>
     /#fsWrap \.nhead\{ position:static!important; \}/.test(css));
  T("zamknięcie zostaje w rogu okna, nie odjeżdża z tytułem", ()=>
     /#modalFs \.fsmodal > #fsClose\{[\s\S]*?position:absolute;/.test(css));
  T("nie ma dwóch krzyżyków naraz", ()=>
     /#fsWrap \.fsCloseInline\{ display:none!important; \}/.test(css));
  T("po schowaniu krzyżyka nagłówek odzyskuje odstęp", ()=>
     /#fsWrap \.nhead\{ padding-right:clamp\(4px, 2vw, 20px\)!important; \}/.test(css));

  console.log("═══ PRZYCISK ZAMKNIĘCIA ═══");
  T("w edycji trzyma się rogu okna", ()=>/#fsWrap \.ncard\.editing \.fsCloseInline\{ position:fixed/.test(css));
  T("nad paskiem narzędzi", ()=>{
     const a=css.match(/#fsWrap \.ncard\.editing \.fsCloseInline\{[^}]*z-index:(\d+)/);
     const b=css.match(/#fsWrap \.editbar\{[^}]*z-index:(\d+)/);
     return a && b && +a[1] > +b[1]; });
  T("pasek ma rezerwę, żeby krzyżyk nie zasłaniał przycisków", ()=>
     /#fsWrap \.ncard\.editing \.editbar\{[^}]*padding-right:calc\(46px \+ 8px\)/.test(css));

  console.log("═══ REZERWA POD BELKĘ ═══");
  T("wysokość belki mierzona", ()=>/function zmierzNhead/.test(js));
  T("w edycji rezerwa zerowana", ()=>/const wEdycji = !!document\.querySelector\("#fsWrap \.ncard\.editing"\)/.test(js));
  T("belka pilnowana na bieżąco", ()=>/ResizeObserver/.test(js) && /function pilnujNhead/.test(js));
  T("przeliczenie przy wejściu i wyjściu z edycji", ()=>(zrodlo("js","14-images.js").match(/zmierzNhead\(\)/g)||[]).length>=2);
  T("wejście w edycję zeruje rezerwę", ()=>{
     d.documentElement.style.setProperty("--nheadH","44px");
     const wrap=d.getElementById("fsWrap");
     const karta=d.createElement("div"); karta.className="ncard editing";
     const belka=d.createElement("div"); belka.className="nhead"; karta.appendChild(belka);
     wrap.appendChild(karta);
     w.zmierzNhead();
     const wynik=d.documentElement.style.getPropertyValue("--nheadH");
     karta.remove();
     return wynik==="0px" || "ustawiono "+wynik; });

  console.log("═══ PUSTA NOTATKA NA PEŁNYM EKRANIE ═══");
  T("treść rozciąga się na całą szerokość", ()=>/width:100%/.test(css) && /align-self:stretch/.test(css));

  T("czytnik nadal działa", ()=>typeof w.renderFs==="function" && typeof w.closeFs==="function");
  T("brak błędów wykonania", ()=>errors.length===0 || errors.join(" "));
});
