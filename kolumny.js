/* ==========================================================================
   UKŁAD KOLUMN — cztery kolumny, chowanie, zachowanie na telefonie.
   ========================================================================== */
const {T, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const css = zrodlo("css","11-polish.css").replace(/\s+/g," ");

  console.log("═══ CZTERY PEŁNE KOLUMNY ═══");
  T("publikacje mają własną kolumnę", ()=>!!d.getElementById("colPubs"));
  T("panel publikacji nie siedzi w etykietach", ()=>d.getElementById("pubPanel").closest(".col").id==="colPubs");
  T("kolejność kolumn", ()=>[...d.querySelectorAll("main .col")].map(c=>c.id).join(",")==="colBooks,colTags,colPubs,colNotes");
  T("etykiety zajmują całą kolumnę", ()=>/#tagPanel\{ flex:1 1 auto; min-height:0/.test(css));
  T("każda kolumna boczna ma uchwyt szerokości", ()=>
     ["colBooks","colTags","colPubs"].every(id=>!!d.querySelector('.colResizer[data-c="'+id+'"]')));
  T("kolumna nazywa się Biblia", ()=>d.querySelector("#colBooks h2").textContent.replace(/[⟨\s]/g,"")==="Biblia");
  T("stara nazwa nigdzie nie została", ()=>!/Księgi Biblii/.test(d.body.textContent));

  console.log("═══ WSPÓLNY WYGLĄD ═══");
  T("trzy kolumny na wspólnym tle", ()=>/#colBooks, #colTags, #colPubs\{ background:var\(--bg\)/.test(css));
  T("białe kafelki we wszystkich", ()=>/#colBooks \.item, #colTags \.item, #colPubs \.item\{ background:var\(--panel\)/.test(css));
  T("jednakowy stan wybrania", ()=>/#colBooks \.item\.active, #colTags \.item\.active, #colPubs \.item\.active\{ background:var\(--accent\)/.test(css));

  console.log("═══ CHOWANIE KOLUMN ═══");
  T("przycisk Kolumny w pasku górnym", ()=>!!d.getElementById("btnCols"));
  T("menu wymienia trzy kolumny", ()=>{
     w.otworzMenuKolumn(d.getElementById("btnCols"));
     return [...d.querySelectorAll("#dropdown [data-kol]")].map(x=>x.dataset.kol).join(",")==="colBooks,colTags,colPubs"; });
  T("każda pozycja ma skrót klawiszowy", ()=>
     [...d.querySelectorAll("#dropdown [data-kol]")].every(x=>x.querySelector(".ddKbd")));
  T("klik chowa i przywraca", ()=>{
     const poz=d.querySelector('#dropdown [data-kol="colPubs"]');
     poz.click(); const zwinieta=d.getElementById("colPubs").classList.contains("collapsed");
     poz.click(); const wrocila=!d.getElementById("colPubs").classList.contains("collapsed");
     return zwinieta && wrocila; });
  T("Pokaż wszystkie odkrywa komplet", ()=>{
     w.setCollapsed("colTags",true); w.setCollapsed("colBooks",true);
     d.querySelector("#dropdown [data-kol-all]").click();
     return [...d.querySelectorAll("main .col")].every(c=>!c.classList.contains("collapsed")); });
  T("strzałka w nagłówku działa", ()=>{
     d.querySelector('.colToggle[data-c="colPubs"]').click();
     const zw=d.getElementById("colPubs").classList.contains("collapsed");
     d.querySelector('.colToggle[data-c="colPubs"]').click();
     return zw; });
  T("stan zapisuje się między uruchomieniami", ()=>{
     w.setCollapsed("colPubs",true);
     const zapis=JSON.parse(w.localStorage.getItem("jwsCols")||"{}");
     w.setCollapsed("colPubs",false);
     return zapis.p===true; });
  T("zwinięta kolumna to pasek z pionowym napisem", ()=>
     /\.col\.collapsed h2, \.col\.collapsed \.pubTitle\{ writing-mode:vertical-rl/.test(css));
  T("po zwinięciu znikają listy i przyciski", ()=>
     /\.col\.collapsed \.tagBtns, \.col\.collapsed \.list, \.col\.collapsed \.pubActs\{ display:none!important/.test(css));
  T("strzałka publikacji ostatnia w nagłówku", ()=>
     d.querySelector("#colPubs .pubTitle").lastElementChild.classList.contains("colToggle"));
  T("po zwinięciu strzałka publikacji pod napisem", ()=>/\.col\.collapsed \.pubTitle \.colToggle\{ order:-1/.test(css));

  console.log("═══ TELEFON I TABLET ═══");
  T("cztery zakładki", ()=>d.querySelectorAll("#mobileTabs button").length===4);
  T("zakładka Publikacje", ()=>!!d.querySelector('#mobileTabs [data-p="colPubs"]'));
  T("przełączenie pokazuje jedną kolumnę", ()=>{
     w.mobileShow("colPubs");
     const widoczne=[...d.querySelectorAll("main .col")].filter(c=>c.classList.contains("mshow"));
     return widoczne.length===1 && widoczne[0].id==="colPubs"; });
  T("aktywna zakładka podświetlona", ()=>d.querySelector('#mobileTabs [data-p="colPubs"]').classList.contains("on"));
  T("powrót do notatek", ()=>{ w.mobileShow("colNotes"); return d.getElementById("colNotes").classList.contains("mshow"); });
  T("na wąskim ekranie publikacje na całą szerokość", ()=>
     /@media \(max-width:900px\)\{[^}]*#colPubs\{ width:100%!important/.test(css));
  T("progi szerokości kolumn", ()=>
     /@media \(min-width:1400px\)/.test(css) && /@media \(max-width:1180px\)/.test(css) && /@media \(max-width:900px\)/.test(css));
  T("skala interfejsu względem okna", ()=>
     /--winScale:1/.test(css) && (css.match(/@media \(max-width:\d+px\) ?\{ :root\{ --winScale/g)||[]).length>=5);

  console.log("═══ NIC SIĘ NIE ZEPSUŁO ═══");
  T("publikacje nadal się rysują", ()=>{ w.renderAll(); return !!d.getElementById("pubList"); });
  T("szerokości kolumn zapamiętywane", ()=>typeof w.applyColWidths==="function");
  T("brak błędów wykonania", ()=>errors.length===0 || errors.join(" "));
});
