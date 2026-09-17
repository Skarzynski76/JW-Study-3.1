'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]?path.dirname(process.argv[2]):path.join(__dirname,'..'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const tests=[];function test(name,fn){tests.push({name,fn});}
function fn(name){
  const m=new RegExp('^(?:async )?function '+name+'\\(','m').exec(html);assert(m,'Brak funkcji '+name);
  const lines=html.slice(m.index).split('\n');let code='';
  for(const line of lines){code+=line+'\n';try{new vm.Script(code);return code;}catch{}}
  throw Error('Nie można odczytać funkcji '+name);
}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dom=require('./dom-testowy')(path.join(root,'lib/smart-import/mammoth.browser.min.js'));
const base={...dom,console,setTimeout,clearTimeout,AbortController,Uint8Array,ArrayBuffer,URL,Date,crypto:require('node:crypto').webcrypto,
 esc:escape,appleEsc:escape,tekstDoPorownania:s=>String(s||'').trim().toLowerCase(),smartTypy:new WeakMap(),smartOcrZasoby:()=>({workerPath:"blob:https://example.test/ocr",langs:[{code:"pol",data:new Uint8Array([1])}]}),smartAbortController:null,smartOcrWorker:null,_stanImportu:null,
 SMART_MAX_STRON_MOBILE:120,SMART_MAX_STRON_DESKTOP:400,MAX_WPISOW_ZIP:5000,
 importNaUrzadzeniuMobilnym:()=>false,ustawPostepImportu(){},oddechImportu:async()=>{},
 location:{href:'https://example.test/jw/index.html'},pokazBrakPamieci(){},reportSaveError(){},idb:null,
 WYTNIJ_Z_ZAWARTOSCIA:['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','FORM','META','LINK','BASE','TEMPLATE','NOSCRIPT','APPLET'],
};
const allFns=['sanitize','bezpiecznyKolor','htmlToPlain','bladBrakuPamieci','idbWrite','idbPut','idbDelKey','idbBulk','saveNote','idbZapiszImportZewnetrzny','szkicOdzyskaj','szkicKlucz',
 'smartSprawdzTyp','smartCzekaj','smartMaTresc','smartTaSamaNotatka','smartHtmlZTekstu','smartPodzielNaglowki','smartNazwaBezRozszerzenia','smartTyp','smartTekstPdf','smartCzytajPdf','smartCzytajDocx','smartCzytajSkanPdf','smartWorkerOcr','smartRozpoznajObraz','smartZakonczOcr','sprawdzAnulowanieImportu','ludzkiRozmiar'];
function context(extra={}){const c=vm.createContext({...base,...extra});vm.runInContext('class ImportAnulowany extends Error {constructor(){super("Anulowano");this.name="ImportAnulowany";}}\n'+allFns.map(fn).join('\n'),c);return c;}
function fakeDb({abort=false}={}){
  let tx;
  const db={transaction(){tx={objectStore(){return {put(){return {};},delete(){return {};}};},abort(){queueMicrotask(()=>tx.onabort?.());}};return tx;}};
  return {db,get tx(){return tx;}};
}
function pdfBytes(texts){
  const objects=[];objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('<< /Type /Pages /Kids ['+texts.map((_,i)=>(3+i*2)+' 0 R').join(' ')+'] /Count '+texts.length+' >>');
  const font=3+texts.length*2;
  for(let i=0;i<texts.length;i++){
    const stream='BT /F1 14 Tf 40 700 Td ('+texts[i]+') Tj ET';
    objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 '+font+' 0 R >> >> /Contents '+(4+i*2)+' 0 R >>');
    objects.push('<< /Length '+Buffer.byteLength(stream)+' >>\nstream\n'+stream+'\nendstream');
  }
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  let out='%PDF-1.4\n',offsets=[0];for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(out));out+=(i+1)+' 0 obj\n'+objects[i]+'\nendobj\n';}
  const start=Buffer.byteLength(out);out+='xref\n0 '+offsets.length+'\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('');
  out+='trailer\n<< /Size '+offsets.length+' /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF';return Buffer.from(out);
}
const file=(name,bytes)=>({name,size:bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer});

test('Składnia wszystkich skryptów i zgodność wersji',()=>{
 let count=0;for(const m of html.matchAll(/^<script(?:\s[^>]*)?>\s*\n([\s\S]*?)<\/script>/gm)){new vm.Script(m[1]);count++;}assert.equal(count,55);
 for(const name of ['sw.js','search-worker.js'])new vm.Script(fs.readFileSync(path.join(root,name),'utf8'));
 for(const m of fs.readFileSync(path.join(root,'onenote.html'),'utf8').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g))if(!m[1].includes('src='))new vm.Script(m[2]);
 assert(html.includes('v'+fs.readFileSync(path.join(root,'WERSJA'),'utf8').trim()+'</span>'));
});
test('Brak bazy nie daje sukcesu zapisu ani importu',async()=>{
 const c=context();assert.equal(await c.saveNote({g:'n'}),false);await assert.rejects(c.idbPut('notes',{}));await assert.rejects(c.idbZapiszImportZewnetrzny([],[],0,0));
});
test('Zapis czeka na commit; abort po operacji kończy się błędem',async()=>{
 for(const action of ['put','delete','bulk']){
  const db=fakeDb(),c=context({idb:db.db});let state='pending';
  const promise=(action==='put'?c.idbPut('notes',{g:'n'}):action==='delete'?c.idbDelKey('notes','n'):c.idbBulk('notes',[{g:'n'}])).then(()=>state='ok',()=>state='error');
  await Promise.resolve();assert.equal(state,'pending');db.tx.onabort();await promise;assert.equal(state,'error');
 }
 const db=fakeDb(),c=context({idb:db.db});let saved=false;const p=c.idbPut('notes',{}).then(()=>saved=true);await Promise.resolve();assert.equal(saved,false);db.tx.oncomplete();await p;assert.equal(saved,true);
});
test('Szkic z nowym formatowaniem lub ilustracją jest proponowany do odzyskania',async()=>{
 for(const changed of ['<div><b>Tekst</b></div>','<div>Tekst<img src="data:image/png;base64,AA=="></div>']){
  let asked=0,removed=0;const c=context({idb:true,idbGet:async()=>({g:'n',t:'T',h:changed,ts:'2026-09-12T10:00:00Z'}),askConfirm:async()=>{asked++;return true;},szkicUsun(){removed++;},ustawStanZapisu(){},toastOk(){}});
  const title={},body={},card={isConnected:true,classList:{contains:()=>true},querySelector:q=>q==='.ntitle'?title:body};
  assert.equal(await c.szkicOdzyskaj(card,{g:'n',t:'T',h:'<div>Tekst</div>',mo:'2026-09-11T10:00:00Z'}),true);assert.equal(asked,1);assert.equal(removed,0);assert(body.innerHTML);
 }
});
test('Niezmieniony szkic jest usuwany bez pytania',async()=>{
 let removed=0;const c=context({idb:true,idbGet:async()=>({g:'n',t:'T',h:'<div>Tekst</div>',ts:'2026-09-12T10:00:00Z'}),szkicUsun(){removed++;},askConfirm(){throw Error('Niepotrzebne pytanie');}});
 assert.equal(await c.szkicOdzyskaj({}, {g:'n',t:'T',h:'<div>Tekst</div>',mo:'2026-09-11T10:00:00Z'}),false);assert.equal(removed,1);
});
test('Łączenie fragmentów słów i pusty znacznik końca linii PDF',()=>{
 const c=context(),item=(str,x,width=10)=>({str,transform:[1,0,0,1,x,100],width,height:10});
 assert.equal(c.smartTekstPdf([item('Je',0),item('howa',10),{str:'',hasEOL:true},item('Tekst',0)]),'Jehowa\nTekst');
 assert.equal(c.smartTekstPdf([item('Dwa',0),item('slowa',16)]),'Dwa slowa');
});
test('Rzeczywisty PDF: krótki tekst bez OCR oraz podział stron',async()=>{
 const pdfjs=require(path.join(root,'lib/smart-import/pdf.min.js'));
 pdfjs.GlobalWorkerOptions.workerSrc=path.join(root,'lib/smart-import/pdf.worker.min.js');
 const c=context({smartPdfLib:async()=>pdfjs});
 c.smartCzytajSkanPdf=()=>{throw Error('Nie wolno uruchamiać OCR dla poprawnego tekstu');};
 const f=file('krotki.pdf',pdfBytes(['Psalm 23','Druga strona']));
 const one=await c.smartCzytajPdf(f,'file',true);assert.equal(one.length,1);assert(one[0].html.includes('Psalm 23'));assert(one[0].html.includes('Druga strona'));
 const parts=await c.smartCzytajPdf(f,'parts',true);assert.equal(parts.length,2);assert.equal(parts[1].page,2);
 await assert.rejects(c.smartCzytajPdf(file('zly.pdf',Buffer.from('not a pdf')),'file',false));
});
test('PDF zwalnia dokument po limicie stron i błędzie odczytu',async()=>{
 for(const mode of ['limit','page']){
  let destroyed=0,cleaned=0;
  const page={getTextContent:async()=>{throw Error('błąd strony');},cleanup(){cleaned++;}};
  const c=context({smartPdfLib:async()=>({getDocument:()=>({promise:Promise.resolve({numPages:mode==='limit'?401:1,getPage:async()=>page}),destroy:async()=>{destroyed++;}})})});
  await assert.rejects(c.smartCzytajPdf(file('x.pdf',Buffer.from('x')),'file',true));assert.equal(destroyed,1);assert.equal(cleaned,mode==='page'?1:0);
 }
});
test('Skan: zachowany obraz przy awarii OCR; brak pustych notatek',async()=>{
 let released=false;const canvas={width:100,height:100,getContext:()=>({}),toDataURL:()=> 'data:image/jpeg;base64,AA=='};
 const c=context({document:{createElement:()=>canvas}});c.smartRozpoznajObraz=async()=>{throw Error('Brak OCR');};
 const page={getViewport:()=>({width:100,height:100}),render:()=>({promise:Promise.resolve(),cancel(){released=true;}})};
 const r=await c.smartCzytajSkanPdf(page,true,true);assert(r.html.includes('<img'));assert(r.warning.includes('OCR'));assert.equal(canvas.width,1);assert(released);
 await assert.rejects(c.smartCzytajSkanPdf(page,false,false),/Włącz OCR/);
});
test('Anulowanie kończy oczekiwanie nawet gdy biblioteka nie odpowiada',async()=>{
 const controller=new AbortController(),c=context({smartAbortController:controller});
 const p=c.smartCzekaj(new Promise(()=>{}));controller.abort();await assert.rejects(p,{name:'ImportAnulowany'});
 const fresh=context();assert.equal(await fresh.smartCzekaj(Promise.resolve(7)),7);await assert.rejects(fresh.smartCzekaj(new Promise(()=>{}),5),/zbyt długo/);
});
test('OCR używa lokalnego workera zgodnego z CSP',async()=>{
 let options;const c=context({smartWczytajSkrypt:async()=>{},Tesseract:{createWorker:async(lang,oem,opt)=>{assert.equal(lang[0].code,'pol');assert(lang[0].data.length>0);options=opt;return {terminate:async()=>{}};}}});
 await c.smartWorkerOcr();assert.equal(options.workerBlobURL,false);assert.equal(new URL(options.workerPath).origin,'https://example.test');await c.smartZakonczOcr();assert.equal(options.cacheMethod,"none");assert(html.includes("worker-src 'self' blob:;"));
});
test('Spóźniony worker po anulowaniu jest zamykany',async()=>{
 let resolve,terminated=0;const controller=new AbortController(),c=context({smartAbortController:controller,smartWczytajSkrypt:async()=>{},Tesseract:{createWorker:()=>new Promise(r=>resolve=r)}});
 const p=c.smartWorkerOcr();await Promise.resolve();controller.abort();await assert.rejects(p,{name:'ImportAnulowany'});resolve({terminate:async()=>terminated++});await Promise.resolve();assert.equal(terminated,1);
});
test('Word: nagłówki bez akapitów i sekcje z ilustracją nie znikają',()=>{
 const c=context(),parts=c.smartPodzielNaglowki('<h2>Sam nagłówek</h2><h3>Obraz</h3><div><img src="data:image/png;base64,AA=="></div><h3>Koniec</h3>','Dokument');
 assert.equal(parts.length,3);assert(parts[0].html.includes('Sam nagłówek'));assert(/<img/i.test(parts[1].html));assert(parts[2].html.includes('Koniec'));
});
test('Duplikaty uwzględniają obrazy, formatowanie i kosz',()=>{
 const c=context(),n={t:'A',h:'<div>Tekst<img src="data:image/png;base64,AA=="></div>'};
 assert(c.smartTaSamaNotatka(n,{...n}));assert(!c.smartTaSamaNotatka(n,{...n,h:n.h.replace('AA==','BB==')}));assert(!c.smartTaSamaNotatka({...n,del:true},n));
 assert(!c.smartTaSamaNotatka({t:'T',h:'<div>Tekst</div>'},{t:'T',h:'<div><b>Tekst</b></div>'}));
});
test('Rzeczywisty DOCX: polski tekst, nagłówki, tabela, obraz, konwersja i podział',async()=>{
 const JSZip=require(path.join(root,'lib/jszip.min.js')),zip=new JSZip();
 zip.file('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
 zip.file('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 zip.file('word/styles.xml','<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style><w:style w:type="paragraph" w:styleId="Heading4"><w:name w:val="heading 4"/></w:style></w:styles>');
 zip.file('word/_rels/document.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="img1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image.png"/></Relationships>');
 zip.file('word/media/image.png','iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=',{base64:true});
 zip.file('word/document.xml',`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Studium</w:t></w:r></w:p><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Zażółć gęślą jaźń</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Komórka tabeli</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p><w:pPr><w:pStyle w:val="Heading4"/></w:pPr><w:r><w:t>Ilustracja</w:t></w:r></w:p><w:p><w:r><w:drawing><wp:inline><wp:docPr id="1" name="Obraz"/><a:graphic><a:graphicData><pic:pic><pic:blipFill><a:blip r:embed="img1"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p></w:body></w:document>`);
 const bytes=await zip.generateAsync({type:'nodebuffer'}),f=file('studium.docx',bytes);
 fs.writeFileSync(path.join(__dirname,'fixtures/word.docx'),bytes);
 fs.writeFileSync(path.join(__dirname,'fixtures/text.pdf'),pdfBytes(['Test PDF importu']));
 const c=context({JSZip,getZipLib:async()=>JSZip,smartMammoth:async()=>dom.mammoth});
 const one=await c.smartCzytajDocx(f,'file');assert.equal(one.length,1);assert.equal(one[0].title,'Studium');assert(one[0].html.includes('Zażółć gęślą jaźń'));assert(/<b>/i.test(one[0].html));assert(/<table/i.test(one[0].html));assert(/<img/i.test(one[0].html));
 c.smartRozpoznajObraz=async()=> 'Tekst ze skanu Word';
 const scan=await c.smartCzytajDocx(f,'file',true);assert(scan[0].html.includes('Tekst ze skanu Word'));
 const parts=await c.smartCzytajDocx(f,'parts');assert.equal(parts.length,2);assert.equal(parts[1].title,'Ilustracja');assert(/<img/i.test(parts[1].html));
 await assert.rejects(c.smartCzytajDocx(file('zly.docx',Buffer.from('not a zip')),'file'),/uszkodzony/);
});

test('Rzeczywisty OCR: lokalny WebAssembly i polski model z paczki',()=>{
 const out=require('node:child_process').execFileSync(process.execPath,[path.join(__dirname,'ocr.js'),root],{encoding:'utf8',timeout:30000});
 assert(out.includes('Jehowa jest moim Pasterzem.'));
});

function importDb(){
 const stored={notes:new Map([['old',{g:'old',t:'Stara notatka'}]]),tags:new Map()};let tx,staged,aborted;
 const db={transaction(){
  staged={notes:new Map(stored.notes),tags:new Map(stored.tags)};aborted=false;
  tx={abort(){aborted=true;queueMicrotask(()=>tx.onabort?.());},objectStore(name){return {
   put(value){staged[name].set(name==='notes'?value.g:value.id,structuredClone(value));},
   count(){const req={};queueMicrotask(()=>{if(!aborted){req.result=staged[name].size;req.onsuccess?.();}});return req;}
  };}};return tx;
 }};
 return {db,stored,commit(){assert(!aborted);for(const name of ['notes','tags'])stored[name]=staged[name];tx.oncomplete();}};
}
test('Atomowy import: zatwierdzenie całości albo wycofanie przy błędnej liczbie',async()=>{
 const db=importDb(),c=context({idb:db.db});let done=false;
 const p=c.idbZapiszImportZewnetrzny([{g:'new',t:'Nowa'}],[{id:1,name:'Import'}],2,1).then(()=>done=true);
 await Promise.resolve();assert.equal(done,false);assert.equal(db.stored.notes.size,1);db.commit();await p;assert.equal(db.stored.notes.size,2);assert.equal(db.stored.tags.size,1);
 const bad=importDb(),c2=context({idb:bad.db});await assert.rejects(c2.idbZapiszImportZewnetrzny([{g:'new'}],[{id:1}],99,1));assert.equal(bad.stored.notes.size,1);assert.equal(bad.stored.tags.size,0);
});
test('Przycisk dodawania: wybór i tytuł są zapisywane dopiero po commit; błąd zachowuje podgląd',async()=>{
 const db=importDb(),els={smartPreviewList:{querySelectorAll:()=>[{checked:true,dataset:{smartCheck:'0'}},{checked:false,dataset:{smartCheck:'1'}}],querySelector:sel=>sel.includes('data-smart-body')?{innerHTML:'<div>Poprawiona treść</div>'}:{value:'Mój tytuł'}},smartTag:{value:'Dokumenty'},smartSave:{disabled:false}};
 let shown=[],opened=[];
 const c=context({idb:db.db,$:id=>els[id],smartPracuje:false,smartWyniki:[{title:'Pierwszy',html:'<div>Treść</div>',source:'plik.pdf',kind:'pdf'},{title:'Pominięty',html:'<div>Nie dodawaj</div>'}],smartPliki:[{size:50}],notes:[{g:'old',t:'Stara notatka'}],tags:[],
 closeModal(){},openModal:id=>opened.push(id),pokazPostepImportu(){},schowajPostepImportu(){},rozpocznijZapisImportu(){},
 nastepnyNumer:()=>1,norm:s=>s.toLowerCase(),bumpTagsVer(){},bumpDirty(){},renderAll(){},smartPokazZaimportowane(){},sprawdzMiejsceDlaImportu:async()=>{},toast(){},showInfo:async title=>shown.push(title)});
 const start=html.indexOf('$("smartSave").onclick=async()=>{');assert(start>0);vm.runInContext(html.slice(start,html.indexOf('async function handleImportFile(',start)),c);
 const p=els.smartSave.onclick();await new Promise(setImmediate);assert.equal(c.notes.length,1);assert.equal(els.smartSave.disabled,true);db.commit();await p;
 assert.equal(c.notes.length,2);assert.equal(c.notes[1].t,'Mój tytuł');assert(c.notes[1].h.includes('Poprawiona treść'));assert.equal(c.notes[1].importKind,'pdf');assert.equal(els.smartSave.disabled,false);assert(shown.includes('Dokumenty zaimportowane'));
 await els.smartSave.onclick();assert.equal(c.notes.length,2);assert(shown.includes('Nie dodano duplikatów'));
 c.idb=null;shown=[];await els.smartSave.onclick();assert.equal(c.notes.length,2);assert(shown.includes('Nie zapisano dokumentów'));assert(opened.includes('modalSmartImport'));assert.equal(els.smartSave.disabled,false);
});

function serviceWorker(){
 const scope='https://example.test/jw/',prefix='jwstudy-'+encodeURIComponent(scope)+'-',stores=new Map(),listeners={};let offline=false,status=200;
 const absolute=k=>new URL(typeof k==='string'?k:k.url,scope).href;
 const cache=name=>{if(!stores.has(name))stores.set(name,new Map());const map=stores.get(name);return {match:async k=>map.get(absolute(k))?.clone(),put:async(k,v)=>map.set(absolute(k),v.clone())};};
 const c=vm.createContext({URL,Response,Request:class extends Request{constructor(k,opts){super(absolute(k),opts);}},setTimeout,clearTimeout,
 caches:{open:async name=>cache(name),keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name)},
 self:{registration:{scope},addEventListener:(k,v)=>listeners[k]=v,skipWaiting(){},clients:{claim:async()=>{}}},
 fetch:async req=>{if(offline)throw Error('offline');const url=new URL(req.url);return new Response(url.pathname.endsWith('onenote.html')?'ONENOTE':'APP',{status});}});
 vm.runInContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),c);
 return {scope,prefix,stores,cache,listeners,set offline(v){offline=v;},set status(v){status=v;},async event(type){let p;listeners[type]({waitUntil:x=>p=x});return p;},async navigate(name){let response;const waits=[];listeners.fetch({request:{url:new URL(name,scope).href,method:'GET',mode:'navigate',destination:'document'},respondWith:p=>response=p,waitUntil:p=>waits.push(p)});const res=await response;await Promise.all(waits);return res;}};
}
test('Offline: OneNote i aplikacja mają oddzielne dokumenty',async()=>{
 const sw=serviceWorker();await sw.event('install');await sw.navigate('onenote.html');sw.offline=true;
 assert.equal(await (await sw.navigate('index.html')).text(),'APP');assert.equal(await (await sw.navigate('onenote.html')).text(),'ONENOTE');assert.equal(await (await sw.navigate('./?x=1')).text(),'APP');assert.equal((await sw.navigate('missing.html')).status,503);
});
test('Aktualizacja usuwa tylko stary cache tej samej instalacji',async()=>{
 const sw=serviceWorker();sw.cache('other-app');sw.cache('jwstudy-v323');sw.cache(sw.prefix+'v323');sw.cache('jwstudy-other-v323');await sw.event('install');await sw.event('activate');
 assert(sw.stores.has('other-app'));assert(sw.stores.has('jwstudy-v323'));assert(sw.stores.has('jwstudy-other-v323'));assert(!sw.stores.has(sw.prefix+'v323'));
});
test('HTTP 404 nie jest zapisywany jako działająca kopia offline',async()=>{
 const sw=serviceWorker();sw.status=404;await assert.rejects(sw.event('install'));for(const map of sw.stores.values())assert.equal(map.size,0);
});
test('Wszystkie pliki do importu/offline znajdują się w paczce',()=>{
 const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');for(const m of sw.matchAll(/'\.\/([^']+)'/g))assert(fs.existsSync(path.join(root,m[1])),m[1]);
 assert(fs.readFileSync(path.join(root,'lib/smart-import/tesseract-core-lstm.wasm.js'),'utf8').length>3000000);
 const data=require('node:zlib').gunzipSync(fs.readFileSync(path.join(root,'lib/smart-import/lang/pol.traineddata.gz')));assert(data.length>1000000);
});
test('Typ pliku pochodzi z zawartości; błędna nazwa nie jest zmieniana',async()=>{
 const JSZip=require(path.join(root,'lib/jszip.min.js')),c=context({JSZip,getZipLib:async()=>JSZip});
 for(const [name,bytes,expected] of [
 ['dokument.json',pdfBytes(['Tekst']),'pdf'],
 ['bez rozszerzenia',fs.readFileSync(path.join(__dirname,'fixtures/word.docx')),'docx'],
 ['foto.pdf',fs.readFileSync(path.join(__dirname,'fixtures/ocr.png')),'image']]){
  const f=new File([bytes],name);assert.equal(await c.smartSprawdzTyp(f),expected);assert.equal(c.smartTyp(f),expected);assert.equal(f.name,name);
 }
 await assert.rejects(c.smartSprawdzTyp(new File(['nie pdf'],'plik.pdf')),/Nie rozpoznano/);
 await assert.rejects(c.smartSprawdzTyp(new File([new Uint8Array([208,207,17,224])],'plik.doc')),/Starszy format/);
});
test('Dokładny OCR obejmuje PDF mający częściową warstwę tekstową',async()=>{
 const page={getTextContent:async()=>({items:[{str:'Nagłówek'}]}),cleanup(){}};
 const c=context({smartPdfLib:async()=>({getDocument:()=>({promise:Promise.resolve({numPages:1,getPage:async()=>page}),destroy:async()=>{}})})});
 c.smartCzytajSkanPdf=async()=>({tekst:'Cały skan',html:'<div>Cały skan</div>',warning:''});
 const result=await c.smartCzytajPdf(file('skan.pdf',Buffer.from('pdf')),'file',true,0,false,true);
 assert(result[0].html.includes('Cały skan'));
});
test('Wbudowane biblioteki są poza komentarzami HTML i zgodne z plikami',()=>{
 const markup=html.replace(/<!--[\s\S]*?-->/g,'');
 const assets=[...markup.matchAll(/<script type="application\/octet-stream" id="smartAsset-([^"]+)">([^<]+)<\/script>/g)];
 assert.equal(assets.length,8);
 for(const [,name,data] of assets){
  const rel=name==='jszip.min.js'?'lib/'+name:name==='pol.traineddata.gz'?'lib/smart-import/lang/'+name:'lib/smart-import/'+name;
  assert.deepEqual(Buffer.from(data,'base64'),fs.readFileSync(path.join(root,rel)));
 }
 assert(!fn('smartPdfLib').includes('./lib/'));
 assert(!fn('smartOcrZasoby').includes('https:'));
});
test('Model OCR inicjalizuje nazwę języka zamiast danych binarnych',()=>{
 const worker=fs.readFileSync(path.join(root,'lib/smart-import/tesseract.worker.min.js'),'utf8');
 assert(worker.includes('f="string"==typeof a?a:a.map((function(t){return"string"==typeof t?t:t.code})).join("+")'));
});
(async()=>{let failed=0;for(const t of tests){try{let timer;try{await Promise.race([Promise.resolve().then(t.fn),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Przekroczono czas testu')),10000);})]);}finally{clearTimeout(timer);}console.log('OK  '+t.name);}catch(e){failed++;console.error('FAIL '+t.name+'\n'+e.stack);}}console.log('\n'+(tests.length-failed)+'/'+tests.length+' testów OK');if(failed)process.exitCode=1;})();
