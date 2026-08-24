/* ==========================================================================
   TABLICA Z KARTECZKAMI I WŁASNE TŁO NOTATKI

   Lista układa notatki jedna pod drugą — po odchudzeniu pasków widać ich kilka,
   ale nadal kilka. Tablica układa je obok siebie w siatkę: na jednym ekranie
   mieści się kilkanaście, a przewijanie ciągnie się dalej tak samo.

   Do tego każda karteczka może mieć własne tło. Testy pilnują, żeby kolor nie
   psuł czytelności (napis dobiera odcień do jasności tła) i żeby nie dało się
   wstawić czegokolwiek w miejsce koloru — wartość trafia do atrybutu style.
   ========================================================================== */
const {T, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const css = zrodlo("css","11-polish.css").replace(/\s+/g," ");
  const zr = zrodlo("js","39-tablica.js");

  w.eval(`notes.length=0; tags.length=0; idb=null;
    for(let i=0;i<12;i++) notes.push({g:"n"+i,t:"Notatka "+i,h:"<div>Treść "+i+"</div>",c:"Treść",
      tg:[],b:null,ch:null,ks:null,cr:"2024-01-01",mo:"2024-01-01",del:false});
    renderAll();`);
  const lista = ()=>d.getElementById("noteList");
  const nota = (g)=>w.eval('notes.find(n=>n.g==="'+g+'")');
  const karta = (g)=>d.querySelector('#noteList .ncard[data-g="'+g+'"]');

  console.log("═══ WIDOK TABLICY ═══");
  T("jest czwarty widok", ()=>d.querySelectorAll("#viewBar .vb").length===4);
  T("da się go włączyć", ()=>{
     w.setNoteView("tablica");
     return lista().classList.contains("v-tablica"); });
  T("karteczki układają się w siatkę, nie w słupek", ()=>
     /#noteList\.v-tablica\{ display:grid;/.test(css));
  T("bez wyboru liczby kolumn siatka dopasowuje się sama", ()=>
     /grid-template-columns:repeat\(auto-fill, minmax\(var\(--kartaMin, 190px\), 1fr\)\)/.test(css));
  T("karteczka ma ograniczoną wysokość", ()=>
     /#noteList\.v-tablica \.ncard\{[^}]*max-height:var\(--kartaWys, 240px\);/.test(css));

  console.log("═══ WIELKOŚĆ KARTECZEK ═══");
  /* Liczba w rzędzie decyduje o szerokości. Osobno trzeba móc powiedzieć, ile
     treści ma się mieścić na jednej karteczce — czyli o jej wysokości. */
  T("jest wybór wielkości, osobny od liczby w rzędzie", ()=>
     !!d.getElementById("rozmiarTablicy") && !!d.getElementById("kolTablicy"));
  T("ma pięć stopni", ()=>d.querySelectorAll("#rozmiarTablicy option").length===5);
  T("wybór zmienia wysokość karteczki", ()=>{
     w.ustawRozmiarTablicy("xl");
     const duza = lista().style.getPropertyValue("--kartaWys").trim();
     w.ustawRozmiarTablicy("xs");
     const mala = lista().style.getPropertyValue("--kartaWys").trim();
     return duza==="440px" && mala==="130px" || `xl ${duza}, xs ${mala}`; });
  T("większe karteczki dostają też więcej szerokości", ()=>{
     w.ustawRozmiarTablicy("xl");
     const szer = lista().style.getPropertyValue("--kartaMin").trim();
     w.ustawRozmiarTablicy("s");
     return szer==="280px" && lista().style.getPropertyValue("--kartaMin").trim()==="170px"; });
  T("przy dopasowaniu automatycznym szerokość idzie za wielkością", ()=>
     /grid-template-columns:repeat\(auto-fill, minmax\(var\(--kartaMin, 190px\), 1fr\)\)/.test(css));
  T("wybór jest zapamiętywany", ()=>{
     w.ustawRozmiarTablicy("l");
     return w.localStorage.getItem("jwsRozmiar")==="l"; });
  T("nieznana wartość nie psuje układu", ()=>{
     const przed = lista().style.getPropertyValue("--kartaWys").trim();
     w.ustawRozmiarTablicy("bzdura");
     return lista().style.getPropertyValue("--kartaWys").trim()===przed; });
  T("wybór wielkości pokazuje się tylko na tablicy", ()=>{
     w.setNoteView("list");
     const schowany = d.getElementById("rozmiarTablicy").hidden;
     w.setNoteView("tablica");
     return schowany && !d.getElementById("rozmiarTablicy").hidden; });

  console.log("═══ NA KARTECZCE LICZY SIĘ TREŚĆ ═══");
  /* PRZYCZYNA: wiersz z odnośnikiem, przyciskiem „Przypisz werset", plakietkami
     i datą zajmował dwie trzecie karteczki. Zostawała jedna ucięta linijka
     tekstu — czyli dokładnie to, po co się na karteczkę patrzy. */
  T("wiersz z wersetem i datą nie zabiera miejsca", ()=>
     /#noteList\.v-tablica \.nmeta2,[\s\S]{0,120}display:none!important;/.test(css));
  T("chowana jest właściwa klasa, nie podobna", ()=>{
     /* Za pierwszym razem schowałem .nmeta, a w kodzie kart jest .nmeta2 —
        reguła nie trafiała w nic i karteczka wyglądała jak przedtem. */
     const kartyHtml = zrodlo("js","09-notes.js");
     const uzywana = /class="(nmeta2?)"/.exec(kartyHtml);
     return !!uzywana && new RegExp("\\."+uzywana[1]+"[,{ ]").test(
       css.slice(css.indexOf("#noteList.v-tablica"), css.indexOf("WŁASNE TŁO")))
       || "karty używają: "+(uzywana&&uzywana[1]); });
  T("treść dostaje całą resztę karteczki", ()=>
     /#noteList\.v-tablica \.ncontent\{ flex:1 1 auto; min-height:0;/.test(css));
  T("pasek ikon leży NAD treścią, nie obok niej", ()=>
     /#noteList\.v-tablica \.ntools\{ position:absolute; left:0; right:0; bottom:0;/.test(css));
  T("i nie przechwytuje dotknięć, póki jest niewidoczny", ()=>
     /#noteList\.v-tablica \.ntools\{[^}]*opacity:0; pointer-events:none;/.test(css));
  T("na dotyku pasek jest dostępny od razu", ()=>
     /@media \(hover:none\)\{[^}]*#noteList\.v-tablica \.ntools\{ opacity:\.85; pointer-events:auto; \}/.test(css));
  T("tytuł zajmuje najwyżej dwie linijki", ()=>
     /#noteList\.v-tablica \.ntitle\{[^}]*-webkit-line-clamp:2;/.test(css));
  T("tytuł nie rozpycha karteczki", ()=>
     /#noteList\.v-tablica \.ntitle\{[^}]*-webkit-line-clamp:2;/.test(css));
  /* Poświata nie jest już przypisana na stałe do widoku — zapala się z tej
     strony, z której faktycznie jest jeszcze tekst (patrz niżej). */
  T("widać, że treść ciągnie się dalej", ()=>
     /\.ncontent\.przewDol:not\(\.przewGora\)\{/.test(css));
  console.log("═══ BELKI Z NAZWĄ GRUPY JUŻ NIE MA ═══");
  /* Przy sortowaniu wg publikacji wstawiała się nad listą belka z nazwą wydania.
     W układzie kafelkowym przykrywała karteczki, a w liście powtarzała to, co
     i tak widać w kolumnie po lewej. Dwa źródła tej samej informacji, z których
     jedno zabierało miejsce — zostało jedno. */
  T("przy sortowaniu wg publikacji nie ma belek grup", ()=>{
     w.eval(`notes.length=0;
       for(let i=0;i<4;i++) notes.push({g:"g"+i,t:"N"+i,h:"<div>T</div>",c:"T",tg:[],
         b:null,ch:null,v:null,ks:"pt14",itn:0,doc:1102024101,par:i+1,
         pub:"Lekcja 2 (a) | Rób dobry użytek z Przekładu Nowego Świata",
         cr:"2024-01-01",mo:"2024-01-01",del:false});
       sortMode="pub"; setNoteView("tablica"); renderAll();`);
     return d.querySelectorAll("#noteList .listGroup").length===0
            || "belek: "+d.querySelectorAll("#noteList .listGroup").length; });
  T("w zwykłej liście też nie", ()=>{
     w.eval('setNoteView("list"); renderAll();');
     const ile = d.querySelectorAll("#noteList .listGroup").length;
     w.eval('setNoteView("tablica"); renderAll();');
     return ile===0 || "belek: "+ile; });
  T("notatki nadal są posortowane wg publikacji", ()=>{
     w.eval('sortMode="pub"; renderAll();');
     const g = [...d.querySelectorAll("#noteList .ncard")].map(x=>x.dataset.g).join(",");
     return g==="g0,g1,g2,g3" || "kolejność: "+g; });
  T("po belce nie został kod ani style", ()=>
     !/listGroup/.test(zrodlo("js","09-notes.js")) && !/listGroup/.test(css));

  /* Wracamy do zestawu notatek, na którym pracują dalsze sprawdzenia. */
  w.eval(`notes.length=0; sortMode="new";
    for(let i=0;i<12;i++) notes.push({g:"n"+i,t:"Notatka "+i,h:"<div>Treść "+i+"</div>",c:"Treść",
      tg:[],b:null,ch:null,ks:null,cr:"2024-01-01",mo:"2024-01-01",del:false});
    renderAll();`);
  T("wszystkie notatki są na tablicy, nic nie ginie", ()=>
     d.querySelectorAll("#noteList .ncard").length===12
     || "kart: "+d.querySelectorAll("#noteList .ncard").length);

  console.log("═══ ILE KARTECZEK W RZĘDZIE ═══");
  T("wybór pokazuje się tylko na tablicy", ()=>!d.getElementById("kolTablicy").hidden);
  T("a w innych widokach jest schowany", ()=>{
     w.setNoteView("list");
     const schowany = d.getElementById("kolTablicy").hidden;
     w.setNoteView("tablica");
     return schowany; });
  T("wybór liczby kolumn działa", ()=>{
     w.ustawKolumnyTablicy(3);
     return lista().style.getPropertyValue("--kolTablicy").trim()==="3"; });
  T("„auto” oddaje decyzję siatce", ()=>{
     w.ustawKolumnyTablicy("auto");
     return lista().style.getPropertyValue("--kolTablicy").trim()==="0"; });
  T("wybór jest zapamiętywany", ()=>{
     w.ustawKolumnyTablicy(4);
     return w.localStorage.getItem("jwsKolumny")==="4"; });

  console.log("═══ WŁASNE TŁO NOTATKI ═══");
  T("kolor z palety trafia na kartę", ()=>{
     w.ustawTloNotatki(nota("n1"), "#fdf3bf");
     w.renderNotes();
     return karta("n1").classList.contains("wlasneTlo")
         && karta("n1").style.getPropertyValue("--tloKarty").trim()==="#fdf3bf"; });
  T("dotyczy jednej notatki, nie wszystkich", ()=>
     !karta("n2").classList.contains("wlasneTlo"));
  T("na jasnym tle napis jest ciemny", ()=>
     karta("n1").style.getPropertyValue("--tekstKarty").trim()==="#1c2b24");
  T("na ciemnym tle napis jest jasny", ()=>{
     w.ustawTloNotatki(nota("n1"), "#123456");
     w.renderNotes();
     return karta("n1").style.getPropertyValue("--tekstKarty").trim()==="#ffffff"; });
  T("da się zdjąć kolor", ()=>{
     w.ustawTloNotatki(nota("n1"), null);
     w.renderNotes();
     return nota("n1").bg===undefined && !karta("n1").classList.contains("wlasneTlo"); });
  T("kolor jedzie z notatką w kopii zapasowej", ()=>{
     w.ustawTloNotatki(nota("n2"), "#d3ecff");
     const kop = JSON.parse(w.eval('JSON.stringify(notes.find(n=>n.g==="n2"))'));
     return kop.bg==="#d3ecff" || "w kopii: "+kop.bg; });
  T("tło jest częścią odcisku karty", ()=>/n\.wys, n\.bg,/.test(zrodlo("js","09-notes.js")));

  console.log("═══ KOLOR NIE MOŻE BYĆ FURTKĄ ═══");
  /* Wartość trafia do atrybutu style — zapis z cudzysłowem pozwoliłby z niego
     wyjść i dopisać własny atrybut. */
  T("próba wstrzyknięcia kodu jest odrzucana", ()=>{
     w.ustawTloNotatki(nota("n3"), '#fff" onload="alert(1)');
     return nota("n3").bg===undefined || "przyjęto: "+nota("n3").bg; });
  T("sprawdzanie idzie przez wspólną funkcję", ()=>/kolorBezpieczny\(kol\)/.test(zr));
  T("kolor z wczytanej kopii też jest sprawdzany", ()=>{
     /* Kopia potrafi krążyć między urządzeniami i wrócić do nas — sito na
        wejściu musi odrzucić tło, które próbuje wyjść z atrybutu style. */
     const wy = w.sanitizeNotes([{g:"z",t:"",h:"",tg:[],bg:'#fff" onload="alert(1)'}], "test", true);
     return wy[0].bg===undefined || "przepuszczono: "+wy[0].bg; });
  T("poprawny kolor z kopii przechodzi", ()=>{
     const wy = w.sanitizeNotes([{g:"z2",t:"",h:"",tg:[],bg:"#d2f2e3"}], "test", true);
     return wy[0].bg==="#d2f2e3" || "odrzucono: "+wy[0].bg; });
  T("wysokość z kopii też jest sprawdzana", ()=>{
     const wy = w.sanitizeNotes([{g:"z3",t:"",h:"",tg:[],wys:"320px; position:fixed"}], "test", true);
     return wy[0].wys===undefined || "przepuszczono: "+wy[0].wys; });

  console.log("═══ WYGLĄD NIE UDAJE ZMIANY TREŚCI ═══");
  T("data zmiany notatki zostaje nietknięta", ()=>{
     const przed = nota("n4").mo;
     w.ustawTloNotatki(nota("n4"), "#ffd9e0");
     return nota("n4").mo===przed || "data zmieniona"; });
  T("kod nie woła markDirty przy zmianie tła", ()=>{
     const f = (zr.match(/function ustawTloNotatki\(n, kol\)[\s\S]*?\n\}/)||[""])[0];
     return f.length>150 && !/markDirty/.test(f); });

  console.log("═══ MENU KOLORÓW ═══");
  T("jest menu tła", ()=>typeof w.menuTlaNotatki==="function");
  T("ma paletę gotowych kolorów", ()=>{
     w.menuTlaNotatki(nota("n5"), d.body);
     return d.querySelectorAll("#dropdown .tloSw[data-tlo]").length===9; });
  T("i dowolny kolor do wyboru", ()=>!!d.querySelector("#dropdown input[type=color][data-tlowlasny]"));
  T("oraz zdjęcie koloru", ()=>!!d.querySelector('#dropdown [data-tlo=""]'));
  T("dostępne z menu karty notatki", ()=>/data-x="tlo"/.test(zrodlo("js","09-notes.js")));

  console.log("═══ PRZEWIJANIE TREŚCI W MAŁEJ KARTECZCE ═══");
  /* Karteczka pokazuje kilkanaście linijek, a notatka bywa dłuższa. Bez tego
     trzeba było otwierać ją na pełnym ekranie tylko po to, żeby zerknąć na koniec. */
  T("treść karteczki daje się przewijać", ()=>
     /#noteList\.v-tablica \.ncontent\{[^}]*overflow-y:auto;/.test(css));
  T("dojechanie do końca nie pociąga całej tablicy", ()=>
     /#noteList\.v-tablica \.ncontent\{[^}]*overscroll-behavior:contain;/.test(css));
  T("w widoku średnim też", ()=>
     /#noteList\.v-medium \.ncontent\{[^}]*overflow-y:auto; overscroll-behavior:contain;/.test(css));
  T("jest funkcja rozpoznająca, z której strony jest jeszcze tekst", ()=>
     typeof w.oznaczPrzewijanie==="function");
  T("poświata u dołu, gdy tekst ciągnie się w dół", ()=>
     /\.ncontent\.przewDol:not\(\.przewGora\)\{[^}]*mask-image:linear-gradient\(180deg,#000 calc\(100% - 18px\),transparent\)/.test(css));
  T("poświata u góry, gdy coś zostało wyżej", ()=>
     /\.ncontent\.przewGora:not\(\.przewDol\)\{[^}]*mask-image:linear-gradient\(180deg,transparent,#000 18px\)/.test(css));
  T("obie naraz, gdy jesteśmy w środku", ()=>
     /\.ncontent\.przewGora\.przewDol\{/.test(css));
  T("krótka notatka nie dostaje żadnej poświaty", ()=>{
     const el = d.createElement("div");
     el.className = "ncontent";
     Object.defineProperty(el, "scrollHeight", {value:100, configurable:true});
     Object.defineProperty(el, "clientHeight", {value:100, configurable:true});
     el.scrollTop = 0;
     w.oznaczPrzewijanie(el);
     return !el.classList.contains("przewDol") && !el.classList.contains("przewGora"); });
  T("na początku długiej notatki poświata jest tylko u dołu", ()=>{
     const el = d.createElement("div");
     el.className = "ncontent";
     Object.defineProperty(el, "scrollHeight", {value:600, configurable:true});
     Object.defineProperty(el, "clientHeight", {value:200, configurable:true});
     el.scrollTop = 0;
     w.oznaczPrzewijanie(el);
     return el.classList.contains("przewDol") && !el.classList.contains("przewGora"); });
  T("w środku — z obu stron", ()=>{
     const el = d.createElement("div");
     el.className = "ncontent";
     Object.defineProperty(el, "scrollHeight", {value:600, configurable:true});
     Object.defineProperty(el, "clientHeight", {value:200, configurable:true});
     el.scrollTop = 200;
     w.oznaczPrzewijanie(el);
     return el.classList.contains("przewDol") && el.classList.contains("przewGora"); });
  T("na końcu — tylko u góry, żeby nie zakrywać ostatniej linijki", ()=>{
     const el = d.createElement("div");
     el.className = "ncontent";
     Object.defineProperty(el, "scrollHeight", {value:600, configurable:true});
     Object.defineProperty(el, "clientHeight", {value:200, configurable:true});
     el.scrollTop = 400;
     w.oznaczPrzewijanie(el);
     return !el.classList.contains("przewDol") && el.classList.contains("przewGora"); });
  T("oznaczenia odświeżają się przy przewijaniu", ()=>
     /addEventListener\("scroll"[\s\S]{0,160}oznaczPrzewijanie\(t\)/.test(zr));
  T("jeden nasłuch na wszystkie karty, nie po jednym na kartę", ()=>
     /\}, true\);/.test(zr) && !/querySelectorAll\("\.ncontent"\)[\s\S]{0,80}addEventListener/.test(zr));

  console.log("═══ ZDJĘCIA W MINIATURACH NIE SĄ SPŁASZCZANE ═══");
  /* PRZYCZYNA: zdjęcie wstawione do notatki dostaje wpisaną W ATRYBUCIE
     szerokość (np. 45%) — tak działa jego regulacja w edytorze. Wpis
     w atrybucie bije każdą regułę arkusza, więc w miniaturze szerokość
     zostawała duża, a sama wysokość była przycinana do 70 px. Obraz wychodził
     spłaszczony. */
  const zeZdjeciem = ()=>{
     w.eval(`notes.length=0;
       notes.push({g:"z",t:"Ze zdjęciem",
         h:'<div>Tekst <img class="img-right" style="width:45%" src="data:image/gif;base64,R0lGODlhAQABAAAAACw="></div>',
         c:"Tekst",tg:[],b:null,ch:null,ks:null,cr:"2024-01-01",mo:"2024-01-01",del:false});
       setNoteView("tablica"); renderAll();`);
     return d.querySelector("#noteList .ncard .ncontent img");
  };
  T("wpisana szerokość ustępuje w miniaturze", ()=>{
     const img = zeZdjeciem();
     const st = w.getComputedStyle(img);
     return (img.style.width==="45%" && st.width==="auto")
            || `w atrybucie ${img.style.width}, wyliczona ${st.width}`; });
  T("wysokość też idzie za proporcją", ()=>
     w.getComputedStyle(d.querySelector("#noteList .ncontent img")).height==="auto");
  T("górna granica wysokości zostaje", ()=>
     w.getComputedStyle(d.querySelector("#noteList .ncontent img")).maxHeight==="70px");
  T("object-fit pilnuje proporcji na wszelki wypadek", ()=>
     w.getComputedStyle(d.querySelector("#noteList .ncontent img")).objectFit==="contain");
  T("zdjęcie nie opływa tekstu w wąskiej karteczce", ()=>{
     const st = w.getComputedStyle(d.querySelector("#noteList .ncontent img"));
     return (st.float||st.cssFloat)==="none"; });
  T("w wydobytej karteczce podgląd jest większy", ()=>
     /#noteList\.v-tablica \.ncard\.wydobyta \.ncontent img\{ max-height:150px; \}/.test(css));
  T("w widoku średnim tak samo", ()=>
     /#noteList\.v-medium \.ncontent img\{ width:auto!important; height:auto!important;/.test(css));

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
