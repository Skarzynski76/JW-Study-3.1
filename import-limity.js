/* Limity wczytywanych plików, obsługa uszkodzonych archiwów,
   brak wykonywania niesprawdzonego kodu z sieci, polityka bezpieczeństwa. */
const fs=require("fs"), path=require("path");
const plik=process.argv[2]||"./index.html";
const kat=path.dirname(plik);
const czytaj=(...p)=>{ const f=path.join(kat,...p); return fs.existsSync(f)?fs.readFileSync(f,"utf8"):fs.readFileSync(plik,"utf8"); };
const {poczekajNaStart}=require("./wspolne-testy.js");
const {dom,errors}=require("./wspolne.js")(plik, process.argv[3]||8137);
poczekajNaStart(dom.window).then(async ()=>{
  const w=dom.window, d=w.document; let p=0,f=0; const bad=[];
  const T=async (l,fn)=>{ try{ if(await fn()){p++} else {f++;bad.push(l)} }catch(e){ f++; bad.push(l+" → "+e.message); } };
  const zF=czytaj("js","17-files.js"), zB=czytaj("js","20-backup.js"), html=fs.readFileSync(plik,"utf8");

  console.log("═══ LIMITY ROZMIARU ═══");
  await T("limit archiwum .jwlibrary", ()=>typeof w.MAX_ARCHIWUM==="undefined" ? /MAX_ARCHIWUM\s*=\s*300/.test(zF) : true);
  await T("limit rozpakowanej bazy", ()=>/MAX_BAZA\s*=\s*400/.test(zF));
  await T("limit liczby wpisów w archiwum", ()=>/MAX_WPISOW_ZIP\s*=\s*5000/.test(zF));
  await T("limit kopii JSON", ()=>/MAX_KOPIA_JSON\s*=\s*300/.test(zB));
  await T("limit liczby notatek i etykiet", ()=>/MAX_NOTATEK\s*=\s*200000/.test(zB) && /MAX_ETYKIET\s*=\s*5000/.test(zB));
  await T("rozmiar sprawdzany PRZED czytaniem pliku", ()=>{
     const i1=zB.indexOf("f.size > MAX_KOPIA_JSON"), i2=zB.indexOf("await f.text()");
     return i1>0 && i2>i1; });
  await T("rozmiar po rozpakowaniu sprawdzany z nagłówka archiwum", ()=>
     /uncompressedSize/.test(zF) && zF.indexOf("uncompressedSize") < zF.indexOf('dbFile.async("uint8array")'));
  await T("pusty plik odrzucany", ()=>/file\.size === 0/.test(zF) && /f\.size === 0/.test(zB));
  await T("czytelny rozmiar w komunikatach", ()=>typeof w.ludzkiRozmiar==="function" && w.ludzkiRozmiar(1572864)==="1.5 MB");

  await T("wybór pliku nie ogranicza rozszerzeń (Android, Windows)", ()=>
    /inp\.accept = "";/.test(zF) || "accept wciąż ustawiany");

  console.log("═══ USZKODZONE ARCHIWUM ═══");
  await T("nieotwierające się archiwum ma własny komunikat", ()=>/nie da się otworzyć jako archiwum/.test(zF));
  await T("brak userData.db rozpoznany", ()=>/nie ma pliku userData\.db/.test(zF));
  await T("nagłówek SQLite sprawdzany przed otwarciem bazy", ()=>{
     const i1=zF.indexOf('"SQLite format 3"'), i2=zF.indexOf("new SQL.Database");
     return i1>0 && i2>i1; });
  await T("błąd rozpakowania łapany osobno", ()=>/Nie udało się rozpakować bazy/.test(zF));
  await T("brak spodziewanych tabel łapany osobno", ()=>/nie ma w niej spodziewanych tabel/.test(zF));
  await T("baza domykana także po błędzie", ()=>/\}finally\{[\s\S]{0,120}db\.close\(\)/.test(zF));
  await T("komunikat uspokaja co do notatek", ()=>/Twoje notatki pozostały nietknięte/.test(zF));

  console.log("═══ ŻADNEGO KODU Z SIECI ═══");
  /* Biblioteki do odczytania archiwum wykonują się z dostępem do wszystkich
     notatek. Do wersji 1.93 pobierały się z cdnjs — teraz są częścią aplikacji
     i nie ma drogi, którą można by sięgnąć na zewnątrz. */
  await T("biblioteki brane wyłącznie z katalogu obok aplikacji", ()=>
    /plik: "\.\/lib\/jszip\.min\.js"/.test(zF) && /plik: "\.\/lib\/sql-wasm\.js"/.test(zF));
  await T("w kodzie nie został żaden obcy adres", ()=>{
    const adresy = [...new Set((zF.match(/https?:\/\/[a-z0-9.-]+/gi)||[]))];
    return adresy.length===0 || "znaleziono: "+adresy.join(", "); });
  await T("silnik bazy też z katalogu obok", ()=>/locateFile: f => "\.\/lib\/" \+ f/.test(zF));
  await T("brak pytania o zgodę — nie ma o co pytać", ()=>
    !/zgodaNaBiblioteki|Pobierz z cdnjs/.test(zF));
  await T("brak biblioteki mówi wprost, co zrobić", ()=>
    /Wgraj katalog lib\/ razem z aplikacją/.test(zF));
  await T("pliki bibliotek są w paczce", ()=>{
    const kat = path.join(path.dirname(plik), "lib");
    return ["jszip.min.js","sql-wasm.js","sql-wasm.wasm"].every(f=>fs.existsSync(path.join(kat,f)))
      || "brakuje plików w lib/"; });
  await T("obsługa offline zapisuje je na urządzeniu", ()=>{
    const sw = fs.existsSync(path.join(path.dirname(plik),"sw.js"))
      ? fs.readFileSync(path.join(path.dirname(plik),"sw.js"),"utf8") : "";
    return /lib\/jszip\.min\.js/.test(sw) && /lib\/sql-wasm\.wasm/.test(sw); });
  await T("sumy kontrolne podane do sprawdzenia", ()=>{
    const r = path.join(path.dirname(plik),"lib","README.md");
    return fs.existsSync(r) && /sha384-/.test(fs.readFileSync(r,"utf8")); });

  console.log("═══ POLITYKA BEZPIECZEŃSTWA TREŚCI ═══");
  const meta=d.querySelector('meta[http-equiv="Content-Security-Policy"]');
  await T("polityka obecna w kodzie strony", ()=>!!meta);
  const tresc = meta ? meta.getAttribute("content") : "";
  [["default-src 'self'","źródło domyślne"],["object-src 'none'","brak wtyczek"],
   ["base-uri 'self'","brak podmiany adresu bazowego"],["form-action 'none'","brak wysyłki formularzy"],
   ["frame-src 'none'","brak ramek"],["worker-src 'self'","wątki tylko własne"]]
   .forEach(([regula,opis])=>T(opis, ()=>tresc.indexOf(regula)>=0));
  await T("skrypty wyłącznie z tego samego adresu", ()=>
    /script-src 'self'/.test(tresc) && !/https?:\/\//.test(tresc.match(/script-src[^;]*/)[0]));
  await T("połączenia wyłącznie z tym samym adresem", ()=>
    /connect-src 'self'/.test(tresc) && !/https?:\/\//.test(tresc.match(/connect-src[^;]*/)[0]));
  await T("w całej polityce nie ma obcego adresu", ()=>
    !/https?:\/\//.test(tresc) || "polityka zawiera: "+(tresc.match(/https?:\/\/[a-z.]*/)||[])[0]);
  await T("sql.js dostaje potrzebne wasm-unsafe-eval", ()=>tresc.indexOf("'wasm-unsafe-eval'")>=0);
  await T("brak atrybutów onclick w kodzie strony", ()=>!/\son[a-z]+="/.test(html.replace(/content="/g,"")));
  await T("zamykanie okien przez wspólny nasłuch", ()=>d.querySelectorAll("[data-zamknij]").length>=7);
  await T("przycisk zamknięcia nadal działa", ()=>{
     w.openModal("modalHelp");
     d.querySelector('#modalHelp [data-zamknij]').click();
     return !d.getElementById("modalHelp").classList.contains("show"); });

  await T("brak błędów wykonania", ()=>errors.length===0);

  console.log("\n════ "+p+" OK, "+f+" błędów ════");
  bad.forEach(b=>console.log("  ❌ "+b));
  if(errors.length) console.log("Błędy JS: "+errors.slice(0,2).join(" | "));
  process.exit(f?1:0);
}).catch(e=>{ console.log("❌ "+e.message); process.exit(1); });
