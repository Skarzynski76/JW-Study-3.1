/* ==========================================================================
   WYDOBYCIE KARTECZKI NA WIERZCH

   Karteczka na tablicy pokazuje początek notatki. Żeby przeczytać więcej,
   trzeba było otwierać ją na pełnym ekranie i wracać — a to gubi miejsce
   w siatce i rytm przeglądania.

   Testy pilnują trzech rzeczy, które łatwo zepsuć:
     • po wydobyciu w siatce zostaje PODKŁADKA, więc reszta karteczek nie
       przeskakuje (bez tego całość wygląda na zepsutą),
     • przerysowanie listy nie zostawia osieroconej podkładki,
     • dotknięcie przycisku w karteczce robi to, co przycisk, a nie powiększa.
   ========================================================================== */
const {T, TA, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const css = zrodlo("css","11-polish.css").replace(/\s+/g," ");
  const zr = zrodlo("js","40-wydobycie.js");

  w.eval(`notes.length=0; tags.length=0; idb=null;
    for(let i=0;i<9;i++) notes.push({g:"k"+i,t:"Notatka "+i,
      h:"<div>"+"Zdanie treści. ".repeat(40)+"</div>", c:"Treść", tg:[],
      b:null,ch:null,ks:null,cr:"2024-01-01",mo:"2024-01-01",del:false});
    setNoteView("tablica"); renderAll();`);
  const karta = (g)=>d.querySelector('#noteList .ncard[data-g="'+g+'"]');
  const podkladki = ()=>d.querySelectorAll("#noteList .wydPodkladka").length;

  console.log("═══ DOTKNIĘCIE WYDOBYWA ═══");
  T("wszystkie karteczki są w siatce", ()=>d.querySelectorAll("#noteList .ncard").length===9);
  T("dotknięcie treści powiększa karteczkę", ()=>{
     karta("k2").querySelector(".ncontent").dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
     return karta("k2").classList.contains("wydobyta"); });
  T("w siatce zostaje podkładka, żeby reszta nie przeskoczyła", ()=>podkladki()===1);
  T("podkładka ma wysokość karty, którą zastąpiła", ()=>
     !!d.querySelector("#noteList .wydPodkladka").style.height);
  T("karta wychodzi z układu i staje nad resztą", ()=>{
     const st = karta("k2").style;
     return st.position==="absolute" && !!st.width && !!st.height
            || `position ${st.position}, ${st.width}×${st.height}`; });
  T("tylko jedna karteczka naraz", ()=>{
     karta("k5").querySelector(".ncontent").dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
     return d.querySelectorAll("#noteList .ncard.wydobyta").length===1
         && karta("k5").classList.contains("wydobyta"); });
  T("po zamianie nadal jest dokładnie jedna podkładka", ()=>podkladki()===1);

  console.log("═══ DRUGIE DOTKNIĘCIE ODKŁADA ═══");
  T("ruch ma swój czas i krzywą", ()=>
     /transition:top \.26s cubic-bezier/.test(css) && /const WYD_CZAS = 260;/.test(zr));
  T("odkładanie wraca do miejsca trzymanego przez podkładkę", ()=>
     /const r = podkladka\.getBoundingClientRect\(\);/.test(zr));
  T("Escape też odkłada", ()=>/e\.key==="Escape" && _wydobyta/.test(zr));
  T("dotknięcie obok odkłada karteczkę", ()=>
     /if\(_wydobyta && !\(e\.target\.closest && e\.target\.closest\("#dropdown"\)\)\)/.test(zr));

  console.log("═══ NIE PRZESZKADZA TEMU, CO BYŁO ═══");
  /* Gdyby powiększanie łapało każde dotknięcie, przyciski w karteczce
     przestałyby działać, a zaznaczanie tekstu zwijałoby ją w połowie zdania. */
  T("przyciski w karteczce działają po swojemu", ()=>{
     const przed = d.querySelectorAll("#noteList .ncard.wydobyta").length;
     const b = karta("k1").querySelector('[data-act="pin"]');
     b.dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
     return !karta("k1") || !karta("k1").classList.contains("wydobyta"); });
  T("pomijamy przyciski, odnośniki i uchwyty", ()=>
     /button, a, select, input, textarea, \.ntools, \.drag, \.dragOrd, \.wysUchwyt/.test(zr));
  T("zaznaczony tekst nie zwija karteczki", ()=>
     /zazn && !zazn\.isCollapsed/.test(zr));
  T("poza tablicą powiększanie nie działa", ()=>{
     w.eval('setNoteView("list"); renderAll();');
     const k = d.querySelector("#noteList .ncard .ncontent");
     k.dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
     const ile = d.querySelectorAll("#noteList .ncard.wydobyta").length;
     w.eval('setNoteView("tablica"); renderAll();');
     return ile===0 || "wydobytych: "+ile; });

  console.log("═══ PRZERYSOWANIE NIE ZOSTAWIA ŚMIECI ═══");
  /* Karty powstają od nowa przy każdym przerysowaniu. Wydobyta karta zniknęłaby,
     a podkładka została pustym miejscem w siatce. */
  T("przerysowanie odkłada karteczkę", ()=>{
     karta("k3").querySelector(".ncontent").dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
     w.renderAll();
     return d.querySelectorAll("#noteList .ncard.wydobyta").length===0; });
  T("i nie zostawia osieroconej podkładki", ()=>podkladki()===0);
  T("odkładanie jest wołane na starcie przerysowania", ()=>
     /schowajKarteczke\(true\);/.test(zrodlo("js","09-notes.js")));

  console.log("═══ ROZMIAR: KARTKA A6 W PIONIE ═══");
  /* „Jedna trzecia okna" dawała przysadzisty prostokąt na szerokim ekranie
     i coś zupełnie innego na wąskim. Kartka ma stały kształt. */
  T("proporcja arkusza A6", ()=>/const A6_STOSUNEK = 1\.4142;/.test(zr));
  T("liczona z widocznego obszaru, nie z całego okna", ()=>/widocznyObszar/.test(zr));
  /* Pomocnik: udajemy ekran i wymiary listy. */
  const ekran = (szer, wys, listaSzer, listaWys)=>{
     w.visualViewport = {offsetLeft:0, offsetTop:0, width:szer, height:wys,
                         addEventListener(){}, removeEventListener(){}};
     const lista = d.getElementById("noteList");
     lista.getBoundingClientRect = ()=>({top:0,left:0,width:listaSzer,height:listaWys,
                                         right:listaSzer,bottom:listaWys});
     return lista;
  };
  const male = (szer, wys)=>({width:szer, height:wys, top:0, left:0});

  T("kształt A6 przy małych karteczkach w rzędzie", ()=>{
     const lista = ekran(1400, 900, 1200, 800);
     const r = w.rozmiarWydobycia(lista, male(220, 240));
     const stos = r.wys / r.szer;
     return Math.abs(stos - 1.4142) < 0.02 || `${r.szer}×${r.wys}, stosunek ${stos.toFixed(3)}`; });
  T("na wąskim telefonie kartka bierze całą dostępną szerokość", ()=>{
     /* Tu proporcja ustępuje z rozmysłem: na 360 px szerokości trzymanie A6
        oznaczałoby kartkę o połowę węższą od ekranu i zmarnowane miejsce.
        Kartka zostaje pionowa i mieści się w liście — o to chodzi. */
     const lista = ekran(360, 640, 340, 560);
     const r = w.rozmiarWydobycia(lista, male(150, 200));
     return (r.szer <= 340-16 && r.szer >= 300 && r.wys > r.szer)
            || `${r.szer}×${r.wys}`; });
  T("pionowo, a nie poziomo", ()=>{
     const lista = ekran(1400, 900, 1200, 800);
     const r = w.rozmiarWydobycia(lista, male(220, 240));
     return r.wys > r.szer || `${r.szer}×${r.wys}`; });
  T("kartka dostała trzydzieści procent zapasu", ()=>
     /const A6_ZAPAS = 1\.3;/.test(zr));

  console.log("═══ ZAWSZE WIĘKSZA NIŻ TA W RZĘDZIE ═══");
  /* Przy dwóch albo trzech karteczkach w rzędzie karty są szerokie i sama
     kartka A6 wychodziła od nich WĘŻSZA — kliknięcie wyglądało jak
     pomniejszenie. To jest ta usterka. */
  T("przy trzech w rzędzie rośnie w obie strony", ()=>{
     const lista = ekran(1400, 900, 1200, 800);
     const m = male(390, 240);                       // 3 karteczki w rzędzie
     const r = w.rozmiarWydobycia(lista, m);
     return (r.szer > m.width && r.wys > m.height)
            || `z ${m.width}×${m.height} zrobiło się ${r.szer}×${r.wys}`; });
  T("przy dwóch w rzędzie także", ()=>{
     const lista = ekran(1400, 900, 1200, 800);
     const m = male(590, 300);                       // 2 karteczki w rzędzie
     const r = w.rozmiarWydobycia(lista, m);
     return (r.szer > m.width && r.wys > m.height)
            || `z ${m.width}×${m.height} zrobiło się ${r.szer}×${r.wys}`; });
  T("przy bardzo dużych karteczkach nie kurczy się poniżej pierwotnej", ()=>{
     const lista = ekran(1000, 700, 900, 600);
     const m = male(860, 440);                       // karta prawie na całą listę
     const r = w.rozmiarWydobycia(lista, m);
     return (r.szer >= Math.min(m.width, 900-16) && r.wys >= Math.min(m.height, 600-16))
            || `z ${m.width}×${m.height} zrobiło się ${r.szer}×${r.wys}`; });
  T("wysokość liczona po odjęciu rezerwy na pasek", ()=>{
     /* Karta zaczyna się POD paskiem, więc miejsca w pionie jest tyle, ile
        zostaje po odjęciu rezerwy. Liczenie od pełnej wysokości listy
        sprawiało, że karta wystawała dołem, a pasek ikon lądował na krawędzi
        albo poza nią — nie dało się go dotknąć. */
     const lista = ekran(1400, 1000, 1500, 1100);
     lista.style.paddingTop = "90px";
     const r = w.rozmiarWydobycia(lista, male(300, 240));
     lista.style.paddingTop = "";
     return r.wys <= 1100 - 90 - 40 + 1 || `wysokość ${r.wys} przy liście 1100 i rezerwie 90`; });
  await TA("karta mieści się między paskiem a dolną krawędzią", async ()=>{
     const lista = d.getElementById("noteList");
     lista.style.paddingTop = "90px";
     lista.getBoundingClientRect = ()=>({top:0,left:0,width:1500,height:1100,right:1500,bottom:1100});
     w.visualViewport = {offsetLeft:0, offsetTop:0, width:1400, height:1000,
                         addEventListener(){}, removeEventListener(){}};
     w.eval(`notes.length=0;
       for(let i=0;i<6;i++) notes.push({g:"g"+i,t:"N"+i,h:"<div>T</div>",c:"T",tg:[],
         b:null,ch:null,ks:null,cr:"2024-01-01",mo:"2024-01-01",del:false});
       setNoteView("tablica"); renderAll();
       fsGuid=null;`);
     const k = d.querySelector("#noteList .ncard");
     k.getBoundingClientRect = ()=>({top:100,left:20,width:300,height:240,right:320,bottom:340});
     k.querySelector(".ncontent").dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
     /* Wymiary docelowe nadawane są w następnej klatce — inaczej ruch nie
        miałby od czego się zacząć. */
     await new Promise(r=>setTimeout(r, 30));
     const top = parseFloat(k.style.top), wys = parseFloat(k.style.height);
     lista.style.paddingTop = "";
     const gora = 90 + 20, dol = 1100 - 20;
     return (top >= gora - 0.5 && top + wys <= dol + 0.5)
            || `karta ${top}…${top+wys}, dozwolone ${gora}…${dol}`; });
  T("między karteczką a krawędziami zostaje oddech", ()=>
     /const oddech  = 20;/.test(zr));
  T("nadal mieści się w liście i na ekranie", ()=>{
     const lista = ekran(1000, 700, 900, 600);
     const r = w.rozmiarWydobycia(lista, male(860, 440));
     return r.szer <= 900-16 && r.wys <= 700-40
            || `${r.szer}×${r.wys} przy liście 900 i ekranie 700`; });
  T("próg wzrostu zapisany wprost", ()=>/const WYD_MIN_WZROST = 1\.12;/.test(zr));
  T("rozmiar liczony ze znajomością małej karty", ()=>
     /rozmiarWydobycia\(lista, r\)/.test(zr));
  T("nie wychodzi poza listę", ()=>
     /Math\.max\(8, Math\.min\(left, rl\.width - szer - 8\)\)/.test(zr));

  console.log("═══ PRZEWIJANIE NIE ODKŁADA KARTECZKI ═══");
  /* Wcześniej przewinięcie listy odkładało karteczkę — miało znaczyć „szukam
     czegoś dalej". W praktyce, gdy tekst sięgał końca albo mieścił się
     w całości, palec przewijał listę pod spodem i karteczka znikała w chwili,
     gdy użytkownik chciał tylko doczytać zdanie. Od narzędzia do czytania
     trzeba wymagać przewidywalności. */
  T("przewinięcie treści w karteczce jej nie zamyka", ()=>{
     w.eval('closeFs(); renderAll();');
     const k = d.querySelector("#noteList .ncard");
     k.querySelector(".ncontent").dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
     const wydobyta = k.classList.contains("wydobyta");
     k.querySelector(".ncontent").dispatchEvent(new w.Event("scroll",{bubbles:false}));
     return (wydobyta && k.classList.contains("wydobyta"))
            || `wydobyta na starcie: ${wydobyta}, po przewinięciu: ${k.classList.contains("wydobyta")}`; });
  T("przewinięcie CAŁEJ listy też jej nie zamyka", ()=>{
     const k = d.querySelector("#noteList .ncard.wydobyta");
     if(!k) return "nie było wydobytej karteczki";
     d.getElementById("noteList").dispatchEvent(new w.Event("scroll",{bubbles:false}));
     return k.classList.contains("wydobyta") || "karteczka zniknęła przy przewijaniu"; });
  T("nie ma już nasłuchu, który by ją odkładał przy przewijaniu", ()=>
     /* Szukamy dokładnie tej reguły, a nie słowa „scroll": w wersji
        jednoplikowej „zr" to cały index.html, w którym przewijanie jest
        nasłuchiwane też gdzie indziej i słusznie. */
     !/if\(e\.target === \$\("noteList"\)\) schowajKarteczke\(\);/.test(zr));
  await TA("dotknięcie karteczki odkłada ją do rzędu", async ()=>{
     const k = d.querySelector("#noteList .ncard.wydobyta");
     if(!k) return "nie było wydobytej karteczki";
     k.querySelector(".ncontent").dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
     await new Promise(r=>setTimeout(r, 340));
     return !k.classList.contains("wydobyta") || "karteczka została podniesiona"; });
  T("i nie zostawia po sobie podkładki", ()=>podkladki()===0);

  console.log("═══ W POWIĘKSZENIU WIDAĆ WIĘCEJ ═══");
  T("wracają szczegóły ukryte na małej karteczce", ()=>
     /#noteList\.v-tablica \.ncard\.wydobyta \.nmeta2\{ display:flex!important;/.test(css));

  console.log("═══ ODNOŚNIK NIE ZAGŁUSZA TREŚCI ═══");
  /* Wiersz z pochodzeniem notatki jest pomyślany dla szerokiej listy. Na kartce
     A6 zajmował trzecią część powierzchni — czyli zagłuszał to, po co się ją
     wydobywa. */
  T("odnośnik zmniejszony mniej więcej o połowę", ()=>{
     const m = /#noteList\.v-tablica \.ncard\.wydobyta \.refbtn\{[^}]*font-size:calc\(var\(--noteFs,14px\) - (\d+)px\)/.exec(css);
     return (m && +m[1] >= 4) || "zmniejszenie: "+(m && m[1]); });
  T("i ma mniejsze wypełnienie", ()=>
     /#noteList\.v-tablica \.ncard\.wydobyta \.refbtn\{ padding:2px 8px;/.test(css));
  T("nazwa publikacji mieści się w jednym wierszu", ()=>
     /#noteList\.v-tablica \.ncard\.wydobyta \.refbtn\{[^}]*white-space:nowrap;/.test(css));
  T("cały wiersz nie zawija się na dwie linie", ()=>
     /#noteList\.v-tablica \.ncard\.wydobyta \.nmeta2\{[^}]*flex-wrap:nowrap;/.test(css));
  T("plakietki i data też są drobne", ()=>
     /#noteList\.v-tablica \.ncard\.wydobyta \.pill\{[^}]*font-size:calc\(var\(--noteFs,14px\) - 5px\)/.test(css));
  T("pełna nazwa zostaje w podpowiedzi, nic nie ginie", ()=>
     /title="Otwórz w JW Library"/.test(zrodlo("js","09-notes.js")));
  T("tytuł dostaje trzy wiersze zamiast dwóch", ()=>
     /#noteList\.v-tablica \.ncard\.wydobyta \.ntitle\{ -webkit-line-clamp:3; \}/.test(css));
  T("pasek ikon jest od razu dostępny", ()=>
     /#noteList\.v-tablica \.ncard\.wydobyta \.ntools\{ opacity:1; pointer-events:auto; \}/.test(css));
  T("kto nie chce ruchu, ten go nie dostaje", ()=>
     /@media \(prefers-reduced-motion: reduce\)\{ #noteList\.v-tablica \.ncard\.wRuchuWydobycia\{ transition:none; \} \}/.test(css));

  console.log("═══ TREŚĆ DA SIĘ PRZEWINĄĆ DO KOŃCA ═══");
  /* Pasek ikon leży NAD treścią, więc bez zapasu u dołu zasłaniał ostatnie
     zdanie: tekst się kończył, a widać go nie było. */
  T("pod tekstem jest zapas na pasek i kilka linijek", ()=>
     /padding:8px 10px calc\(38px \+ 3\.2em\)/.test(css));
  T("pasek ikon bierze kolor karteczki, nie szarość panelu", ()=>
     /background:linear-gradient\(180deg, transparent, var\(--tloKarty, var\(--panel\)\) 42%\)/.test(css));

  console.log("═══ NASŁUCH NA CAŁEJ STRONIE NIE MOŻE SIĘ WYWRACAĆ ═══");
  /* Celem kliknięcia bywa sam dokument, który nie ma metody closest. Nasłuchy
     pilnujące całej strony wywracały się wtedy na zwykłym dotknięciu tła,
     a błąd z fazy przechwytywania trafia do okna jako gołe „Script error." —
     bez pliku i numeru wiersza, czyli bez żadnej wskazówki. */
  T("dotknięcie tła nie zgłasza błędu", ()=>{
     const przed = errors.length;
     d.dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
     d.dispatchEvent(new w.MouseEvent("mouseup",{bubbles:true}));
     return errors.length===przed || "błąd: "+errors.slice(-1)[0]; });
  T("wszystkie zdarzenia na tle są bezpieczne", ()=>{
     /* Sprawdzamy zachowanie, a nie zapis w kodzie: wysyłamy na dokument te
        zdarzenia, które aplikacja nasłuchuje globalnie, i wymagamy ciszy.
        Sprawdzanie po treści kodu myliło się na nasłuchach podpiętych do
        pojedynczych elementów, gdzie cel zawsze jest elementem. */
     const przed = errors.length;
     ["click","mouseup","pointerdown","pointerup","dragstart","contextmenu","scroll"]
       .forEach(nazwa=>{
          const E = nazwa.startsWith("pointer") ? w.PointerEvent
                  : nazwa==="scroll" ? w.Event : w.MouseEvent;
          try{ d.dispatchEvent(new E(nazwa,{bubbles:true})); }catch(e){}
       });
     return errors.length===przed || "błąd: "+errors.slice(przed).join(" | "); });

  console.log("═══ DWA DOTKNIĘCIA NALEŻĄ DO ZAZNACZANIA ═══");
  /* Przez trzy wydania dwa dotknięcia otwierały pełny ekran. Gest usunięty:
     na dotyku dwa stuknięcia w słowo to ZAZNACZENIE SŁOWA — odbieranie tego
     kosztowało więcej, niż dawał skrót. Objawiało się to tak, że przy próbie
     zaznaczenia słowa w edycji nie działo się nic: nasłuch przechwytywał
     drugie stuknięcie, zatrzymywał je i przerysowywał notatkę, a razem z nią
     ginęło świeże zaznaczenie. */
  const dotknij = (el, x, y)=>{
    const ev = new w.MouseEvent("click",
      {bubbles:true, cancelable:true, clientX:x||10, clientY:y||10});
    el.dispatchEvent(ev);
    return ev.defaultPrevented;
  };
  T("po gescie nie został ani ślad w kodzie", ()=>
     !/toDrugieDotkniecie|DWUKLIK_CZAS|_ostatnieDotkniecie/.test(zr));
  T("czytnik nie zamyka się od dwóch stuknięć w treść", ()=>{
     w.eval(`notes.length=0; fsGuid=null;
       notes.push({g:"z1",t:"Notatka",h:"<div>Zdanie do zaznaczenia</div>",
         c:"Zdanie do zaznaczenia",tg:[],b:null,ch:null,ks:null,
         cr:"2024-01-01",mo:"2024-01-01",del:false});
       setNoteView("tablica"); renderAll(); openFs(notes[0]);`);
     const tresc = d.querySelector("#fsWrap .ncontent");
     if(!tresc) return "brak treści w czytniku";
     dotknij(tresc, 50, 50); dotknij(tresc, 51, 52);
     return w.eval("fsGuid")==="z1" || "czytnik się zamknął"; });
  T("i nikt nie odbiera drugiego stuknięcia", ()=>{
     const tresc = d.querySelector("#fsWrap .ncontent");
     const zablokowano = dotknij(tresc, 60, 60) || dotknij(tresc, 61, 61);
     return !zablokowano || "zdarzenie zostało zatrzymane"; });

  console.log("═══ W EDYCJI NA PEŁNYM EKRANIE DA SIĘ ZAZNACZAĆ ═══");
  /* Zgłoszenie wprost: „gdy edytuję tekst, próbuję zaznaczyć słowo czy zdanie
     na pełnym — nic się nie dzieje". Sprawdzamy trzy rzeczy naraz: że pole
     edycji w ogóle powstaje, że zaznaczenie w nim przeżywa dotknięcia i że
     pasek edycji — jedyne miejsce, z którego coś z zaznaczeniem zrobisz —
     jest w zasięgu. */
  T("pole edycji powstaje w pełnym ekranie", ()=>{
     const karta = d.querySelector("#fsWrap .ncard");
     const n = w.eval("notes[0]");
     w.toggleEdit(karta, n);
     const ce = d.querySelector("#fsWrap .ncontent");
     return (ce && ce.getAttribute("contenteditable")==="true")
            || "treść nie stała się edytowalna"; });
  T("pasek edycji jest przy tekście, nie gdzieś poza kartą", ()=>{
     const pasek = d.querySelector("#fsWrap .editbar");
     return !!(pasek && pasek.closest(".ncard")) || "brak paska edycji"; });
  T("zaznaczenie przeżywa dotknięcia w polu edycji", ()=>{
     const ce = d.querySelector("#fsWrap .ncontent");
     const wezel = ce.firstChild && (ce.firstChild.firstChild || ce.firstChild);
     if(!wezel) return "pole edycji jest puste";
     const zakres = d.createRange();
     try{ zakres.setStart(wezel, 0); zakres.setEnd(wezel, 6); }
     catch(e){ return "nie dało się ustawić zaznaczenia: "+e.message; }
     /* Wspólny szkielet podstawia uproszczone window.getSelection — do
        prawdziwego zaznaczania sięgamy po to z dokumentu. */
     const poprzednie = w.getSelection;
     const sel = d.getSelection(); sel.removeAllRanges(); sel.addRange(zakres);
     w.getSelection = ()=>d.getSelection();
     dotknij(ce, 40, 40); dotknij(ce, 41, 41);
     const teraz = d.getSelection();
     w.getSelection = poprzednie;
     return (teraz.rangeCount && !teraz.isCollapsed)
            || "zaznaczenie zniknęło po dotknięciu"; });
  T("rysik nie wchodzi w drogę pisaniu w polu edycji", ()=>{
     const ce = d.querySelector("#fsWrap .ncontent");
     if(typeof w.trescDoZaznaczania !== "function") return "brak trescDoZaznaczania";
     return w.trescDoZaznaczania(ce)===null
            || "rysik przejmuje zaznaczanie w trybie edycji"; });
  T("pasek kolorów nie zasłania paska edycji", ()=>
     /if\(cont\.isContentEditable\)\{ hlBar\.style\.display="none"; return; \}/.test(zr)
     || !/hlBar/.test(zr));   // w wersji jednoplikowej reguła jest, ale w innym miejscu
  T("w miniaturze nie ma czego zaznaczać do edycji", ()=>{
     w.eval('closeFs(); renderAll();');
     return d.querySelectorAll('#noteList .ncontent[contenteditable="true"]').length===0; });

  console.log("═══ MENU JEST OSIĄGALNE Z KAŻDEJ POSTACI ═══");
  /* Na tablicy pasek ikon jest schowany, dopóki karteczka jest mała — a długie
     przytrzymanie było blokowane na treści notatki. Menu stawało się więc
     nieosiągalne: ani z paska, ani przytrzymaniem. */
  T("przytrzymanie na treści miniatury otwiera menu", ()=>{
     w.eval(`notes.length=0;
       notes.push({g:"m1",t:"Notatka",h:"<div>Treść</div>",c:"Treść",tg:[],
         b:null,ch:null,ks:null,cr:"2024-01-01",mo:"2024-01-01",del:false});
       setNoteView("tablica"); renderAll();`);
     const tresc = d.querySelector("#noteList .ncard .ncontent");
     return w.contextMenuBlocked(tresc)===false
            || "przytrzymanie nadal zablokowane"; });
  T("ale w powiększonej karteczce tekst nadal służy do zaznaczania", ()=>{
     const k = d.querySelector("#noteList .ncard");
     k.classList.add("wydobyta");
     const zablokowane = w.contextMenuBlocked(k.querySelector(".ncontent"));
     k.classList.remove("wydobyta");
     return zablokowane===true || "przytrzymanie przejmuje zaznaczanie"; });
  T("w pozostałych widokach też zostaje po staremu", ()=>{
     w.eval('setNoteView("list"); renderAll();');
     const zablokowane = w.contextMenuBlocked(d.querySelector("#noteList .ncard .ncontent"));
     w.eval('setNoteView("tablica"); renderAll();');
     return zablokowane===true || "zmieniono zachowanie poza tablicą"; });
  T("na dotyku pasek w powiększonej karteczce jest wyraźny", ()=>
     /@media \(hover:none\)\{[^@]*#noteList\.v-tablica \.ncard\.wydobyta \.ntools\{[^}]*border-top:1px solid var\(--border\);/
       .test(zrodlo("css","11-polish.css").replace(/\s+/g," ")));
  T("i ma większe przyciski pod palec", ()=>
     /#noteList\.v-tablica \.ncard\.wydobyta \.ntools \.sbtn\.ico\{ padding:7px 9px; \}/
       .test(zrodlo("css","11-polish.css").replace(/\s+/g," ")));

  console.log("═══ W MINIATURZE SIĘ NIE PISZE ═══");
  /* Karteczka reaguje na dotknięcia (podnosi się, odkłada, przewija treść),
     więc pisanie w niej to walka gestów: próba przesunięcia kursora zwijała
     kartę i tekst uciekał. Miejsce do pisania musi być spokojne. */
  T("dotknięcie ✎ na karteczce otwiera pełny ekran zamiast edycji w miejscu", ()=>{
     w.eval(`notes.length=0; fsGuid=null;
       notes.push({g:"e1",t:"Do edycji",h:"<div>Treść</div>",c:"Treść",tg:[],
         b:null,ch:null,ks:null,cr:"2024-01-01",mo:"2024-01-01",del:false});
       setNoteView("tablica"); renderAll();`);
     const karta = d.querySelector("#noteList .ncard");
     w.toggleEdit(karta, w.eval('notes.find(n=>n.g==="e1")'));
     return (!karta.classList.contains("editing") && w.eval("fsGuid")==="e1")
            || `edycja w miniaturze: ${karta.classList.contains("editing")}, czytnik: ${w.eval("fsGuid")}`; });
  await TA("po chwili edycja włącza się w czytniku", ()=>new Promise(r=>setTimeout(()=>{
     const wCzytniku = d.querySelector("#fsWrap .ncard");
     r((wCzytniku && wCzytniku.classList.contains("editing")) || "czytnik nie wszedł w edycję");
  }, 120)));
  T("w pozostałych widokach edycja w miejscu zostaje", ()=>{
     w.eval('closeFs(); setNoteView("list"); renderAll();');
     const karta = d.querySelector("#noteList .ncard");
     w.toggleEdit(karta, w.eval('notes.find(n=>n.g==="e1")'));
     const jest = karta.classList.contains("editing");
     if(jest) w.toggleEdit(karta, w.eval('notes.find(n=>n.g==="e1")'));
     w.eval('setNoteView("tablica"); renderAll();');
     return jest || "edycja w liście przestała działać"; });
  T("pasek edycji nie pokazuje się na karteczce", ()=>
     /#noteList\.v-tablica \.ncard \.editbar\{ display:none!important; \}/
       .test(zrodlo("css","11-polish.css").replace(/\s+/g," ")));

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
