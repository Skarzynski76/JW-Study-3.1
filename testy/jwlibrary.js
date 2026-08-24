/* ==========================================================================
   EKSPORT DO JW LIBRARY — CZY TAMTA APLIKACJA TO PRZECZYTA

   To jedyne miejsce, gdzie dane opuszczają aplikację do CUDZEGO programu.
   Błąd tutaj wychodzi dopiero na urządzeniu, po przywróceniu kopii, gdy jest
   już za późno — dlatego sprawdzamy nie zapis w kodzie, tylko GOTOWY PLIK:
   rozpakowujemy go i odpytujemy bazę SQL tak, jak zrobi to JW Library.

   Kopia bazowa jest budowana tak, jak robi ją JW Library: те same tabele,
   te same kolumny, jedna notatka i jedna etykieta już w środku.
   ========================================================================== */
const path=require("path"), fs=require("fs");
const {poczekajNaStart, wyjdz} = require("./wspolne-testy.js");
const initSqlJs = require(path.join(__dirname,"..","lib","sql-wasm.js"));
const JSZip = require(path.join(__dirname,"..","lib","jszip.min.js"));

const plik = process.argv[2] || "./index.html";
const {dom, errors} = require("./wspolne.js")(path.resolve(plik), process.argv[3]||8137);

let zdane=0, niezdane=0; const bledy=[];
const T=(opis,fn)=>{ try{ const w=fn(); if(w===true) zdane++;
  else { niezdane++; bledy.push(opis+(typeof w==="string"?" → "+w:"")); } }
  catch(e){ niezdane++; bledy.push(opis+" → "+e.message); } };

(async ()=>{
  const SQL = await initSqlJs({locateFile:f=>path.join(__dirname,"..","lib",f)});

  /* ——— kopia bazowa, taka jak z JW Library ——— */
  const baza = new SQL.Database();
  baza.run(`
    CREATE TABLE Location (LocationId INTEGER PRIMARY KEY, BookNumber INTEGER,
      ChapterNumber INTEGER, DocumentId INTEGER, Track INTEGER, IssueTagNumber INTEGER DEFAULT 0,
      KeySymbol TEXT, MepsLanguage INTEGER, Type INTEGER, Title TEXT);
    CREATE TABLE UserMark (UserMarkId INTEGER PRIMARY KEY, ColorIndex INTEGER,
      LocationId INTEGER, StyleIndex INTEGER, UserMarkGuid TEXT, Version INTEGER);
    CREATE TABLE Note (NoteId INTEGER PRIMARY KEY, Guid TEXT, UserMarkId INTEGER,
      LocationId INTEGER, Title TEXT, Content TEXT, LastModified TEXT, Created TEXT,
      BlockType INTEGER, BlockIdentifier INTEGER);
    CREATE TABLE Tag (TagId INTEGER PRIMARY KEY, Type INTEGER, Name TEXT);
    CREATE TABLE TagMap (TagMapId INTEGER PRIMARY KEY, PlaylistItemId INTEGER,
      LocationId INTEGER, NoteId INTEGER, TagId INTEGER, Position INTEGER);
    CREATE TABLE LastModified (LastModified TEXT);
    INSERT INTO LastModified VALUES ('2026-01-01T00:00:00+00:00');
    INSERT INTO Location (LocationId, BookNumber, ChapterNumber, KeySymbol, MepsLanguage, Type, IssueTagNumber)
      VALUES (1, 40, 5, 'nwtsty', 0, 0, 0);
    INSERT INTO Note (NoteId, Guid, LocationId, Title, Content, LastModified, Created, BlockType, BlockIdentifier)
      VALUES (1, 'STARA-1', 1, 'Notatka z biblioteki', 'Treść z JW Library',
              '2026-01-01T00:00:00+00:00', '2026-01-01T00:00:00+00:00', 2, 3);
    INSERT INTO Tag (TagId, Type, Name) VALUES (1, 1, 'Studium');
  `);
  const zipBaza = new JSZip();
  zipBaza.file("userData.db", baza.export());
  zipBaza.file("manifest.json", JSON.stringify({
    name:"UserdataBackup_2026-01-01_Telefon.jwlibrary", creationDate:"2026-01-01",
    version:1, type:0,
    userDataBackup:{ lastModifiedDate:"2026-01-01T00:00:00+00:00", deviceName:"Telefon",
      databaseName:"userData.db", hash:"stary", schemaVersion:14 }
  }));
  const bazaBuf = await zipBaza.generateAsync({type:"arraybuffer"});

  await poczekajNaStart(dom.window);
  const w = dom.window;

  /* Aplikacja bierze biblioteki z ./lib przez sieć; w teście podajemy je wprost.
     SQL i JSZip są zmiennymi modułu, nie własnościami okna — stąd podstawienie
     przez eval, a nie zwykłe przypisanie. */
  w.__SQL = SQL; w.__JSZip = JSZip;
  w.eval("SQL = window.__SQL; JSZip = window.__JSZip; getLibs = async ()=>{}; idb = true;");
  w.idbGet = async (sklep, klucz)=>{
    if(sklep==="files" && klucz==="lastBackup") return bazaBuf;
    if(sklep==="meta" && klucz==="lastBackupDate") return "2026-01-01T00:00:00Z";
    if(sklep==="meta" && klucz==="lastBackupName") return "UserdataBackup.jwlibrary";
    return null;
  };
  /* Blob z jsdom opakowujący Blob z Node gubi bajty przy odczycie w teście
     (dwa różne środowiska). Podstawiamy prostą wersję, która trzyma zawartość
     tak, jak ją dostała — sprawdzamy przecież bajty, a nie samą klasę. */
  w.Blob = class {
    constructor(czesci, opcje){ this._czesci = czesci || []; this.type = (opcje&&opcje.type)||""; }
    async arrayBuffer(){
      const kawalki = [];
      for(const c of this._czesci){
        if(c && typeof c.arrayBuffer === "function") kawalki.push(Buffer.from(await c.arrayBuffer()));
        else if(c instanceof Uint8Array) kawalki.push(Buffer.from(c));
        else if(c && c._czesci) kawalki.push(Buffer.from(await (new w.Blob(c._czesci)).arrayBuffer()));
        else kawalki.push(Buffer.from(String(c)));
      }
      const razem = Buffer.concat(kawalki);
      return razem.buffer.slice(razem.byteOffset, razem.byteOffset + razem.byteLength);
    }
  };

  /* Zamiast zapisywać plik — przechwytujemy go. */
  let wynikBlob = null, wynikNazwa = "";
  w.chooseSaveOrShare = (blob, nazwa)=>{ wynikBlob = blob; wynikNazwa = nazwa; };
  w.saveFile = async (blob, nazwa)=>{ wynikBlob = blob; wynikNazwa = nazwa; return true; };
  w.toast = ()=>{}; w.toastOk = ()=>{}; w.toastErr = (m)=>{ bledy.push("toastErr: "+m); };
  /* Okno podsumowania czeka na kliknięcie użytkownika — w teście przechodzimy dalej. */
  w.showInfo = async ()=>{};
  w.closeModal = ()=>{};
  /* Prawdziwy odcisk bazy zamiast atrapy ze szkieletu testów: sprawdzamy przecież,
     czy JW Library uzna plik za spójny, a odcisk jest tego częścią. */
  const kryptoNode = require("crypto");
  const prawdziwyOdcisk = async (alg, dane)=>{
    const h = kryptoNode.createHash("sha256").update(Buffer.from(dane)).digest();
    return h.buffer.slice(h.byteOffset, h.byteOffset + h.byteLength);
  };
  w.__odcisk = prawdziwyOdcisk;
  /* crypto bywa własnością tylko do odczytu — podstawiamy samą metodę. */
  try{ w.crypto.subtle = {digest: prawdziwyOdcisk}; }
  catch(e){ Object.defineProperty(w, "crypto", {value:{subtle:{digest:prawdziwyOdcisk},
             randomUUID:()=>"X"}, configurable:true}); }

  /* ——— nasze notatki: jedna biblijna, jedna z publikacji, jedna z etykietą ——— */
  w.eval(`notes.length=0; tags.length=0;
    tags.push({id:1, name:"Studium", ord:0});
    tags.push({id:2, name:"Kongres 2026", ord:10});
    notes.push({g:"NOWA-1", t:"Moja notatka biblijna",
      h:"<div>Treść <b>pogrubiona</b> i zwykła.</div>", c:"Treść pogrubiona i zwykła.",
      tg:[1], b:43, ch:3, v:16, ks:"nwtsty", itn:0, doc:0, par:0,
      cr:"2026-08-01T10:00:00Z", mo:"2026-08-02T11:00:00Z", del:false});
    notes.push({g:"NOWA-2", t:"Z publikacji",
      h:"<div>Notatka z artykułu.</div>", c:"Notatka z artykułu.",
      tg:[2], b:null, ch:null, v:null, ks:"w", itn:20260100, doc:1102026101, par:7,
      cr:"2026-08-03T10:00:00Z", mo:"2026-08-03T10:00:00Z", del:false});
    notes.push({g:"NOWA-3", t:"Skasowana", h:"", c:"", tg:[], b:null, ch:null, ks:null,
      cr:"2026-08-04T10:00:00Z", mo:"2026-08-04T10:00:00Z", del:true});
  `);

  w.console.error = (...a)=>{ bledy.push("console.error: "+a.map(String).join(" ").slice(0,200)); };
  try{ await dom.window.document.getElementById("expGo").onclick(); }
  catch(e){ bledy.push("eksport rzucił: "+e.message); }
  await new Promise(r=>setTimeout(r, 800));

  console.log("═══ PLIK POWSTAJE ═══");
  T("eksport oddaje plik", ()=>!!wynikBlob || "nic nie powstało");
  T("nazwa wygląda jak kopia JW Library", ()=>/\.jwlibrary$/.test(wynikNazwa) || "nazwa: "+wynikNazwa);

  if(!wynikBlob){
    console.log("\n════ "+zdane+" OK, "+(niezdane+1)+" błędów ════");
    bledy.forEach(b=>console.log("  ❌ "+b));
    return wyjdz(1, "");
  }

  /* ——— rozpakowujemy tak, jak zrobi to JW Library ——— */
  const bufWy = Buffer.from(await wynikBlob.arrayBuffer());
  T("plik nie jest pusty", ()=>bufWy.length > 1000 || "bajtów: "+bufWy.length);
  const zipWy = await JSZip.loadAsync(bufWy);

  console.log("═══ BUDOWA ARCHIWUM ═══");
  T("w środku jest baza danych", ()=>!!zipWy.file("userData.db"));
  T("i manifest", ()=>!!zipWy.file("manifest.json"));

  const manifest = JSON.parse(await zipWy.file("manifest.json").async("string"));
  T("manifest ma opis kopii", ()=>!!manifest.userDataBackup);
  T("nazwa pliku zapisana w manifeście", ()=>/\.jwlibrary$/.test(manifest.name||"") || "name: "+manifest.name);
  T("odcisk bazy przeliczony na nowo", ()=>
     !!manifest.userDataBackup.hash && manifest.userDataBackup.hash!=="stary"
     || "hash: "+manifest.userDataBackup.hash);
  T("data ostatniej zmiany odświeżona", ()=>
     manifest.userDataBackup.lastModifiedDate !== "2026-01-01T00:00:00+00:00");
  T("wersja schematu bazy nietknięta", ()=>manifest.userDataBackup.schemaVersion===14);

  const dbWy = new SQL.Database(new Uint8Array(await zipWy.file("userData.db").async("arraybuffer")));
  const pytaj = (sql)=>{ const r = dbWy.exec(sql); return r.length ? r[0].values : []; };

  console.log("═══ NOTATKI W BAZIE ═══");
  T("notatka z biblioteki nie zniknęła", ()=>
     pytaj("SELECT Guid FROM Note WHERE Guid='STARA-1'").length===1);
  T("nasze notatki doszły", ()=>
     pytaj("SELECT Guid FROM Note WHERE Guid IN ('NOWA-1','NOWA-2')").length===2
     || "znaleziono: "+JSON.stringify(pytaj("SELECT Guid FROM Note")));
  T("skasowana notatka NIE trafia do kopii", ()=>
     pytaj("SELECT Guid FROM Note WHERE Guid='NOWA-3'").length===0);
  T("tytuł i treść zapisane", ()=>{
     const r = pytaj("SELECT Title, Content FROM Note WHERE Guid='NOWA-1'")[0];
     return (r && r[0]==="Moja notatka biblijna" && /Treść pogrubiona/.test(r[1]))
            || "w bazie: "+JSON.stringify(r); });
  T("treść jest zwykłym tekstem, bez znaczników HTML", ()=>{
     const r = pytaj("SELECT Content FROM Note WHERE Guid='NOWA-1'")[0];
     return !/<[a-z]/i.test(r[0]) || "treść: "+r[0]; });
  T("daty w formacie, którego oczekuje JW Library", ()=>{
     const r = pytaj("SELECT Created, LastModified FROM Note WHERE Guid='NOWA-1'")[0];
     const wzor = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+00:00$/;
     return (wzor.test(r[0]) && wzor.test(r[1])) || "daty: "+JSON.stringify(r); });
  T("żadna notatka nie ma pustej treści", ()=>{
     /* JW Library nie pokazuje notatki bez treści — pusty tytuł to za mało. */
     const puste = pytaj("SELECT Guid FROM Note WHERE Content IS NULL OR TRIM(Content)=''");
     return puste.length===0 || "puste: "+JSON.stringify(puste); });

  console.log("═══ MIEJSCE NOTATKI W PUBLIKACJI ═══");
  T("notatka biblijna wskazuje werset", ()=>{
     const r = pytaj("SELECT BlockType, BlockIdentifier FROM Note WHERE Guid='NOWA-1'")[0];
     return (r && r[0]===2 && r[1]===16) || "BlockType/Id: "+JSON.stringify(r); });
  T("i właściwą księgę z rozdziałem", ()=>{
     const r = pytaj(`SELECT l.BookNumber, l.ChapterNumber FROM Note n
                      JOIN Location l ON n.LocationId=l.LocationId WHERE n.Guid='NOWA-1'`)[0];
     return (r && r[0]===43 && r[1]===3) || "księga/rozdział: "+JSON.stringify(r); });
  T("każda notatka ma przypisane miejsce", ()=>{
     /* Notatka bez miejsca nie ma się gdzie pokazać w JW Library: nie wisi przy
        żadnym akapicie i nie widać jej w publikacji. Wychodziło to dopiero po
        przywróceniu kopii na urządzeniu — czyli gdy nic już nie dało się zrobić. */
     const bez = pytaj("SELECT Guid FROM Note WHERE LocationId IS NULL");
     return bez.length===0 || "bez miejsca: "+JSON.stringify(bez); });
  T("notatka z publikacji wskazuje symbol, wydanie i dokument", ()=>{
     const r = pytaj(`SELECT l.KeySymbol, l.IssueTagNumber, l.DocumentId FROM Note n
                      JOIN Location l ON n.LocationId=l.LocationId WHERE n.Guid='NOWA-2'`)[0];
     return (r && r[0]==="w" && r[1]===20260100 && r[2]===1102026101)
            || "miejsce: "+JSON.stringify(r); });
  T("i akapit, przy którym ma wisieć", ()=>{
     const r = pytaj("SELECT BlockType, BlockIdentifier FROM Note WHERE Guid='NOWA-2'")[0];
     return (r && r[0]===1 && r[1]===7) || "BlockType/Id: "+JSON.stringify(r); });
  T("miejsce publikacji nie ma numeru księgi", ()=>{
     const r = pytaj(`SELECT l.BookNumber FROM Note n JOIN Location l ON n.LocationId=l.LocationId
                      WHERE n.Guid='NOWA-2'`)[0];
     return (r && r[0]===null) || "BookNumber: "+JSON.stringify(r); });
  T("nie powstały zduplikowane identyfikatory notatek", ()=>{
     const d = pytaj("SELECT NoteId, COUNT(*) FROM Note GROUP BY NoteId HAVING COUNT(*)>1");
     return d.length===0 || "powtórzone: "+JSON.stringify(d); });
  T("ani zduplikowane identyfikatory miejsc", ()=>{
     const d = pytaj("SELECT LocationId, COUNT(*) FROM Location GROUP BY LocationId HAVING COUNT(*)>1");
     return d.length===0 || "powtórzone: "+JSON.stringify(d); });

  console.log("═══ ETYKIETY ═══");
  T("istniejąca etykieta nie została zdublowana", ()=>{
     const r = pytaj("SELECT COUNT(*) FROM Tag WHERE Name='Studium'")[0];
     return r[0]===1 || "razy: "+r[0]; });
  T("nowa etykieta doszła", ()=>
     pytaj("SELECT TagId FROM Tag WHERE Name='Kongres 2026'").length===1);
  T("notatka jest powiązana ze swoją etykietą", ()=>{
     const r = pytaj(`SELECT t.Name FROM TagMap m
                      JOIN Note n ON n.NoteId=m.NoteId JOIN Tag t ON t.TagId=m.TagId
                      WHERE n.Guid='NOWA-1'`);
     return (r.length===1 && r[0][0]==="Studium") || "powiązania: "+JSON.stringify(r); });
  T("powiązania mają swoje pozycje", ()=>{
     const bez = pytaj("SELECT TagMapId FROM TagMap WHERE Position IS NULL");
     return bez.length===0 || "bez pozycji: "+JSON.stringify(bez); });

  console.log("═══ SPÓJNOŚĆ BAZY ═══");
  T("baza przechodzi kontrolę spójności SQLite", ()=>{
     const r = pytaj("PRAGMA integrity_check");
     return (r.length && r[0][0]==="ok") || "wynik: "+JSON.stringify(r); });
  T("znacznik ostatniej zmiany bazy odświeżony", ()=>{
     const r = pytaj("SELECT LastModified FROM LastModified")[0];
     return r[0] !== "2026-01-01T00:00:00+00:00" || "zostało: "+r[0]; });
  T("żadne powiązanie nie wskazuje na nieistniejącą notatkę", ()=>{
     const zle = pytaj(`SELECT m.TagMapId FROM TagMap m
                        LEFT JOIN Note n ON n.NoteId=m.NoteId
                        WHERE m.NoteId IS NOT NULL AND n.NoteId IS NULL`);
     return zle.length===0 || "osierocone: "+JSON.stringify(zle); });
  T("ani na nieistniejącą etykietę", ()=>{
     const zle = pytaj(`SELECT m.TagMapId FROM TagMap m
                        LEFT JOIN Tag t ON t.TagId=m.TagId WHERE t.TagId IS NULL`);
     return zle.length===0 || "osierocone: "+JSON.stringify(zle); });

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));

  wyjdz(niezdane ? 1 : 0,
    "\n════ "+zdane+" OK, "+niezdane+" błędów ════\n"
    + bledy.map(b=>"  ❌ "+b+"\n").join(""));
})().catch(e=>{ wyjdz(1, "❌ "+e.message+"\n"+(e.stack||"").split("\n").slice(0,4).join("\n")+"\n"); });
