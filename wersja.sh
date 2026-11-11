#!/bin/sh
# Ustawia nową wersję plików (omija pamięć podręczną przeglądarek). Uruchom przed commitem: sh wersja.sh
V=$(date +%Y%m%d-%H%M)
sed -i -E "s/\.(js|css)\?v=[A-Za-z0-9-]+/.\1?v=$V/g" app.html index.html
sed -i -E "s/const WERSJA='[^']*'/const WERSJA='$V'/" index.html
echo "Wersja: $V"
