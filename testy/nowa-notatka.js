/* ==========================================================================
   OKNO NOWEJ NOTATKI I MENU PRZY NOTATCE

   Dwa zgłoszenia z tego samego dnia:

   1. „Przy tworzeniu nowej notatki dalej nie ma możliwości dodania jej do
      sekcji." Pole wyboru pokazywało wyłącznie ZAKŁADKI, a sekcje bez zakładek
      pomijało. Gdy żadna sekcja nie miała jeszcze zakładki, całe pole znikało —
      i notatka trafiała do ogólnego zbioru, bez sposobu, żeby temu zaradzić.

   2. „Na tablecie nie działa usuń notatkę, tylko pojawia się menu przypisania
      do publikacji." Menu ⋯ ma siedemnaście pozycji i na tablecie wymaga
      przewijania; „Usuń" jest ostatnie, a w jego okolicy leżą pozycje
      otwierające inne menu.
   ========================================================================== */
const {T, TA, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const css = zrodlo("css","11-polish.css").replace(/\s+/g," ");
  const sel = ()=>d.getElementById("nnZakladka");
  const karta = ()=>d.getElementById("nnZakladkaKarta");
  const opcje = ()=>[...sel().querySelectorAll("option")].map(o=>o.value+"="+o.textContent);

  console.log("═══ SEKCJA BEZ ZAKŁADEK TEŻ JEST DO WYBORU ═══");
  T("świeżo utworzona sekcja pojawia się w oknie nowej notatki", ()=>{
     w.eval(`notes.length=0; tags.length=0; sections.length=0; secTabs.length=0; idb=null;
       sections.push({id:1,name:"Kongresy",ord:0,open:true});
       renderAll(); renderNnZakladki();`);
     const o = opcje().join(" | ");
     return /nowa:1/.test(o) || "pozycje: "+o; });
  T("pole nie chowa się, gdy sekcja nie ma jeszcze zakładek", ()=>
     karta().style.display !== "none");
  T("sekcja jest nagłówkiem grupy, a nie zwykłą pozycją", ()=>{
     const g = [...sel().querySelectorAll("optgroup")].map(x=>x.label);
     return g.length===1 && g[0]==="Kongresy" || "grupy: "+g.join(","); });
  T("zakładki sekcji są w tej samej grupie", ()=>{
     w.eval(`secTabs.push({id:7,sec:1,name:"Kongres 2026",ord:0}); renderNnZakladki();`);
     const o = opcje().join(" | ");
     return /7=Kongres 2026/.test(o) && /nowa:1/.test(o) || "pozycje: "+o; });
  T("bez ŻADNEJ sekcji pole nadal się chowa — nie ma czego wybierać", ()=>{
     w.eval(`sections.length=0; secTabs.length=0; renderNnZakladki();`);
     return karta().style.display === "none"; });

  console.log("═══ NOWA ZAKŁADKA POWSTAJE Z NAZWĄ OD UŻYTKOWNIKA ═══");
  /* Ciche tworzenie zakładki o zmyślonej nazwie byłoby gorsze niż brak
     możliwości: użytkownik znalazłby u siebie coś, czego nie zakładał. */
  await TA("wybór nowej zakładki pyta o nazwę i tworzy ją", async ()=>{
     w.eval(`sections.length=0; secTabs.length=0;
       sections.push({id:1,name:"Kongresy",ord:0,open:true}); renderNnZakladki();`);
     w.askText = async ()=>"Kongres 2027";
     const id = await w.ustalZakladkeNowejNotatki("nowa:1");
     const z = JSON.parse(w.eval("JSON.stringify(secTabs)"));
     return (z.length===1 && z[0].name==="Kongres 2027" && z[0].sec===1 && id===z[0].id)
            || "zakładki: "+JSON.stringify(z); });
  await TA("rezygnacja z nazwy nie tworzy zakładki ani notatki", async ()=>{
     w.eval(`secTabs.length=0;`);
     w.askText = async ()=>null;
     const wynik = await w.ustalZakladkeNowejNotatki("nowa:1");
     return wynik===false && w.eval("secTabs.length")===0
            || "wynik "+wynik+", zakładek "+w.eval("secTabs.length"); });
  await TA("wybór istniejącej zakładki nie pyta o nic", async ()=>{
     w.eval(`secTabs.length=0; secTabs.push({id:9,sec:1,name:"Istniejąca",ord:0});`);
     let pytano = false;
     w.askText = async ()=>{ pytano = true; return "x"; };
     const id = await w.ustalZakladkeNowejNotatki("9");
     return (id===9 && !pytano) || `id ${id}, pytano ${pytano}`; });
  await TA("brak wyboru zostawia notatkę poza sekcjami", async ()=>
     (await w.ustalZakladkeNowejNotatki("")) === null);
  await TA("notatka trafia do nowo utworzonej zakładki", async ()=>{
     w.eval(`notes.length=0; secTabs.length=0; renderNnZakladki();`);
     w.askText = async ()=>"Zebranie";
     d.getElementById("nnTitle").value = "Moja notatka";
     d.getElementById("nnContent").value = "Treść";
     sel().value = "nowa:1";
     await d.getElementById("nnSave").onclick();
     await new Promise(r=>setTimeout(r,60));
     const n = JSON.parse(w.eval("JSON.stringify(notes[0]||null)"));
     const z = JSON.parse(w.eval("JSON.stringify(secTabs[0]||null)"));
     return (n && z && n.stb===z.id && z.name==="Zebranie")
            || `notatka ${JSON.stringify(n&&n.stb)}, zakładka ${JSON.stringify(z)}`; });

  console.log("═══ USUWANIE ZAWSZE NA WIDOKU ═══");
  /* Menu jest długie i przewijane. Pozycja niebezpieczna nie może uciekać
     poza ekran, bo w jej okolicy leżą pozycje otwierające inne menu. */
  T("pozycja usuwania trzyma się dolnej krawędzi menu", ()=>
     /#dropdown \.dd-danger\{ position:sticky; bottom:0;/.test(css));
  T("ma nieprzezroczyste tło, żeby nic pod nią nie prześwitywało", ()=>
     /#dropdown \.dd-danger\{[^}]*background:var\(--panel\);/.test(css));
  T("jest oddzielona kreską od reszty", ()=>
     /#dropdown \.dd-danger\{[^}]*border-top:1px solid var\(--border\);/.test(css));
  await TA("dotknięcie pozycji usuwania usuwa notatkę", async ()=>{
     w.eval(`notes.length=0;
       notes.push({g:"n1",t:"Do usunięcia",h:"<div>x</div>",c:"x",tg:[],b:null,ch:null,v:null,
         ks:"w",itn:1,doc:1,par:1,cr:"2024-01-01",mo:"2024-01-01",del:false});
       setNoteView("list"); renderAll();`);
     let co = [];
     w.delNote = ()=>co.push("usuwanie");
     w.pubTabMenu = ()=>co.push("menu publikacji");
     w.menuZakladek = ()=>co.push("menu zakładek");
     d.querySelector('#noteList .ncard [data-act="more"]')
      .dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
     const poz = d.querySelector('#dropdown [data-x="del"]');
     poz.dispatchEvent(new w.PointerEvent("pointerdown",{bubbles:true,pointerId:1}));
     poz.dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
     await new Promise(r=>setTimeout(r,80));
     return co.join(",")==="usuwanie" || "wykonano: "+(co.join(",")||"nic"); });
  T("usuwanie jest ostatnią pozycją menu", ()=>{
     const poz = [...d.querySelectorAll("#dropdown [data-x]")].map(e=>e.dataset.x);
     return poz[poz.length-1]==="del" || "kolejność: "+poz.join(","); });

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
