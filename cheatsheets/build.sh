#!/bin/bash
# Prints each sheet to an A4 PDF with headless Chrome and fails if any page overflows or the PDF's page count differs from its number of .sheet pages.
set -euo pipefail
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PROFILE=$(mktemp -d)
trap 'rm -rf "$PROFILE"' EXIT
for f in "${@:-ep1 ep11 ep2 ep3 ep4 ep5 ep6 ep7 all}"; do for n in $f; do
  "$CHROME" --headless=new --disable-gpu --no-first-run --user-data-dir="$PROFILE" \
    --no-pdf-header-footer --print-to-pdf="$PWD/$n.pdf" "file://$PWD/$n.html" 2>/dev/null
  slack=$("$CHROME" --headless=new --disable-gpu --no-first-run --user-data-dir="$PROFILE" --window-size=1000,1400 --dump-dom "file://$PWD/$n.html" 2>/dev/null | sed -n 's/.*data-slack="\(-\{0,1\}[0-9]*\)".*/\1/p' | head -1)
  [ -n "$slack" ] && [ "$slack" -ge 0 ] || { echo "FAIL: $n.html overflows the A4 page (slack=${slack:-?}px)"; exit 1; }
  pages=$(python3 -c "import re,sys;d=open(sys.argv[1],'rb').read();print(len(re.findall(rb'/Type\s*/Page[^s]',d)))" "$n.pdf")
  want=$(grep -o 'class="sheet"' "$n.html" | wc -l | tr -d ' ')
  echo "$n.pdf: $pages page(s), ${slack}px spare"
  [ "$pages" = "$want" ] || { echo "FAIL: $n.pdf must be $want page(s)"; exit 1; }
done; done
