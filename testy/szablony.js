/* ==========================================================================
   SZABLONY NOTATEK

   W notatkach z zebrań powtarza się ten sam szkielet: data, nazwisko mówcy,
   „Komentarze", „Omówienie". Wpisywanie go od nowa to kilkanaście sekund
   i kilka pomyłek tygodniowo — a przy notowaniu na bieżąco liczy się każda.

   Szablon powstaje z WŁASNEJ notatki użytkownika, nie z gotowca wymyślonego
   przez program. Testy pilnują dwóch rzeczy, które łatwo zepsuć: że wstawienie
   szablonu NIE kasuje tego, co już napisano, oraz że wstawki ({data}, {kursor})
   są zamieniane, a nie wklejane dosłownie.
   ========================================================================== */
const {T, TA, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const zr = zrodlo("js","43-szablony.js");
  const pole = (id)=>d.getElementById(id);

  w.eval(`notes.length=0; tags.length=0; szablony.length=0; idb=null;
    notes.push({g:"a", t:"14.08.2026 Dorian Paszkiewicz",
      h:"<div>Komentarze<br>Treść komentarza.<br><br>Omówienie<br>Treść omówienia.</div>",
      c:"Komentarze\\nTreść komentarza.\\n\\nOmówienie\\nTreść omówienia.",
      tg:[], b:null, ch:null, ks:null, cr:"2026-08-14", mo:"2026-08-14", del:false});
    renderAll();`);

  console.log("═══ SZABLON POWSTAJE Z WŁASNEJ NOTATKI ═══");
  T("jest pozycja w menu notatki", ()=>/data-x="szablon"/.test(zrodlo("js","09-notes.js")));
  await TA("zapisanie notatki jako szablonu", async ()=>{
     w.askText = async ()=>"Komentarz z zebrania";
     await w.zapiszJakoSzablon("a");
     const s = w.eval("JSON.stringify(szablony)");
     const l = JSON.parse(s);
     return (l.length===1 && l[0].nazwa==="Komentarz z zebrania")
            || "szablony: "+s; });
  T("szablon zabiera tytuł i treść notatki", ()=>{
     const s = JSON.parse(w.eval("JSON.stringify(szablony[0])"));
     return (/Dorian/.test(s.tytul) && /Komentarze/.test(s.tresc) && /Omówienie/.test(s.tresc))
            || "szablon: "+JSON.stringify(s).slice(0,140); });
  T("treść zapisana jako zwykły tekst, bez znaczników", ()=>
     !/<[a-z]/i.test(JSON.parse(w.eval("JSON.stringify(szablony[0])")).tresc));
  await TA("rezygnacja z nazwy nie tworzy szablonu", async ()=>{
     w.askText = async ()=>null;
     await w.zapiszJakoSzablon("a");
     return w.eval("szablony.length")===1; });

  console.log("═══ WSTAWIANIE DO NOWEJ NOTATKI ═══");
  const id = ()=>w.eval("szablony[0].id");
  T("pasek pokazuje szablon", ()=>{
     w.rysujSzablony();
     const b = d.querySelector('#nnSzablony [data-szab]');
     return !!b && b.textContent==="Komentarz z zebrania"; });
  T("wstawienie wypełnia puste pola", ()=>{
     pole("nnTitle").value = ""; pole("nnContent").value = "";
     w.zastosujSzablon(id());
     return (/Dorian/.test(pole("nnTitle").value) && /Komentarze/.test(pole("nnContent").value))
            || `tytuł „${pole("nnTitle").value}", treść „${pole("nnContent").value.slice(0,40)}"`; });
  T("NIE nadpisuje tytułu, który już wpisano", ()=>{
     pole("nnTitle").value = "Mój własny tytuł"; pole("nnContent").value = "";
     w.zastosujSzablon(id());
     return pole("nnTitle").value==="Mój własny tytuł"; });
  T("a napisaną treść dokleja, zamiast ją kasować", ()=>{
     /* Sedno: wybór szablonu po rozpoczęciu pisania nie może zjeść zdań,
        które już powstały — to strata nie do odzyskania. */
     pole("nnTitle").value = ""; pole("nnContent").value = "Zdanie zapisane wcześniej.";
     w.zastosujSzablon(id());
     const v = pole("nnContent").value;
     return (/Zdanie zapisane wcześniej\./.test(v) && /Komentarze/.test(v))
            || "treść: "+v.slice(0,80); });

  console.log("═══ WSTAWKI SĄ ZAMIENIANE ═══");
  T("{data} zamienia się na dzisiejszą datę", ()=>{
     const wynik = w.wypelnijWstawki("Dziś: {data}");
     return /^Dziś: \d{4}-\d{2}-\d{2}$/.test(wynik) || "otrzymano: "+wynik; });
  T("{godzina} też", ()=>/^\d{2}:\d{2}$/.test(w.wypelnijWstawki("{godzina}")));
  T("wielkość liter nie ma znaczenia", ()=>
     /^\d{4}-/.test(w.wypelnijWstawki("{DATA}")));
  T("tekst bez wstawek zostaje nietknięty", ()=>
     w.wypelnijWstawki("Zwykły tekst {nieznane}")==="Zwykły tekst {nieznane}");
  T("{kursor} znika z tekstu i podaje swoje miejsce", ()=>{
     const r = w.rozdzielKursor("Ala {kursor}ma kota");
     return (r.tekst==="Ala ma kota" && r.pozycja===4) || JSON.stringify(r); });
  T("bez {kursor} nie ma położenia", ()=>
     w.rozdzielKursor("Bez znacznika").pozycja===null);
  T("kursor ląduje we wskazanym miejscu", ()=>{
     w.eval('szablony[0].tresc = "Nagłówek\\n{kursor}\\nStopka";');
     pole("nnTitle").value = ""; pole("nnContent").value = "";
     w.zastosujSzablon(id());
     return pole("nnContent").selectionStart===9
            || `kursor na ${pole("nnContent").selectionStart}, treść „${pole("nnContent").value}"`; });

  console.log("═══ ZARZĄDZANIE ═══");
  await TA("zmiana nazwy", async ()=>{
     w.askText = async ()=>"Inna nazwa";
     await w.zmienNazweSzablonu(id());
     return w.eval("szablony[0].nazwa")==="Inna nazwa"; });
  T("usunięcie", ()=>{
     w.usunSzablon(id());
     return w.eval("szablony.length")===0; });
  T("bez szablonów pasek tłumaczy, skąd się biorą", ()=>{
     w.rysujSzablony();
     return /Zapisz jako szablon/.test(pole("nnSzablony").textContent); });
  T("szablony są zapisywane na urządzeniu", ()=>
     /idbPut\("meta", szablony, "szablony"\)/.test(zr) && /idbGet\("meta","szablony"\)/.test(zr));
  T("i trafiają do kopii zapasowej", ()=>{
     w.eval(`szablony.length=0;
       szablony.push({id:1, nazwa:"Zebranie", tytul:"{data}", tresc:"Komentarze", ord:0});`);
     const kop = JSON.parse(w.eval("JSON.stringify(daneKopii())"));
     return (Array.isArray(kop.szablony) && kop.szablony.length===1)
            || "w kopii: "+JSON.stringify(kop.szablony); });
  T("wczytana kopia dokłada szablony, których nie ma", ()=>{
     const przed = w.eval("szablony.length");
     w.mergeBackup({notes:[], tags:[], szablony:[{nazwa:"Wykład", tytul:"T", tresc:"C"}]}, false, false);
     return w.eval("szablony.length")===przed+1
            || "było "+przed+", jest "+w.eval("szablony.length"); });
  T("i nie dubluje tych, które już mam", ()=>{
     const przed = w.eval("szablony.length");
     w.mergeBackup({notes:[], tags:[], szablony:[{nazwa:"Zebranie", tytul:"INNY", tresc:"INNA"}]}, false, false);
     return w.eval("szablony.length")===przed
            || "zdublowano: "+w.eval("szablony.length"); });
  T("ani nie nadpisuje moich poprawek cudzą wersją", ()=>
     w.eval('szablony.find(s=>s.nazwa==="Zebranie").tresc')==="Komentarze");
  T("uszkodzony wpis w kopii jest pomijany", ()=>{
     const przed = w.eval("szablony.length");
     w.mergeBackup({notes:[], tags:[], szablony:[null, {}, {nazwa:"   "}, "tekst"]}, false, false);
     return w.eval("szablony.length")===przed; });
  T("wczytywane przy starcie aplikacji", ()=>
     /loadSzablony/.test(zrodlo("js","03-boot.js")));

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
