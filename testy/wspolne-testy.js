/* Wspólny szkielet zestawów: uruchamia aplikację w jsdom, liczy asercje,
   ustala kod wyjścia. Dzięki temu każdy zestaw to sama lista sprawdzeń. */
const fs=require("fs"), path=require("path");
const plik = process.argv[2] || "./index.html";
const port = process.argv[3] || 8137;
const kat  = path.dirname(path.resolve(plik));

let zdane=0, niezdane=0; const bledy=[];
function T(opis, fn){
  try{
    const wynik = fn();
    if(wynik===true) zdane++;
    else { niezdane++; bledy.push(opis + (typeof wynik==="string" ? " → "+wynik : "")); }
  }catch(e){ niezdane++; bledy.push(opis+" → "+e.message); }
}
/** Wersja dla sprawdzeń, które muszą na coś zaczekać. Zawsze z await. */
async function TA(opis, fn){
  try{
    const wynik = await fn();
    if(wynik===true) zdane++;
    else { niezdane++; bledy.push(opis + (typeof wynik==="string" ? " → "+wynik : "")); }
  }catch(e){ niezdane++; bledy.push(opis+" → "+e.message); }
}
/** Treść pliku źródłowego; w wersji jednoplikowej — całego index.html. */
function zrodlo(...czesci){
  const f = path.join(kat, ...czesci);
  return fs.existsSync(f) ? fs.readFileSync(f,"utf8") : fs.readFileSync(path.resolve(plik),"utf8");
}
/* Moduły wczytują się po kolei przez sieć, więc zamiast zgadywać czas
   czekamy na funkcję z OSTATNIEGO modułu. Inaczej zestaw sprawdzałby
   aplikację w połowie wczytaną i zgłaszał braki, których nie ma. */
/* Limit hojny z rozmysłem: przy uruchomieniu wszystkich zestawów naraz maszyna
   bywa obciążona i moduły wczytują się wolniej. Zbyt ciasny limit dawał raz po
   raz fałszywy alarm „aplikacja się nie wczytała", choć wszystko było w porządku. */
function poczekajNaStart(w, limit = 60000){
  return new Promise((res, rej)=>{
    const start = Date.now();
    (function sprawdz(){
      if(typeof w.upuscPozycje === "function" && typeof w.buildEditbar === "function"
         && typeof w.renderAll === "function") return res();
      if(Date.now()-start > limit) return rej(new Error("aplikacja nie wczytała się w "+(limit/1000)+" s"));
      setTimeout(sprawdz, 120);
    })();
  });
}
function uruchom(scenariusz){
  const {dom, errors} = require("./wspolne.js")(path.resolve(plik), port);
  const bezpiecznik = setTimeout(()=>wyjdz(1, "\n⏱ przekroczony czas — zestaw przerwany\n"), 150000);
  setTimeout(async ()=>{
    try{ await poczekajNaStart(dom.window); }
    catch(e){ console.log("❌ "+e.message); clearTimeout(bezpiecznik); process.exit(1); }
    try{ await scenariusz({w:dom.window, d:dom.window.document, errors, zrodlo}); }
    catch(e){ niezdane++; bledy.push("zestaw przerwany → "+e.message); }
    clearTimeout(bezpiecznik);
    wyjdz(niezdane ? 1 : 0,
      "\n════ "+zdane+" OK, "+niezdane+" błędów ════\n"
      + bledy.map(b=>"  ❌ "+b+"\n").join(""));
  }, 2600);
}
let _podsumowano = false;
/* Zestaw, który zamilkł w połowie, wychodził z kodem 0 i wyglądał na zdany.
   Ten strażnik zamienia takie ciche zniknięcie w głośny błąd. */
process.on("exit", ()=>{
  if(_podsumowano) return;
  try{ require("fs").writeSync(2,
    "\n❌ zestaw zakończył się BEZ PODSUMOWANIA — któreś sprawdzenie nie doczekało "+
    "odpowiedzi i pętla zdarzeń opustoszała\n"); }catch(e){}
  process.exitCode = 1;
});
/**
 * Zakończenie zestawu bez gubienia wyniku.
 *
 * Zapis synchroniczny wprost do deskryptora 1: nie ma bufora, który mógłby się
 * zgubić przy wyjściu. Zwykłe console.log + process.exit gubiło podsumowanie
 * mniej więcej co trzeci przebieg, gdy wynik szedł do potoku albo do pliku —
 * zestaw wyglądał wtedy na przerwany, choć przeszedł.
 */
function wyjdz(kod, tekst){
  _podsumowano = true;
  if(tekst) try{ require("fs").writeSync(1, tekst); }catch(e){ process.stdout.write(tekst); }
  process.exit(kod);
}
module.exports = {T, TA, uruchom, zrodlo, poczekajNaStart, wyjdz};
