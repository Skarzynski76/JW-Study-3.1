/* ==========================================================================
   OKIENKA NIE MOGĄ CHOWAĆ SIĘ ZA KLAWIATURĄ

   Przy edycji notatki na tablecie: zaznaczasz tekst, wybierasz z menu kolor
   albo cytat — i okienko wyboru znika za klawiaturą albo za dolną krawędzią.

   PRZYCZYNA: wszystkie okienka układały się względem innerHeight. Ta wartość
   NIE zmienia się, gdy wyskoczy klawiatura ekranowa — okno zostaje tej samej
   wysokości, tylko dolna część jest zasłonięta. Menu „mieściło się na ekranie"
   według liczb i jednocześnie nie było go widać. Na tablecie dotkliwie, bo
   klawiatura zabiera tam nawet połowę wysokości.

   Widoczny wycinek podaje visualViewport — i to jego pilnujemy.
   ========================================================================== */
const {T, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const zf = zrodlo("js","04-filters.js");

  console.log("═══ WSPÓLNA MIARA WIDOCZNEGO OBSZARU ═══");
  T("jest funkcja podająca widoczny wycinek", ()=>typeof w.widocznyObszar==="function");
  T("bez visualViewport zwraca całe okno", ()=>{
     const ob = w.widocznyObszar();
     return ob.dol===w.innerHeight && ob.gora===0 || JSON.stringify(ob); });
  T("z visualViewport zwraca to, co widać", ()=>{
     /* Udajemy iPada z klawiaturą: okno 1000 px, widoczne tylko 600 px. */
     w.visualViewport = {offsetLeft:0, offsetTop:0, width:800, height:600,
                         addEventListener(){}, removeEventListener(){}};
     const ob = w.widocznyObszar();
     return ob.dol===600 && ob.wys===600 || JSON.stringify(ob); });

  console.log("═══ MENU LĄDUJE NAD KLAWIATURĄ ═══");
  const menu = ()=>d.getElementById("dropdown");
  const kotwica = ()=>{
    const b = d.getElementById("btnCols");
    b.getBoundingClientRect = ()=>({top:520, bottom:560, left:100, right:160,
                                    width:60, height:40, x:100, y:520});
    return b;
  };
  T("menu nie schodzi poniżej widocznego obszaru", ()=>{
     const dd = menu();
     Object.defineProperty(dd, "offsetHeight", {value:300, configurable:true});
     Object.defineProperty(dd, "offsetWidth",  {value:260, configurable:true});
     dd.style.display = "block";
     w.placeDropdown(dd, kotwica());
     const gora = parseFloat(dd.style.top);
     const wys  = parseFloat(dd.style.maxHeight);
     return (gora + Math.min(300, wys)) <= 600 || `góra ${gora}, wysokość ${wys}`; });
  T("ani powyżej górnej krawędzi", ()=>parseFloat(menu().style.top) >= 10);
  T("wysokość menu ograniczona do tego, co widać", ()=>
     parseFloat(menu().style.maxHeight) <= 600 - 20);
  T("gdy pod przyciskiem brak miejsca, menu idzie nad niego", ()=>{
     const dd = menu();
     Object.defineProperty(dd, "offsetHeight", {value:260, configurable:true});
     w.placeDropdown(dd, kotwica());
     return parseFloat(dd.style.top) < 520 || "góra: "+dd.style.top; });
  T("menu trzyma się też lewej i prawej krawędzi", ()=>{
     const dd = menu();
     const b = d.getElementById("btnCols");
     b.getBoundingClientRect = ()=>({top:100, bottom:140, left:760, right:800,
                                     width:40, height:40, x:760, y:100});
     w.placeDropdown(dd, b);
     return parseFloat(dd.style.left) <= 800 - 260 - 10 || "lewo: "+dd.style.left; });

  console.log("═══ POZOSTAŁE OKIENKA LICZĄ TAK SAMO ═══");
  /* Jedno miejsce naprawione nie wystarczy — użytkownik trafia w te okienka,
     które akurat otworzy. */
  T("pasek kolorów zaznaczenia", ()=>/widocznyObszar/.test(zrodlo("js","15-highlight.js")));
  T("okienko paska edycji", ()=>/widocznyObszar/.test(zrodlo("js","13-editor.js")));
  T("pasek zdjęcia", ()=>/widocznyObszar/.test(zrodlo("js","14-images.js")));
  T("menu kolorów kolumn", ()=>/widocznyObszar/.test(zrodlo("js","07-appearance.js")));
  T("okienko czytnika", ()=>/widocznyObszar/.test(zrodlo("js","10-reader.js")));
  T("menu pod przytrzymaniem palca", ()=>/widocznyObszar/.test(zrodlo("js","25-context-menu.js")));
  T("wybór zapisu albo udostępnienia", ()=>/widocznyObszar/.test(zrodlo("js","19-export-doc.js")));
  T("nigdzie nie zostało liczenia z samego innerHeight", ()=>{
     /* Poza definicją funkcji i pomiarem klawiatury — tam innerHeight jest na miejscu. */
     const pliki = ["07-appearance","10-reader","13-editor","14-images","15-highlight",
                    "19-export-doc","25-context-menu"];
     const zle = pliki.filter(f=>{
       const z = zrodlo("js", f+".js");
       return /style\.top\s*=\s*[^;]*innerHeight/.test(z) || /style\.left\s*=\s*[^;]*innerWidth/.test(z);
     });
     return zle.length===0 || "zostało w: "+zle.join(", "); });

  console.log("═══ PASEK KOLORÓW SZUKA MIEJSCA, NIE ZNIKA ═══");
  T("gdy pod zaznaczeniem brak miejsca, próbuje nad nim", ()=>
     /const nad = r\.top - h - 12;/.test(zrodlo("js","15-highlight.js")));
  T("a w ostateczności przypina się do dolnej krawędzi widocznego obszaru", ()=>
     /ob\.dol - h - 12/.test(zrodlo("js","15-highlight.js")));

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
