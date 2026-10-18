#!/bin/bash
BASE="https://www.mequinenza.com/fotos/coleccion"

# Categorías y número aproximado de fotos
declare -A CATEGORIES=(
  ["ajuntament"]=14
  ["campfutbol"]=5
  ["castell"]=8
  ["competicions"]=22
  ["elements"]=30
  ["enderroc"]=12
  ["esglesia"]=39
  ["festes"]=49
  ["generals"]=67
  ["llauts"]=11
  ["lopoble"]=99
  ["mequinensans"]=62
  ["mina"]=12
  ["moments"]=6
)

for cat in "${!CATEGORIES[@]}"; do
  count=${CATEGORIES[$cat]}
  mkdir -p "$cat"
  for i in $(seq 1 $count); do
    # Determinar el patrón de nombre
    case $cat in
      ajuntament) f="ajuntament${i}.jpg" ;;
      campfutbol) f="campfutbol${i}.jpg" ;;
      castell) f="castell${i}.jpg" ;;
      competicions) f="competicions${i}.jpg" ;;
      elements) f="elements${i}.jpg" ;;
      enderroc) f="enderroc${i}.jpg" ;;
      esglesia) f="esglesia${i}.jpg" ;;
      festes) f="festes${i}.jpg" ;;
      generals) f="generals${i}.jpg" ;;
      llauts) f="llauts${i}.jpg" ;;
      lopoble) f="poble${i}.jpg" ;;
      mequinensans) f="mequinensans${i}.jpg" ;;
      mina) f="mina${i}.jpg" ;;
      moments) f="moments${i}.jpg" ;;
    esac
    curl -sL -o "${cat}/${f}" "${BASE}/${cat}/${f}" &
  done
done
wait
echo "DESCARGA COMPLETA"
