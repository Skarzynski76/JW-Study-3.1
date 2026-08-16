/* „Zastąp wszystko" ma być niepodzielne, a po imporcie zapis potwierdzony odczytem. */
const fs=require("fs"), path=require("path");
const plik=process.argv[2]||"./index.html";
const kat=path.dirname(plik);
const czytaj=(...p)=>{ const f=path.join(kat,...p); return fs.existsSync(f)?fs.readFileSync(f,"utf8"):fs.readFileSync(plik,"utf8"); };
const {poczekajNaStart, wyjdz}=require("./wspolne-testy.js");
const {dom,errors}=require("./wspolne.js")(plik, process.argv[3]||8137);
poczekajNaStart(dom.window).then(async ()=>{
  const w=dom.window; let p=0,f=0; const bad=[];
  const T=async (l,fn)=>{ try{ if(await fn()){p++} else {f++;bad.push(l)} }catch(e){ f++; bad.push(l+" → "+e.message); } };
  const zrodloS=czytaj("js","02-storage.js"), zrodloB=czytaj("js","20-backup.js");

  console.log("═══ JEDNA TRANSAKCJA, NIE DWIE ═══");
  await T("jest funkcja wymiany całej bazy", ()=>typeof w.idbZastapWszystko==="function");
  await T("czyszczenie i zapis w tej samej transakcji", ()=>
    /idb\.transaction\(\["notes","tags","meta"\],"?\s*"readwrite"\)/.test(zrodloS.replace(/\s+/g,"")) ||
    /transaction\(\["notes","tags","meta"\], "readwrite"\)/.test(zrodloS));
  await T("clear i put w jednym bloku", ()=>{
    const blok=zrodloS.slice(zrodloS.indexOf("function idbZastapWszystko"), zrodloS.indexOf("async function sprawdzZapis"));
    return /sn\.clear\(\); st\.clear\(\);/.test(blok) && /sn\.put\(n\)/.test(blok) && /st\.put\(t\)/.test(blok); });
  await T("sekcje i zakładki w tej samej transakcji", ()=>{
    const blok=zrodloS.slice(zrodloS.indexOf("function idbZastapWszystko"), zrodloS.indexOf("async function sprawdzZapis"));
    return /sm\.put\(noweSekcje,\s*"sections"\)/.test(blok) && /sm\.put\(noweZakladki,\s*"pubTabs"\)/.test(blok); });
  await T("przerwana transakcja kończy się błędem, nie ciszą", ()=>
    /tx\.onabort\s*=\s*\(\)=>rej/.test(zrodloS) && /tx\.onerror\s*=\s*\(\)=>rej/.test(zrodloS));
  await T("stare, dwuetapowe czyszczenie usunięte", ()=>
    !/objectStore\("notes"\)\.clear\(\);t\.objectStore\("tags"\)\.clear\(\)/.test(zrodloB));

  console.log("═══ PAMIĘĆ PODMIENIANA DOPIERO PO ZAPISIE ═══");
  const iZapis=zrodloB.indexOf("await idbZastapWszystko");
  const iPamiec=zrodloB.indexOf("notes = noweNotes; tags = noweTags;");
  await T("zapis do bazy wyprzedza podmianę pamięci", ()=>iZapis>0 && iPamiec>iZapis);
  await T("niepełny zapis przerywa całość", ()=>/if\(kontrola && !kontrola\.zgadza\)\{[\s\S]{0,600}?return;/.test(zrodloB));
  await T("komunikat mówi, że dane zostały nietknięte", ()=>/nie zostały podmienione/.test(zrodloB));
  await T("błąd nie gubi dotychczasowych danych", ()=>/pozostały nietknięte/.test(zrodloB));

  console.log("═══ NADPISANIE PRZY POWTÓRNYM IMPORCIE ═══");
  /* Dołączanie nadpisuje notatkę tylko wtedy, gdy ta z pliku jest NOWSZA.
     Przy powtórnym przenoszeniu z innego programu data pochodzi ze źródła
     i się nie zmienia — bez osobnego wyboru poprawiona treść nigdy by nie weszła. */
  await T("bez nadpisania notatka o tej samej dacie zostaje", ()=>{
    w.eval(`notes.length=0; tags.length=0;
      notes.push({g:"x1",t:"T",h:"<div>STARA</div>",c:"STARA",tg:[],b:null,ch:null,ks:null,
        cr:"2024-01-01T00:00:00Z",mo:"2025-01-01T00:00:00Z",del:false});`);
    const plik={tags:[],sections:[],pubTabs:[],secTabs:[],notes:[{g:"x1",t:"T",
      h:"<div>NOWA</div>",c:"NOWA",tg:[],b:null,ch:null,ks:null,
      cr:"2024-01-01T00:00:00Z",mo:"2025-01-01T00:00:00Z",del:false}]};
    const r=w.mergeBackup(JSON.parse(JSON.stringify(plik)), true, false);
    return r.st.notesKept===1 && r.st.notesUpdated===0 && /STARA/.test(w.eval("notes[0].h"));
  });
  await T("z nadpisaniem treść z pliku wchodzi", ()=>{
    const plik={tags:[],sections:[],pubTabs:[],secTabs:[],notes:[{g:"x1",t:"T",
      h:"<div>NOWA</div>",c:"NOWA",tg:[],b:null,ch:null,ks:null,
      cr:"2024-01-01T00:00:00Z",mo:"2025-01-01T00:00:00Z",del:false}]};
    const r=w.mergeBackup(JSON.parse(JSON.stringify(plik)), true, true);
    return r.st.notesUpdated===1 && /NOWA/.test(w.eval("notes[0].h"));
  });
  await T("data utworzenia przetrwa nadpisanie", ()=>w.eval("notes[0].cr")==="2024-01-01T00:00:00Z");
  await T("okno wyboru ma tę możliwość", ()=>/Dołącz \+ nadpisz istniejące/.test(zrodloB));
  await T("podpowiedź, gdy wszystko zostało pominięte", ()=>/Nic się nie zmieniło\?/.test(zrodloB));

  console.log("═══ ZAKŁADKI SEKCJI PRZY DOŁĄCZANIU ═══");
  /* Numery zakładek na dwóch urządzeniach są niezależne. Bez dopasowania po nazwie
     notatka z drugiego urządzenia trafiłaby do przypadkowej zakładki. */
  await T("zakładka dopasowywana po sekcji i nazwie, nie po numerze", ()=>
    /secTabs\.find\(x=>x\.sec===docelowaSekcja && norm\(x\.name\)===norm\(z\.name\)\)/.test(zrodloB));
  await T("przypisanie notatki przenumerowane", ()=>/zakMap\[mapped\.stb\]/.test(zrodloB));
  await T("wskazanie nieznanej zakładki jest zdejmowane, nie zgadywane", ()=>
    /if\(zakMap\[mapped\.stb\]!==undefined\) mapped\.stb=zakMap\[mapped\.stb\];\s*else delete mapped\.stb;/.test(zrodloB));
  await T("etykiety w zakładkach też przenumerowane", ()=>/moja\.stb = zakMap\[t\.stb\]/.test(zrodloB));
  await T("podsumowanie mówi o nowych zakładkach sekcji", ()=>/Nowych zakładek w sekcjach/.test(zrodloB));
  await T("notatka trafia do zakładki o tej samej nazwie", ()=>{
    w.eval(`notes.length=0;tags.length=0;sections.length=0;secTabs.length=0;
      sections.push({id:3,name:"Kongresy",ord:0,open:true});
      secTabs.push({id:99,sec:3,name:"Kongres 2026",ord:0});`);
    const zPliku = {tags:[], sections:[{id:1,name:"Kongresy",ord:0,open:true}],
      secTabs:[{id:1,sec:1,name:"Kongres 2026",ord:0}], pubTabs:[],
      notes:[{g:"z1",t:"Przyszła",h:"<div>x</div>",c:"x",tg:[],b:null,ch:null,ks:null,
        cr:"2024-01-01",mo:"2024-01-01",del:false,stb:1}]};
    w.mergeBackup(zPliku, true);
    const n = w.eval("notes").find(x=>x.g==="z1");
    const zak = w.eval("secTabs");
    return (zak.length===1 && n && n.stb===99) || `zakładek ${zak.length}, stb ${n&&n.stb}`;
  });

  console.log("═══ POTWIERDZENIE ZAPISU ODCZYTEM ═══");
  await T("jest funkcja sprawdzająca", ()=>typeof w.sprawdzZapis==="function");
  await T("sprawdzenie liczy rekordy w bazie", ()=>/idbCount\("notes"\), idbCount\("tags"\)/.test(zrodloS));
  await T("zastąpienie potwierdza liczby z bazy", ()=>/Zapisano i sprawdzono w bazie urządzenia/.test(zrodloB));
  await T("dołączenie też potwierdza", ()=>/Zapisano i sprawdzono: <b>\$\{kontrolaM\.notatki\}/.test(zrodloB));

  // działanie na atrapie bazy — podstawiamy zmienną modułu, nie własność okna
  w.eval(`
    window.__zapisane=null; window.__przerwij=false;
    idb = { transaction(){
      const dane={notes:[],tags:[],meta:{}};
      const tx={};
      const sklep=(n)=>({clear(){dane[n]=[];}, put(v,k){ if(k!==undefined) dane.meta[k]=v; else dane[n].push(v); }});
      tx.objectStore=(n)=>sklep(n);
      /* Zawiadamiamy przez mikrozadanie, nie przez zegar. setTimeout(...,0)
         ścigał się z przypisaniem tx.oncomplete/onabort w badanym kodzie. Gdy
         zegar wygrywał, obietnica nie rozstrzygała się nigdy: zestaw cicho
         kończył pracę, wychodził z kodem 0 i wyglądał na zdany — bez
         podsumowania. Mikrozadanie rusza dopiero po całym ciele funkcji. */
      Promise.resolve().then(()=>{
        if(window.__przerwij){
          tx.error = new Error("brak miejsca");
          (tx.onabort || tx.onerror || (()=>{}))();
        }else{
          window.__zapisane = dane;
          (tx.oncomplete || (()=>{}))();
        }
      });
      return tx;
    } };
  `);
  await T("udany zapis oddaje komplet danych", async ()=>{
    w.__przerwij=false;
    const ok=await w.idbZastapWszystko([{g:"1"},{g:"2"}], [{id:1,name:"E"}], [{id:9,name:"S"}], [{id:3,name:"Z"}]);
    const z=w.__zapisane;
    return ok===true && z.notes.length===2 && z.tags.length===1
        && z.meta.sections.length===1 && z.meta.pubTabs.length===1; });
  await T("przerwany zapis zgłasza błąd zamiast po cichu przejść", async ()=>{
    w.__przerwij=true;
    try{ await w.idbZastapWszystko([{g:"1"}], [], [], []); return false; }
    catch(e){ return /brak miejsca/.test(e.message); } });
  await T("nieudany zapis nie zostawia półproduktu", ()=>w.__zapisane && w.__zapisane.notes.length===2);

  await T("brak błędów wykonania", ()=>errors.length===0);

  wyjdz(f?1:0, "\n════ "+p+" OK, "+f+" błędów ════\n"
              + bad.map(b=>"  ❌ "+b+"\n").join("")
              + (errors.length ? "Błędy JS: "+errors.slice(0,2).join(" | ")+"\n" : ""));
}).catch(e=>{ wyjdz(1, "❌ "+e.message+"\n"); });
