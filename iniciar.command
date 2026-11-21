#!/bin/zsh
# Abre Nodo en macOS. Usa Node instalado o el runtime de Codex si el primero no funciona.
cd -- "${0:A:h}"
if ! node --version >/dev/null 2>&1; then
  NODO_RUNTIME="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"
  if [[ -x "$NODO_RUNTIME/node" ]]; then
    export PATH="$NODO_RUNTIME:$PATH"
  else
    print 'Instala Node.js 22.12 o superior desde https://nodejs.org y vuelve a abrir este archivo.'
    read -k 1
    exit 1
  fi
fi
if [[ ! -d node_modules ]]; then
  npm install || exit 1
fi
print 'Nodo está disponible en la dirección que aparece abajo. Mantén esta ventana abierta.'
npm run dev -- --port 5173 --open
