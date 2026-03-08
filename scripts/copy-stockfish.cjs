/**
 * Copia i file Stockfish WASM da node_modules a public/stockfish/
 * Eseguito automaticamente da npm postinstall.
 */
const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '..', 'node_modules', 'stockfish', 'bin')
const dest = path.join(__dirname, '..', 'public', 'stockfish')

const files = [
  'stockfish-18-lite-single.js',
  'stockfish-18-lite-single.wasm',
]

if (!fs.existsSync(src)) {
  console.log('⚠️  stockfish non trovato in node_modules, skip copia.')
  process.exit(0)
}

fs.mkdirSync(dest, { recursive: true })

for (const file of files) {
  const from = path.join(src, file)
  const to = path.join(dest, file)
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, to)
    console.log(`✅ Copiato ${file} → public/stockfish/`)
  } else {
    console.warn(`⚠️  ${file} non trovato in node_modules/stockfish/bin/`)
  }
}
