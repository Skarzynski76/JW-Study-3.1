/* ==========================================================================
   ZAZNACZANIE RYSIKIEM

   Zgłoszenie: „rysik nie od razu reaguje, gdy podczas czytania chcę coś
   zaznaczyć". To nie było opóźnienie w kodzie — na iPadzie rysik domyślnie
   PRZEWIJA tak samo jak palec, a żeby zaznaczyć, trzeba najpierw przytrzymać
   albo dwukrotnie stuknąć w słowo.

   W treści notatki ruch rysikiem zaznacza od pierwszego ruchu. Testy pilnują
   granic tej zmiany: palec ma nadal przewijać, a w trybie edycji rysik ma
   należeć do Scribble, czyli do pisania.
   ========================================================================== */
const {T, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const zr = zrodlo("js","42-rysik.js");

  w.eval(`notes.length=0; tags.length=0; idb=null;
    notes.push({g:"a",t:"Notatka",h:"<div>Pierwsze zdanie treści notatki do zaznaczania.</div>",
      c:"Pierwsze zdanie",tg:[],b:null,ch:null,ks:null,cr:"2024-01-01",mo:"2024-01-01",del:false});
    setNoteView("list"); renderAll();`);
  const tresc = ()=>d.querySelector("#noteList .ncard .ncontent");

  /* jsdom nie ma pozycjonowania tekstu, więc podstawiamy wyznaczanie miejsca
     kursora: każdy punkt trafia w węzeł tekstowy treści. */
  const wezel = ()=>tresc().firstChild.firstChild || tresc().firstChild;
  w.caretRangeFromPoint = (x)=>{
    const r = d.createRange();
    r.setStart(wezel(), Math.min(Math.max(0, Math.round(x/10)), wezel().length||0));
    r.collapse(true);
    return r;
  };
  const dotyk = (typ, x, y, rodzaj)=>{
    const t = {clientX:x, clientY:y, touchType:rodzaj, target:tresc(),
               identifier:1, pageX:x, pageY:y};
    const e = new w.Event(typ, {bubbles:true, cancelable:true});
    e.touches = typ==="touchend" ? [] : [t];
    e.changedTouches = [t];
    Object.defineProperty(e, "target", {value:tresc(), configurable:true});
    d.dispatchEvent(e);
    return e;
  };
  /* Szkielet testów podstawia uproszczone getSelection (aplikacja pyta o nie
     w wielu miejscach). Tutaj potrzebujemy prawdziwego, bo sprawdzamy właśnie
     zaznaczanie. */
  w.getSelection = ()=>d.getSelection();
  const zaznaczone = ()=>String(d.getSelection());

  console.log("═══ RYSIK ZAZNACZA OD PIERWSZEGO RUCHU ═══");
  T("ciągnięcie rysikiem zaznacza tekst", ()=>{
     dotyk("touchstart", 10, 10, "stylus");
     dotyk("touchmove", 200, 12, "stylus");
     dotyk("touchend", 200, 12, "stylus");
     return zaznaczone().length > 0 || "nic nie zaznaczono"; });
  T("i odbiera przewijanie tylko wtedy, gdy naprawdę zaznacza", ()=>{
     w.getSelection().removeAllRanges();
     dotyk("touchstart", 10, 10, "stylus");
     const male = dotyk("touchmove", 12, 11, "stylus");    // drgnięcie
     const duze = dotyk("touchmove", 200, 12, "stylus");   // ruch
     dotyk("touchend", 200, 12, "stylus");
     return (!male.defaultPrevented && duze.defaultPrevented)
            || `drgnięcie ${male.defaultPrevented}, ruch ${duze.defaultPrevented}`; });
  T("próg ruchu opisany wprost", ()=>/const RYS_PROG = 5;/.test(zr));
  T("po zakończeniu pokazuje się pasek kolorów", ()=>/showHlBar/.test(zr));

  console.log("═══ PALEC MA NADAL PRZEWIJAĆ ═══");
  /* Gdyby zaznaczanie objęło palec, przewijanie długiej notatki stałoby się
     niemożliwe — a to podstawowy gest. */
  T("dotknięcie palcem nie zaznacza", ()=>{
     w.getSelection().removeAllRanges();
     dotyk("touchstart", 10, 10, "direct");
     const ruch = dotyk("touchmove", 200, 12, "direct");
     dotyk("touchend", 200, 12, "direct");
     return zaznaczone().length===0 && !ruch.defaultPrevented
            || `zaznaczono „${zaznaczone()}", przewijanie zablokowane: ${ruch.defaultPrevented}`; });
  T("rozpoznanie po rodzaju dotknięcia, nie po zgadywaniu", ()=>
     /touchType === "stylus"/.test(zr) && /pointerType === "pen"/.test(zr));

  console.log("═══ W EDYCJI RYSIK NALEŻY DO PISANIA ═══");
  /* Scribble pozwala pisać rysikiem wprost po tekście. Wejście mu w drogę
     odebrałoby funkcję, której nie da się zastąpić. */
  T("w polu edycji rysik nie zaznacza po swojemu", ()=>{
     tresc().setAttribute("contenteditable","true");
     w.getSelection().removeAllRanges();
     dotyk("touchstart", 10, 10, "stylus");
     const ruch = dotyk("touchmove", 200, 12, "stylus");
     dotyk("touchend", 200, 12, "stylus");
     tresc().removeAttribute("contenteditable");
     return !ruch.defaultPrevented || "zablokowano Scribble"; });
  T("wyjątek zapisany wprost", ()=>
     /if\(t\.isContentEditable\) return null;/.test(zr)
     && /if\(t\.closest\('\[contenteditable="true"\]'\)\) return null;/.test(zr));

  console.log("═══ GRANICE ZAZNACZANIA ═══");
  T("zaznaczanie nie wychodzi poza jedną notatkę", ()=>
     /if\(!_rysik\.tresc\.contains\(koniec\.startContainer\)\) return;/.test(zr));
  T("poza treścią notatki rysik działa jak dotąd", ()=>{
     w.getSelection().removeAllRanges();
     const e = new w.Event("touchstart", {bubbles:true, cancelable:true});
     e.touches = [{clientX:5, clientY:5, touchType:"stylus"}];
     Object.defineProperty(e, "target", {value:d.getElementById("search"), configurable:true});
     d.dispatchEvent(e);
     const ruch = dotyk("touchmove", 200, 12, "stylus");
     dotyk("touchend", 200, 12, "stylus");
     return !ruch.defaultPrevented || "przechwycono ruch poza notatką"; });
  T("przerwanie gestu sprząta po sobie", ()=>
     /addEventListener\("touchcancel", koniecRysika\)/.test(zr));

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
