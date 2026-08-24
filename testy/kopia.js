/* ==========================================================================
   KOPIA ZAPASOWA — nadpisywanie jednego pliku zamiast mnożenia nowych.
   ========================================================================== */
const {T, TA, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const js = zrodlo("js","20-backup.js");

  // atrapa bazy i pliku na dysku
  const magazyn={};
  w.idbGet=(s,k)=>Promise.resolve(magazyn[k]);
  w.idbPut=(s,v,k)=>{ magazyn[k]=v; return Promise.resolve(); };
  w.idbDelKey=(s,k)=>{ delete magazyn[k]; return Promise.resolve(); };
  let naDysku=null, zamkniec=0, pobrania=0;
  const uchwyt={ name:"moje-notatki-kopia.json",
    queryPermission:()=>Promise.resolve(uchwyt._prawo||"granted"),
    requestPermission:()=>{ uchwyt._prawo="granted"; return Promise.resolve("granted"); },
    createWritable:()=>Promise.resolve({ write:(t)=>{ naDysku=t; return Promise.resolve(); },
                                         close:()=>{ zamkniec++; return Promise.resolve(); } }) };
  w.saveFile=()=>{ pobrania++; return Promise.resolve(true); };
  w.clearDirty=()=>{};

  console.log("═══ BEZ WSKAZANEGO PLIKU ═══");
  await w.exportJson();
  T("kopia jest pobierana", ()=>pobrania===1 && naDysku===null);
  T("nazwa zawiera datę", ()=>/moje-notatki-kopia-" \+ new Date/.test(js));

  console.log("═══ ZE WSKAZANYM PLIKIEM ═══");
  w.showSaveFilePicker=()=>Promise.resolve(uchwyt);
  T("przeglądarka rozpoznana jako zdolna", ()=>w.stalyPlikDostepny()===true);
  await TA("wskazanie zapamiętane", async ()=>await w.wskazPlikKopii()===true);
  await w.wskazPlikKopii();
  const przed=pobrania;
  await w.exportJson();
  T("kopia trafia do pliku, nie do pobrań", ()=>pobrania===przed && typeof naDysku==="string" && naDysku.length>10);
  T("zapisane dane to poprawna kopia", ()=>{
     const o=JSON.parse(naDysku);
     return "notes" in o && "tags" in o && "sections" in o && "pubTabs" in o; });
  T("plik domykany po zapisie", ()=>zamkniec>=1);
  w.eval('notes.push({g:"nowa",t:"Nowa notatka",h:"",c:"",tg:[],b:null,ch:null,ks:null,cr:"",mo:"",del:false,ptb:null})');
  const przed2=pobrania, zam2=zamkniec;
  await w.exportJson();
  T("druga kopia nadpisuje ten sam plik", ()=>pobrania===przed2 && zamkniec===zam2+1 && /Nowa notatka/.test(naDysku));
  await TA("nazwa pliku widoczna dla użytkownika", async ()=>await w.nazwaPlikuKopii()==="moje-notatki-kopia.json");

  console.log("═══ GDY COŚ PÓJDZIE NIE TAK ═══");
  uchwyt._prawo="denied"; uchwyt.requestPermission=()=>Promise.resolve("denied");
  const przed3=pobrania; await w.exportJson();
  T("odmowa prawa → zwykłe pobranie", ()=>pobrania===przed3+1);
  uchwyt._prawo="granted"; uchwyt.requestPermission=()=>Promise.resolve("granted");
  const dobry=uchwyt.createWritable;
  uchwyt.createWritable=()=>Promise.reject(new Error("dysk pełny"));
  const przed4=pobrania; await w.exportJson(); uchwyt.createWritable=dobry;
  T("błąd zapisu → zwykłe pobranie, kopia nie przepada", ()=>pobrania===przed4+1);
  const blad=new Error("x"); blad.name="AbortError";
  w.showSaveFilePicker=()=>Promise.reject(blad);
  await TA("rezygnacja z okna wyboru nic nie psuje", async ()=>await w.wskazPlikKopii()===false);
  w.showSaveFilePicker=()=>Promise.resolve(uchwyt);
  await w.zapomnijPlikKopii();
  const przed5=pobrania; await w.exportJson();
  T("można wrócić do pobierania", ()=>pobrania===przed5+1);

  console.log("═══ PRZEGLĄDARKA BEZ TEJ MOŻLIWOŚCI ═══");
  delete w.showSaveFilePicker;
  T("rozpoznana poprawnie", ()=>w.stalyPlikDostepny()===false);
  await TA("wskazanie pliku nie wywala aplikacji", async ()=>await w.wskazPlikKopii()===false);
  const przed6=pobrania; await w.exportJson();
  T("kopia nadal działa przez pobranie", ()=>pobrania===przed6+1);

  console.log("═══ USTAWIENIA ═══");
  w.openSettings();
  T("przycisk wskazania pliku", ()=>!!d.querySelector('#setBody [data-act="plikKopii"]'));
  await new Promise(r=>setTimeout(r,40));
  T("opis mówi, co się dzieje", ()=>{
     const t=d.getElementById("stPlikKopii"); return t && t.textContent.length>10; });

  T("brak błędów wykonania", ()=>errors.length===0 || errors.join(" "));
});
