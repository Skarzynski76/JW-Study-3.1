#!/usr/bin/env node
/* ==========================================================================
   DROGA 1 — z eksportu do Worda

   OneNote (także na Macu): File → Export → Word Document, osobno dla każdej
   sekcji. Powstałe pliki .docx wrzuć do jednego katalogu i wskaż go temu
   skryptowi.

     npm install mammoth
     node narzedzia/onenote/z-worda.js ~/Desktop/onenote-export

   Kilka notesów: zrób podkatalog na każdy notes i wrzuć do niego jego pliki .docx.
   Wtedy nazwa podkatalogu staje się nazwą SEKCJI, a nazwy plików — ZAKŁADKAMI:

       onenote-export/
         Studium osobiste/     ← sekcja
           Betel.docx          ← zakładka
           Kursy.docx          ← zakładka
         Kongresy/             ← sekcja
           Kongres 2026.docx   ← zakładka

   Bez podkatalogów cały katalog jest jedną sekcją.
   Strony wewnątrz sekcji rozpoznajemy po nagłówkach pierwszego stopnia:
   OneNote zapisuje tytuł każdej strony właśnie jako taki nagłówek.

   Czego ta droga NIE przeniesie: prawdziwych dat utworzenia. W eksporcie do
   Worda ich nie ma — wszystkie notatki dostaną dzisiejszą datę. Jeśli daty są
   dla Ciebie ważne, użyj drogi przez Microsoft Graph (z-graph.js).
   ========================================================================== */
const fs = require("fs"), path = require("path");
const {zbudujKopie, zapiszKopie} = require("./wspolne-onenote.js");

function wczytajMammoth(){
  for(const k of [path.join(__dirname,"..","..","node_modules","mammoth"), "mammoth", "/tmp/node_modules/mammoth"]){
    try{ return require(k); }catch(e){}
  }
  console.error("Brak biblioteki mammoth. Zainstaluj:  npm install mammoth");
  process.exit(1);
}

(async ()=>{
  const katalog = process.argv[2];
  const bezObrazow = process.argv.includes("--bez-obrazow");
  if(!katalog){
    console.log("Użycie: node narzedzia/onenote/z-worda.js <katalog z plikami .docx> [--bez-obrazow]");
    process.exit(1);
  }
  const mammoth = wczytajMammoth();
  /* Zbieramy pliki .docx razem z informacją, do którego notesu (podkatalogu) należą. */
  const doPrzerobienia = [];
  const wKorzeniu = fs.readdirSync(katalog).filter(f=>/\.docx$/i.test(f) && !f.startsWith("~$"));
  wKorzeniu.forEach(f=>doPrzerobienia.push({sekcja: path.basename(path.resolve(katalog)), sciezka: path.join(katalog,f), plik:f}));
  fs.readdirSync(katalog).forEach(pod=>{
    const pelna = path.join(katalog, pod);
    if(!fs.statSync(pelna).isDirectory()) return;
    fs.readdirSync(pelna).filter(f=>/\.docx$/i.test(f) && !f.startsWith("~$"))
      .forEach(f=>doPrzerobienia.push({sekcja: pod, sciezka: path.join(pelna,f), plik:f}));
  });
  if(!doPrzerobienia.length){ console.error("Nie znalazłem plików .docx — ani w katalogu, ani w podkatalogach."); process.exit(1); }

  const notesy = [...new Set(doPrzerobienia.map(x=>x.sekcja))];
  console.log("Plików .docx: " + doPrzerobienia.length + "  ·  sekcji: " + notesy.length + "  (" + notesy.join(", ") + ")");
  const strony = [];

  for(const wpis of doPrzerobienia){
    const plik = wpis.plik;
    const nazwaZakladki = plik.replace(/\.docx$/i, "");
    process.stdout.write("  " + nazwaZakladki + " … ");
    const wynik = await mammoth.convertToHtml(
      {path: wpis.sciezka},
      bezObrazow ? {convertImage: mammoth.images.imgElement(()=>({src:""}))} : undefined
    );
    const html = wynik.value;

    /* Eksport sekcji zawiera wszystkie strony po kolei; tytuł każdej to nagłówek
       pierwszego stopnia. Dzielimy po nich z powrotem na osobne notatki. */
    const czesci = html.split(/(?=<h1[^>]*>)/i).filter(x=>x.trim());
    if(!czesci.length){ console.log("pusty"); continue; }

    let ile = 0;
    czesci.forEach((czesc, i)=>{
      const m = czesc.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const tytul = m ? m[1].replace(/<[^>]+>/g,"").trim() : (czesci.length===1 ? nazwaZakladki : "Strona "+(i+1));
      const tresc = m ? czesc.replace(m[0], "") : czesc;
      if(!tresc.replace(/<[^>]+>/g,"").trim() && !/<img/i.test(tresc)) return;   // pusta strona
      strony.push({
        notes: wpis.sekcja,
        sekcja: nazwaZakladki,
        tytul,
        html: tresc,
        obrazy: !bezObrazow,
        zrodlo: "docx",
        klucz: wpis.sekcja + "|" + nazwaZakladki + "|" + tytul + "|" + i
      });
      ile++;
    });
    console.log(ile + " stron");
  }

  if(!strony.length){ console.error("Nie znalazłem żadnej strony do przeniesienia."); process.exit(1); }
  const kopia = zbudujKopie(strony);
  const wyjscie = path.join(katalog, "onenote-do-jwstudy.json");
  zapiszKopie(kopia, wyjscie);
  console.log("\nUwaga: eksport do Worda nie zawiera dat utworzenia — wszystkie notatki");
  console.log("mają datę dzisiejszą. Daty zachowuje droga przez Microsoft Graph.");
})();
