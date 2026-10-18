#!/bin/zsh
BASE="https://www.mequinenza.com/fotos/coleccion"

categories=(
  "ajuntament:14:ajuntament"
  "campfutbol:5:campfutbol"
  "castell:8:castell"
  "competicions:22:competicions"
  "elements:30:elements"
  "enderroc:12:enderroc"
  "esglesia:39:esglesia"
  "festes:49:festes"
  "generals:67:generals"
  "llauts:11:llauts"
  "lopoble:99:poble"
  "mequinensans:62:mequinensans"
  "mina:12:mina"
  "moments:6:moments"
)

for entry in $categories; do
  cat=$(echo $entry | cut -d: -f1)
  count=$(echo $entry | cut -d: -f2)
  prefix=$(echo $entry | cut -d: -f3)
  mkdir -p "$cat"
  for i in {1..$count}; do
    f="${prefix}${i}.jpg"
    curl -sL -o "${cat}/${f}" "${BASE}/${cat}/${f}" &
  done
done
wait
echo "DESCARGA COMPLETA"
