#!/usr/bin/env bash
# =============================================================================
#  WYDANIE NOWEJ WERSJI — jedno polecenie zamiast dziewięciu kroków z pamięci.
#
#     ./narzedzia/wydaj.sh --podnies      # 1.73 → 1.74
#     ./narzedzia/wydaj.sh 2.0            # numer wprost
#     ./narzedzia/wydaj.sh --sprawdz      # tylko kontrola, bez wydawania
#
#  Kolejność jest celowa: najpierw sprawdzamy to, co mamy, potem podnosimy
#  numer, budujemy i sprawdzamy jeszcze raz wynik budowania. Wydanie
#  zatrzymuje się przy pierwszym niepowodzeniu — nigdy nie powstaje paczka
#  z wersją, która nie przeszła testów.
# =============================================================================
set -uo pipefail
KAT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CEL_PUB="${JW_CEL:-${KAT}/../JW_Study_publikacja}"
cd "$KAT"

krok(){ echo; echo "───────────────────────────────────────────"; echo " $1"; echo "───────────────────────────────────────────"; }
stop(){ echo; echo "❌ $1"; echo "   Wydanie przerwane — nic nie zostało spakowane."; exit 1; }

TRYB="${1:---sprawdz}"

krok "1/6  Kontrola bieżącego stanu"
./testy/uruchom.sh || stop "testy wersji roboczej nie przeszły"

if [ "$TRYB" = "--sprawdz" ]; then
  echo; echo "✅ Stan bieżący w porządku. Aby wydać: ./narzedzia/wydaj.sh --podnies"; exit 0
fi

krok "2/6  Numer wersji"
node narzedzia/wersja.js "$TRYB" || stop "nie udało się ustawić numeru wersji"
WERSJA="$(cat WERSJA)"
node narzedzia/wersja.js --sprawdz || stop "numer wersji się rozjeżdża"

krok "3/6  Wpis w dzienniku zmian"
if ! grep -q "^## v${WERSJA}" CHANGELOG.md 2>/dev/null; then
  echo "⚠ Brak wpisu '## v${WERSJA}' w CHANGELOG.md."
  echo "  Opisz zmianę wraz z PRZYCZYNĄ, nie tylko listą poprawek, i uruchom ponownie."
  stop "dziennik zmian nieuzupełniony"
fi
echo "✅ wpis obecny"

krok "4/6  Budowanie wersji do publikacji"
node narzedzia/buduj.js "$CEL_PUB" || stop "budowanie się nie powiodło"

krok "5/6  Kontrola wersji zbudowanej"
( cd "$CEL_PUB" && ./testy/uruchom.sh ./index.html 8138 ) || stop "testy wersji jednoplikowej nie przeszły"

krok "6/6  Paczki"
ROB="$(basename "$KAT")"
( cd "$KAT/.." && rm -f "JW_Study_v${WERSJA}.zip" "JW_Study_publikacja_v${WERSJA}.zip" \
  && zip -qr "JW_Study_v${WERSJA}.zip" "$ROB" -x "*/node_modules/*" \
  && zip -qr "JW_Study_publikacja_v${WERSJA}.zip" "$(basename "$CEL_PUB")" ) || stop "pakowanie się nie powiodło"

echo
echo "═══════════════════════════════════════════"
echo " Wydano wersję ${WERSJA}"
echo "═══════════════════════════════════════════"
echo " Na GitHub wgraj zawartość katalogu:"
echo "   ${CEL_PUB}"
echo " index.html ma tam $(du -k "$CEL_PUB/index.html" | cut -f1) kB — jeśli widzisz mniejszy, to zły plik."
echo
echo " Pamiętaj: index.html ZAWSZE razem z sw.js."
