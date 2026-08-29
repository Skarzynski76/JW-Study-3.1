/* ==========================================================================
   PROCES WYDANIA — narzędzia i dokumentacja są w repozytorium i działają.
   Zestaw nie uruchamia aplikacji: sprawdza samo rusztowanie wokół niej.
   ========================================================================== */
const fs=require("fs"), path=require("path");
const {execFileSync}=require("child_process");
const KAT = path.resolve(__dirname, "..");
let zdane=0, niezdane=0; const bledy=[];
const T=(opis,fn)=>{ try{ const w=fn(); if(w===true) zdane++;
  else { niezdane++; bledy.push(opis+(typeof w==="string"?" → "+w:"")); } }
  catch(e){ niezdane++; bledy.push(opis+" → "+e.message); } };
const jest = (...p)=>fs.existsSync(path.join(KAT,...p));
const czytaj = (...p)=>fs.readFileSync(path.join(KAT,...p),"utf8");
const jednoplikowa = !jest("js");

console.log("═══ NARZĘDZIA W REPOZYTORIUM ═══");
/* Skrypty budujące i wersjonujące mieszkały poza repozytorium i przepadały
   razem ze środowiskiem — tak jak wcześniej testy. */
T("plik WERSJA istnieje", ()=>jest("WERSJA"));
T("WERSJA zawiera sam numer", ()=>/^\d+\.\d+$/.test(czytaj("WERSJA").trim()) || "zawiera: "+czytaj("WERSJA").trim());
T("skrypt numeru wersji", ()=>jest("narzedzia","wersja.js"));
T("skrypt budowania", ()=>jest("narzedzia","buduj.js"));
T("skrypt wydania", ()=>jest("narzedzia","wydaj.sh"));
T("skrypt wydania wykonywalny", ()=>{
   const m=fs.statSync(path.join(KAT,"narzedzia","wydaj.sh")).mode;
   return (m & 0o111)!==0; });

console.log("═══ NUMER WERSJI — JEDNO ŹRÓDŁO ═══");
T("kontrola numeru przechodzi", ()=>{
   const out=execFileSync("node",[path.join(KAT,"narzedzia","wersja.js"),"--sprawdz"],{encoding:"utf8"});
   return /wszędzie ten sam numer/.test(out) || out.trim(); });
T("numer z WERSJA jest w index.html", ()=>{
   const v=czytaj("WERSJA").trim();
   return czytaj("index.html").indexOf('ver">v'+v)>=0 || "brak v"+v+" w index.html"; });
T("numer z WERSJA jest w sw.js", ()=>{
   const v=czytaj("WERSJA").trim().replace(".","");
   return new RegExp("jwstudy-v"+v+"s?\\b").test(czytaj("sw.js")) || "brak jwstudy-v"+v+" w sw.js"; });
T("analiza statyczna sprawdza zgodność numeru", ()=>/plik WERSJA/.test(czytaj("testy","audyt.js")));

console.log("═══ DZIENNIK ZMIAN ═══");
T("dziennik istnieje", ()=>jest("CHANGELOG.md"));
T("dziennik ma wpis dla bieżącej wersji", ()=>{
   const v=czytaj("WERSJA").trim();
   return czytaj("CHANGELOG.md").indexOf("## v"+v)>=0 || "brak wpisu ## v"+v; });
T("wpisy opisują przyczynę, nie samą listę", ()=>{
   const c=czytaj("CHANGELOG.md");
   return /Dlaczego|przyczyn|było nie tak/i.test(c); });
T("wydanie wymaga wpisu w dzienniku", ()=>/CHANGELOG\.md/.test(czytaj("narzedzia","wydaj.sh")));

console.log("═══ DOKUMENTACJA ═══");
["ARCHITEKTURA.md","MODULY.md","PRZEPLYW.md","DANE.md","FUNKCJE.md","WYDANIE.md"]
  .forEach(f=>T("docs/"+f, ()=>jest("docs",f)));
T("README odsyła do dokumentacji", ()=>{
   const r=czytaj("README.md");
   return /docs\/WYDANIE\.md/.test(r) && /testy\/README\.md/.test(r) && /CHANGELOG\.md/.test(r); });
T("README opisuje obie wersje", ()=>/JW_Study_publikacja/.test(czytaj("README.md")));
T("README wymienia zasady dla zmian w kodzie", ()=>/Kolejność modułów ma znaczenie/.test(czytaj("README.md")));
T("stare raporty przeniesione do archiwum", ()=>{
   const wGlownym=fs.readdirSync(KAT).filter(f=>/^(RAPORT|ZMIANY|POPRAWKA|PASEK|PRZYCISK|WYGLAD|OPTYMALIZACJA)/.test(f));
   return wGlownym.length===0 || "zostały w katalogu głównym: "+wGlownym.join(", "); });
T("archiwum zachowane, nie skasowane", ()=>jest("docs","archiwum") && fs.readdirSync(path.join(KAT,"docs","archiwum")).length>=8);

console.log("═══ OSTRZEŻENIA PRZED POMYŁKĄ ═══");
/* Dwa pliki index.html o tym samym numerze — pomyłka kosztowała pół dnia. */
if(jednoplikowa){
  T("katalog do publikacji ma potwierdzenie", ()=>jest("WGRYWAJ-TEN-KATALOG.txt"));
  T("potwierdzenie podaje rozmiar", ()=>/\d+ kB/.test(czytaj("WGRYWAJ-TEN-KATALOG.txt")));
  T("index.html zawiera całą aplikację", ()=>{
     const h=czytaj("index.html");
     return h.indexOf("<script src=")<0 && h.length>300000; });
  T("plik .nojekyll obecny", ()=>jest(".nojekyll"));
}else{
  T("skrypt budowania zostawia ostrzeżenie w katalogu roboczym", ()=>
     /NIE-WGRYWAJ-NA-GITHUB\.txt/.test(czytaj("narzedzia","buduj.js")));
  T("i potwierdzenie w katalogu do publikacji", ()=>
     /WGRYWAJ-TEN-KATALOG\.txt/.test(czytaj("narzedzia","buduj.js")));
  T("budowanie przerywa przy znakach psujących GitHub Pages", ()=>
     /indexOf\("\{\{"\)>=0/.test(czytaj("narzedzia","buduj.js")));
  T("budowanie zabiera testy i dokumentację", ()=>
     /"docs","lib","testy","narzedzia"/.test(czytaj("narzedzia","buduj.js")));
}

console.log("═══ KOLEJNOŚĆ KROKÓW WYDANIA ═══");
{
  const w=czytaj("narzedzia","wydaj.sh");
  T("testy przed podniesieniem numeru", ()=>w.indexOf("./testy/uruchom.sh") < w.indexOf("narzedzia/wersja.js"));
  T("budowanie po podniesieniu numeru", ()=>w.indexOf("narzedzia/wersja.js") < w.indexOf("narzedzia/buduj.js"));
  T("testy wersji zbudowanej przed pakowaniem", ()=>w.indexOf("8138") < w.indexOf("zip -qr"));
  T("każde niepowodzenie przerywa wydanie", ()=>(w.match(/\|\| stop /g)||[]).length>=6);
  T("na końcu podana ścieżka do wgrania", ()=>/Na GitHub wgraj zawartość katalogu/.test(w));
}

console.log("\n════ "+zdane+" OK, "+niezdane+" błędów ════");
bledy.forEach(b=>console.log("  ❌ "+b));
/* Sam kod wyjścia, bez process.exit: te zestawy nie trzymają niczego otwartego,
   więc Node kończy sam — i dopiero po opróżnieniu bufora wypisywania. Wymuszone
   wyjście ucinało podsumowanie, gdy wynik szedł do potoku albo do pliku. */
process.exitCode = niezdane?1:0;
