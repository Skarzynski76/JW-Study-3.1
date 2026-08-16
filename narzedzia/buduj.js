#!/usr/bin/env node
/* ==========================================================================
   BUDOWANIE WERSJI JEDNOPLIKOWEJ

   Skleja wszystkie arkusze stylów i moduły w jeden index.html. Taka wersja
   jedzie na GitHub Pages: nie ma jak zgubić pliku po drodze ani wgrać
   niekompletnego zestawu.

   Skrypt mieszkał wcześniej poza repozytorium i przepadał razem ze
   środowiskiem. Teraz jest tutaj.

   Użycie:  node narzedzia/buduj.js [katalog wyjściowy]
            (domyślnie ../JW_Study_publikacja)
   ========================================================================== */
const fs = require("fs"), path = require("path");
const ZRODLO = path.resolve(__dirname, "..");
const CEL = path.resolve(process.argv[2] || path.join(ZRODLO, "..", "JW_Study_publikacja"));

if(!fs.existsSync(path.join(ZRODLO,"js"))){
  console.error("To już jest wersja jednoplikowa — nie ma czego budować.");
  process.exit(1);
}

fs.rmSync(CEL, {recursive:true, force:true});
fs.mkdirSync(CEL, {recursive:true});

/* pliki towarzyszące: ikony, manifest, katalogi */
for(const f of fs.readdirSync(ZRODLO)){
  if(f==="index.html" || f==="sw.js" || f==="js" || f==="css" || f==="node_modules") continue;
  const p = path.join(ZRODLO,f);
  if(fs.statSync(p).isDirectory()){
    if(["docs","lib","testy","narzedzia"].includes(f)) fs.cpSync(p, path.join(CEL,f), {recursive:true});
    continue;
  }
  fs.copyFileSync(p, path.join(CEL,f));
}

/* sklejenie */
let html = fs.readFileSync(path.join(ZRODLO,"index.html"),"utf8");
let liczCss=0, liczJs=0;
html = html.replace(/<link rel="stylesheet" href="\.\/(css\/[^"]+)">/g, (m,f)=>{
  liczCss++; return "<style>\n"+fs.readFileSync(path.join(ZRODLO,f),"utf8")+"\n</style>"; });
html = html.replace(/<script src="\.\/(js\/[^"]+)"><\/script>/g, (m,f)=>{
  liczJs++; return "<script>\n"+fs.readFileSync(path.join(ZRODLO,f),"utf8")+"\n<\/script>"; });
fs.writeFileSync(path.join(CEL,"index.html"), html);

/* obsługa offline: w wersji jednoplikowej zapisujemy tylko stronę,
   bo modułów już nie ma. Nazwa pamięci dostaje „s", żeby obie wersje
   otwierane pod tym samym adresem nie mieszały sobie plików. */
let sw = fs.readFileSync(path.join(ZRODLO,"sw.js"),"utf8");
sw = sw.replace(/const CORE = \[[\s\S]*?\];/, "const CORE = [\n  './', './index.html'\n];");
sw = sw.replace(/jwstudy-v(\d+)/, (m,v)=>"jwstudy-v"+v+"s");
fs.writeFileSync(path.join(CEL,"sw.js"), sw);

fs.writeFileSync(path.join(CEL,".nojekyll"), "");

/* Ostrzeżenie w katalogu źródłowym: to NIE jest wersja do wgrania.
   Pomyłka między dwoma plikami index.html o tym samym numerze wersji
   kosztowała kiedyś pół dnia szukania. */
fs.writeFileSync(path.join(ZRODLO,"NIE-WGRYWAJ-NA-GITHUB.txt"),
`To jest wersja ROBOCZA (modułowa) — do pracy nad kodem.

index.html ma tu ~${Math.round(fs.statSync(path.join(ZRODLO,"index.html")).size/1024)} kB i sam z siebie NIE DZIAŁA:
szuka plików w katalogach js/ i css/.

Na GitHub wgrywaj katalog:  ${path.basename(CEL)}
tam index.html ma ~${Math.round(Buffer.byteLength(html)/1024)} kB i zawiera całą aplikację.
`);
fs.writeFileSync(path.join(CEL,"WGRYWAJ-TEN-KATALOG.txt"),
`TAK, TEN KATALOG.

index.html ma tu ~${Math.round(Buffer.byteLength(html)/1024)} kB — cała aplikacja w jednym pliku.
Wgrywaj index.html ZAWSZE razem z sw.js.

Jeśli widzisz gdzieś drugi index.html o rozmiarze ~${Math.round(fs.statSync(path.join(ZRODLO,"index.html")).size/1024)} kB,
to wersja robocza — na GitHub się nie nadaje.
`);

const kb = Math.round(Buffer.byteLength(html)/1024);
console.log("zbudowano: "+CEL);
console.log("  arkuszy stylów: "+liczCss+" · modułów: "+liczJs);
console.log("  index.html: "+kb+" kB");
if(html.indexOf("{{")>=0 || html.indexOf("{%")>=0){
  console.error("  ❌ w pliku są znaki {{ lub {% — GitHub Pages przerwie budowanie strony");
  process.exit(1);
}
