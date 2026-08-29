/* ==========================================================================
   WŁASNA WYSOKOŚĆ KAŻDEJ NOTATKI

   Widok listy pokazywał każdą kartę w całości, widok zwarty przycinał wszystkie
   do trzech linijek — zawsze CAŁĄ listę naraz. Notatki są różne: jedna ma dwa
   zdania i zajmuje pół ekranu na darmo, druga ma dwie strony.

   Testy pilnują trzech rzeczy: że wysokość jest ustawiana osobno dla każdej
   notatki, że przeżywa przerysowanie i zapis, oraz że nie udaje zmiany treści
   (data modyfikacji musi zostać nietknięta — inaczej samo zmniejszenie karty
   przestawiałoby notatkę w sortowaniu „ostatnio zmienione").
   ========================================================================== */
const {T, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const zr = zrodlo("js","38-wysokosc.js");
  const css = zrodlo("css","11-polish.css").replace(/\s+/g," ");

  w.eval(`notes.length=0; tags.length=0; idb=null;
    notes.push({g:"a",t:"Krótka",h:"<div>Dwa zdania.</div>",c:"Dwa zdania.",tg:[],
      b:null,ch:null,ks:null,cr:"2024-01-01",mo:"2024-01-01",del:false});
    notes.push({g:"b",t:"Długa",h:"<div>"+"Treść ".repeat(400)+"</div>",c:"x",tg:[],
      b:null,ch:null,ks:null,cr:"2024-01-02",mo:"2024-01-02",del:false});
    renderAll();`);
  const karta = (g)=>d.querySelector('#noteList .ncard[data-g="'+g+'"]');
  const tresc = (g)=>karta(g) && karta(g).querySelector(".ncontent");
  const nota  = (g)=>w.eval('notes.find(n=>n.g==="'+g+'")');

  console.log("═══ KAŻDA NOTATKA MA SWOJĄ WYSOKOŚĆ ═══");
  T("każda karta ma uchwyt do zmiany wysokości", ()=>
     d.querySelectorAll("#noteList .ncard .wysUchwyt").length===2);
  T("ustawienie dotyczy jednej notatki, nie całej listy", ()=>{
     w.ustawWysokosc(nota("a"), 140);
     w.renderNotes();
     return tresc("a").style.maxHeight==="140px" && !tresc("b").style.maxHeight
            || `a: ${tresc("a").style.maxHeight}, b: ${tresc("b").style.maxHeight}`; });
  T("druga notatka może mieć zupełnie inną", ()=>{
     w.ustawWysokosc(nota("b"), 420);
     w.renderNotes();
     return tresc("b").style.maxHeight==="420px" && tresc("a").style.maxHeight==="140px"; });
  T("treść przewija się w karcie, a nie rozpycha listy", ()=>
     tresc("a").style.overflowY==="auto");
  T("widać, że treść jest ucięta", ()=>
     /\.ncard\.wlasnaWys:not\(\.pelnaWys\) \.ncontent\{ -webkit-mask-image/.test(css));

  console.log("═══ WARTOŚCI SKRAJNE ═══");
  T("nie da się zmniejszyć poniżej rozsądku", ()=>{
     w.ustawWysokosc(nota("a"), 5);
     return nota("a").wys===60 || "zapisano: "+nota("a").wys; });
  T("ani rozdmuchać bez granic", ()=>{
     w.ustawWysokosc(nota("a"), 999999);
     return nota("a").wys===4000 || "zapisano: "+nota("a").wys; });
  T("zero znaczy „cała notatka”, a nie brak ustawienia", ()=>{
     w.ustawWysokosc(nota("a"), 0);
     w.renderNotes();
     return nota("a").wys===0 && karta("a").classList.contains("pelnaWys")
            && tresc("a").style.maxHeight==="none"; });
  T("„cała notatka” przebija też widok zwarty", ()=>
     /#noteList\.v-compact \.ncard\.pelnaWys \.ncontent\{ max-height:none!important/.test(css));
  T("można wrócić do ustawienia z widoku", ()=>{
     w.ustawWysokosc(nota("a"), null);
     w.renderNotes();
     return nota("a").wys===undefined && !tresc("a").style.maxHeight
            && !karta("a").classList.contains("wlasnaWys"); });

  console.log("═══ USTAWIENIE MUSI PRZEŻYĆ ═══");
  T("wysokość jest częścią odcisku karty", ()=>{
     /* Bez tego karta zostaje w pamięci podręcznej i zmiana nie trafia na ekran. */
     return /n\.cr, n\.wys,/.test(zrodlo("js","09-notes.js")); });
  T("zmiana wysokości pojawia się po przerysowaniu", ()=>{
     w.ustawWysokosc(nota("b"), 200);
     w.renderAll();
     return tresc("b").style.maxHeight==="200px" || "jest: "+tresc("b").style.maxHeight; });
  T("wysokość jedzie z notatką w kopii zapasowej", ()=>{
     const kop = JSON.parse(w.eval('JSON.stringify(notes.find(n=>n.g==="b"))'));
     return kop.wys===200 || "w kopii: "+kop.wys; });
  T("data zmiany notatki zostaje nietknięta", ()=>{
     /* Zmieniło się miejsce na ekranie, a nie treść. Gdyby data rosła, samo
        zmniejszenie karty przestawiałoby notatkę w sortowaniu wg zmiany. */
     const przed = nota("b").mo;
     w.ustawWysokosc(nota("b"), 300);
     return nota("b").mo===przed || "data zmieniona z "+przed+" na "+nota("b").mo; });
  T("kod nie woła markDirty przy zmianie wysokości", ()=>{
     /* Zawężone do samej funkcji: w wersji jednoplikowej „zr" to cały index.html,
        a markDirty jest tam używane w wielu miejscach — i słusznie. */
     const f = (zr.match(/function ustawWysokosc\(n, px\)[\s\S]*?\n\}/)||[""])[0];
     return f.length>150 && !/markDirty/.test(f) || "nie znaleziono funkcji"; });

  console.log("═══ DWIE DROGI USTAWIENIA ═══");
  T("uchwyt reaguje na palec tak samo jak na mysz", ()=>
     /pointerdown/.test(zr) && /pointermove/.test(zr) && /pointercancel/.test(zr));
  T("uchwyt nie przewija listy podczas ciągnięcia", ()=>
     /\.ncard \.wysUchwyt\{ height:12px; margin:2px -4px -6px; cursor:ns-resize; touch-action:none;/.test(css));
  T("na dotyku uchwyt jest widoczny od razu", ()=>
     /@media \(hover:none\)\{ \.ncard \.wysUchwyt\{ opacity:\.45; height:16px; \} \}/.test(css));
  T("jest też menu z gotowymi rozmiarami", ()=>typeof w.menuWysokosci==="function");
  T("menu dostępne z karty notatki", ()=>/data-x="wysokosc"/.test(zrodlo("js","09-notes.js")));
  T("menu pokazuje, który rozmiar jest wybrany", ()=>{
     w.ustawWysokosc(nota("a"), 260);
     w.menuWysokosci(nota("a"), d.body);
     const zazn = d.querySelector('#dropdown [data-wys="260"] .ddZnak');
     return !!zazn; });
  T("z menu da się wrócić do ustawienia z widoku", ()=>
     !!d.querySelector('#dropdown [data-wys="auto"]'));
  T("dwuklik w uchwyt przywraca wysokość z widoku", ()=>
     /addEventListener\("dblclick"/.test(zr));

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
