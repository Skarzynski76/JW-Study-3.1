/* ==========================================================================
   MENU NA TELEFONIE — TRAFIA TAM, GDZIE DOTKNIĘTO

   Zgłoszenie: „gdy próbuję wysłać notatkę, pokazuje mi przypisz do publikacji".
   Wyłącznie na telefonie. Przyczyny były dwie i obie wynikają z tego, że
   #dropdown jest JEDNYM elementem na całą aplikację i bywa przewijany:

   1. Przewinięcie zostawało po poprzednim menu. Następne otwierało się
      w połowie listy, więc pod palcem stała inna pozycja, niż się wydawało.
      Na komputerze niewidoczne, bo tam menu mieści się na ekranie.

   2. Między dotknięciem a puszczeniem palca lista potrafi drgnąć i `click`
      trafia w wiersz, który dopiero wjechał pod palec.
   ========================================================================== */
const {T, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const zf = zrodlo("js","04-filters.js");
  const zc = zrodlo("js","25-context-menu.js");

  w.eval(`notes.length=0;
    notes.push({g:"n1",t:"Test",h:"<div>x</div>",c:"x",tg:[],b:null,ch:null,v:null,
      ks:"w",itn:20240100,doc:111,par:1,pub:"Art",cr:"2024-01-01",mo:"2024-01-01",del:false});
    renderAll();`);
  const dd = ()=>d.getElementById("dropdown");
  const otworzMenuKarty = ()=>{
    d.querySelector('#noteList .ncard [data-act="more"]')
     .dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
    return dd();
  };

  console.log("═══ MENU OTWIERA SIĘ ZAWSZE OD GÓRY ═══");
  T("przewinięcie jest zerowane przy otwarciu", ()=>/dd\.scrollTop = 0;/.test(zf));
  T("po przewinięciu i ponownym otwarciu znów widać początek", ()=>{
     const m = otworzMenuKarty();
     m.scrollTop = 120;                       // udajemy, że użytkownik przewinął
     d.body.click();                          // zamknięcie
     otworzMenuKarty();
     return dd().scrollTop===0 || "zostało: "+dd().scrollTop; });

  console.log("═══ DZIAŁA POZYCJA, NA KTÓREJ PALEC WYLĄDOWAŁ ═══");
  /* Sedno zgłoszenia: dotknięcie „Wyślij", a wykonane „Miejsce w publikacji". */
  T("gdy lista drgnie, polecenie NIE jest wykonywane", ()=>{
     const m = otworzMenuKarty();
     w.eval('__wyw=[]; wyslijNotatke=(g)=>__wyw.push("wyslij"); ustawMiejsceWPublikacji=(g)=>__wyw.push("miejsce");');
     const wyslij  = m.querySelector('[data-x="wyslij"]');
     const miejsce = m.querySelector('[data-x="miejsce"]');
     wyslij.dispatchEvent(new w.PointerEvent("pointerdown",{bubbles:true,pointerId:1}));
     miejsce.dispatchEvent(new w.MouseEvent("click",{bubbles:true}));   // lista drgnęła
     return w.eval("__wyw.join(',')")==="" || "wykonano mimo drgnięcia: "+w.eval("__wyw.join(',')"); });
  T("dotknięcie tej samej pozycji działa normalnie", ()=>{
     const m = otworzMenuKarty();
     w.eval('__wyw=[]; wyslijNotatke=(g)=>__wyw.push("wyslij:"+g);');
     const wyslij = m.querySelector('[data-x="wyslij"]');
     wyslij.dispatchEvent(new w.PointerEvent("pointerdown",{bubbles:true,pointerId:1}));
     wyslij.dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
     return w.eval("__wyw.join(',')")==="wyslij:n1" || "wywołano: "+w.eval("__wyw.join(',')"); });
  T("klik bez dotyku (mysz, klawiatura) nie jest blokowany", ()=>{
     const m = otworzMenuKarty();
     w.eval('__wyw=[]; wyslijNotatke=(g)=>__wyw.push("wyslij:"+g);');
     m.querySelector('[data-x="wyslij"]').dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
     return w.eval("__wyw.join(',')")==="wyslij:n1" || "wywołano: "+w.eval("__wyw.join(',')"); });
  T("użytkownik dowiaduje się, czemu nic się nie stało", ()=>
     /Lista drgnęła — dotknij jeszcze raz/.test(zc));
  T("zabezpieczenie obejmuje wszystkie menu, nie tylko notatki", ()=>
     /data-x\],\[data-c\],\[data-kol\],\[data-zm\],\[data-pokaz\]/.test(zc));

  console.log("═══ WYSYŁANIE JEST W ZASIĘGU BEZ PRZEWIJANIA ═══");
  /* Wysyłanie to działanie główne, nie format pliku — stało w „Eksporcie",
     czyli na samym dole długiego menu, gdzie na telefonie trzeba przewijać. */
  T("„Wyślij” stoi w górnej części menu", ()=>{
     const m = otworzMenuKarty();
     const poz = [...m.querySelectorAll("[data-x]")].map(e=>e.dataset.x);
     return poz.indexOf("wyslij") < poz.indexOf("doc") || "kolejność: "+poz.join(","); });
  T("zaraz po kopiowaniu, przed przypisaniami", ()=>{
     const poz = [...dd().querySelectorAll("[data-x]")].map(e=>e.dataset.x);
     return poz.indexOf("wyslij") < poz.indexOf("miejsce") || "kolejność: "+poz.join(","); });

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
