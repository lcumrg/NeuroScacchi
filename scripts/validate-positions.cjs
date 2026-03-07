#!/usr/bin/env node
// Validazione automatica delle posizioni v2.
// Verifica che ogni posizione abbia:
// 1. FEN valido
// 2. Tutte le solutionMoves siano mosse legali nella posizione
// 3. Campi obbligatori presenti e corretti
//
// Viene eseguito automaticamente prima di ogni build (pre-build script).
// Se trova errori, il build si blocca.

const { Chess } = require('chess.js')
const path = require('path')
const fs = require('fs')

const POSITIONS_PATH = path.join(__dirname, '..', 'src', 'v2', 'data', 'positions.json')

const VALID_THEMES = [
  'fork', 'pin', 'skewer', 'discovery', 'mate',
  'deflection', 'decoy', 'trapped_piece', 'promotion',
  'endgame', 'opening', 'defense', 'sacrifice', 'tactics',
]

function validate() {
  if (!fs.existsSync(POSITIONS_PATH)) {
    console.log('Nessun file posizioni trovato, skip validazione.')
    process.exit(0)
  }

  const positions = JSON.parse(fs.readFileSync(POSITIONS_PATH, 'utf-8'))
  const errors = []
  const ids = new Set()

  positions.forEach((p, index) => {
    const prefix = `Posizione #${index + 1} (${p.id || 'SENZA ID'})`

    // ID univoco
    if (!p.id || typeof p.id !== 'string') {
      errors.push(`${prefix}: id mancante`)
    } else if (ids.has(p.id)) {
      errors.push(`${prefix}: id duplicato "${p.id}"`)
    } else {
      ids.add(p.id)
    }

    // FEN valido
    let game = null
    if (!p.fen || typeof p.fen !== 'string') {
      errors.push(`${prefix}: fen mancante`)
    } else {
      try {
        game = new Chess(p.fen)
      } catch (e) {
        errors.push(`${prefix}: FEN non valido — ${e.message}`)
      }
    }

    // solutionMoves: array non vuoto di mosse legali
    if (!Array.isArray(p.solutionMoves) || p.solutionMoves.length === 0) {
      errors.push(`${prefix}: solutionMoves mancante o vuoto`)
    } else if (game) {
      const legals = game.moves({ verbose: true }).map(m => m.from + m.to)
      const legalsWithPromo = game.moves({ verbose: true }).map(m => m.from + m.to + (m.promotion || ''))

      p.solutionMoves.forEach(sol => {
        const base = sol.slice(0, 4)
        const isLegal = legals.includes(base) || legalsWithPromo.includes(sol)
        if (!isLegal) {
          errors.push(`${prefix}: mossa "${sol}" non legale. Mosse possibili: ${legals.join(', ')}`)
        }
      })
    }

    // Tema valido
    if (!p.theme || !VALID_THEMES.includes(p.theme)) {
      errors.push(`${prefix}: tema non valido "${p.theme}"`)
    }

    // Difficolta 1-10
    if (typeof p.difficulty !== 'number' || p.difficulty < 1 || p.difficulty > 10) {
      errors.push(`${prefix}: difficulty deve essere 1-10, trovato ${p.difficulty}`)
    }

    // Hints: se presente deve essere array di stringhe
    if (p.hints !== undefined) {
      if (!Array.isArray(p.hints)) {
        errors.push(`${prefix}: hints deve essere un array`)
      } else {
        p.hints.forEach((h, i) => {
          if (typeof h !== 'string' || h.trim() === '') {
            errors.push(`${prefix}: hint[${i}] vuoto o non stringa`)
          }
        })
      }
    }
  })

  // Report
  if (errors.length > 0) {
    console.error('\n❌ VALIDAZIONE POSIZIONI FALLITA\n')
    errors.forEach(e => console.error('  • ' + e))
    console.error(`\n${errors.length} errore/i trovato/i. Correggi prima di fare il build.\n`)
    process.exit(1)
  } else {
    console.log(`✅ Tutte le ${positions.length} posizioni validate correttamente.`)
  }
}

validate()
