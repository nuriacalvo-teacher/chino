#!/bin/bash
#  Grabar los audios de la portada (tonos y palabras del día) · para Mac.
#  Doble clic desde el Finder. Si el servicio rechaza a GitHub Actions, usa esto.
set -u
cd "$(dirname "$0")/.." || exit 1
pausa() { echo; read -n 1 -s -r -p "Pulsa cualquier tecla para cerrar esta ventana."; echo; }
[ -d .venv-audio ] || python3 -m venv .venv-audio || { pausa; exit 1; }
.venv-audio/bin/python -m pip install --quiet --upgrade pip edge-tts || { echo "Sin conexión."; pausa; exit 1; }
.venv-audio/bin/python tools/grabar_audios.py "$@" || { pausa; exit 1; }
if [ -d .git ]; then git add audio && git commit -q -m "Audios de la portada" && git push -q && echo "LISTO: subidos a GitHub."; fi
pausa
