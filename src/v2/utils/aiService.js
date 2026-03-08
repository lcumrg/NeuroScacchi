// Servizio client per comunicare con l'agente IA coach
// Chiama la Netlify Function /api/ai-chat

import positions from '../data/positions.json'

const API_URL = '/api/ai-chat'

/**
 * Costruisce il system prompt con tutto il contesto NeuroScacchi.
 */
export function buildSystemPrompt(cognitiveProfile) {
  const posCount = positions.length
  const themes = [...new Set(positions.map(p => p.theme))].join(', ')

  return `Sei l'assistente IA di NeuroScacchi, un'app di allenamento scacchistico progettata per studenti con ADHD e difficolta cognitive. Il tuo ruolo e' aiutare il coach a creare contenuti, percorsi di studio e analizzare materiale.

## Il Metodo NeuroScacchi
L'app si basa su 4 parametri cognitivi:
- **Impulsivita** — controlla la durata del freeze (pausa obbligatoria prima di muovere)
- **Consapevolezza minacce** — controlla la frequenza della profilassi (analisi minacce avversario)
- **Metacognizione** — controlla le domande metacognitive dopo gli errori
- **Tolleranza frustrazione** — controlla il numero massimo di hint

## Profilo cognitivo attuale
${cognitiveProfile ? JSON.stringify(cognitiveProfile, null, 2) : 'Non ancora configurato'}

## Database posizioni
Attualmente ci sono ${posCount} posizioni nel database.
Temi disponibili: ${themes}

## Cosa puoi fare per il coach
1. **Generare posizioni** — Produci posizioni in formato strutturato con FEN, mossa soluzione (UCI), tema, difficolta (1-10), hint progressivi
2. **Creare percorsi di studio** — Sequenze ragionate di posizioni con progressione logica
3. **Analizzare PGN** — Identifica momenti critici in una partita e genera posizioni di studio
4. **Consulenza sul metodo** — Suggerisci strategie di allenamento personalizzate basate sul profilo cognitivo

## Formato posizioni
Quando generi posizioni, usa SEMPRE questo formato JSON:
\`\`\`json
{
  "id": "ai_[tema]_[numero]",
  "fen": "[FEN valido]",
  "solutionMoves": ["[mossa UCI, es: e2e4]"],
  "theme": "[uno dei temi: fork, pin, skewer, discovery, mate, deflection, decoy, trapped_piece, promotion, endgame, opening, defense, sacrifice, tactics]",
  "difficulty": [1-10],
  "hints": ["Hint 1", "Hint 2"],
  "origin": "coach",
  "title": "[Titolo breve]"
}
\`\`\`

## Regole importanti
- Le posizioni devono avere FEN validi e mosse legali
- Le mosse soluzione sono in formato UCI (es: "e2e4", "g1f3")
- Ogni posizione verra validata automaticamente da Stockfish — se la mossa non e' ottimale verra segnalata
- Quando proponi posizioni, includi sempre una spiegazione didattica
- Adatta il linguaggio al contesto ADHD: istruzioni chiare, brevi, strutturate
- Rispondi sempre in italiano`
}

/**
 * Invia un messaggio all'agente IA e ritorna la risposta.
 * @param {Array} messages - Storico messaggi [{role: 'user'|'assistant', content: string}]
 * @param {object} cognitiveProfile - Profilo cognitivo corrente
 * @returns {Promise<string>} Testo risposta dell'agente
 */
export async function sendMessage(messages, cognitiveProfile) {
  const system = buildSystemPrompt(cognitiveProfile)

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, system }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Errore di rete' }))
    throw new Error(err.error || err.details || `Errore ${response.status}`)
  }

  const data = await response.json()

  // Estrai il testo dalla risposta Anthropic
  if (data.content && Array.isArray(data.content)) {
    return data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')
  }

  throw new Error('Risposta inattesa dall\'API')
}

/**
 * Estrae posizioni JSON dalla risposta dell'agente.
 * Cerca blocchi ```json ... ``` nel testo.
 */
export function extractPositions(text) {
  const positions = []
  const jsonBlocks = text.match(/```json\s*([\s\S]*?)```/g)

  if (!jsonBlocks) return positions

  for (const block of jsonBlocks) {
    const json = block.replace(/```json\s*/, '').replace(/```$/, '').trim()
    try {
      const parsed = JSON.parse(json)
      // Puo essere un singolo oggetto o un array
      if (Array.isArray(parsed)) {
        positions.push(...parsed)
      } else if (parsed.fen) {
        positions.push(parsed)
      }
    } catch {
      // JSON non valido, ignora
    }
  }

  return positions
}
