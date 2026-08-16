#!/usr/bin/env node
/* ==========================================================================
   ANALIZA STATYCZNA — sprawdza kod bez uruchamiania aplikacji.

   Łapie klasy błędów, których testy w przeglądarce nie zobaczą:
   funkcję wywołaną zanim została zadeklarowana (kolejność modułów),
   literówkę w nazwie, martwy kod, zapomniane style, znaki psujące GitHub Pages.

   Uruchomienie:  node testy/audyt.js [katalog projektu]
   Kod wyjścia 1 = coś wymaga uwagi.
   ========================================================================== */
const fs = require("fs"), path = require("path");
const KAT = process.argv[2] || ".";
const KAT_JS = path.join(KAT, "js"), KAT_CSS = path.join(KAT, "css");
const jednoplikowa = !fs.existsSync(KAT_JS);

/* Rozróżniamy dwie wagi. „Błąd" psuje aplikację i zatrzymuje wydanie.
   „Do przejrzenia" to podpowiedź — bywa fałszywym alarmem, więc nie blokuje. */
let bledy = 0, podpowiedzi = 0;
const ok = (t)=>console.log("✅ "+t);
const wypisz = (znak, t, lista)=>{ console.log(znak+" "+t+": "+lista.length);
  lista.slice(0,20).forEach(x=>console.log("   "+x));
  if(lista.length>20) console.log("   … i "+(lista.length-20)+" więcej"); };
const zle  = (t, lista)=>{ bledy++;      wypisz("❌", t, lista); };
const info = (t, lista)=>{ podpowiedzi++; wypisz("ℹ", t, lista); };

/* ---------- wczytanie źródeł ---------- */
const html = fs.readFileSync(path.join(KAT,"index.html"),"utf8");
let moduly = [], style = [];
if(jednoplikowa){
  moduly = [["index.html", html]];
  style  = [["index.html", html]];
}else{
  moduly = (html.match(/<script src="\.\/(js\/[^"]+)"><\/script>/g)||[])
    .map(m=>m.match(/js\/[^"]+/)[0])
    .map(f=>[f, fs.readFileSync(path.join(KAT,f),"utf8")]);
  style = (html.match(/<link rel="stylesheet" href="\.\/(css\/[^"]+)">/g)||[])
    .map(m=>m.match(/css\/[^"]+/)[0])
    .map(f=>[f, fs.readFileSync(path.join(KAT,f),"utf8")]);
}
const calyJs  = moduly.map(m=>m[1]).join("\n");
const calyCss = style.map(m=>m[1]).join("\n");

console.log("═══ ANALIZA STATYCZNA ═══");
console.log((jednoplikowa?"wersja jednoplikowa":moduly.length+" modułów JS, "+style.length+" arkuszy CSS"));

/* ---------- 1. składnia ---------- */
{
  const zepsute=[];
  moduly.concat(fs.existsSync(path.join(KAT,"sw.js"))?[["sw.js",fs.readFileSync(path.join(KAT,"sw.js"),"utf8")]]:[])
    .forEach(([nazwa,tresc])=>{
      if(nazwa.endsWith(".html")) return;
      try{ new Function(tresc); }catch(e){ zepsute.push(nazwa+" → "+e.message); }
    });
  zepsute.length ? zle("moduły z błędem składni", zepsute) : ok("składnia modułów");
}

/* ---------- 2. równowaga nawiasów w CSS ---------- */
{
  const zle2 = style.filter(([n,t]) => n.endsWith(".css") &&
    (t.split("{").length !== t.split("}").length)).map(x=>x[0]);
  zle2.length ? zle("arkusze z niezamkniętym nawiasem", zle2) : ok("nawiasy w arkuszach stylów");
}

/* ---------- 3. kolejność modułów ---------- */
if(!jednoplikowa){
  /* Deklaracje const/let na poziomie modułu obowiązuje strefa martwa: użycie
     PRZED wykonaniem deklaracji kończy się błędem. Funkcje są windowane,
     więc dotyczy to wyłącznie stałych i zmiennych. */
  const gdzieZadeklarowana = {};
  moduly.forEach(([nazwa,tresc], i)=>{
    (tresc.match(/^(?:const|let)\s+([A-Za-z_$][\w$]*)/gm)||[]).forEach(m=>{
      const id = m.replace(/^(?:const|let)\s+/,"");
      if(gdzieZadeklarowana[id]===undefined) gdzieZadeklarowana[id]=i;
    });
  });
  const zderzenia=[];
  moduly.forEach(([nazwa,tresc], i)=>{
    // użycia poza ciałami funkcji: linie na poziomie zerowego wcięcia
    tresc.split("\n").forEach((linia,nr)=>{
      if(/^\s/.test(linia) || /^\s*(\/\/|\/\*|\*)/.test(linia)) return;
      Object.keys(gdzieZadeklarowana).forEach(id=>{
        if(gdzieZadeklarowana[id] > i && new RegExp("\\b"+id.replace(/\$/g,"\\$")+"\\b").test(linia)
           && !new RegExp("^(const|let)\\s+"+id.replace(/\$/g,"\\$")).test(linia.trim()))
          zderzenia.push(nazwa+":"+(nr+1)+" używa "+id+" zadeklarowanego w "+moduly[gdzieZadeklarowana[id]][0]);
      });
    });
  });
  zderzenia.length ? zle("użycie przed deklaracją", [...new Set(zderzenia)]) : ok("kolejność modułów");
}

/* ---------- 4. martwe deklaracje ---------- */
{
  const deklaracje = new Set();
  (calyJs.match(/^\s*function\s+([A-Za-z_$][\w$]*)/gm)||[]).forEach(m=>deklaracje.add(m.trim().replace(/^function\s+/,"")));
  (calyJs.match(/^(?:const|let)\s+([A-Z_][A-Z0-9_]{2,})\s*=/gm)||[]).forEach(m=>deklaracje.add(m.replace(/^(?:const|let)\s+/,"").replace(/\s*=$/,"").trim()));
  const martwe=[];
  deklaracje.forEach(id=>{
    const uzycia = (calyJs.match(new RegExp("\\b"+id.replace(/\$/g,"\\$")+"\\b","g"))||[]).length;
    const wHtml  = new RegExp("\\b"+id.replace(/\$/g,"\\$")+"\\b").test(html.replace(calyJs,""));
    if(uzycia<=1 && !wHtml) martwe.push(id);
  });
  martwe.length ? zle("nieużywane deklaracje", martwe) : ok("brak martwego kodu");
}

/* ---------- 5. znaki psujące GitHub Pages ---------- */
{
  const zlz=[];
  if(html.indexOf("{{")>=0) zlz.push("index.html zawiera {{ — Jekyll przerwie budowanie strony");
  if(html.indexOf("{%")>=0) zlz.push("index.html zawiera {% — Jekyll przerwie budowanie strony");
  moduly.concat(style).forEach(([n,t])=>{
    if(n.endsWith(".html")) return;
    if(t.indexOf("{{")>=0) zlz.push(n+" zawiera {{");
    if(t.indexOf("{%")>=0) zlz.push(n+" zawiera {%");
  });
  if(!fs.existsSync(path.join(KAT,".nojekyll"))) zlz.push("brak pliku .nojekyll");
  zlz.length ? zle("przeszkody przy publikacji", zlz) : ok("publikacja na GitHub Pages");
}

/* ---------- 6. atrybuty z kodem w treści strony ---------- */
{
  const bezMeta = html.replace(/<meta[^>]*>/g,"");
  const znalezione = (bezMeta.match(/\son(click|error|load|mouseover|focus|submit)="/g)||[]);
  znalezione.length ? zle("atrybuty z kodem w kodzie strony", znalezione) : ok("brak atrybutów z kodem");
}

/* ---------- 7. niezabezpieczone operacje ---------- */
{
  const ryzykowne=[];
  moduly.forEach(([nazwa,tresc])=>{
    tresc.split("\n").forEach((l,nr)=>{
      if(/JSON\.parse\(/.test(l)){
        const kontekst = tresc.split("\n").slice(Math.max(0,nr-3), nr+3).join(" ");
        if(!/try\s*\{/.test(kontekst) && !/catch/.test(kontekst))
          ryzykowne.push(nazwa+":"+(nr+1)+" JSON.parse bez zabezpieczenia");
      }
    });
  });
  ryzykowne.length ? zle("operacje bez zabezpieczenia", ryzykowne) : ok("odczyt danych zabezpieczony");
}

/* ---------- 8. martwe klasy CSS ---------- */
{
  const klasy = new Set();
  (calyCss.match(/\.[a-zA-Z][\w-]{2,}/g)||[]).forEach(k=>klasy.add(k.slice(1)));
  const zrodloUzyc = calyJs + html;
  const nieuzywane=[...klasy].filter(k=>{
    if(zrodloUzyc.indexOf(k)>=0) return false;
    /* Część nazw powstaje w kodzie ze sklejenia, np. "t-"+typ albo "stag-"+rodzaj.
       Jeśli przedrostek występuje w kodzie jako napis, klasa jest używana. */
    const i = k.lastIndexOf("-");
    if(i>0){
      const przedrostek = k.slice(0, i+1);
      const wzor = przedrostek.replace(/-/g,"\\-");
      // np. " t-"+typ  albo  "stag-"+rodzaj — przedrostek kończy napis, po nim sklejenie
      if(new RegExp(wzor+'["\'`]\\s*\\+').test(zrodloUzyc)) return false;
    }
    return true;
  });
  nieuzywane.length ? info("klasy CSS bez pokrycia w kodzie (do przejrzenia)", nieuzywane) : ok("wszystkie klasy CSS używane");
}

/* ---------- 9. zdublowane reguły CSS ---------- */
{
  const widziane={}, duble=[];
  style.forEach(([nazwa,tresc])=>{
    (tresc.match(/^\s*([^@{}\/][^{}]{0,120}?)\s*\{/gm)||[]).forEach(m=>{
      const sel=m.replace(/\s*\{$/,"").trim().replace(/\s+/g," ");
      if(!sel || sel.length<3) return;
      if(widziane[sel] && widziane[sel]!==nazwa) duble.push(sel+"  ("+widziane[sel]+" i "+nazwa+")");
      widziane[sel]=nazwa;
    });
  });
  /* Warstwy nadpisujące celowo powtarzają selektory: 08-menus ma zapytania
     o szerokość ekranu, 09-dark tryb nocny, 10-redesign i 11-polish wygląd.
     Zgłaszamy tylko powtórzenia MIĘDZY warstwami podstawowymi (01–07),
     bo tylko te są przypadkowe. */
  const warstwaNadpisujaca = /0[89]-|1[01]-/;
  const istotne = duble.filter(d=>{
    const pliki = d.match(/\((\S+) i (\S+)\)/);
    if(!pliki) return true;
    return !warstwaNadpisujaca.test(pliki[1]) && !warstwaNadpisujaca.test(pliki[2]);
  });
  istotne.length ? info("ten sam selektor w dwóch arkuszach podstawowych (do przejrzenia)", istotne) : ok("brak przypadkowych powtórzeń w stylach");
}

/* ---------- 10. spójność wersji ---------- */
{
  /* Numer żyje w pliku WERSJA i jest rozprowadzany do index.html oraz sw.js.
     Rozjazd oznacza, że przeglądarka nie zauważy aktualizacji. */
  const wHtml = (html.match(/ver">v(\d+\.\d+)/)||[])[1];
  const sw = fs.existsSync(path.join(KAT,"sw.js")) ? fs.readFileSync(path.join(KAT,"sw.js"),"utf8") : "";
  const wSw = (sw.match(/jwstudy-v(\d+)/)||[])[1];
  const plikW = path.join(KAT,"WERSJA");
  const wPliku = fs.existsSync(plikW) ? fs.readFileSync(plikW,"utf8").trim() : null;
  const rozjazd = [];
  if(!wHtml) rozjazd.push("nie znaleziono numeru w index.html");
  if(!wSw)   rozjazd.push("nie znaleziono nazwy pamięci w sw.js");
  if(wHtml && wSw && wSw.replace(/s$/,"") !== wHtml.replace(".",""))
    rozjazd.push("index.html: v"+wHtml+" · sw.js: jwstudy-v"+wSw);
  if(wPliku && wHtml && wPliku !== wHtml)
    rozjazd.push("plik WERSJA: "+wPliku+" · index.html: v"+wHtml);
  if(!wPliku) rozjazd.push("brak pliku WERSJA — jedynego źródła numeru");
  rozjazd.length
    ? zle("numer wersji", rozjazd.concat(["napraw:  node narzedzia/wersja.js "+(wPliku||wHtml||"1.0")]))
    : ok("numer wersji zgodny: WERSJA, index.html i sw.js (v"+wHtml+")");
}

console.log("\nrozmiar JS: "+Math.round(Buffer.byteLength(calyJs)/1024)+" kB · CSS: "+Math.round(Buffer.byteLength(calyCss)/1024)+" kB");
console.log(bledy
  ? "\n════ "+bledy+" BŁĘDÓW — wydanie wstrzymane ════"
  : (podpowiedzi ? "\n════ czysto (podpowiedzi do przejrzenia: "+podpowiedzi+") ════"
                 : "\n════ analiza czysta ════"));
/* Sam kod wyjścia, bez process.exit: te zestawy nie trzymają niczego otwartego,
   więc Node kończy sam — i dopiero po opróżnieniu bufora wypisywania. Wymuszone
   wyjście ucinało podsumowanie, gdy wynik szedł do potoku albo do pliku. */
process.exitCode = bledy ? 1 : 0;
