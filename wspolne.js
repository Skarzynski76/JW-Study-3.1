module.exports = function(plik, port, opcje){
  const fs=require("fs"), path=require("path");
  /* Biblioteka jsdom bywa zainstalowana w projekcie albo globalnie w środowisku.
     Szukamy po kolei zamiast wpisywać ścieżkę na sztywno — wpisana na sztywno
     wskazywała kiedyś poza repozytorium i testy przestawały działać po przeniesieniu. */
  const {JSDOM,VirtualConsole} = (()=>{
    const kandydaci = [
      path.join(__dirname,"..","node_modules","jsdom"),
      path.join(__dirname,"node_modules","jsdom"),
      "jsdom", "/tmp/node_modules/jsdom"
    ];
    for(const k of kandydaci){ try{ return require(k); }catch(e){} }
    throw new Error("Brak biblioteki jsdom — uruchom: npm install jsdom axe-core");
  })();
  const html=fs.readFileSync(plik,"utf8");
  const vc=new VirtualConsole();const errors=[];
  vc.on("jsdomError", e=>{
    const tresc = String((e && e.detail && (e.detail.message || e.detail)) || e || "");
    /* jsdom nie ma rysowania na płótnie i zgłasza to jako błąd. Aplikacja tego
       oczekuje i ma zapasową drogę, więc nie jest to usterka do zgłaszania. */
    if(/Not implemented: HTMLCanvasElement/.test(tresc)) return;
    errors.push(tresc);
  });
  function mkStore(){return {get:()=>({}),put:()=>({}),getAll:()=>({}),delete:()=>({}),clear:()=>({}),count:()=>({}),index:()=>({getAll:()=>({})})};}
  /* Podstawiona transakcja MUSI się kończyć.
     Wcześniej zwracała goły obiekt bez oncomplete, więc kod czekający na koniec
     zapisu (idbZastapWszystko) nie doczekiwał się nigdy: pętla zdarzeń pustoszała,
     zestaw cicho kończył pracę i wychodził z kodem 0 — czyli meldował sukces.
     Zawiadamiamy mikrozadaniem, żeby zdążyły się podpiąć procedury tx.oncomplete. */
  function mkTx(){
    const tx = {objectStore:()=>mkStore(), abort(){ tx.__przerwana=true; }};
    Promise.resolve().then(()=>{
      if(tx.__przerwana){ (tx.onabort || tx.onerror || (()=>{}))(); }
      else (tx.oncomplete || (()=>{}))();
    });
    return tx;
  }
  const dom=new JSDOM(html,{runScripts:"dangerously",url:"http://127.0.0.1:"+port+"/index.html",resources:"usable",pretendToBeVisual:true,virtualConsole:vc,
   beforeParse(w){w.matchMedia=q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
    w.indexedDB=(opcje && opcje.indexedDB) || {open(){const r={};setTimeout(function(){const db={objectStoreNames:{contains:()=>true},createObjectStore:()=>({createIndex(){}}),transaction:()=>mkTx(),close(){}};r.result=db;if(r.onsuccess)r.onsuccess({target:{result:db}});},0);return r;}};
    w.crypto={subtle:{digest:async()=>new ArrayBuffer(32)},randomUUID:()=>"X"};w.scrollTo=()=>{};w.open=()=>({});
    /* jsdom nie implementuje hit-testu układu. Prawdziwe przeglądarki mają tę
       funkcję; pusta odpowiedź pozwala testować drogę zapasową bez sztucznego
       TypeError, który wcześniej udawał awarię dotyku. */
    w.document.elementFromPoint=()=>null;
    w.IntersectionObserver=class{observe(){}disconnect(){}};w.requestAnimationFrame=cb=>setTimeout(cb,0);w.Element.prototype.scrollIntoView=function(){};
    w.navigator.storage={estimate:async()=>({usage:5e6,quota:1e9})};
    w.navigator.clipboard={writeText:()=>Promise.resolve()};w.scrollBy=()=>{};
    const rejestracje=[];
    w.navigator.serviceWorker={_opcje:null,controller:{},ready:Promise.resolve(),
      register(u,o){this._opcje=o;const r={scope:"/",installing:null,update(){},addEventListener(){}};rejestracje.push(r);return Promise.resolve(r);},
      getRegistrations(){return Promise.resolve(rejestracje);},addEventListener(){}};
    if(opcje && opcje.vv) w.visualViewport={height:400,offsetTop:0,addEventListener(){}};
    w.getSelection=()=>({isCollapsed:true,rangeCount:0,toString:()=>""});}});
  return {dom, errors};
};
