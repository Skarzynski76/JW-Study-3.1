/* TEST BEZPIECZEŃSTWA — wstrzyknięcie kodu przez plik kopii JSON. */
const fs=require("fs"), path=require("path");
const plik=process.argv[2]||"./index.html";
const {poczekajNaStart}=require("./wspolne-testy.js");
const {dom,errors}=require("./wspolne.js")(plik, process.argv[3]||8137);
poczekajNaStart(dom.window).then(async ()=>{
  const w=dom.window, d=w.document; let p=0,f=0; const bad=[];
  const T=(l,fn)=>{ try{ if(fn()){p++} else {f++;bad.push(l)} }catch(e){ f++; bad.push(l+" → "+e.message); } };
  w.__wybuch = 0;
  w.eval('window.wybuch = function(){ window.__wybuch++; };');

  const LADUNKI = [
    ['<script>wybuch()<\/script>',                                  "znacznik script"],
    ['<img src=x onerror="wybuch()">',                              "obrazek z onerror"],
    ['<svg><animate onbegin="wybuch()" attributeName="x">',         "svg z onbegin"],
    ['<svg onload="wybuch()"></svg>',                               "svg z onload"],
    ['<iframe src="javascript:wybuch()"></iframe>',                 "ramka z javascript:"],
    ['<a href="javascript:wybuch()">klik</a>',                      "odnosnik javascript:"],
    ['<a href="data:text/html,<script>wybuch()<\/script>">x</a>',   "odnosnik data:"],
    ['<body onload="wybuch()">',                                    "body z onload"],
    ['<div onmouseover="wybuch()">najedz</div>',                    "zdarzenie w atrybucie"],
    ['<form action="javascript:wybuch()"><button>x</button></form>',"formularz"],
    ['<object data="javascript:wybuch()"></object>',                "object"],
    ['<embed src="javascript:wybuch()">',                           "embed"],
    ['<style>@import "javascript:wybuch()";</style>',               "styl z importem"],
    ['<img src="x" onerror=wybuch() >',                             "onerror bez cudzyslowow"],
    ['<IMG SRC=x ONERROR="wybuch()">',                              "wielkie litery"],
    ['<img/src=x/onerror=wybuch()>',                                "ukosniki zamiast spacji"],
    ['<iframe srcdoc="&lt;script&gt;wybuch()&lt;/script&gt;">',     "srcdoc"],
    ['<meta http-equiv="refresh" content="0;javascript:wybuch()">', "meta refresh"],
    ['<link rel="stylesheet" href="javascript:wybuch()">',          "link"],
    ['<base href="javascript:wybuch()//">',                         "base"]
  ];
  console.log("═══ TREŚĆ NOTATKI Z CUDZEGO PLIKU ═══");
  LADUNKI.forEach(([kod, nazwa])=>{
    T("nie przechodzi: "+nazwa, ()=>{
      const przed = w.__wybuch;
      const n = w.sanitizeNote({g:"x", h:kod, tg:[]}, true);
      const box = d.createElement("div"); box.innerHTML = n.h; d.body.appendChild(box);
      const wykonano = w.__wybuch > przed;
      const zostalo = /on\w+\s*=|javascript:|<script|<iframe|<object|<embed|srcdoc|http-equiv/i.test(n.h);
      box.remove();
      return !wykonano && !zostalo;
    });
  });

  console.log("═══ KOLOR ETYKIETY W ATRYBUCIE STYLU ═══");
  ['" onload="wybuch()','red" onmouseover="wybuch()','url(javascript:wybuch())','expression(wybuch())',
   '#fff;background-image:url(javascript:x)','"><img src=x onerror=wybuch()>','red;}</style><script>x<\/script>']
   .forEach(kol=>T("odrzucony kolor: "+kol.slice(0,24), ()=>w.kolorBezpieczny(kol)===false));
  ["#fff","#a1b2c3","#a1b2c3dd","rgb(10, 20, 30)","rgba(1,2,3,.5)","tomato","hsl(200, 50%, 40%)"]
   .forEach(kol=>T("przyjęty kolor: "+kol, ()=>w.kolorBezpieczny(kol)===true));
  T("etykieta z groźnym kolorem traci kolor", ()=>{
    const r=w.sanitizeTags([{id:1,name:"Zla",color:'" onload="wybuch()'}],"test",true);
    return r.length===1 && r[0].color===undefined; });
  T("etykieta z poprawnym kolorem go zachowuje", ()=>
    w.sanitizeTags([{id:2,name:"Dobra",color:"#3366aa"}],"test",true)[0].color==="#3366aa");
  T("groźny kolor nie trafia na ekran nawet z bazy", ()=>{
    const przed=w.__wybuch;
    const html=w.tagItem(9,"Etykieta",3,true,'" onload="wybuch()',false,undefined);
    const box=d.createElement("div"); box.innerHTML=html; d.body.appendChild(box);
    const zle=/onload|onmouseover/i.test(html); box.remove();
    return !zle && w.__wybuch===przed; });

  console.log("═══ NAZWY ETYKIET ═══");
  T("nazwa etykiety nie wykonuje kodu", ()=>{
    const przed=w.__wybuch;
    const html=w.tagItem(8,'<img src=x onerror="wybuch()">',1,true,"",false,undefined);
    const box=d.createElement("div"); box.innerHTML=html; d.body.appendChild(box);
    const ok=box.querySelectorAll("img").length===0 && w.__wybuch===przed;
    box.remove(); return ok; });

  console.log("═══ CO MA PRZEŻYĆ ═══");
  T("zwykłe formatowanie zostaje", ()=>{
    const n=w.sanitizeNote({g:"y",h:'<div><b>pogrubienie</b> <i>kursywa</i> <mark class="hl2">tlo</mark></div>',tg:[]},true);
    return /<b>/.test(n.h) && /<i>/.test(n.h) && /hl2/.test(n.h); });
  T("odnośnik do JW Library zostaje", ()=>{
    const n=w.sanitizeNote({g:"z",h:'<a class="jwl-ref" href="jwlibrary:///finder?x=1">Jan 3:16</a>',tg:[]},true);
    return /jwlibrary:/.test(n.h) && /jwl-ref/.test(n.h); });
  T("zdjęcie w notatce zostaje", ()=>{
    const n=w.sanitizeNote({g:"w",h:'<img src="data:image/png;base64,iVBOR" class="img-m">',tg:[]},true);
    return /<img/.test(n.h) && /data:image/.test(n.h); });
  T("własne dane nie są przemielane bez potrzeby", ()=>{
    const surowe='<div>zwykły tekst</div>';
    return w.sanitizeNote({g:"v",h:surowe,tg:[]}).h === surowe; });

  console.log("═══ IMPORT KORZYSTA Z FILTRA ═══");
  const zrodlo=(()=>{ const f=path.join(path.dirname(plik),"js","20-backup.js");
    return fs.existsSync(f)?fs.readFileSync(f,"utf8"):fs.readFileSync(plik,"utf8"); })();
  T("wczytywanie kopii oznacza dane jako obce", ()=>
    /sanitizeNotes\(data\.notes, "wczytana kopia", true\)/.test(zrodlo) &&
    /sanitizeTags\(data\.tags, "wczytana kopia", true\)/.test(zrodlo));
  T("sekcje z pliku też są sprawdzane", ()=>/kolorBezpieczny\(sek\.color\)/.test(zrodlo));
  T("brak błędów wykonania", ()=>errors.length===0);
  T("obcy kod nie wykonał się ani razu", ()=>w.__wybuch===0);

  console.log("\n════ "+p+" OK, "+f+" błędów ════");
  bad.forEach(b=>console.log("  ❌ "+b));
  if(errors.length) console.log("Błędy JS: "+errors.slice(0,2).join(" | "));
  process.exit(f?1:0);
}).catch(e=>{ console.log("❌ "+e.message); process.exit(1); });
