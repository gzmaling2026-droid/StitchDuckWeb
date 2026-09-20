#!/bin/sh
# Renders the link preview cards in /assets/og/ from _src/og/og.html.
# Needs Google Chrome, ImageMagick, and network access for the web fonts.
set -e
cd "$(dirname "$0")/../.."

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PORT=4179

python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null' EXIT
sleep 1

mkdir -p assets/og
for pair in en:en zh:zh-hans zht:zh-hant; do
  out="assets/og/og-${pair#*:}"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1200,630 --virtual-time-budget=8000 \
    --screenshot="$out.png" \
    "http://127.0.0.1:$PORT/_src/og/og.html?lang=${pair%%:*}" >/dev/null 2>&1
  # JPEG keeps the cards near 100 KB; some link unfurlers skip large images.
  magick "$out.png" -sampling-factor 4:4:4 -quality 88 "$out.jpg"
  rm "$out.png"
  echo "rendered $out.jpg"
done
