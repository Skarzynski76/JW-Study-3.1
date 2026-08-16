#!/usr/bin/env node
/* ==========================================================================
   DROGA 2 — przez Microsoft Graph (wierniejsza)

   Pobiera strony wprost z konta Microsoft: zachowuje formatowanie, obrazy
   oraz PRAWDZIWE daty utworzenia i ostatniej zmiany każdej strony.

   Jak zdobyć token (bez zakładania niczego, bez instalowania):
     1. wejdź na  https://developer.microsoft.com/graph/graph-explorer
     2. zaloguj się swoim kontem Microsoft (Sign in, lewy górny róg)
     3. w polu zapytania wpisz:  https://graph.microsoft.com/v1.0/me/onenote/pages
        i naciśnij „Run query" — to nada uprawnienie do odczytu notatek
     4. zakładka „Access token" → skopiuj token

     node narzedzia/onenote/z-graph.js <token> [katalog wyjściowy]

   Token żyje około godziny — na 150 stron w zupełności wystarczy.
   Skrypt niczego nie wysyła: wyłącznie pobiera i zapisuje plik na dysku.
   ========================================================================== */
const fs = require("fs"), path = require("path");
const https = require("https");
const {zbudujKopie, zapiszKopie} = require("./wspolne-onenote.js");

const token = process.argv[2];
const katalogWy = (process.argv[3] && !process.argv[3].startsWith("--")) ? process.argv[3] : process.cwd();
const bezObrazow = process.argv.includes("--bez-obrazow");
/* Sam spis, bez pobierania treści — przy kilku notesach i 150 stronach warto
   najpierw zobaczyć, co powstanie, niż czekać na pobranie i dopiero się dziwić. */
const tylkoSpis = process.argv.includes("--spis");
/* Ograniczenie do wybranych notesów: --notes "Studium,Kongresy" */
const wybraneNotesy = (()=>{
  const i = process.argv.indexOf("--notes");
  if(i<0 || !process.argv[i+1]) return null;
  return process.argv[i+1].split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
})();
if(!token || token.length < 40){
  console.log("Użycie: node narzedzia/onenote/z-graph.js <token z Graph Explorer> [katalog]");
  console.log("Instrukcja zdobycia tokenu — w nagłówku tego pliku.");
  process.exit(1);
}

function pobierz(url, jakoBinarne){
  return new Promise((res, rej)=>{
    const opcje = {headers:{Authorization:"Bearer "+token}};
    https.get(url, opcje, o=>{
      if(o.statusCode===302 || o.statusCode===301) return res(pobierz(o.headers.location, jakoBinarne));
      const kawalki=[];
      o.on("data", c=>kawalki.push(c));
      o.on("end", ()=>{
        const buf = Buffer.concat(kawalki);
        if(o.statusCode>=400) return rej(new Error("HTTP "+o.statusCode+": "+buf.toString().slice(0,200)));
        res(jakoBinarne ? {buf, typ:o.headers["content-type"]||"image/png"} : buf.toString("utf8"));
      });
    }).on("error", rej);
  });
}

/* Obrazy w treści z Graph są odnośnikami wymagającymi tokenu — przeglądarka
   sama ich nie pobierze. Wciągamy je do notatki jako osadzone, żeby kopia
   była samodzielna i działała offline. */
async function wciagnijObrazy(html){
  const adresy = [...new Set((html.match(/src="(https:\/\/graph\.microsoft\.com[^"]+)"/g)||[])
    .map(m=>m.match(/src="([^"]+)"/)[1]))];
  let wynik = html, ile = 0;
  for(const adres of adresy){
    try{
      const {buf, typ} = await pobierz(adres, true);
      if(buf.length > 4*1024*1024){ wynik = wynik.split(adres).join(""); continue; }  // za duży — pomijamy
      const dane = "data:"+typ.split(";")[0]+";base64,"+buf.toString("base64");
      wynik = wynik.split(adres).join(dane);
      ile++;
    }catch(e){ wynik = wynik.split(adres).join(""); }
  }
  return {html: wynik, ile};
}

(async ()=>{
  console.log("Pobieram spis stron…");
  let strony = [], url = "https://graph.microsoft.com/v1.0/me/onenote/pages?$top=100&$select=id,title,createdDateTime,lastModifiedDateTime,parentSection,parentNotebook&$expand=parentSection,parentNotebook";
  while(url){
    const odp = JSON.parse(await pobierz(url));
    strony = strony.concat(odp.value || []);
    url = odp["@odata.nextLink"] || null;
    process.stdout.write("  zebrano: " + strony.length + "\r");
  }
  console.log("\nZnaleziono stron: " + strony.length);
  if(!strony.length){ console.error("Konto nie zwróciło żadnych stron."); process.exit(1); }

  if(wybraneNotesy){
    const przed = strony.length;
    strony = strony.filter(s=>{
      const n = ((s.parentNotebook && s.parentNotebook.displayName) || "").toLowerCase();
      return wybraneNotesy.some(w=>n.includes(w));
    });
    console.log("Po zawężeniu do wybranych notesów: " + strony.length + " z " + przed);
    if(!strony.length){ console.error("Żaden notes nie pasuje do podanych nazw."); process.exit(1); }
  }

  /* Spis: co powstanie w JW Study, zanim cokolwiek pobierzemy. */
  const drzewo = new Map();
  strony.forEach(s=>{
    const notes = (s.parentNotebook && s.parentNotebook.displayName) || "OneNote";
    const sekcja = (s.parentSection && s.parentSection.displayName) || "(bez sekcji)";
    if(!drzewo.has(notes)) drzewo.set(notes, new Map());
    const m = drzewo.get(notes);
    m.set(sekcja, (m.get(sekcja)||0) + 1);
  });
  console.log("\n════ CO POWSTANIE W JW STUDY ════");
  let ileZakladek = 0;
  [...drzewo.entries()].forEach(([notes, sekcje])=>{
    const suma = [...sekcje.values()].reduce((a,b)=>a+b,0);
    console.log("\n  SEKCJA: " + notes + "   (" + suma + " notatek)");
    [...sekcje.entries()].sort((a,b)=>b[1]-a[1]).forEach(([sek, ile])=>{
      console.log("    └ zakładka: " + sek + "  —  " + ile);
      ileZakladek++;
    });
  });
  console.log("\n  Razem: " + drzewo.size + " sekcji · " + ileZakladek + " zakładek · " + strony.length + " notatek");
  console.log("════════════════════════════════\n");

  if(tylkoSpis){
    console.log("To był sam spis — nic nie zostało pobrane ani zapisane.");
    console.log("Aby przenieść wszystko, powtórz bez --spis.");
    console.log("Aby wziąć tylko wybrane notesy:  --notes \"Nazwa1,Nazwa2\"");
    return;
  }

  const gotowe = [];
  let obrazow = 0;
  for(let i=0;i<strony.length;i++){
    const s = strony[i];
    process.stdout.write("  ["+(i+1)+"/"+strony.length+"] "+(s.title||"bez tytułu").slice(0,40)+"          \r");
    let html = "";
    try{ html = await pobierz("https://graph.microsoft.com/v1.0/me/onenote/pages/"+s.id+"/content?includeIDs=false"); }
    catch(e){ console.log("\n  pominięto (" + e.message.slice(0,60) + ")"); continue; }
    if(!bezObrazow){
      const w = await wciagnijObrazy(html);
      html = w.html; obrazow += w.ile;
    }
    gotowe.push({
      notes: (s.parentNotebook && s.parentNotebook.displayName) || "OneNote",
      sekcja: (s.parentSection && s.parentSection.displayName) || "",
      tytul: s.title || "Bez tytułu",
      html,
      obrazy: !bezObrazow,
      utworzono: s.createdDateTime,
      zmieniono: s.lastModifiedDateTime,
      zrodlo: "graph",
      klucz: s.id
    });
  }
  console.log("\nPobrano obrazów: " + obrazow);
  const kopia = zbudujKopie(gotowe);
  zapiszKopie(kopia, path.join(katalogWy, "onenote-do-jwstudy.json"));
})();
