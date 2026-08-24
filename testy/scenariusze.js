/* ==========================================================================
   SCENARIUSZE — całe ścieżki użytkownika, nie pojedyncze funkcje.

   Uczciwe nazewnictwo: to NIE jest E2E. Prawdziwe E2E wymaga przeglądarki
   z układem strony, obsługą offline i bazą IndexedDB. Tutaj jest jsdom,
   więc sprawdzamy logikę i budowę strony na całej długości ścieżki:
   od kliknięcia po zapis i ponowne odczytanie.

   Wartość: usterki na styku modułów. Zestawy jednostkowe sprawdzają, że każdy
   krok działa osobno; te scenariusze — że działają po kolei.
   ========================================================================== */
const {T, TA, uruchom} = require("./wspolne-testy.js");

uruchom(async ({w, d, errors})=>{
  /* Baza w atrapie: zapisujemy do zwykłego obiektu, żeby dało się sprawdzić,
     co NAPRAWDĘ trafiło na dysk, a nie tylko co widać na ekranie. */
  const dysk = {notes:{}, tags:{}, meta:{}};
  w.eval(`
    idb = {
      transaction(sklepy, tryb){
        const tx={};
        const nazwy = Array.isArray(sklepy)?sklepy:[sklepy];
        tx.objectStore=(n)=>({
          /* Opróżniamy TEN SAM obiekt, zamiast podstawiać nowy. Podstawienie
             zrywało wspólną referencję: zestaw trzymał wskazanie na stary
             obiekt i po każdym „Zastąp wszystko" liczył zawartość sprzed
             czyszczenia — stąd wynik raz dobry, raz zły. */
          clear(){ const o = window.__dysk[n]; Object.keys(o).forEach(k=>delete o[k]); },
          put(v,k){ const klucz = k!==undefined ? k : (v && (v.g||v.id)); window.__dysk[n===("meta")?"meta":n][klucz]=v; },
          get(k){ const r={}; setTimeout(()=>{ r.result=window.__dysk[n][k]; r.onsuccess&&r.onsuccess(); },0); return r; },
          getAll(){ const r={}; setTimeout(()=>{ r.result=Object.values(window.__dysk[n]); r.onsuccess&&r.onsuccess(); },0); return r; },
          delete(k){ delete window.__dysk[n][k]; const r={}; setTimeout(()=>r.onsuccess&&r.onsuccess(),0); return r; },
          count(){ const r={}; setTimeout(()=>{ r.result=Object.keys(window.__dysk[n]).length; r.onsuccess&&r.onsuccess(); },0); return r; }
        });
        /* Mikrozadanie, nie zegar: setTimeout(...,0) ścigał się z zapisami
           wykonywanymi w ciele transakcji i z przypisaniem tx.oncomplete.
           Raz na kilka przebiegów koniec ogłaszał się przed ostatnim put,
           a test liczył wtedy niepełną zawartość bazy. */
        Promise.resolve().then(()=>tx.oncomplete&&tx.oncomplete());
        return tx;
      }
    };
    notes.length=0; tags.length=0; sections.length=0;
    renderAll();
  `);
  w.__dysk = dysk;
  /* Dane aplikacji żyją w zakresie skryptu, nie na obiekcie okna — sięgamy po nie
     tak, jak robi to sama aplikacja. */
  const N = ()=>w.eval("notes");
  const G = ()=>w.eval("tags");
  const naDysku = (sklep)=>Object.keys(dysk[sklep]).length;
  const odczekaj = (ms=30)=>new Promise(r=>setTimeout(r,ms));

  console.log("═══ ŚCIEŻKA 1: NOWA NOTATKA OD ZERA ═══");
  T("okno nowej notatki otwiera się z paska", ()=>{
     d.getElementById("btnNew").click();
     return d.getElementById("modalNew").classList.contains("show"); });
  T("pola tytułu i treści są gotowe", ()=>!!d.getElementById("nnTitle") && !!d.getElementById("nnContent"));
  await TA("notatka zapisuje się i trafia na listę", async ()=>{
     d.getElementById("nnTitle").value = "Rozważanie o cierpliwości";
     d.getElementById("nnContent").value = "Cierpliwość jest owocem ducha.";
     /* Zapis jest asynchroniczny — czekamy na niego wprost, a nie na oślep. */
     await d.getElementById("nnSave").onclick();
     await odczekaj(60);
     const naEkranie = [...d.querySelectorAll("#noteList .ncard")]
       .some(k=>/cierpliwości/i.test(k.textContent));
     return (N().length===1 && naEkranie) || `w pamięci: ${N().length}, na ekranie: ${naEkranie}`; });
  await TA("notatka trafiła też do bazy urządzenia", async ()=>{
     await odczekaj(40);
     return naDysku("notes")===1 || "w bazie: "+naDysku("notes"); });
  T("licznik na górze się zgadza", ()=>/1/.test(d.getElementById("counts").textContent));

  console.log("═══ ŚCIEŻKA 2: FORMATOWANIE I ZAPIS ═══");
  T("wejście w tryb edycji dokłada pasek narzędzi", ()=>{
     const karta = d.querySelector("#noteList .ncard");
     w.toggleEdit(karta, N()[0]);
     return karta.classList.contains("editing") && !!karta.querySelector(".editbar"); });
  T("zmiana stylu akapitu wywołuje polecenie edycji", ()=>{
     const karta = d.querySelector("#noteList .ncard.editing");
     const pasek = karta.querySelector(".editbar");
     const wywolane=[]; const stary=d.execCommand;
     d.execCommand=(c,x,v)=>{ wywolane.push(c); return true; };
     w.openEbPop("blok", pasek.querySelector(".eb-block"), pasek);
     d.getElementById("ebPop").querySelector("[data-blok='H2']")
       .dispatchEvent(new w.MouseEvent("pointerdown",{bubbles:true}));
     d.execCommand=stary;
     return wywolane.indexOf("formatBlock")>=0 || "wywołano: "+wywolane.join(","); });
  T("wyjście z edycji zapisuje oczyszczoną treść", ()=>{
     const karta = d.querySelector("#noteList .ncard.editing");
     karta.querySelector(".ncontent").innerHTML =
       '<div>Tekst <b>ważny</b><img src=x onerror="alert(1)"></div>';
     w.toggleEdit(karta, N()[0]);
     const zapisana = N()[0].h;
     return /<b>ważny<\/b>/.test(zapisana) && !/onerror/i.test(zapisana)
            || "zapisano: "+zapisana.slice(0,80); });

  console.log("═══ ŚCIEŻKA 3: ETYKIETA I FILTROWANIE ═══");
  T("nowa etykieta pojawia się w kolumnie", ()=>{
     w.eval('tags.push({id:1,name:"Studium",ord:1,sec:null,color:"#b9a9d6"}); saveTags(); renderAll();');
     return [...d.querySelectorAll("#tagList .item")].some(i=>/Studium/.test(i.textContent)); });
  T("przypisanie etykiety do notatki", ()=>{
     w.eval('notes[0].tg=[1]; markDirty(notes[0]); renderAll();');
     return N()[0].tg.length===1; });
  T("filtr po etykiecie pokazuje właściwą notatkę", ()=>{
     w.eval('filt.tag=1; renderAll();');
     const widoczne = w.baseNotes().length;
     w.eval('filt.tag="all"; renderAll();');
     return widoczne===1 || "widocznych: "+widoczne; });
  T("etykieta bez notatek nie znika z listy", ()=>{
     w.eval('tags.push({id:2,name:"Pusta",ord:2,sec:null,color:""}); renderAll();');
     return [...d.querySelectorAll("#tagList .item")].some(i=>/Pusta/.test(i.textContent)); });

  console.log("═══ ŚCIEŻKA 4: WYSZUKIWANIE ═══");
  T("znajduje po treści", ()=>{ w.parseQuery("ważny"); const n=w.baseNotes().length; w.parseQuery(""); return n===1 || "znaleziono "+n; });
  T("znajduje po tytule", ()=>{ w.parseQuery("cierpliwości"); const n=w.baseNotes().length; w.parseQuery(""); return n===1; });
  T("działa bez polskich znaków", ()=>{ w.parseQuery("cierpliwosci"); const n=w.baseNotes().length; w.parseQuery(""); return n===1; });
  T("brak wyników nie wywraca listy", ()=>{
     w.parseQuery("czegotutajniema"); w.renderAll();
     const pusto = w.baseNotes().length===0 && !!d.querySelector("#noteList");
     w.parseQuery(""); w.renderAll();
     return pusto; });

  console.log("═══ ŚCIEŻKA 5: KOPIA I POWRÓT ═══");
  let kopia = null;
  await TA("zrobienie kopii zapasowej", async ()=>{
     w.saveFile=(blob)=>{ return Promise.resolve(true); };
     w.eval('window.__kopia = JSON.stringify({tags, notes, sections, pubTabs: (typeof pubTabs!=="undefined"?pubTabs:[])});');
     kopia = JSON.parse(w.__kopia);
     return kopia.notes.length===1 && kopia.tags.length===2 || `notatek ${kopia.notes.length}, etykiet ${kopia.tags.length}`; });
  T("kopia zawiera komplet pól", ()=>
     ["notes","tags","sections","pubTabs"].every(k=>k in kopia));
  await TA("wczytanie kopii przez „Zastąp wszystko\" kończy się powodzeniem", async ()=>{
     /* Ten zestaw chodzi po ŚCIEŻKACH użytkownika i ma podstawioną, uproszczoną
        bazę. Sprawdzanie na niej, ile dokładnie rekordów wylądowało po podmianie,
        okazało się mierzeniem samej atrapy, a nie aplikacji — wynik zależał od
        kolejności zdarzeń w atrapie i potrafił się zmieniać między przebiegami.
        Niepodzielność i faktyczna zawartość bazy po „Zastąp wszystko" mają własny
        zestaw z porządną atrapą: testy/import-atomowy.js. Tutaj pilnujemy tego,
        co należy do ścieżki: że operacja dochodzi do skutku i nie rzuca błędem. */
     const dane = {
       notes: w.sanitizeNotes(JSON.parse(JSON.stringify(kopia.notes)).concat([{g:"z1",t:"Z kopii",h:"<div>x</div>",c:"x",tg:[],cr:"",mo:""}]), "test", true),
       tags:  w.sanitizeTags(JSON.parse(JSON.stringify(kopia.tags)), "test", true),
       sections: [], pubTabs: []
     };
     const ok = await w.idbZastapWszystko(dane.notes, dane.tags, dane.sections, dane.pubTabs);
     return (ok===true && dane.notes.length===2)
            || `wynik ${ok}, notatek do zapisu ${dane.notes.length}`; });
  T("wczytana kopia jest oczyszczona z obcego kodu", ()=>{
     const zle = w.sanitizeNotes([{g:"x",t:"t",h:'<img src=y onerror="alert(1)">',tg:[]}], "test", true);
     return !/onerror/i.test(zle[0].h); });

  console.log("═══ ŚCIEŻKA 6: KOSZ ═══");
  T("usunięcie notatki zdejmuje ją z listy", ()=>{
     w.eval('notes[0].del=true; markDirty(notes[0]); renderAll();');
     return w.baseNotes().length===0; });
  T("usunięta notatka nadal jest w danych", ()=>N().filter(n=>n.del).length===1);
  T("przywrócenie z kosza działa", ()=>{
     w.eval('notes[0].del=false; markDirty(notes[0]); renderAll();');
     return w.baseNotes().length===1; });

  console.log("═══ ŚCIEŻKA 7: CZYTNIK ═══");
  T("otwarcie notatki na pełnym ekranie", ()=>{
     w.eval('fsGuid = notes[0].g; renderFs();');
     return !!d.querySelector("#fsWrap .ncard"); });
  T("czytnik pokazuje treść notatki", ()=>/cierpliwości/i.test(d.getElementById("fsWrap").textContent));
  T("zamknięcie czytnika wraca do listy", ()=>{
     w.closeFs();
     return !w.eval("fsGuid"); });

  console.log("═══ ŚCIEŻKA 8: USTAWIENIA WPŁYWAJĄ NA WYGLĄD ═══");
  T("zmiana wielkości pisma działa od razu", ()=>{
     const przed = d.documentElement.style.getPropertyValue("--noteFs");
     d.getElementById("fPlus").click();
     const po = d.documentElement.style.getPropertyValue("--noteFs");
     d.getElementById("fMinus").click();
     return przed!==po || "bez zmiany: "+przed; });
  T("kompozycja przemalowuje interfejs", ()=>{
     w.openSettings();
     d.querySelector('#setBody [data-komp]:not([data-komp="reset"])').click();
     const css = d.getElementById("colorOverrides").textContent;
     d.querySelector('#setBody [data-komp="reset"]').click();
     return /header\{background:#/.test(css); });
  T("ustawienia zapamiętują się", ()=>{
     w.setNoteView("compact");
     const zapis = w.localStorage.getItem("jwsView");
     w.setNoteView("list");
     return zapis==="compact"; });

  T("przez całą drogę bez błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
