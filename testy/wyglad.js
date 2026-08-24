/* ==========================================================================
   WYGLĄD — gotowe kompozycje w Ustawieniach, kolory kolumn pod paletą.
   Te same rzeczy nie mogą być w dwóch miejscach naraz.
   ========================================================================== */
const {T, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const css = zrodlo("css","11-polish.css").replace(/\s+/g," ");
  const cssNadpisan = ()=> (d.getElementById("colorOverrides")||{textContent:""}).textContent;

  console.log("═══ KOMPOZYCJE W USTAWIENIACH ═══");
  w.openSettings();
  T("kafelki kompozycji w oknie ustawień", ()=>d.querySelectorAll("#setBody [data-komp]").length>=9);
  T("jest pozycja przywracająca domyślny wygląd", ()=>!!d.querySelector('#setBody [data-komp="reset"]'));
  T("bieżąca kompozycja odhaczona", ()=>d.querySelectorAll("#setBody .st-kafel.on").length===1);
  T("kafelki mają nazwy kolorów", ()=>
     [...d.querySelectorAll("#setBody [data-komp]")].every(k=>k.textContent.replace("✓","").trim().length>2));

  console.log("═══ KOMPOZYCJA OBEJMUJE CAŁY INTERFEJS ═══");
  /* Pasek górny był na stałe butelkowo-zielony — brał kolor ze zmiennej --accent
     ustawianej w arkuszu stylów, której kompozycja wcześniej nie ruszała. */
  d.querySelector('#setBody [data-komp]:not([data-komp="reset"])').click();
  const po = cssNadpisan();
  T("kompozycja podmienia --accent", ()=>/:root\{--accent:#/.test(po));
  T("pasek górny przemalowany", ()=>/header\{background:#/.test(po));
  T("napis w pasku dobrany do jasności tła", ()=>/\.brand-name\{color:#/.test(po));
  T("przycisk „Nowa notatka\" nadal czytelny", ()=>/header \.btn\.primary\{background:#[0-9a-f]+;color:#/.test(po));
  T("zakładki na telefonie objęte", ()=>/#mobileTabs button\.on/.test(po));
  /* Motyw nocny trzymał --accent na html[data-theme], więc pasek (malowany
     wprost) był lawendowy, a filtry i zaznaczenia zostawały zielone. */
  T("motyw nocny też bierze --accent z kompozycji", ()=>
     /html\[data-theme="dark"\],html\[data-theme="sepia"\]\{--accent:#/.test(po));
  T("filtry szybkiego wyboru biorą kolor kompozycji", ()=>
     /\.qf\.on,/.test(po) && /html\[data-theme="dark"\] \.qf\.on/.test(po));
  T("wybrana księga i etykieta biorą kolor kompozycji", ()=>
     /#colBooks \.item\.active/.test(po) && /#colTags \.item\.active/.test(po));
  T("kolumna Biblia objęta", ()=>/#colBooks\{background/.test(po));
  T("kolumna Etykiety objęta", ()=>/#colTags\{background/.test(po));
  T("kolumna Publikacje objęta", ()=>/#colPubs\{background/.test(po));
  T("belka notatki objęta", ()=>/\.nhead\{background/.test(po));
  /* Pastel na czerni dawał szare tło apki. Kompozycja maluje kolumny
     tylko w motywie dziennym; w nocy zostaje tło motywu. */
  T("tło kolumn tylko w motywie dziennym", ()=>
     /html:not\(\[data-theme="dark"\]\) #colBooks\{background/.test(po)
     && /html:not\(\[data-theme="dark"\]\) #colNotes\{background/.test(po));
  T("w nocy tło notatek zostaje tłem motywu", ()=>
     /html\[data-theme="dark"\] #colNotes\{ background:var\(--panel\)/.test(css));
  T("wybór odhacza się od razu", ()=>d.querySelectorAll("#setBody .st-kafel.on").length===1);

  console.log("═══ POWRÓT DO DOMYŚLNEGO ═══");
  d.querySelector('#setBody [data-komp="reset"]').click();
  T("kompozycja zdjęta", ()=>!/:root\{--accent/.test(cssNadpisan()));
  T("odhaczona pozycja domyślna", ()=>d.querySelector("#setBody .st-kafel.on").dataset.komp==="reset");

  console.log("═══ NIC NIE JEST W DWÓCH MIEJSCACH ═══");
  w.openSettings();
  T("w ustawieniach nie ma kolorów kolumn", ()=>d.querySelectorAll("#setBody [data-target]").length===0);
  T("w ustawieniach nie ma starego przycisku kolorów", ()=>d.querySelectorAll('#setBody [data-act="colors"]').length===0);
  w.openColorMenu({target:d.getElementById("btnColors")});
  const paleta=d.getElementById("colorMenu");
  T("paleta ma kolory pięciu części", ()=>paleta.querySelectorAll("[data-target]").length===5);
  T("paleta obejmuje kolumnę Publikacje", ()=>!!paleta.querySelector('[data-target="colPubs"]'));
  T("w palecie nie ma już kompozycji", ()=>paleta.querySelectorAll(".cm-preset").length===0);
  T("paleta mówi, gdzie szukać kompozycji", ()=>/Ustawieniach/.test(paleta.textContent));

  console.log("═══ STYL KAFELKÓW ═══");
  T("kafelki układają się w siatkę", ()=>/\.st-komp\{ display:grid/.test(css));
  T("wybrany kafelek ma obwódkę", ()=>/\.st-kafel\.on\{ box-shadow/.test(css));

  console.log("═══ KAŻDE OKNO MIEŚCI SIĘ NA EKRANIE ═══");
  /* #askModal i #msgModal nie miały ŻADNEGO ograniczenia wysokości. Przy dłuższej
     treści — liście artykułów do wyboru, raporcie błędów — okno rosło poza ekran,
     a że nie miało własnego przewijania, przycisków „OK" i „Anuluj" nie dało się
     dosięgnąć. */
  T("wszystkie okna mają ograniczoną wysokość", ()=>{
     const zle = [...d.querySelectorAll(".overlay")].filter(o=>{
       const m = o.firstElementChild;
       if(!m) return true;
       const mh = w.getComputedStyle(m).maxHeight;
       return !mh || mh==="none";
     }).map(o=>o.id);
     return zle.length===0 || "bez ograniczenia: "+zle.join(", "); });
  T("treść komunikatu przewija się, gdy jest długa", ()=>
     w.getComputedStyle(d.querySelector("#msgModal .msgBody")).overflowY==="auto");
  T("wiersz odpowiedzi też — przy wielu do wyboru", ()=>
     w.getComputedStyle(d.querySelector("#msgModal .askBtns")).overflowY==="auto");
  T("nagłówek i przyciski zostają na widoku", ()=>
     /#askModal \.askTitle,\s*#msgModal \.askTitle\{ flex:0 0 auto; \}/.test(zrodlo("css","11-polish.css")));

  T("brak błędów wykonania", ()=>errors.length===0 || errors.join(" "));
});
