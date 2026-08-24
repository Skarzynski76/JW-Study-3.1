/* ==========================================================================
   EDYTOR NOTATKI — poprawki, które użytkownik zgłaszał kilkakrotnie.
   Każda asercja odpowiada konkretnej usterce z historii, żeby nie wróciła.
   ========================================================================== */
const {T, uruchom} = require("./wspolne-testy.js");
uruchom(async ({w, d, errors, zrodlo})=>{
  const js  = zrodlo("js","13-editor.js");
  const css = zrodlo("css","11-polish.css").replace(/\s+/g," ");
  /* Pasek musi siedzieć w karcie notatki — menu szuka treści przez rodzica. */
  const karta = d.createElement("div"); karta.className="ncard editing"; karta.dataset.g="tEdytor";
  const tresc = d.createElement("div"); tresc.className="ncontent";
  tresc.innerHTML='<h3 id="h">Nagłówek</h3><div id="p">Akapit</div>';
  const pasek = w.buildEditbar({});
  karta.appendChild(tresc); karta.appendChild(pasek); d.body.appendChild(karta);
  w.eval('notes.push({g:"tEdytor",t:"",h:"",c:"",tg:[],b:null,ch:null,ks:null,cr:"",mo:"",del:false,ptb:null})');
  const pop = d.getElementById("ebPop");

  console.log("═══ STYL AKAPITU — NIE MOŻE SIĘ ZACINAĆ ═══");
  /* Historia: styl akapitu był listą <select>. Lista nie wysyła zdarzenia przy
     wyborze TEJ SAMEJ pozycji, więc „Nagłówek" dawało się ustawić raz. */
  T("styl akapitu to przycisk, nie lista", ()=>pasek.querySelector(".eb-block").tagName==="BUTTON");
  T("przycisk pokazuje bieżący styl", ()=>!!pasek.querySelector(".eb-blockLbl"));
  T("menu ma cztery style", ()=>{
     w.openEbPop("blok", pasek.querySelector(".eb-block"), pasek);
     return pop.querySelectorAll("[data-blok]").length===4; });
  T("dwa razy ten sam styl daje dwa wywołania", ()=>{
     const wywolane=[]; const stary=d.execCommand;
     d.execCommand=(c,x,v)=>{ wywolane.push(c+":"+(v||"")); return true; };
     w.openEbPop("blok", pasek.querySelector(".eb-block"), pasek);
     pop.querySelector("[data-blok='H2']").dispatchEvent(new w.MouseEvent("pointerdown",{bubbles:true}));
     w.openEbPop("blok", pasek.querySelector(".eb-block"), pasek);
     pop.querySelector("[data-blok='H2']").dispatchEvent(new w.MouseEvent("pointerdown",{bubbles:true}));
     d.execCommand=stary;
     return wywolane.filter(x=>x==="formatBlock:<h2>").length===2
            || "wywołania: "+wywolane.join(" | "); });
  T("przycisk nadąża za kursorem", ()=>{
     const wTresci=(el)=>{ w.getSelection=()=>({isCollapsed:false,rangeCount:1,toString:()=>"",
       getRangeAt:()=>({startContainer:el,collapsed:false})}); };
     wTresci(d.getElementById("p").firstChild); w.updateEditbarState(pasek);
     const a=pasek.querySelector(".eb-blockLbl").textContent;
     wTresci(d.getElementById("h").firstChild); w.updateEditbarState(pasek);
     const b=pasek.querySelector(".eb-blockLbl").textContent;
     return (a==="Treść" && b==="Nagłówek") || a+" / "+b; });

  console.log("═══ INTERLINIA I ODSTĘPY ═══");
  T("menu ma cztery interlinie i cztery odstępy", ()=>{
     w.openEbPop("blok", pasek.querySelector(".eb-block"), pasek);
     return pop.querySelectorAll("[data-lh]").length===4 && pop.querySelectorAll("[data-pm]").length===4; });
  T("ustawienie zapisuje się w notatce", ()=>{
     const karta=d.createElement("div"); karta.className="ncard"; karta.dataset.g="tEd";
     const ce=d.createElement("div"); ce.className="ncontent"; karta.appendChild(ce); d.body.appendChild(karta);
     w.eval('notes.push({g:"tEd",t:"",h:"",c:"",tg:[],b:null,ch:null,ks:null,cr:"",mo:"",del:false,ptb:null})');
     w.ustawOdstepy(ce,"1.85",null); w.ustawOdstepy(ce,null,".7em");
     const zapis=w.eval('JSON.stringify(notes.find(n=>n.g==="tEd"))');
     return /"lh":"1.85"/.test(zapis) && /"pm":".7em"/.test(zapis); });
  T("style korzystają z tych zmiennych", ()=>
     /\.ncontent\{ line-height:var\(--nLh, 1\.6\)/.test(css) && /margin-top:var\(--nPm, 0\)/.test(css));

  console.log("═══ COFANIE — WŁASNA HISTORIA ═══");
  /* Historia: execCommand("undo") bez czego cofać potrafił cofnąć całą stronę. */
  T("jest własna historia", ()=>typeof w.histStart==="function" && typeof w.histZapisz==="function");
  T("cofanie nie idzie do przeglądarki", ()=>{
     const wywolane=[]; const stary=d.execCommand;
     d.execCommand=(c)=>{ wywolane.push(c); return true; };
     const karta=d.createElement("div"); karta.className="ncard editing";
     const ce=d.createElement("div"); ce.className="ncontent"; ce.contentEditable="true";
     Object.defineProperty(ce,"isContentEditable",{value:true});
     ce.innerHTML="<div>pierwsza</div>";
     const b=w.buildEditbar({}); karta.appendChild(ce); karta.appendChild(b); d.body.appendChild(karta);
     w.getSelection=()=>({isCollapsed:true,rangeCount:0,toString:()=>"",removeAllRanges(){},addRange(){}});
     w.histStart(ce);
     ce.innerHTML="<div>druga</div>"; w.histZapisz(ce);
     w.wykonajWTresci("undo", b);
     const trescPo=ce.textContent;
     w.wykonajWTresci("redo", b);
     d.execCommand=stary;
     return trescPo==="pierwsza" && ce.textContent==="druga"
            && wywolane.indexOf("undo")<0 && wywolane.indexOf("redo")<0; });
  T("na dnie historii nic nie leci do przeglądarki", ()=>
     /toast\(kier < 0 \? "Nie ma czego cofnąć"/.test(js));
  T("Cmd\\+Z poza polem edycji zablokowany", ()=>/e\.key\.toLowerCase\(\)==="z"/.test(zrodlo("js","23-shortcuts.js")));

  console.log("═══ CZCIONKI I KOLORY ═══");
  T("czcionki pogrupowane", ()=>pasek.querySelector(".eb-font").querySelectorAll("optgroup").length===3);
  T("co najmniej 25 krojów", ()=>pasek.querySelector(".eb-font").querySelectorAll("option").length>=25);
  /* Lista krojów zależy od systemu: Optima czy Iowan Old Style są na Macu,
     ale nie na Windowsie ani Androidzie. Wybór z innego urządzenia musi zostać
     uszanowany, a użytkownik — poinformowany, że widzi zastępczy. */
  T("aplikacja umie sprawdzić obecność kroju", ()=>typeof w.czcionkaDostepna==="function");
  T("Domyślna jest zawsze dostępna", ()=>w.czcionkaDostepna("")===true);
  T("brakujący krój zostaje na liście, tylko oznaczony", ()=>{
     // podstawiamy wynik pomiaru: udajemy, że Optimy w tym systemie nie ma
     w.eval('_dostepneKroje.set("Optima,\'Segoe UI\',Candara, sans-serif", false)');
     const p2 = w.buildEditbar({});
     const opcje = [...p2.querySelector(".eb-font").querySelectorAll("option")];
     const brak = opcje.filter(o=>o.dataset.brak==="1");
     return (opcje.length>=25 && brak.length===1 && /zastępcza/.test(brak[0].textContent))
       || "oznaczonych: "+brak.length+" z "+opcje.length; });
  T("krój obecny nie jest niczym oznaczany", ()=>{
     const p2 = w.buildEditbar({});
     const georgia = [...p2.querySelector(".eb-font").querySelectorAll("option")]
       .find(o=>o.textContent.trim()==="Georgia");
     return !!georgia && !georgia.dataset.brak; });

  console.log("═══ MENU I NARZĘDZIA ═══");
  T("menu Więcej ma komplet pozycji z ikonami", ()=>{
     w.openEbPop("more", pasek.querySelector(".eb-more"), pasek);
     const poz=[...pop.querySelectorAll("[data-narz],[data-cmd],[data-clear]")];
     return poz.length>=11 && poz.every(x=>x.querySelector("svg.ic")); });
  T("brak emoji w menu", ()=>{
     const fragment=js.slice(js.indexOf('data-cmd="outdent"'), js.indexOf('data-clear="1"')+120);
     return !/[☀-➿\uD83C-\uDBFF]/.test(fragment); });
  T("trzy narzędzia pisania", ()=>["wielkosc","data","licz"].every(k=>!!pop.querySelector("[data-narz='"+k+"']")));
  T("skróty pisania podpięte", ()=>typeof w.skrotPisania==="function");
  T("można wybrać kilka zdjęć naraz", ()=>pasek.querySelector(".eb-img input").multiple===true);
  T("menu edytora się przewija", ()=>pop.style.overflowY==="auto");

  T("brak błędów wykonania", ()=>errors.length===0 || errors.join(" "));
});
