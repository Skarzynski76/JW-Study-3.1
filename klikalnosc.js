/* ==========================================================================
   APLIKACJA NIE MOŻE PRZESTAĆ REAGOWAĆ NA DOTYK

   Zgłoszenie: „na telefonie nie działa więcej funkcji, np. wgranie notatek
   z OneNote". Przyczyna nie miała nic wspólnego z importem.

   Przenoszenie elementów (v1.96) zakładało na <body> klasę `wTrakcieChwytu`,
   a nasłuch w fazie przechwytywania POŁYKAŁ KAŻDE kliknięcie w całej
   aplikacji, dopóki ta klasa tam była. Wystarczyło, żeby raz nie doszło
   `pointerup` — na telefonie zdarza się to często: przerysowanie listy zabiera
   element spod palca, gest przejmuje system, przeglądarka odbiera zdarzenie
   karcie. Klasa zostawała na zawsze i aplikacja przestawała reagować na
   cokolwiek: ustawienia, przyciski, okno wyboru pliku z kopią.

   Ten zestaw pilnuje, żeby żadna blokada nie mogła być trwała.
   ========================================================================== */
const {T, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const zr = zrodlo("js","34-chwytanie.js");

  w.eval(`notes.length=0;tags.length=0;sections.length=0;secTabs.length=0;idb=null;
    tags.push({id:1,name:"Alfa",ord:0});
    tags.push({id:2,name:"Beta",ord:10});
    renderAll();`);

  /** Czy zwykłe kliknięcie w aplikacji dochodzi do skutku. */
  const klikDziala = ()=>{
    let doszlo = false;
    const b = d.getElementById("btnSettings");
    const h = ()=>{ doszlo = true; };
    b.addEventListener("click", h);
    b.dispatchEvent(new w.MouseEvent("click",{bubbles:true,cancelable:true}));
    b.removeEventListener("click", h);
    return doszlo;
  };

  console.log("═══ STAN WYJŚCIOWY ═══");
  T("kliknięcia normalnie działają", ()=>klikDziala());
  T("nie ma nasłuchu połykającego wszystko po klasie na body", ()=>
     !/classList\.contains\("wTrakcieChwytu"\)\)\{ e\.preventDefault/.test(zr));
  T("blokada jest jednorazowa i ograniczona czasem", ()=>
     /_polkniecieDo/.test(zr) && /Date\.now\(\) \+ 400/.test(zr));

  console.log("═══ PRZERWANY GEST NIE ZOSTAWIA BLOKADY ═══");
  /* Sedno usterki: puszczenie palca przepada, a aplikacja ma działać dalej. */
  const uchwyt = ()=>d.querySelector('#tagList .item[data-k="1"] .dragOrd');
  T("po zgubionym puszczeniu palca aplikacja nadal reaguje", ()=>{
     uchwyt().dispatchEvent(new w.PointerEvent("pointerdown",
       {bubbles:true,pointerId:1,clientX:10,clientY:10}));
     d.dispatchEvent(new w.PointerEvent("pointermove",
       {bubbles:true,pointerId:1,clientX:10,clientY:60}));
     /* ŻADNEGO pointerup — dokładnie tak, jak gubi je telefon. */
     w.posprzatajChwyt();
     return klikDziala(); });
  T("klasa z <body> jest zdejmowana", ()=>!d.body.classList.contains("wTrakcieChwytu"));
  T("etykietka i linia znikają z ekranu", ()=>
     !d.querySelector(".chwytDuszek") && !d.querySelector(".chwytWskaznik"));
  T("żaden wiersz nie zostaje wyblakły", ()=>!d.querySelector(".chwytany"));

  console.log("═══ KILKA NIEZALEŻNYCH DRÓG SPRZĄTANIA ═══");
  /* Jedna droga to za mało — telefon potrafi zgubić każdą z osobna. */
  T("przy utracie okna", ()=>/window\.addEventListener\("blur", posprzatajChwyt\)/.test(zr));
  T("przy przerwaniu gestu przez system", ()=>
     /window\.addEventListener\("pointercancel", posprzatajChwyt\)/.test(zr));
  T("przy schowaniu aplikacji w tło", ()=>
     /visibilitychange[\s\S]{0,60}posprzatajChwyt/.test(zr));
  T("i strażnik czasowy, gdy wszystko inne zawiedzie", ()=>
     /ostatniRuch \|\| 0\) > 5000/.test(zr));

  console.log("═══ BLOKADA NADAL ROBI SWOJE ═══");
  T("po przerwanym geście nic nie jest połykane", ()=>{
     w.posprzatajChwyt();
     return klikDziala(); });
  T("połknięcie dotyczy jednego kliknięcia, nie strumienia", ()=>
     /_polkniecieDo = 0;\s*\/\/ jedno kliknięcie, nie strumień/.test(zr));

  console.log("═══ MENU: PRZERYSOWANY WIERSZ TO NADAL TEN SAM WIERSZ ═══");
  T("porównujemy polecenie, nie tylko węzeł", ()=>
     /opis\(_ddNacisniete\) === opis\(teraz\)/.test(zrodlo("js","25-context-menu.js")));

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
