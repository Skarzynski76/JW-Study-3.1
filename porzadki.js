/* ==========================================================================
   UPORZĄDKOWANIE ODSTĘPÓW W NOTATKACH JUŻ WCZYTANYCH

   Treść notatki wyświetlana jest z zachowaniem spacji, żeby własne wcięcia
   użytkownika wyglądały tak, jak je wpisał. Notatki przeniesione z innego
   programu niosą jednak wcięcia i podziały wierszy z PLIKU ŹRÓDŁOWEGO — i one
   też są widoczne. Narzędzie ma usunąć drugie, nie ruszając pierwszych.
   ========================================================================== */
const {T, TA, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors})=>{
  const brzydka = '<div>\n  <div>\n    <div>Pierwsza myśl</div>\n    <div></div>\n    <div>&nbsp;</div>\n'+
                  '    <div>Druga myśl</div>\n    <br><br><br>\n    <ul><li>Punkt</li></ul>\n'+
                  '    <table width="620"><tr><td width="300">A</td></tr></table>\n  </div>\n</div>';

  console.log("═══ CO ZNIKA ═══");
  const po = w.oczyscOdstepy(brzydka);
  T("wcięcia i podziały wierszy ze źródła", ()=>!/\n\s{2,}/.test(po) || "zostały odstępy");
  T("puste akapity", ()=>!/<div><\/div>/.test(po));
  T("akapity z samą spacją nierozdzielającą", ()=>!/&nbsp;/.test(po));
  T("zbitki przerw", ()=>(po.match(/<br>/g)||[]).length===0 || "przerw: "+(po.match(/<br>/g)||[]).length);
  T("sztywne szerokości tabel", ()=>!/width=/.test(po));
  T("treść jest krótsza", ()=>po.length < brzydka.length || po.length+" vs "+brzydka.length);

  console.log("═══ CO ZOSTAJE ═══");
  T("cały tekst", ()=>["Pierwsza myśl","Druga myśl","Punkt","A"].every(x=>po.indexOf(x)>=0));
  T("listy i tabele", ()=>/<ul><li>Punkt<\/li><\/ul>/.test(po) && /<table>/.test(po));
  T("wyróżnienia", ()=>{
     const x = w.oczyscOdstepy('<div><b>tłusto</b> <mark class="hl2">tło</mark></div>');
     return /<b>tłusto<\/b>/.test(x) && /<mark class="hl2">/.test(x); });
  T("zdjęcia", ()=>/<img/.test(w.oczyscOdstepy('<div>\n  <img src="data:image/png;base64,x">\n</div>')));
  T("przerwa wpisana ręcznie w środku zdania", ()=>
     /pierwszy<br>drugi/.test(w.oczyscOdstepy("<div>pierwszy<br>drugi</div>")));
  T("notatka bez śmieci nie jest ruszana", ()=>{
     const czysta = "<div>Pierwszy wiersz</div><div>Drugi wiersz</div>";
     return w.oczyscOdstepy(czysta)===czysta; });

  console.log("═══ DZIAŁANIE NA CAŁYM ZBIORZE ═══");
  w.eval(`notes.length=0; idb=null;
    notes.push({g:"a",t:"Z importu",h:${JSON.stringify(brzydka)},c:"x",tg:[],b:null,ch:null,ks:null,cr:"2024-01-01",mo:"2024-01-01",del:false});
    notes.push({g:"b",t:"Własna",h:"<div>Wiersz</div>",c:"x",tg:[],b:null,ch:null,ks:null,cr:"2024-01-01",mo:"2024-01-01",del:false});
    notes.push({g:"c",t:"W koszu",h:${JSON.stringify(brzydka)},c:"x",tg:[],b:null,ch:null,ks:null,cr:"2024-01-01",mo:"2024-01-01",del:true});`);
  T("liczy tylko notatki wymagające poprawy", ()=>{
     const r = w.policzDoUporzadkowania();
     return r.ile===1 || "policzono: "+r.ile; });
  T("podaje, ile ubędzie", ()=>w.policzDoUporzadkowania().zaoszczedzone>0);
  T("jest funkcja porządkująca", ()=>typeof w.uporzadkujOdstepyNotatek==="function");
  T("przycisk w ustawieniach", ()=>{
     w.openSettings();
     return !!d.querySelector('#setBody [data-act="odstepy"]'); });
  T("opis tłumaczy, skąd te odstępy", ()=>
     /pliku źródłowego/.test(d.getElementById("setBody").innerHTML));

  console.log("═══ ZGODNOŚĆ Z FILTREM TREŚCI ═══");
  T("wynik przechodzi przez filtr aplikacji bez strat", ()=>{
     const przez = w.sanitize(po);
     return ["Pierwsza myśl","Druga myśl","Punkt"].every(x=>przez.indexOf(x)>=0); });
  T("porządkowanie nie wpuszcza obcego kodu", ()=>{
     const x = w.oczyscOdstepy('<div>\n <script>alert(1)<\/script>\n <b>ok</b></div>');
     return /<b>ok<\/b>/.test(x); });

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
