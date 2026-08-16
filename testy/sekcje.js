/* ==========================================================================
   SORTOWANIE PO UTWORZENIU + ZAKŁADKI W SEKCJACH
   ========================================================================== */
const {T, TA, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const N = ()=>w.eval("notes"), G = ()=>w.eval("tags"), S = ()=>w.eval("sections"), Z = ()=>w.eval("secTabs");
  w.eval(`
    idb=null; notes.length=0; tags.length=0; sections.length=0; secTabs.length=0;
    notes.push({g:"a",t:"Najstarsza",h:"",c:"",tg:[],b:null,ch:null,ks:null,cr:"2024-01-01",mo:"2026-08-01",del:false});
    notes.push({g:"b",t:"Średnia",   h:"",c:"",tg:[],b:null,ch:null,ks:null,cr:"2025-06-01",mo:"2026-01-01",del:false});
    notes.push({g:"c",t:"Najnowsza", h:"",c:"",tg:[],b:null,ch:null,ks:null,cr:"2026-05-01",mo:"2024-02-01",del:false});
    renderAll();
  `);

  console.log("═══ SORTOWANIE PO DACIE UTWORZENIA ═══");
  /* Daty zmiany są celowo w odwrotnej kolejności niż daty utworzenia — dzięki temu
     błędne sortowanie od razu widać, zamiast przypadkiem dawać dobry wynik. */
  T("opcje sortowania po utworzeniu są w liście", ()=>{
     const o=[...d.querySelectorAll("#sortSel option")].map(x=>x.value);
     return o.includes("createdNew") && o.includes("createdOld"); });
  T("są w osobnej, opisanej grupie", ()=>
     [...d.querySelectorAll("#sortSel optgroup")].some(g=>/utworzeni/i.test(g.label)));
  T("najnowsze utworzone na górze", ()=>{
     w.eval('sortMode="createdNew"; renderAll();');
     const t=[...d.querySelectorAll("#noteList .ncard .ntitle")].map(x=>x.textContent.trim());
     return t.join(",")==="Najnowsza,Średnia,Najstarsza" || t.join(","); });
  T("najdawniej utworzone na górze", ()=>{
     w.eval('sortMode="createdOld"; renderAll();');
     const t=[...d.querySelectorAll("#noteList .ncard .ntitle")].map(x=>x.textContent.trim());
     return t.join(",")==="Najstarsza,Średnia,Najnowsza" || t.join(","); });
  T("to NIE jest to samo co sortowanie po zmianie", ()=>{
     w.eval('sortMode="new"; renderAll();');
     const t=[...d.querySelectorAll("#noteList .ncard .ntitle")].map(x=>x.textContent.trim());
     return t.join(",")==="Najstarsza,Średnia,Najnowsza" || t.join(","); });

  console.log("═══ DATA WIDOCZNA NA KARCIE ═══");
  /* Sedno zgłoszenia: sortowanie działało, ale karta pokazywała datę zmiany,
     więc kolejność wyglądała na przypadkową. */
  T("przy sortowaniu po utworzeniu karta pokazuje datę utworzenia", ()=>{
     w.eval('sortMode="createdNew"; renderAll();');
     const p=d.querySelector("#noteList .ncard .pill.date");
     return /2026-05-01/.test(p.textContent) || "pokazano: "+p.textContent.trim(); });
  T("i oznacza ją jako datę utworzenia", ()=>
     !!d.querySelector("#noteList .ncard .pill.date .dateTag"));
  T("przy sortowaniu po zmianie wraca data zmiany", ()=>{
     w.eval('sortMode="new"; renderAll();');
     const p=d.querySelector("#noteList .ncard .pill.date");
     return /2026-08-01/.test(p.textContent) || "pokazano: "+p.textContent.trim(); });
  T("podpowiedź podaje obie daty", ()=>{
     const t=d.querySelector("#noteList .ncard .pill.date").getAttribute("title");
     return /Utworzono/.test(t) && /Ostatnia zmiana/.test(t); });

  console.log("═══ ZAKŁADKI W SEKCJACH ═══");
  w.eval('sections.push({id:1,name:"Kongres 2026",ord:0,open:true}); renderAll();');
  T("menu sekcji ma pozycję tworzenia zakładki", ()=>{
     w.sectionMenu({target:d.querySelector(".secHead .secMore")||d.body}, S()[0]);
     return !!d.querySelector('#dropdown [data-sm="tab"]'); });
  T("zakładka powstaje i pokazuje się pod sekcją", ()=>{
     w.eval('secTabs.push({id:1,sec:1,name:"Wykłady",ord:0}); renderAll();');
     const el=d.querySelector('#tagList .stbItem[data-stb="1"]');
     return !!el && /Wykłady/.test(el.textContent); });
  T("kilka zakładek zachowuje kolejność", ()=>{
     w.eval('secTabs.push({id:2,sec:1,name:"Materiały",ord:1}); renderAll();');
     const n=[...d.querySelectorAll("#tagList .stbItem .nm")].map(x=>x.textContent);
     return n.join(",")==="Wykłady,Materiały" || n.join(","); });

  console.log("═══ NOTATKI W ZAKŁADCE ═══");
  T("notatkę da się wrzucić do zakładki", ()=>{
     w.setNoteSecTab(N()[0], 1);
     return N()[0].stb===1; });
  T("zakładka liczy wrzucone notatki", ()=>w.secTabCount(1)===1 || "policzono "+w.secTabCount(1));
  T("filtr zakładki pokazuje tylko jej notatki", ()=>{
     w.eval('filt.tag="stb:1"; renderAll();');
     const ile=w.baseNotes().length;
     w.eval('filt.tag="all"; renderAll();');
     return ile===1 || "widocznych "+ile; });
  T("kliknięcie zakładki włącza i wyłącza filtr", ()=>{
     const el=d.querySelector('#tagList .stbItem[data-stb="1"]');
     el.click(); const wl=w.eval("String(filt.tag)")==="stb:1";
     el.click(); const wyl=w.eval("String(filt.tag)")==="all";
     w.renderAll();
     return wl && wyl; });

  console.log("═══ ETYKIETY W ZAKŁADCE ═══");
  T("etykietę da się przypisać do zakładki", ()=>{
     w.eval('tags.push({id:5,name:"Notatki z wykładu",ord:0,sec:1}); renderAll();');
     w.setTagSecTab(G().find(t=>t.id===5), 1);
     return G().find(t=>t.id===5).stb===1; });
  T("zakładka pokazuje też notatki z jej etykiet", ()=>{
     w.eval('notes[1].tg=[5]; renderAll();');
     return w.secTabCount(1)===2 || "policzono "+w.secTabCount(1); });
  T("notatka z etykiety przechodzi przez filtr zakładki", ()=>
     w.notatkaWZakladce(N()[1], 1)===true);
  T("etykieta w zakładce jest wcięta pod nią", ()=>{
     w.renderAll();
     return !!d.querySelector("#tagList .item.wZakladce"); });

  console.log("═══ NOWA NOTATKA WPROST DO ZAKŁADKI ═══");
  /* Notatka tworzona „w sekcji" lądowała poza nią i trzeba jej było szukać
     wśród wszystkich — mimo że intencja była oczywista z kontekstu. */
  w.eval('sections.push({id:9,name:"Kongresy",ord:5,open:true}); secTabs.push({id:91,sec:9,name:"Kongres 2026",ord:0}); renderAll();');
  T("okno nowej notatki ma wybór zakładki", ()=>{
     d.getElementById("btnNew").click();
     return !!d.getElementById("nnZakladka"); });
  T("zakładki pogrupowane po sekcjach", ()=>{
     const g=[...d.querySelectorAll("#nnZakladka optgroup")].map(x=>x.label);
     return g.length>=1 && g.indexOf("Kongresy")>=0 || "grupy: "+g.join(","); });
  T("da się nie wybierać żadnej", ()=>d.querySelector('#nnZakladka option[value=""]')!==null);
  T("otwarta zakładka jest podpowiadana", ()=>{
     w.eval('filt.tag="stb:91"; renderAll();');
     d.getElementById("btnNew").click();
     const v=d.getElementById("nnZakladka").value;
     return v==="91" || "podpowiedziano: "+JSON.stringify(v); });
  await TA("notatka trafia do wybranej zakładki", async ()=>{
     /* Zapis jest teraz asynchroniczny: wybór „nowa zakładka" pyta o nazwę,
        więc zapisanie notatki musi na tę odpowiedź poczekać. */
     d.getElementById("nnTitle").value="Z zakładki";
     d.getElementById("nnContent").value="treść";
     await d.getElementById("nnSave").onclick();
     const n=N().find(x=>x.t==="Z zakładki");
     return n && n.stb===91 || "stb: "+(n&&n.stb); });
  T("i widać ją od razu po wejściu w tę zakładkę", ()=>{
     w.eval('filt.tag="stb:91"; renderAll();');
     const widoczne=[...d.querySelectorAll("#noteList .ncard .ntitle")].map(x=>x.textContent.trim());
     w.eval('filt.tag="all"; renderAll();');
     return widoczne.indexOf("Z zakładki")>=0 || "widoczne: "+widoczne.join(", "); });
  T("sekcja bez zakładek NADAL jest do wyboru", ()=>{
     /* Dawniej pole chowało się, gdy nie było żadnej zakładki — i świeżo
        utworzona sekcja stawała się nieosiągalna dla nowej notatki. Teraz
        sekcja jest w liście, z pozycją „＋ nowa zakładka w tej sekcji". */
     w.eval('const kopia=secTabs.slice(); secTabs.length=0; window.__kop=kopia; renderAll();');
     d.getElementById("btnNew").click();
     const widoczne = d.getElementById("nnZakladkaKarta").style.display!=="none";
     const maNowa = !!d.querySelector('#nnZakladka option[value^="nowa:"]');
     w.eval('window.__kop.forEach(z=>secTabs.push(z)); renderAll();');
     return (widoczne && maNowa) || `widoczne ${widoczne}, pozycja „nowa" ${maNowa}`; });

  /* Sprzątamy po sobie — dalsze sprawdzenia liczą pozycje w kolumnie etykiet
     i cudza sekcja by je przekłamała. */
  w.eval(`
    sections.splice(sections.findIndex(s=>s.id===9),1);
    const i=secTabs.findIndex(z=>z.id===91); if(i>=0) secTabs.splice(i,1);
    const j=notes.findIndex(n=>n.t==="Z zakładki"); if(j>=0) notes.splice(j,1);
    renderAll();`);

  console.log("═══ LICZNIK PRZY NAGŁÓWKU SEKCJI ═══");
  /* Sekcja złożona z samych zakładek — a taka powstaje po przeniesieniu
     notatek z OneNote — pokazywała „0", bo licznik liczył wyłącznie etykiety. */
  T("sekcja z samymi zakładkami nie pokazuje zera", ()=>{
     w.eval('tags.length=0; renderAll();');
     const c = d.querySelector(".secHead .secCnt").textContent.trim();
     return c!=="0" || "pokazano: "+c; });
  T("licznik mówi, ile zakładek i ile notatek", ()=>{
     const c = d.querySelector(".secHead .secCnt").textContent;
     return /zakł|zakładka/.test(c) && /\d/.test(c) || "pokazano: "+c; });
  T("liczy notatki z zakładek, nie tylko z etykiet", ()=>
     typeof w.licznikSekcji==="function" && /secTabCount/.test(zrodlo("js","06-tags.js")));

  console.log("═══ WYGLĄD I KOLOR ZAKŁADKI ═══");
  /* Ikona była rysowana krawędziami elementu (ramka bez dolnej krawędzi)
     i wyglądała jak niedokończony kwadrat. Teraz to zamknięty kształt w SVG. */
  T("ikona zakładki to zamknięty kształt, nie ramka", ()=>{
     const ik = d.querySelector("#tagList .stbItem .stbIc");
     return !!ik && !!ik.querySelector("svg") || "zawartość: "+(ik&&ik.innerHTML.slice(0,40)); });
  T("style nie rysują już ikony krawędziami", ()=>{
     const css = zrodlo("css","11-polish.css").replace(/\s+/g," ");
     return !/\.stbIc\{[^}]*border-bottom:0/.test(css); });
  T("menu zakładki ma paletę kolorów", ()=>{
     w.secTabMenu({target:d.body}, Z()[0]);
     return d.querySelectorAll("#dropdown [data-zc]").length >= 8; });
  T("wybór koloru zapisuje się w zakładce", ()=>{
     w.secTabMenu({target:d.body}, Z()[0]);
     const kafel = d.querySelector('#dropdown [data-zc]:not([data-zc=""])');
     kafel.click();
     return !!Z()[0].color || "kolor: "+Z()[0].color; });
  T("kolor widać na wierszu zakładki", ()=>{
     w.renderTags();
     const el = d.querySelector("#tagList .stbItem.zKolorem");
     return !!el && el.style.getPropertyValue("--stbKol")===Z()[0].color; });
  T("da się zdjąć kolor", ()=>{
     w.secTabMenu({target:d.body}, Z()[0]);
     d.querySelector('#dropdown [data-zc=""]').click();
     return Z()[0].color===undefined; });
  T("niebezpieczny kolor nie przejdzie z kopii", ()=>{
     const zrodloB = zrodlo("js","20-backup.js");
     return /kolorBezpieczny\(z\.color\)/.test(zrodloB); });

  console.log("═══ ZMIANA NAZWY, KOLEJNOŚĆ, USUNIĘCIE ═══");
  T("menu zakładki ma komplet pozycji", ()=>{
     w.secTabMenu({target:d.body}, Z()[0]);
     return ["ren","up","down","del"].every(a=>!!d.querySelector('#dropdown [data-zm="'+a+'"]')); });
  T("przesunięcie zmienia kolejność", ()=>{
     w.przesunSecTab(1, 1); w.renderAll();
     const n=[...d.querySelectorAll("#tagList .stbItem .nm")].map(x=>x.textContent);
     w.przesunSecTab(1,-1); w.renderAll();
     return n.join(",")==="Materiały,Wykłady" || n.join(","); });
  T("usunięcie zakładki nie kasuje notatek ani etykiet", ()=>{
     const przedN=N().length, przedT=G().length;
     w.eval('secTabs = secTabs.filter(z=>z.id!==2);');
     return N().length===przedN && G().length===przedT; });

  console.log("═══ ZAPIS I POWRÓT ═══");
  T("zakładki mają własne miejsce w danych", ()=>typeof w.saveSecTabs==="function" && typeof w.loadSecTabs==="function");
  T("przypisanie notatki jest w jej polach", ()=>"stb" in N()[0]);
  T("kopia zapasowa obejmie zakładki sekcji", ()=>{
     const zrodloB = zrodlo("js","20-backup.js");
     return /secTabs/.test(zrodloB) || "brak secTabs w kopii"; });

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
