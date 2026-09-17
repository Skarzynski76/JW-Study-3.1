/* Adapter DOM wyłącznie do testów Node. Wykorzystuje parser już zawarty
   w Mammoth; NIE jest używany w aplikacji i nie zastępuje testu przeglądarki. */
const fs=require('node:fs'),vm=require('node:vm');
module.exports=function(vendor){
  const source=fs.readFileSync(vendor,'utf8');
  const marker='},{},[21])(21)';
  if(!source.includes(marker))throw Error('Zmieniony pakiet Mammoth — zaktualizuj adapter testowy.');
  const ctx={module:{exports:{}},exports:{},setTimeout,clearTimeout,console,Buffer,ArrayBuffer,Uint8Array,TextDecoder,TextEncoder};
  vm.runInNewContext(source.replace(marker,'},{},[21])'),ctx);
  const bundle=ctx.module.exports,xml=bundle(45),dom=bundle(43);
  const serialize=new xml.XMLSerializer();
  const node=dom.Node.prototype,element=dom.Element.prototype;
  function htmlDocument(){return new xml.DOMImplementation().createDocument(null,null,null);}
  function selector(el,tag){return Array.from(el.getElementsByTagName(tag.toUpperCase()))[0]||null;}
  element.querySelector=function(tag){return selector(this,tag);};
  Object.defineProperty(node,'parentElement',{get(){return this.parentNode&&this.parentNode.nodeType===1?this.parentNode:null;}});
  Object.defineProperty(element,'children',{get(){return Array.from(this.childNodes).filter(n=>n.nodeType===1);}});
  Object.defineProperty(element,'className',{get(){return this.getAttribute('class')||'';},set(v){this.setAttribute('class',v);}});
  Object.defineProperty(element,'src',{get(){return this.getAttribute('src')||'';},set(v){this.setAttribute('src',v);}});
  Object.defineProperty(element,'outerHTML',{get(){return serialize.serializeToString(this);}});
  Object.defineProperty(element,'innerHTML',{get(){return Array.from(this.childNodes).map(n=>serialize.serializeToString(n)).join('');}});
  Object.defineProperty(element,'style',{get(){const el=this;return new Proxy({}, {get(_,k){const key=k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());return (el.getAttribute('style')||'').split(';').map(s=>s.trim().split(/:\s*/)).find(a=>a[0]===key)?.[1]||'';},set(_,k,v){const key=k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());const parts=(el.getAttribute('style')||'').split(';').filter(s=>s.trim()&&!s.trim().startsWith(key+':'));parts.push(key+': '+v);el.setAttribute('style',parts.join('; ')+';');return true;}});}});
  dom.NodeList.prototype.forEach=Array.prototype.forEach;
  dom.NodeList.prototype[Symbol.iterator]=Array.prototype[Symbol.iterator];
  const document=htmlDocument();const oldCreate=document.createElement;
  document.createElement=function(tag){return oldCreate.call(this,tag.toUpperCase());};
  function parsujBezwladnie(html){
    const body=new xml.DOMParser({errorHandler:{warning(){},error(){},fatalError(e){throw Error(e);}}}).parseFromString('<body>'+html+'</body>','text/html').documentElement;
    function upper(n){if(n.nodeType===1)n.tagName=n.nodeName=n.tagName.toUpperCase();Array.from(n.childNodes||[]).forEach(upper);}upper(body);return body;
  }
  return {document,parsujBezwladnie,mammoth:bundle(21)};
};
