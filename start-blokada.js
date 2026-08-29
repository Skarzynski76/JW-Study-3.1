/* Zablokowana aktualizacja IndexedDB nie może zostawić warstwy ładowania,
   która przechwytuje wszystkie dotknięcia. */
const path=require("path");
const plik=process.argv[2] || "./index.html";
const port=process.argv[3] || 8137;
const zablokowana={open(){
  const r={};
  setTimeout(()=>{ if(r.onblocked) r.onblocked({target:r}); }, 0);
  return r;
}};
const {dom,errors}=require("./wspolne.js")(path.resolve(plik), port, {indexedDB:zablokowana});
const w=dom.window, d=w.document;
let zakonczone=false;
const limit=setTimeout(()=>koniec(false,"warstwa ładowania nie zniknęła"),5000);
function koniec(ok,opis){
  if(zakonczone) return; zakonczone=true; clearTimeout(limit);
  const loader=d.getElementById("loading");
  const wynik=ok && loader && loader.style.display==="none" && typeof w.renderAll==="function";
  console.log("════ "+(wynik?"3 OK, 0 błędów":"2 OK, 1 błędów")+" ════");
  if(!wynik) console.log("  ❌ "+opis);
  if(errors.length) console.log("  ❌ błędy wykonania: "+errors.slice(0,2).join(" | "));
  process.exitCode=(wynik && !errors.length)?0:1;
  try{ w.close(); }catch(_){}
}
(function czekaj(){
  const loader=d.getElementById("loading");
  if(loader && loader.style.display==="none") return koniec(true,"");
  setTimeout(czekaj,50);
})();
