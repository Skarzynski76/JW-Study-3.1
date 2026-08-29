/* ==========================================================================
   CHWYTANIE — PRZENOSZENIE GDZIEKOLWIEK

   Stary mechanizm pilnował data-grupa, więc etykieta nie mogła opuścić swojej
   sekcji ani przeskoczyć nagłówka. Nie było też widać nic — żadnego elementu
   przy palcu, żadnej linii — więc nawet gdy coś się przesuwało, wyglądało to
   na awarię. Testy sprawdzają PRZYCZYNĘ, nie objaw.
   ========================================================================== */
const {T, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const zr = zrodlo("js","34-chwytanie.js");
  const css = zrodlo("css","11-polish.css").replace(/\s+/g," ");

  w.eval(`notes.length=0;tags.length=0;sections.length=0;secTabs.length=0;idb=null;
    sections.push({id:1,name:"Kongresy",ord:0,open:true});
    sections.push({id:2,name:"Studium",ord:1,open:true});
    tags.push({id:11,name:"Alfa", ord:0,  sec:1});
    tags.push({id:12,name:"Beta", ord:10, sec:1});
    tags.push({id:13,name:"Gamma",ord:20, sec:1});
    tags.push({id:14,name:"Delta",ord:30, sec:1});
    tags.push({id:15,name:"Omega",ord:0,  sec:2});
    renderAll();`);

  /* jsdom nie liczy układu strony, więc podajemy wysokości sami. */
  const wiersze = ()=>[...d.querySelectorAll("#tagList .item[data-k], #tagList .secHead")];
  w.Element.prototype.getBoundingClientRect = function(){
     const i = wiersze().indexOf(this);
     const top = i<0 ? 0 : i*30;
     return {top, bottom:top+30, left:0, right:200, width:200, height:30, x:0, y:top};
  };
  const el = (id)=>d.querySelector('#tagList .item[data-k="'+id+'"]');
  const srodek = (id)=>{ const r = el(id).getBoundingClientRect(); return r.top + 15; };
  const nazwy = (sek)=>w.eval("tags.filter(t=>t.sec==="+sek+")"
                              +".slice().sort((a,b)=>a.ord-b.ord).map(t=>t.name).join(',')");
  const przenies = (id, y)=>{
    const uchwyt = el(id).querySelector(".dragOrd") || el(id);
    const opcje = (yy)=>({bubbles:true, pointerId:1, clientX:20, clientY:yy});
    uchwyt.dispatchEvent(new w.PointerEvent("pointerdown", opcje(srodek(id))));
    d.dispatchEvent(new w.PointerEvent("pointermove", opcje(y)));
    const stan = {duszek:!!d.querySelector(".chwytDuszek"),
                  linia: d.querySelector(".chwytWskaznik"),
                  blady: el(id) && el(id).classList.contains("chwytany")};
    stan.liniaWidoczna = !!stan.linia && stan.linia.style.display==="block";
    d.dispatchEvent(new w.PointerEvent("pointerup", opcje(y)));
    return stan;
  };

  console.log("═══ WIDAĆ, ŻE ELEMENT JEST W RĘCE ═══");
  let stan = przenies(11, srodek(11));
  T("chwycona pozycja leci za palcem jako etykietka", ()=>stan.duszek);
  T("chwycona pozycja blednie na liście", ()=>stan.blady);
  T("widać linię pokazującą miejsce wstawienia", ()=>stan.liniaWidoczna);
  T("po puszczeniu etykietka znika", ()=>!d.querySelector(".chwytDuszek"));
  T("po puszczeniu linia znika", ()=>!d.querySelector(".chwytWskaznik"));

  console.log("═══ KILKA MIEJSC JEDNYM GESTEM ═══");
  T("etykieta przeskakuje o kilka pozycji naraz", ()=>{
     w.eval("tags.forEach(t=>{t.ord = {11:0,12:10,13:20,14:30,15:0}[t.id];}); renderAll();");
     przenies(11, srodek(14)+10);
     return nazwy(1)==="Beta,Gamma,Delta,Alfa" || "otrzymano: "+nazwy(1); });
  T("i wraca na sam początek jednym gestem", ()=>{
     przenies(11, srodek(12)-10);
     return nazwy(1)==="Alfa,Beta,Gamma,Delta" || "otrzymano: "+nazwy(1); });

  console.log("═══ PRZEZ GRANICĘ SEKCJI ═══");
  T("upuszczenie w innej sekcji przenosi etykietę", ()=>{
     przenies(12, srodek(15)+10);
     return w.eval("tags.find(t=>t.id===12).sec")===2 || "sec="+w.eval("tags.find(t=>t.id===12).sec"); });
  T("etykieta trafia we właściwe miejsce nowej sekcji", ()=>
     nazwy(2)==="Omega,Beta" || "otrzymano: "+nazwy(2));
  T("stara sekcja już jej nie zawiera", ()=>nazwy(1)==="Alfa,Gamma,Delta" || nazwy(1));
  T("kod nie ogranicza ruchu do jednej grupy", ()=>!/data-grupa|dataset\.grupa/.test(zr));

  console.log("═══ ZAKŁADKI I NOTATKI TAK SAMO ═══");
  T("zakładkę też można chwycić", ()=>/stbItem/.test(zr) && /rodzaj:"zakladka"/.test(zr));
  T("zakładka zabiera swoje etykiety", ()=>
     /tags\.forEach\(t=>\{ if\(t\.stb===z\.id\) t\.sec = z\.sec; \}\)/.test(zr));
  T("zakładki publikacji nie mieszają się między publikacjami", ()=>/sasiad\.ks!==z\.ks/.test(zr));
  T("kartę notatki też można chwycić", ()=>/rodzaj:"notatka"/.test(zr) && /#noteList \.ncard/.test(zr));
  T("kartę wolno chwycić tylko za uchwyt, nie za treść", ()=>/if\(notatka && !zUchwytu\) return;/.test(zr));
  T("upuszczenie na etykietę nadal przypisuje etykietę", ()=>
     /celDlaNotatki/.test(zr) && /upusc\(notes\.find/.test(zr));

  console.log("═══ WŁASNA KOLEJNOŚĆ MUSI PRZEŻYĆ ZMIANĘ SORTOWANIA ═══");
  /* PRZYCZYNA: numery nadawało się po tym, co widać na ekranie (i*10), a lista
     pokazuje tylko pierwszą porcję i tylko notatki z bieżącego filtra. */
  T("numery nadawane na pełnej liście, nie po widoku", ()=>
     /notatkiWKolejnosci\(\)/.test(zr) && !/querySelectorAll\("\.ncard"\)[\s\S]{0,120}ord = i\*10/.test(zr));
  T("stary moduł numerujący widok został usunięty", ()=>!/24-reorder\.js/.test(zrodlo(".","index.html")));
  T("każda notatka dostaje numer przy pierwszym użyciu", ()=>/function ustalKolejnoscNotatek/.test(zr));
  T("kolejność zapisywana do bazy", ()=>/idbBulkChunked\("notes", zmienione\)/.test(zr));
  T("data zmiany notatki zostaje nietknięta", ()=>{
     const f = (zr.match(/function przeniesNotatke\([\s\S]*?\n\}/)||[""])[0];
     return f.length>200 && !/markDirty/.test(f); });
  T("kolejność przeżywa zmianę sortowania i powrót", ()=>{
     w.eval(`notes.length=0; sortMode="custom";
       for(let i=0;i<6;i++) notes.push({g:"n"+i,t:"N"+i,h:"",c:"",tg:[],b:null,ch:null,ks:null,
         cr:"2024-01-0"+(i+1),mo:"2024-01-0"+(i+1),del:false});`);
     w.przeniesNotatke(w.eval("notes.find(n=>n.g==='n0')"), w.eval("notes.find(n=>n.g==='n4')"), false);
     const po = w.eval("notes.filter(n=>!n.del).slice().sort((a,b)=>a.ord-b.ord).map(n=>n.g).join(',')");
     w.eval('sortMode="new"; renderAll(); sortMode="custom"; renderAll();');
     const znow = w.eval("notes.filter(n=>!n.del).slice().sort((a,b)=>a.ord-b.ord).map(n=>n.g).join(',')");
     return (po===znow && /n0/.test(po)) || "przed: "+po+" po: "+znow; });
  T("wszystkie notatki mają różne numery", ()=>{
     const o = w.eval("notes.filter(n=>!n.del).map(n=>n.ord).join(',')").split(",");
     return new Set(o).size===o.length || "numery: "+o.join(","); });
  T("przeciągnięcie w innym sortowaniu włącza własną kolejność", ()=>
     /sortMode = "custom"/.test(zr) && /lsSet\(KP\+"Sort", "custom"\)/.test(zr));

  console.log("═══ LISTA PRZEWIJA SIĘ SAMA PRZY KRAWĘDZI ═══");
  T("jest przewijanie przy krawędzi", ()=>/function krokPrzewijania/.test(zr) && /CHWYT_STREFA/.test(zr));
  T("im bliżej krawędzi, tym szybciej", ()=>{
     const przy = w.silaPrzewijania(2, 0, 500), dalej = w.silaPrzewijania(50, 0, 500),
           srod = w.silaPrzewijania(250, 0, 500);
     return (przy < dalej && dalej < 0 && srod===0) || `krawędź ${przy}, dalej ${dalej}, środek ${srod}`; });
  T("przy dolnej krawędzi jedzie w dół", ()=>w.silaPrzewijania(498, 0, 500) > 0);
  T("bez pojemnika przewija samo okno", ()=>/scrollBy\(0, krok\)/.test(zr));
  T("pętla chodzi mimo nieruchomego palca", ()=>/requestAnimationFrame\(petlaPrzewijania\)/.test(zr));
  T("po przewinięciu linia jest przeliczana na nowo", ()=>
     /if\(krokPrzewijania\(_chwyt\.y\)\) przelicz\(_chwyt\.x, _chwyt\.y\);/.test(zr));
  T("po puszczeniu pętla się zatrzymuje", ()=>/cancelAnimationFrame\(_chwyt\.klatka\)/.test(zr));

  console.log("═══ DOTYK I MYSZ TAK SAMO ═══");
  T("obsługa oparta na zdarzeniach wskaźnika", ()=>
     /pointerdown/.test(zr) && /pointermove/.test(zr) && /pointercancel/.test(zr));
  T("uchwyt nie przewija listy podczas przenoszenia", ()=>
     /#tagList \.dragOrd, #pubList \.dragOrd\{ touch-action:none/.test(css));
  T("można też przytrzymać sam wiersz", ()=>/CHWYT_PRZYTRZYMANIE/.test(zr) && /setTimeout\(odklej/.test(zr));
  T("numeracja co 10, żeby było miejsce na wstawki", ()=>/x\.ord = k\*10/.test(zr));

  console.log("═══ PANEL PUBLIKACJI TYM SAMYM CHWYTEM ═══");
  /* Publikacje miały własny, słabszy mechanizm: nasłuchy na samym uchwycie
     i przechwycenie wskaźnika. Gdy przechwycenie przepadało — a na tablecie
     zdarza się to przy przerysowaniu panelu — wiersz przestawał iść za palcem
     albo puszczenie nie dochodziło i nowa kolejność NIE była zapisywana. */
  T("stary, osobny mechanizm został usunięty", ()=>
     !/function initPubDrag/.test(zrodlo("js","05-publications.js")));
  T("pozycje publikacji są rozpoznawane przez wspólny chwyt", ()=>
     /rodzaj:"publikacja"/.test(zr) && /#pubList \.item\.pubMove/.test(zr));
  T("uchwytem jest ⠿ przy publikacji", ()=>
     /info\.rodzaj==="publikacja" \? "\.pubDrag"/.test(zr));
  T("przeciągnięcie zmienia i ZAPISUJE kolejność", ()=>{
     w.eval(`notes.length=0; pubTabs.length=0;
       const dodaj=(ks,i)=>notes.push({g:ks+i,t:"N",h:"",c:"",tg:[],b:null,ch:null,v:null,
         ks:ks, itn:0, doc:1, par:i, pub:"A", cr:"2024-01-01",mo:"2024-01-01",del:false});
       ["w","bt","g"].forEach((k,j)=>{ for(let i=0;i<3-j;i++) dodaj(k,i); });
       pubView={cat:null, year:null}; filt.book="all";
       try{ localStorage.removeItem("pubOrder"); }catch(e){}
       pubOrder={}; renderAll(); renderPubPanel();`);
     const wiersze = ()=>[...d.querySelectorAll("#pubList .pubMove")];
     if(wiersze().length < 3) return "panel pokazał "+wiersze().length+" pozycji";
     w.Element.prototype.getBoundingClientRect = function(){
       const i = wiersze().indexOf(this); const top = i<0 ? 0 : i*30;
       return {top, bottom:top+30, left:0, right:200, width:200, height:30, x:0, y:top};
     };
     const przed = wiersze().map(x=>x.dataset.ord).join(",");
     const u = wiersze()[0].querySelector(".pubDrag");
     const o = (y)=>({bubbles:true, pointerId:1, clientX:20, clientY:y});
     u.dispatchEvent(new w.PointerEvent("pointerdown", o(15)));
     d.dispatchEvent(new w.PointerEvent("pointermove", o(95)));
     d.dispatchEvent(new w.PointerEvent("pointerup", o(95)));
     const po = wiersze().map(x=>x.dataset.ord).join(",");
     const zapis = w.localStorage.getItem("pubOrder")||"";
     return (po!==przed && /"cats"/.test(zapis))
            || `przed ${przed}, po ${po}, zapis ${zapis}`; });
  T("po zmianie pojawia się przywracanie domyślnej kolejności", ()=>
     /getElementById\("pubReset"\)/.test(zr));

  T("brak błędów wykonania", ()=>errors.length===0 || errors.slice(0,2).join(" | "));
});
