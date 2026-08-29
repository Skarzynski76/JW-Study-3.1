#!/usr/bin/env bash
# =============================================================================
#  Pełna kontrola jakości JW Study.
#
#  Uruchomienie z katalogu projektu:   ./testy/uruchom.sh
#  Można też wskazać inny plik:        ./testy/uruchom.sh ./index.html
#
#  Sam podnosi serwer, uruchamia analizę statyczną i wszystkie zestawy,
#  po czym sprząta po sobie. Kod wyjścia 1 = coś nie przeszło.
# =============================================================================
set -uo pipefail
KAT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CEL="${1:-$KAT/index.html}"
PORT="${2:-8137}"

cd "$KAT"

if [ ! -d "node_modules/jsdom" ] && [ ! -d "/tmp/node_modules/jsdom" ]; then
  echo "Brakuje biblioteki jsdom. Zainstaluj ją poleceniem:"
  echo "   npm install jsdom axe-core"
  exit 1
fi

echo "════════════════════════════════════════════"
echo " JW Study — kontrola jakości"
echo " projekt: $KAT"
echo " plik:    $CEL"
echo "════════════════════════════════════════════"
echo

BLEDY=0

echo "── Analiza statyczna ──────────────────────"
node testy/audyt.js "$KAT" || BLEDY=$((BLEDY+1))
echo

# Zajęty port to najpodstępniejsza z możliwych usterek: testy przechodzą albo
# padają, badając CUDZY katalog podany przez obcy serwer. Lepiej stanąć i powiedzieć.
if (echo > /dev/tcp/127.0.0.1/"$PORT") 2>/dev/null; then
  echo "❌ Port $PORT jest już zajęty przez inny serwer."
  echo "   Testy badałyby wtedy nie ten katalog. Zamknij tamten proces albo podaj inny port:"
  echo "     ./testy/uruchom.sh \"$CEL\" 8150"
  exit 1
fi

python3 -m http.server "$PORT" >/dev/null 2>&1 &
SERWER=$!
sleep 1.2
# upewniamy się, że odpowiada NASZ serwer, z naszym plikiem
if ! node -e "
  const http=require('http');
  http.get('http://127.0.0.1:$PORT/index.html', r=>{
    let d=''; r.on('data',c=>{ d+=c; if(d.length>4000) r.destroy(); });
    r.on('close',()=>process.exit(/JW Study/.test(d)?0:1));
  }).on('error',()=>process.exit(1));
" 2>/dev/null; then
  echo "❌ Serwer na porcie $PORT nie podaje pliku aplikacji z katalogu $KAT."
  exit 1
fi
sprzataj(){ kill "$SERWER" 2>/dev/null; }
trap sprzataj EXIT

ZESTAWY=(start-blokada regres edytor kolumny czytnik wyglad aktualizacja kopia bezpieczenstwo import-atomowy import-limity wydanie scenariusze dostepnosc sekcje onenote-strona porzadki przenoszenie udostepnianie chwytanie wszystkie kolejnosc-publikacji miejsce menu-dotyk klikalnosc telefon wydajnosc wysokosc gestosc tablica okienka wydobycie zwarty rysik jwlibrary szablony powiazane nowa-notatka warstwy)
declare -a WYNIKI

for z in "${ZESTAWY[@]}"; do
  [ -f "testy/$z.js" ] || continue
  printf "── %-16s " "$z"
  WYNIK=$(node "testy/$z.js" "$CEL" "$PORT" 2>&1)
  if [ $? -eq 0 ]; then
    echo "$(echo "$WYNIK" | grep -o '════ [0-9]* OK[^═]*' | tail -1)"
    WYNIKI+=("✅ $z")
  else
    echo "BŁĄD"
    echo "$WYNIK" | grep -E "❌|════" | sed 's/^/     /'
    WYNIKI+=("❌ $z")
    BLEDY=$((BLEDY+1))
  fi
done

echo
echo "════════════════════════════════════════════"
for w in "${WYNIKI[@]}"; do echo " $w"; done
echo "════════════════════════════════════════════"
if [ "$BLEDY" -eq 0 ]; then
  echo " Wszystko przeszło — wersja gotowa do wydania."
  exit 0
else
  echo " $BLEDY rzeczy nie przeszło — wydanie wstrzymane."
  exit 1
fi
