/* ==========================================================================
   ILE MIEJSCA ZOSTAJE NA NOTATKI

   Na iPadzie widać było trzy notatki. Zanim zaczynała się pierwsza, stało nad
   nią PIĘĆ pasków: górny pasek aplikacji w dwóch wierszach, ukryte kolumny,
   „Widok", szybkie filtry i licznik notatek. Każdy z osobna wyglądał niewinnie,
   razem zjadały ponad połowę ekranu.

   Testy pilnują, że składowe nadal istnieją i działają — samo ich schowanie
   byłoby oszustwem — ale mieszczą się w jednym wierszu, a karty notatek nie
   trwonią wysokości na rzeczy, które bywają potrzebne rzadko.
   ========================================================================== */
const {T, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const css = zrodlo("css","11-polish.css").replace(/\s+/g," ");
  const html = zrodlo(".","index.html");

  w.eval(`notes.length=0; tags.length=0; idb=null;
    for(let i=0;i<20;i++) notes.push({g:"n"+i,t:"Notatka "+i,h:"<div>Treść</div>",c:"Treść",
      tg:[],b:null,ch:null,ks:null,cr:"2024-01-01",mo:"2024-01-01",del:false});
    renderAll();`);

  console.log("═══ JEDEN PASEK ZAMIAST CZTERECH ═══");
  T("wszystkie cztery składowe są w jednym pasku", ()=>{
     const pas = d.getElementById("pasekListy");
     return !!pas && ["ukryteKolumny","viewBar","quickFilters","counts"]
       .every(id=>{ const el=d.getElementById(id); return el && el.parentElement===pas; }); });
  T("pasek układa je w wiersz, nie w słupek", ()=>
     /#pasekListy\{ display:flex; flex-wrap:wrap; align-items:center;/.test(css));
  T("składowe nie dokładają własnych marginesów", ()=>
     /#pasekListy > #ukryteKolumny, #pasekListy > #viewBar, #pasekListy > #quickFilters, #pasekListy > #counts\{ padding:0; margin:0; \}/.test(css));
  T("licznik notatek idzie na prawy koniec", ()=>
     /#pasekListy > #counts\{ margin-left:auto/.test(css));
  T("na wąskim ekranie licznik schodzi do własnej linii", ()=>
     /@media \(max-width:600px\)\{ #pasekListy\{ gap:6px 8px; padding:6px 10px 5px; \} #pasekListy > #counts\{ margin-left:0; \} \}/.test(css));

  console.log("═══ NIC NIE ZNIKNĘŁO PO DRODZE ═══");
  /* Zmniejszenie zajmowanego miejsca nie może odbierać funkcji. */
  T("przełącznik widoku nadal działa", ()=>{
     const zwarty = d.querySelector('#viewBar [data-view="compact"]');
     zwarty.click();
     return d.getElementById("noteList").classList.contains("v-compact"); });
  T("i wraca do listy", ()=>{
     d.querySelector('#viewBar [data-view="list"]').click();
     return !d.getElementById("noteList").classList.contains("v-compact"); });
  T("szybkie filtry nadal filtrują", ()=>{
     w.eval('notes[0].fav=true; renderAll();');
     d.querySelector('#quickFilters [data-qf="fav"]').click();
     return d.querySelectorAll("#noteList .ncard").length===1
            || "kart: "+d.querySelectorAll("#noteList .ncard").length; });
  T("licznik notatek nadal pokazuje liczbę", ()=>{
     d.querySelector('#quickFilters [data-qf="all"]').click();
     return /20/.test(d.getElementById("counts").textContent); });
  T("wszystkie sześć filtrów jest na miejscu", ()=>
     d.querySelectorAll("#quickFilters .qf").length===6);

  console.log("═══ TRZECI WIDOK: ŚREDNI ═══");
  /* Dwa widoki były skokiem z jednej skrajności w drugą: albo cała treść
     (trzy notatki na ekranie), albo ucięcie tak mocne, że trzeba otwierać każdą. */
  T("widoków jest więcej niż dwa", ()=>d.querySelectorAll("#viewBar .vb").length>=3);
  T("widok średni da się włączyć", ()=>{
     w.setNoteView("medium");
     return d.getElementById("noteList").classList.contains("v-medium"); });
  T("przycina treść do kilku linijek", ()=>
     /#noteList\.v-medium \.ncontent\{ max-height:7\.5em; line-height:1\.5;/.test(css));
  T("i pozwala ją przewinąć na miejscu", ()=>
     /#noteList\.v-medium \.ncontent\{[^}]*overflow-y:auto; overscroll-behavior:contain;/.test(css));
  T("widać, z której strony jest jeszcze tekst", ()=>
     /\.ncontent\.przewDol:not\(\.przewGora\)\{/.test(css) &&
     /\.ncontent\.przewGora:not\(\.przewDol\)\{/.test(css));
  T("własna wysokość notatki przebija widok", ()=>
     /#noteList\.v-medium \.ncard\.pelnaWys \.ncontent\{ max-height:none; overflow:visible; \}/.test(css));
  T("wybór widoku jest zapamiętywany", ()=>{
     return w.localStorage.getItem("jwsView")==="medium"
            || "zapisano: "+w.localStorage.getItem("jwsView"); });
  T("po ponownym wczytaniu wraca ten sam widok", ()=>
     /includes\(savedView\)/.test(zrodlo("js","06-tags.js")) &&
     /"medium"/.test(zrodlo("js","06-tags.js")));
  T("każdy widok ma własną ikonę", ()=>
     [...d.querySelectorAll("#viewBar .vb")].every(b=>b.querySelector("svg")));
  T("i wracamy do listy bez śladu po średnim", ()=>{
     w.setNoteView("list");
     const k = d.getElementById("noteList").classList;
     return k.contains("v-list") && !k.contains("v-medium") && !k.contains("v-compact"); });
  T("napis „Widok” zniknął, ale przyciski zostały z podpowiedziami", ()=>{
     const b = d.querySelectorAll("#viewBar .vb");
     return b.length>=3 && [...b].every(x=>x.getAttribute("title")); });

  console.log("═══ KARTA NOTATKI BEZ ZBĘDNEGO POWIETRZA ═══");
  T("odstęp między kartami zmniejszony", ()=>/\.ncard\{ margin-bottom:8px; \}/.test(css));
  T("belka tytułu niższa", ()=>/\.nhead\{ padding-top:4px; padding-bottom:3px; \}/.test(css));
  T("pasek ikon niższy", ()=>/\.ntools\{ padding:1px 8px 2px; \}/.test(css));
  T("ikony nadal są klikalne palcem", ()=>
     /\.ntools \.sbtn\.ico\{ padding:5px 7px; \}/.test(css));
  T("wiersz etykiet nadal pojawia się na żądanie", ()=>{
     const karta = d.querySelector("#noteList .ncard");
     const przed = w.getComputedStyle(karta.querySelector(".tagrow")).display;
     karta.classList.add("showtags");
     const po = w.getComputedStyle(karta.querySelector(".tagrow")).display;
     return przed==="none" && po==="flex" || `przed ${przed}, po ${po}`; });

  console.log("═══ GÓRNY PASEK ═══");
  T("pole szukania ustępuje miejsca", ()=>
     /header \.searchwrap\{ flex:1 1 200px; min-width:150px; \}/.test(css));
  T("lista sortowania też", ()=>/header #sortSel\{ flex:0 1 auto; max-width:210px; \}/.test(css));
  T("pasek jest niższy", ()=>/header\{ padding-top:calc\(7px \+ env\(safe-area-inset-top, 0px\)\); padding-bottom:7px; row-gap:6px; \}/.test(css));
  T("„Nowa notatka” nadal jest w pasku", ()=>!!d.getElementById("btnNew"));

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
