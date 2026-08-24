#!/usr/bin/env node
/* ==========================================================================
   NUMER WERSJI — jedno źródło prawdy.

   Numer żyje w pliku WERSJA. Ten skrypt rozprowadza go do miejsc, gdzie
   jest potrzebny:
     • index.html  — napis obok nazwy aplikacji
     • sw.js       — nazwa pamięci podręcznej; jej zmiana każe przeglądarce
                     pobrać wszystko od nowa, więc MUSI iść razem z wersją

   Rozjazd między tymi dwoma miejscami oznaczał, że użytkownik wgrywał nową
   wersję, a przeglądarka dalej podawała starą. Zdarzyło się to naprawdę,
   stąd ten skrypt i kontrola w analizie statycznej.

   Użycie:
     node narzedzia/wersja.js              — pokaż bieżący numer
     node narzedzia/wersja.js --podnies    — 1.73 → 1.74 i rozprowadź
     node narzedzia/wersja.js 2.0          — ustaw wprost i rozprowadź
   ========================================================================== */
const fs = require("fs"), path = require("path");
const KAT = path.resolve(__dirname, "..");
const PLIK_WERSJI = path.join(KAT, "WERSJA");

function czytaj(){
  const v = fs.readFileSync(PLIK_WERSJI, "utf8").trim();
  if(!/^\d+\.\d+$/.test(v)) throw new Error("Plik WERSJA ma zawierać numer w postaci 1.73, a zawiera: "+v);
  return v;
}
function podnies(v){
  const [a,b] = v.split(".").map(Number);
  return a + "." + (b+1);
}
/** Wpisuje numer do index.html i sw.js. Zwraca listę zmienionych plików. */
function rozprowadz(v){
  const zmienione = [];
  const idx = path.join(KAT,"index.html");
  let h = fs.readFileSync(idx,"utf8");
  const noweH = h.replace(/(ver">v)\d+\.\d+/, "$1"+v);
  if(noweH !== h){ fs.writeFileSync(idx, noweH); zmienione.push("index.html"); }

  const swp = path.join(KAT,"sw.js");
  let s = fs.readFileSync(swp,"utf8");
  const noweS = s.replace(/jwstudy-v\d+s?/, "jwstudy-v"+v.replace(".",""));
  if(noweS !== s){ fs.writeFileSync(swp, noweS); zmienione.push("sw.js"); }
  return zmienione;
}
/** Sprawdza, czy wszystkie miejsca mają ten sam numer. */
function sprawdz(){
  const v = czytaj();
  const h = fs.readFileSync(path.join(KAT,"index.html"),"utf8");
  const s = fs.readFileSync(path.join(KAT,"sw.js"),"utf8");
  const wHtml = (h.match(/ver">v(\d+\.\d+)/)||[])[1];
  const wSw   = (s.match(/jwstudy-v(\d+)s?/)||[])[1];
  const rozjazd = [];
  if(wHtml !== v) rozjazd.push("index.html ma v"+wHtml+" zamiast v"+v);
  if(wSw !== v.replace(".","")) rozjazd.push("sw.js ma jwstudy-v"+wSw+" zamiast jwstudy-v"+v.replace(".",""));
  return {v, wHtml, wSw, rozjazd};
}

const arg = process.argv[2];
if(!arg || arg==="--sprawdz"){
  const w = sprawdz();
  console.log("WERSJA:     "+w.v);
  console.log("index.html: v"+w.wHtml);
  console.log("sw.js:      jwstudy-v"+w.wSw);
  if(w.rozjazd.length){ console.log("\n❌ ROZJAZD:"); w.rozjazd.forEach(r=>console.log("   "+r));
    console.log("\nnapraw:  node narzedzia/wersja.js "+w.v); process.exit(1); }
  console.log("\n✅ wszędzie ten sam numer");
  process.exit(0);
}
let nowa;
if(arg==="--podnies") nowa = podnies(czytaj());
else if(/^\d+\.\d+$/.test(arg)) nowa = arg;
else { console.log("Użycie: node narzedzia/wersja.js [--podnies | --sprawdz | 1.74]"); process.exit(1); }

fs.writeFileSync(PLIK_WERSJI, nowa+"\n");
const zm = rozprowadz(nowa);
console.log("wersja: "+nowa);
zm.forEach(f=>console.log("  zaktualizowano "+f));
if(!zm.length) console.log("  (pliki miały już ten numer)");
