/* ==========================================================================
   CO JEST NAD CZYM — PORZĄDEK WARSTW

   Zgłoszenie: „powiększona karteczka chowa początek treści pod paskiem".
   Przyczyna była w położeniu, ale przy okazji wyszło, że warstwy nigdy nie były
   sprawdzane jako całość — a jest ich jedenaście i każda nowa rzecz dokładała
   swoją liczbę „na oko".

   Ten zestaw ustala i pilnuje jednego porządku. Reguła jest prosta i wynika
   z tego, do czego rzeczy służą: im bardziej coś wymaga uwagi TERAZ, tym wyżej.
   Okno dialogowe przerywa pracę, więc jest najwyżej. Pasek nad listą tylko
   porządkuje widok, więc jest nisko — ale wciąż nad samą listą, bo treść ma pod
   nim przepływać przy przewijaniu.
   ========================================================================== */
const {T, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const z = (sel)=>{
    const el = d.querySelector(sel);
    if(!el) return null;
    const v = parseInt(w.getComputedStyle(el).zIndex, 10);
    return isNaN(v) ? 0 : v;
  };
  /* Kolejność od najniższej warstwy do najwyższej. */
  const porzadek = [
    ["#mobileTabs",   "pasek przełączania kolumn"],
    ["#pasekListy",   "pasek nad listą"],
    ["header",        "górny pasek aplikacji"],
    ["#dropdown",     "menu rozwijane"],
    ["#hlBar",        "pasek kolorów zaznaczenia"],
    ["#colorMenu",    "menu kolorów"],
    [".overlay",      "okna dialogowe"]
  ];

  console.log("═══ PORZĄDEK WARSTW JEST ZACHOWANY ═══");
  porzadek.forEach(([sel,opis],i)=>{
    if(i===0) return;
    const [selP, opisP] = porzadek[i-1];
    T(opis+" nad: "+opisP, ()=>{
      const a = z(sel), b = z(selP);
      return (a!==null && b!==null && a > b) || `${opis} ${a} vs ${opisP} ${b}`; });
  });

  console.log("═══ PASEK NAD LISTĄ: NAD TREŚCIĄ, POD NAGŁÓWKIEM ═══");
  /* Nad listą — bo karty mają pod nim przepływać przy przewijaniu.
     Pod nagłówkiem — bo przy chowaniu wsuwa się właśnie pod niego. */
  T("jest nad zwykłą karteczką", ()=>{
     w.eval(`notes.length=0;
       notes.push({g:"a",t:"N",h:"<div>T</div>",c:"T",tg:[],b:null,ch:null,ks:null,
         cr:"2024-01-01",mo:"2024-01-01",del:false});
       setNoteView("tablica"); renderAll();`);
     const karta = parseInt(w.getComputedStyle(d.querySelector("#noteList .ncard")).zIndex,10);
     return (isNaN(karta) || karta < z("#pasekListy")) || "karta: "+karta; });
  T("jest nad powiększoną karteczką — pasek ma zostać dostępny", ()=>{
     d.querySelector("#noteList .ncontent").dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
     const wyd = d.querySelector("#noteList .ncard.wydobyta");
     if(!wyd) return "nie udało się powiększyć";
     const kz = parseInt(w.getComputedStyle(wyd).zIndex,10);
     return kz < z("#pasekListy") || `karta ${kz}, pasek ${z("#pasekListy")}`; });
  T("i pod górnym paskiem, bo pod niego się wsuwa", ()=>z("#pasekListy") < z("header"));

  console.log("═══ REZERWA POD PASEK W KAŻDYM WIDOKU ═══");
  T("wszystkie cztery widoki zostawiają miejsce na pasek", ()=>{
     const el = d.getElementById("noteList");
     const zle = [];
     ["list","medium","compact","tablica"].forEach(v=>{
       w.setNoteView(v);
       if(!/--wysPaska/.test(w.getComputedStyle(el).paddingTop)) zle.push(v);
     });
     w.setNoteView("list");
     return zle.length===0 || "bez rezerwy: "+zle.join(", "); });

  console.log("═══ OKNA ZASŁANIAJĄ WSZYSTKO INNE ═══");
  /* Okno dialogowe przerywa pracę — nic nie może się nad nim znaleźć. */
  T("okna są ponad każdą inną warstwą", ()=>{
     const okno = z(".overlay");
     const inne = ["header","#mobileTabs","#pasekListy","#dropdown","#hlBar","#colorMenu","#imgBar"]
       .map(s=>[s, z(s)]).filter(([s,v])=>v!==null && v >= okno);
     return inne.length===0 || "nad oknem albo równo: "+inne.map(([s,v])=>s+" "+v).join(", "); });
  T("pasek błędu jest widoczny nawet nad oknem", ()=>{
     /* Komunikat o błędzie ma dotrzeć zawsze — także wtedy, gdy błąd wydarzył
        się przy otwartym oknie. */
     const css = zrodlo("css","11-polish.css").replace(/\s+/g," ");
     const m = /#pasekBledu\{[^}]*z-index:(\d+)/.exec(css);
     return (m && +m[1] > z(".overlay")) || "pasek błędu: "+(m&&m[1])+", okna: "+z(".overlay"); });

  console.log("═══ ŻADNE OKNO NIE WYCHODZI POZA EKRAN ═══");
  T("każde ma ograniczoną wysokość", ()=>{
     const zle = [...d.querySelectorAll(".overlay")].filter(o=>{
       const m = o.firstElementChild;
       if(!m) return true;
       const mh = w.getComputedStyle(m).maxHeight;
       return !mh || mh==="none";
     }).map(o=>o.id);
     return zle.length===0 || "bez ograniczenia: "+zle.join(", "); });
  T("menu rozwijane też", ()=>{
     const mh = w.getComputedStyle(d.getElementById("dropdown")).maxHeight;
     return (mh && mh!=="none") || "max-height: "+mh; });

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
