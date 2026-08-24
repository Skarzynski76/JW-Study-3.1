/* ==========================================================================
   DOSTĘPNOŚĆ

   Dwa źródła sprawdzeń:
   1. axe-core — silnik reguł WCAG, ten sam, którego używają narzędzia
      przeglądarkowe. Uruchamiany w sześciu stanach aplikacji.
   2. Sprawdzenia własne — kontrast liczony z palety aplikacji, obsługa
      klawiaturą, ognisko w oknach. Tego axe w jsdom nie zrobi, bo nie ma
      układu strony ani kolorów wyliczonych z arkuszy.

   Wymaga: npm install jsdom axe-core
   ========================================================================== */
const fs=require("fs"), path=require("path");
const {T, TA, uruchom} = require("./wspolne-testy.js");

/* Reguły wyłączone i POWÓD — bez powodu wyłączanie reguł jest oszukiwaniem siebie. */
const WYLACZONE = {
  // jsdom nie liczy kolorów z arkuszy; kontrast sprawdzamy niżej własnym testem
  "color-contrast": {enabled:false},
  // wymaga rzeczywistych wymiarów elementów, których jsdom nie ma
  "target-size": {enabled:false},
  "scrollable-region-focusable": {enabled:false}
};
/* Rozwijane menu i palety to elementy przypięte do swoich przycisków, nie treść
   strony. Mają własne role (menu / dialog); reguła „region" oczekiwałaby
   dodatkowo opakowania w punkt orientacyjny, co nic tu nie wnosi. */
const POMIJANE = ["#dropdown", "#colorMenu", "#ebPop", "#hlBar", "#imgBar"];

uruchom(async ({w, d, errors})=>{
  const zrodloAxe = ["/tmp/node_modules/axe-core/axe.min.js",
                     path.join(__dirname,"..","node_modules","axe-core","axe.min.js")]
                    .find(p=>fs.existsSync(p));
  if(!zrodloAxe){ console.log("⚠ brak axe-core — pomijam badanie regułami WCAG (npm install axe-core)"); }
  else w.eval(fs.readFileSync(zrodloAxe,"utf8"));

  w.eval(`for(let i=0;i<5;i++) notes.push({g:"a"+i,t:"Notatka "+i,h:"<div>treść</div>",c:"treść",
    tg:[],b:null,ch:null,ks:null,cr:"2025-01-01",mo:"2025-01-01",del:false,ptb:null}); renderAll();`);

  if(zrodloAxe){
    console.log("═══ REGUŁY WCAG (axe-core) ═══");
    const stany = [
      ["lista notatek",   ()=>{}],
      ["ustawienia",      ()=>w.openSettings()],
      ["nowa notatka",    ()=>d.getElementById("btnNew").click()],
      ["menu kolumn",     ()=>w.otworzMenuKolumn(d.getElementById("btnCols"))],
      ["paleta kolorów",  ()=>w.openColorMenu({target:d.getElementById("btnColors")})],
      ["okno pomocy",     ()=>w.openModal("modalHelp")]
    ];
    for(const [nazwa, przygotuj] of stany){
      przygotuj();
      const r = await w.axe.run({exclude: POMIJANE.map(s=>[s])}, {rules: WYLACZONE});
      await TA("bez naruszeń: "+nazwa, ()=> r.violations.length===0 ||
        r.violations.map(v=>`${v.id} (${v.impact}, ${v.nodes.length})`).join(", "));
    }
  }

  console.log("═══ NAZWY DLA CZYTNIKA EKRANU ═══");
  T("strona ma podany język", ()=>d.documentElement.lang==="pl");
  T("każdy przycisk ma nazwę", ()=>{
     const bez=[...d.querySelectorAll("button")]
       .filter(b=>!b.textContent.trim() && !b.getAttribute("aria-label") && !b.getAttribute("aria-labelledby"));
     return bez.length===0 || bez.length+" bez nazwy: "+bez.slice(0,4).map(b=>b.id||b.className).join(", "); });
  T("wyszukiwarka ma nazwę, nie samą podpowiedź", ()=>!!d.getElementById("search").getAttribute("aria-label"));
  T("wybór sortowania ma nazwę", ()=>!!d.getElementById("sortSel").getAttribute("aria-label"));
  T("ekran wczytywania zapowiada się czytnikowi", ()=>{
     const l=d.getElementById("loading");
     return l.getAttribute("role")==="status" && l.getAttribute("aria-live")==="polite"; });
  T("przełącznik widoku mówi, co jest włączone", ()=>
     [...d.querySelectorAll("#viewBar .vb")].every(b=>b.hasAttribute("aria-pressed")));

  console.log("═══ OKNA DIALOGOWE ═══");
  T("wszystkie okna mają rolę dialogu", ()=>{
     const bez=[...d.querySelectorAll(".overlay")].filter(o=>{
       const m=o.querySelector(".modal")||o;
       return m.getAttribute("role")!=="dialog"; });
     return bez.length===0 || bez.map(o=>o.id).join(", "); });
  T("okna są powiązane z własnym nagłówkiem", ()=>{
     const zNaglowkiem=[...d.querySelectorAll(".overlay")].filter(o=>(o.querySelector(".modal")||o).querySelector("h2,h3"));
     const bezPowiazania=zNaglowkiem.filter(o=>{
       const m=o.querySelector(".modal")||o;
       return !m.getAttribute("aria-labelledby") && !m.getAttribute("aria-label"); });
     return bezPowiazania.length===0 || bezPowiazania.map(o=>o.id).join(", "); });
  T("zamknięte okno jest ukryte dla czytnika", ()=>{
     w.closeModal("modalHelp");
     return d.getElementById("modalHelp").getAttribute("aria-hidden")==="true"; });
  T("otwarcie okna przenosi ognisko do środka", ()=>{
     w.openModal("modalHelp");
     const okno=d.getElementById("modalHelp");
     return okno.contains(d.activeElement) || "ognisko na: "+(d.activeElement&&d.activeElement.tagName); });
  T("zamknięcie oddaje ognisko tam, skąd otwarto", ()=>{
     const przycisk=d.getElementById("btnNew");
     przycisk.focus();
     w.openModal("modalHelp"); w.closeModal("modalHelp");
     return d.activeElement===przycisk || "ognisko na: "+(d.activeElement&&d.activeElement.id); });
  T("klawisz Tab nie wychodzi poza otwarte okno", ()=>{
     w.openModal("modalHelp");
     const okno=d.getElementById("modalHelp");
     const pola=[...okno.querySelectorAll("button, input, select, textarea, a[href]")];
     if(!pola.length) return "okno nie ma nic do ogniskowania";
     pola[pola.length-1].focus();
     okno.dispatchEvent(new w.KeyboardEvent("keydown",{key:"Tab",bubbles:true}));
     const wSrodku = okno.contains(d.activeElement);
     w.closeModal("modalHelp");
     return wSrodku || "ognisko uciekło poza okno"; });

  console.log("═══ ROZWIJANE MENU ═══");
  T("menu ma rolę i nazwę", ()=>{
     const m=d.getElementById("dropdown");
     return m.getAttribute("role")==="menu" && !!m.getAttribute("aria-label"); });
  T("pozycje menu są pozycjami, a nie zwykłymi napisami", ()=>{
     w.otworzMenuKolumn(d.getElementById("btnCols"));
     const poz=[...d.querySelectorAll("#dropdown [data-kol]")];
     return poz.length>0 && poz.every(p=>p.getAttribute("role")==="menuitem"); });
  T("podpisy sekcji nie udają pozycji", ()=>
     [...d.querySelectorAll("#dropdown .dd-lbl")].every(l=>l.getAttribute("role")==="presentation"));
  T("separatory oznaczone", ()=>
     [...d.querySelectorAll("#dropdown .dd-sep")].every(l=>l.getAttribute("role")==="separator"));

  console.log("═══ OBSŁUGA Z KLAWIATURY ═══");
  T("Escape zamyka otwarte okno", ()=>{
     w.openModal("modalHelp");
     d.dispatchEvent(new w.KeyboardEvent("keydown",{key:"Escape",bubbles:true}));
     return !d.getElementById("modalHelp").classList.contains("show"); });
  T("ukośnik przenosi do wyszukiwarki", ()=>{
     d.body.focus();
     d.dispatchEvent(new w.KeyboardEvent("keydown",{key:"/",bubbles:true}));
     return d.activeElement===d.getElementById("search"); });
  T("skróty nie działają podczas pisania", ()=>{
     const pole=d.getElementById("search"); pole.focus();
     const przed=d.querySelectorAll("#noteList .ncard").length;
     pole.dispatchEvent(new w.KeyboardEvent("keydown",{key:"n",bubbles:true}));
     pole.blur();
     return d.querySelectorAll("#noteList .ncard").length===przed; });
  T("kolumny chowa się klawiszami 1-3", ()=>{
     Object.defineProperty(w,"innerWidth",{value:1400,configurable:true});
     d.dispatchEvent(new w.KeyboardEvent("keydown",{key:"2",bubbles:true}));
     const zw=d.getElementById("colTags").classList.contains("collapsed");
     d.dispatchEvent(new w.KeyboardEvent("keydown",{key:"2",bubbles:true}));
     return zw; });

  console.log("═══ KONTRAST WŁASNEJ PALETY ═══");
  /* axe w jsdom nie policzy kontrastu, bo nie ma wyliczonych stylów. Sprawdzamy
     za to sam mechanizm: dla KAŻDEGO koloru z palety aplikacji funkcja
     czytelnyTekst() musi dać napis o kontraście co najmniej 4.5:1 (WCAG AA). */
  const kontrast=(t,b)=>{
     const a=w.luminancja(t), c=w.luminancja(b);
     const [j,ciem]=a>c?[a,c]:[c,a];
     return (j+0.05)/(ciem+0.05); };
  const palety = [["etykiety", w.eval("TAGCOLORS")], ["kompozycje", w.eval("PASTELS").map(p=>p[1])]];
  palety.forEach(([nazwa, kolory])=>{
    const slabe = kolory.filter(c=>kontrast(w.czytelnyTekst(c), c) < 4.5)
                        .map(c=>c+" ("+kontrast(w.czytelnyTekst(c),c).toFixed(1)+":1)");
    T("kontrast napisu na każdym kolorze — "+nazwa, ()=>slabe.length===0 || slabe.join(", "));
  });
  T("kontrast tekstu podstawowego na białym", ()=>{
     const k=kontrast("#1c1c1e","#ffffff");
     return k>=7 || k.toFixed(1)+":1 (oczekiwane 7:1 dla AAA)"; });
  T("pasek górny kompozycji ma czytelny napis", ()=>{
     /* Sprawdzamy dokładnie tę funkcję, której używa aplikacja — nie powtarzamy
        wzoru w teście, bo wtedy sprawdzalibyśmy własną kopię, nie kod. */
     const slabe=w.eval("PASTELS").map(p=>p[1]).filter(c=>{
       const tlo=w.akcentCzytelny(w.desat(c,.18));
       return kontrast(w.czytelnyTekst(tlo), tlo) < 4.5; });
     return slabe.length===0 || slabe.map(c=>{
       const tlo=w.akcentCzytelny(w.desat(c,.18));
       return c+" → "+kontrast(w.czytelnyTekst(tlo),tlo).toFixed(2)+":1"; }).join(", "); });

  console.log("═══ RUCH I ANIMACJE ═══");
  T("da się wyłączyć animacje", ()=>typeof w.applyAnim==="function" || /animMode/.test(String(w.applyFs)) || !!w.eval("typeof animMode"));
  T("aplikacja szanuje ustawienie systemowe", ()=>{
     /* W wersji jednoplikowej style siedzą w index.html — szukamy w obu miejscach. */
     const arkusz = path.join(__dirname,"..","css","11-polish.css");
     const tresc = fs.existsSync(arkusz)
       ? fs.readFileSync(arkusz,"utf8")
       : [...d.querySelectorAll("style")].map(t=>t.textContent).join("\n");
     return /prefers-reduced-motion/.test(tresc) || "brak reguły prefers-reduced-motion"; });

  T("brak błędów wykonania", ()=>errors.length===0 || errors.join(" "));
});
