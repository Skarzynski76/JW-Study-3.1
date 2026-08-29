/* ==========================================================================
   Wspólna część obu dróg przenoszenia z OneNote.

   Odwzorowanie struktury — celowo takie, a nie inne:
     notes OneNote (notebook)  →  SEKCJA w JW Study
     sekcja OneNote            →  ZAKŁADKA w tej sekcji
     strona OneNote            →  NOTATKA przypisana do zakładki

   Dzięki temu porządek, który zbudowałeś przez lata w OneNote, przenosi się
   jeden do jednego, zamiast wysypywać się jako 150 luźnych notatek.
   ========================================================================== */
const fs = require("fs"), path = require("path");

/* Znaczniki, które JW Study przyjmuje przy zapisie notatki. Wszystko poza tą
   listą i tak odpadnie przy wczytywaniu kopii, więc odsiewamy je od razu —
   inaczej plik kopii byłby kilka razy większy bez żadnego zysku. */
const DOZWOLONE = new Set(["B","STRONG","I","EM","U","S","STRIKE","DEL","BR","MARK",
  "H2","H3","BLOCKQUOTE","UL","OL","LI","TABLE","THEAD","TBODY","TR","TD","TH",
  "SUP","SUB","HR","A","IMG","DIV","P"]);

/** Bardzo prosty porządkowacz HTML — bez przeglądarki, na wyrażeniach. */
function oczyscHtml(html, opcje){
  const zachowajObrazy = !opcje || opcje.obrazy !== false;
  let t = String(html || "");
  t = t.replace(/<!--[\s\S]*?-->/g, "");
  t = t.replace(/<(script|style|head|meta|link)[\s\S]*?<\/\1>/gi, "");
  t = przenieRoznieceniaZeSpanow(t);
  t = t.replace(/<\/?(html|body|span|font|o:p)[^>]*>/gi, "");
  if(!zachowajObrazy) t = t.replace(/<img[^>]*>/gi, "[obraz]");
  // atrybuty z kodem i style w tekście — nie mają czego szukać w notatce
  t = t.replace(/\son[a-z]+="[^"]*"/gi, "");
  t = t.replace(/\sstyle="[^"]*"/gi, "");
  /* Klasy usuwamy wszędzie POZA <mark> — tam niosą kolor podświetlenia,
     który dopiero co uratowaliśmy ze stylów OneNote. */
  t = t.replace(/<(?!mark\b)([a-z0-9]+)([^>]*?)\sclass="[^"]*"([^>]*)>/gi, "<$1$2$3>");
  // OneNote lubi puste akapity — zbijamy je, żeby notatka nie była samą przerwą
  t = t.replace(/(<p>\s*(<br\s*\/?>)?\s*<\/p>\s*){2,}/gi, "<p></p>");
  t = t.replace(/<p([^>]*)>/gi, "<div>").replace(/<\/p>/gi, "</div>");
  return t.trim();
}

/* Paleta podświetleń JW Study — ta sama, co przy zaznaczaniu tekstu w aplikacji. */
const PODSWIETLENIA = ["#fff3a3","#c8f0c0","#bfe0ff","#ffd0c0","#e6ccff","#ffe0f0","#d8d8d8"];

/** Odległość dwóch kolorów — do dobrania najbliższego podświetlenia. */
function odlegloscKoloru(a, b){
  const r = h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
  try{
    const [r1,g1,b1] = r(a), [r2,g2,b2] = r(b);
    return (r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2;
  }catch(e){ return Infinity; }
}
function najblizszePodswietlenie(hex){
  let naj = 0, min = Infinity;
  PODSWIETLENIA.forEach((c,i)=>{ const d = odlegloscKoloru(hex, c); if(d < min){ min = d; naj = i; } });
  return "hl" + (naj + 1);
}

/**
 * OneNote zapisuje pogrubienie, kursywę i podświetlenie jako style na <span>.
 * Sam <span> odpada przy zapisie w JW Study, więc zanim go usuniemy, przenosimy
 * te wyróżnienia na znaczniki, które aplikacja rozumie. Bez tego podświetlenia
 * — a w notatkach ze studium jest ich sporo — przepadłyby bez śladu.
 *
 * Obsługujemy postać bez zagnieżdżeń, czyli tę, którą OneNote faktycznie tworzy.
 */
function przenieRoznieceniaZeSpanow(html){
  return String(html).replace(/<span[^>]*style="([^"]*)"[^>]*>([\s\S]*?)<\/span>/gi, (calosc, styl, tresc)=>{
    let wynik = tresc;
    const tlo = styl.match(/background(?:-color)?:\s*(#[0-9a-f]{6}|#[0-9a-f]{3})/i);
    if(tlo){
      let hex = tlo[1];
      if(hex.length===4) hex = "#"+hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3];
      if(!/^#f{3,6}$/i.test(hex))                    // biel to nie podświetlenie
        wynik = '<mark class="'+najblizszePodswietlenie(hex)+'">'+wynik+'</mark>';
    }
    if(/font-weight:\s*(bold|[6-9]00)/i.test(styl)) wynik = "<b>"+wynik+"</b>";
    if(/font-style:\s*italic/i.test(styl))          wynik = "<i>"+wynik+"</i>";
    if(/text-decoration[^;]*underline/i.test(styl))  wynik = "<u>"+wynik+"</u>";
    return wynik;
  });
}

/** Tekst bez znaczników — do wyszukiwania i podglądu na karcie. */
function naZwyklyTekst(html){
  return String(html||"")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|p|li|h\d|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n").trim();
}

/** Identyfikator notatki — stały dla tej samej strony, żeby powtórny import nie dublował. */
function idNotatki(zrodlo, klucz){
  let h = 0;
  const s = zrodlo + "|" + klucz;
  for(let i=0;i<s.length;i++){ h = (h*31 + s.charCodeAt(i)) | 0; }
  return "on" + Math.abs(h).toString(36);
}

/**
 * Buduje plik kopii JW Study.
 * @param {Array} strony  [{notes, sekcja, tytul, html, utworzono, zmieniono}]
 * @returns {Object} zawartość pliku kopii
 */
function zbudujKopie(strony){
  const sections = [], secTabs = [], notes = [];
  const mapaSekcji = new Map(), mapaZakladek = new Map();

  strony.forEach(s=>{
    const nazwaSekcji = (s.notes || "OneNote").trim();
    if(!mapaSekcji.has(nazwaSekcji)){
      const id = mapaSekcji.size + 1;
      mapaSekcji.set(nazwaSekcji, id);
      sections.push({id, name:nazwaSekcji, ord:sections.length, open:true});
    }
    const idSekcji = mapaSekcji.get(nazwaSekcji);

    let idZakladki;
    const nazwaZakladki = (s.sekcja || "").trim();
    if(nazwaZakladki){
      const klucz = idSekcji + "|" + nazwaZakladki;
      if(!mapaZakladek.has(klucz)){
        const id = mapaZakladek.size + 1;
        mapaZakladek.set(klucz, id);
        secTabs.push({id, sec:idSekcji, name:nazwaZakladki, ord:secTabs.length});
      }
      idZakladki = mapaZakladek.get(klucz);
    }

    const html = oczyscHtml(s.html, {obrazy: s.obrazy !== false});
    const teraz = new Date().toISOString();
    const n = {
      g: idNotatki(s.zrodlo || "onenote", s.klucz || s.tytul),
      t: (s.tytul || "Bez tytułu").trim(),
      h: html,
      c: naZwyklyTekst(html),
      tg: [], b: null, ch: null, v: null, ks: "", pub: "", doc: 0, itn: 0, par: 0, col: 0,
      cr: s.utworzono || teraz,
      mo: s.zmieniono || s.utworzono || teraz,
      del: false, ed: true
    };
    if(idZakladki) n.stb = idZakladki;
    notes.push(n);
  });

  return {tags: [], notes, sections, pubTabs: [], secTabs};
}

/** Zapisuje plik kopii i wypisuje podsumowanie. */
function zapiszKopie(dane, sciezka){
  fs.writeFileSync(sciezka, JSON.stringify(dane));
  const mb = (fs.statSync(sciezka).size/1048576).toFixed(1);
  console.log("\n════════════════════════════════════════");
  console.log("  Notatek:   " + dane.notes.length);
  console.log("  Sekcji:    " + dane.sections.length + "  (" + dane.sections.map(s=>s.name).join(", ") + ")");
  console.log("  Zakładek:  " + dane.secTabs.length);
  console.log("  Obrazów:   " + dane.notes.reduce((s,n)=>s+((n.h.match(/<img/gi)||[]).length),0));
  console.log("  Plik:      " + sciezka + "  (" + mb + " MB)");
  console.log("════════════════════════════════════════");
  console.log("\nW JW Study: przycisk kopii → wczytaj ten plik → wybierz „Dołącz + układ\".");
}

module.exports = {oczyscHtml, naZwyklyTekst, zbudujKopie, zapiszKopie, idNotatki,
                  przenieRoznieceniaZeSpanow, najblizszePodswietlenie, DOZWOLONE};
