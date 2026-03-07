#!/usr/bin/env node
// Import puzzle da Lichess database
//
// Il database completo e' qui: https://database.lichess.org/lichess_db_puzzle.csv.zst
// Questo script lavora su un CSV gia scaricato e decompresso.
//
// Uso:
//   node scripts/import-lichess-puzzles.cjs <file.csv> [--theme fork] [--min-rating 1000] [--max-rating 1800] [--count 50]
//
// Formato CSV Lichess:
//   PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
//
// Le mosse sono in formato UCI separate da spazio.
// La prima mossa e' la mossa dell'avversario (setup), la seconda e' la soluzione.

const fs = require('fs')
const path = require('path')

const THEME_MAP = {
  'mateIn1': 'mate', 'mateIn2': 'mate', 'mateIn3': 'mate', 'mateIn4': 'mate',
  'fork': 'fork', 'pin': 'pin', 'skewer': 'skewer',
  'discoveredAttack': 'discovery', 'deflection': 'deflection', 'decoy': 'decoy',
  'trappedPiece': 'trapped_piece', 'promotion': 'promotion',
  'endgame': 'endgame', 'opening': 'opening',
  'sacrifice': 'sacrifice', 'defensiveMove': 'defense',
}

function ratingToDifficulty(rating) {
  if (rating < 800) return 1
  if (rating < 1000) return 2
  if (rating < 1200) return 3
  if (rating < 1400) return 4
  if (rating < 1600) return 5
  if (rating < 1800) return 6
  if (rating < 2000) return 7
  if (rating < 2200) return 8
  if (rating < 2500) return 9
  return 10
}

function mapTheme(lichessThemes) {
  const parts = lichessThemes.split(' ')
  for (const t of parts) {
    if (THEME_MAP[t]) return THEME_MAP[t]
  }
  return 'tactics'
}

function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.log('Uso: node scripts/import-lichess-puzzles.cjs <file.csv> [opzioni]')
    console.log('  --theme <nome>       Filtra per tema Lichess (fork, pin, mateIn1, ecc.)')
    console.log('  --min-rating <n>     Rating minimo (default: 600)')
    console.log('  --max-rating <n>     Rating massimo (default: 2000)')
    console.log('  --count <n>          Numero posizioni da importare (default: 50)')
    console.log('  --output <file>      File di output (default: stdout)')
    process.exit(0)
  }

  const csvFile = args[0]
  let theme = null
  let minRating = 600
  let maxRating = 2000
  let count = 50
  let output = null

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--theme') theme = args[++i]
    else if (args[i] === '--min-rating') minRating = parseInt(args[++i])
    else if (args[i] === '--max-rating') maxRating = parseInt(args[++i])
    else if (args[i] === '--count') count = parseInt(args[++i])
    else if (args[i] === '--output') output = args[++i]
  }

  if (!fs.existsSync(csvFile)) {
    console.error('File non trovato: ' + csvFile)
    process.exit(1)
  }

  const lines = fs.readFileSync(csvFile, 'utf-8').split('\n')
  const positions = []

  for (let i = 1; i < lines.length && positions.length < count; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const parts = line.split(',')
    if (parts.length < 9) continue

    const [puzzleId, fen, moves, rating] = parts
    const themes = parts[7]
    const ratingNum = parseInt(rating)

    if (ratingNum < minRating || ratingNum > maxRating) continue
    if (theme && !themes.includes(theme)) continue

    // La prima mossa e' il setup, la seconda e' la soluzione
    const moveParts = moves.split(' ')
    if (moveParts.length < 2) continue

    const solutionMove = moveParts[1] // La mossa che lo studente deve trovare

    const mappedTheme = theme ? (THEME_MAP[theme] || 'tactics') : mapTheme(themes)

    positions.push({
      id: 'lichess-' + puzzleId,
      fen: applySetupMove(fen, moveParts[0]),
      solutionMoves: [solutionMove],
      theme: mappedTheme,
      difficulty: ratingToDifficulty(ratingNum),
      hints: [],
      origin: 'lichess',
      title: 'Lichess #' + puzzleId,
    })
  }

  const json = JSON.stringify(positions, null, 2)

  if (output) {
    fs.writeFileSync(output, json)
    console.log(`${positions.length} posizioni importate in ${output}`)
  } else {
    console.log(json)
  }
}

// Applica la mossa di setup alla FEN per ottenere la posizione di partenza del puzzle
function applySetupMove(fen, moveUci) {
  try {
    const { Chess } = require('chess.js')
    const g = new Chess(fen)
    const from = moveUci.slice(0, 2)
    const to = moveUci.slice(2, 4)
    const promotion = moveUci.length > 4 ? moveUci[4] : undefined
    g.move({ from, to, promotion })
    return g.fen()
  } catch {
    return fen
  }
}

main()
