# Design e UX per bambini — Analisi e linee guida

*NeuroScacchi 3.0 — Documento riservato*

---

## Contesto

I test con i bambini (8–12 anni) confermano che l'aspetto grafico è un fattore decisivo di engagement, motivazione e percezione della qualità. Un buon contenuto presentato male appare come un cattivo contenuto. L'interfaccia attuale ha una base tecnica solida ma un aspetto corporate e freddo — progettato inconsciamente per adulti.

---

## Stato attuale — fotografia

**Stack CSS:** CSS custom properties puro, zero Tailwind. Font Nunito + Atkinson Hyperlegible. Tema chiaro e scuro già supportati. Responsive mobile-first. Animazioni via keyframe CSS.

### Palette attuale

<div style="display:flex;flex-wrap:wrap;gap:12px;margin:16px 0">
  <div style="text-align:center">
    <div style="width:80px;height:80px;background:#283593;border-radius:8px;border:1px solid #ccc"></div>
    <div style="font-size:0.75rem;margin-top:6px;font-weight:600">Primario<br/>#283593</div>
    <div style="font-size:0.7rem;color:#888">Blu indigo</div>
  </div>
  <div style="text-align:center">
    <div style="width:80px;height:80px;background:#F8F9FA;border-radius:8px;border:1px solid #ccc"></div>
    <div style="font-size:0.75rem;margin-top:6px;font-weight:600">Sfondo<br/>#F8F9FA</div>
    <div style="font-size:0.7rem;color:#888">Grigio freddo</div>
  </div>
  <div style="text-align:center">
    <div style="width:80px;height:80px;background:#E8E8E8;border-radius:8px;border:1px solid #ccc"></div>
    <div style="font-size:0.75rem;margin-top:6px;font-weight:600">Casa chiara<br/>#E8E8E8</div>
    <div style="font-size:0.7rem;color:#888">Grigio anonimo</div>
  </div>
  <div style="text-align:center">
    <div style="width:80px;height:80px;background:#B8B8B8;border-radius:8px;border:1px solid #ccc"></div>
    <div style="font-size:0.75rem;margin-top:6px;font-weight:600">Casa scura<br/>#B8B8B8</div>
    <div style="font-size:0.7rem;color:#888">Grigio anonimo</div>
  </div>
  <div style="text-align:center">
    <div style="width:80px;height:80px;background:rgba(40,53,147,0.82);border-radius:8px;border:1px solid #ccc"></div>
    <div style="font-size:0.75rem;margin-top:6px;font-weight:600">Freeze<br/>rgba(40,53,147,.82)</div>
    <div style="font-size:0.7rem;color:#888">Opprimente</div>
  </div>
</div>

**Problemi principali:**
- Blu indigo: freddo, corporate, tipico dei software gestionali
- Scacchiera grigia: non richiama gli scacchi fisici
- Palette monocromatica: tutte le attività hanno lo stesso aspetto
- Nessuna gamification visiva, nessuna risposta emotiva al successo

---

## Il problema della visualizzazione mentale della scacchiera

Quando un testo dice *"il Cavallo su c3 controlla d5"*, il bambino deve compiere quattro operazioni cognitive:

1. Decodificare "c3" come coordinata
2. Localizzare c3 sulla scacchiera *(mapping visivo)*
3. Trovare il Cavallo lì
4. Capire l'influenza su d5

Solo il punto 4 è l'obiettivo didattico. I punti 1–3 sono **carico cognitivo parassitico** — consumano risorse mentali senza produrre comprensione scacchistica. Questo è l'**effetto di attenzione divisa** (Sweller, 1988): quando informazione verbale e visiva sono in posizioni diverse, il cervello deve integrarle manualmente.

**La soluzione è il principio di contiguità:** la parola "c3" nel testo deve essere accompagnata da un cerchio sulla casa c3. Il bambino vede già il mapping — il carico cognitivo si concentra sul *perché*, non sul *dove*.

### Colori frecce Chessground — uso consigliato

<div style="display:flex;flex-wrap:wrap;gap:10px;margin:16px 0">
  <div style="display:flex;align-items:center;gap:8px;background:#f5f5f5;padding:8px 12px;border-radius:8px">
    <div style="width:28px;height:28px;background:#15781B;border-radius:50%"></div>
    <div><div style="font-size:0.8rem;font-weight:700">green</div><div style="font-size:0.72rem;color:#666">Mossa corretta / best move SF</div></div>
  </div>
  <div style="display:flex;align-items:center;gap:8px;background:#f5f5f5;padding:8px 12px;border-radius:8px">
    <div style="width:28px;height:28px;background:#882020;border-radius:50%"></div>
    <div><div style="font-size:0.8rem;font-weight:700">red</div><div style="font-size:0.72rem;color:#666">Mossa da evitare / errore</div></div>
  </div>
  <div style="display:flex;align-items:center;gap:8px;background:#f5f5f5;padding:8px 12px;border-radius:8px">
    <div style="width:28px;height:28px;background:#003088;border-radius:50%"></div>
    <div><div style="font-size:0.8rem;font-weight:700">blue</div><div style="font-size:0.72rem;color:#666">Casa/pezzo da osservare (neutro)</div></div>
  </div>
  <div style="display:flex;align-items:center;gap:8px;background:#f5f5f5;padding:8px 12px;border-radius:8px">
    <div style="width:28px;height:28px;background:#e6a817;border-radius:50%"></div>
    <div><div style="font-size:0.8rem;font-weight:700">yellow</div><div style="font-size:0.72rem;color:#666">Target detective, casa chiave</div></div>
  </div>
  <div style="display:flex;align-items:center;gap:8px;background:#f5f5f5;padding:8px 12px;border-radius:8px">
    <div style="width:28px;height:28px;background:#7dc0f0;border-radius:50%"></div>
    <div><div style="font-size:0.8rem;font-weight:700">paleBlue</div><div style="font-size:0.72rem;color:#666">Variante secondaria, alternativa</div></div>
  </div>
  <div style="display:flex;align-items:center;gap:8px;background:#f5f5f5;padding:8px 12px;border-radius:8px">
    <div style="width:28px;height:28px;background:#aaa;border-radius:50%"></div>
    <div><div style="font-size:0.8rem;font-weight:700">paleGrey</div><div style="font-size:0.72rem;color:#666">Contesto, mossa avversario</div></div>
  </div>
</div>

### Uso per tipo di attività

| Attività | Prima della risposta | Dopo la risposta |
|---|---|---|
| **Intent** | Cerchi blue su case delle opzioni | Freccia green sull'opzione corretta |
| **Detective** | Nessuna (spoilererebbe) | Cerchio yellow sulla casa corretta |
| **Candidate** | Frecce paleBlue per le candidate | Freccia green per best move |
| **Move** | Freccia green suggerisce direzione | Sparisce dopo esecuzione |
| **Demo** | Frecce che seguono la sequenza | — |
| **Text** | Cerchi blue su tutte le case citate | — |

### Livelli di implementazione

**Livello 1 — visualAids espliciti nel JSON** (già implementato, da usare sistematicamente nei prompt IA)

```json
"visualAids": [
  { "type": "circle", "square": "c3", "brush": "blue" },
  { "type": "arrow", "orig": "c3", "dest": "d5", "brush": "green" }
]
```

**Livello 2 — parsing automatico del testo** (da aggiungere): il player rileva pattern `[a-h][1-8]` nel testo e li evidenzia automaticamente sulla scacchiera. Nessuna configurazione manuale.

**Livello 3 — highlight sincrono con lettura** (futuro): le case evidenziate cambiano mentre il testo scorre.

---

## Scacchiera — prima e dopo

Il cambio più semplice e più impattante. Due righe di CSS.

<div style="display:flex;gap:24px;flex-wrap:wrap;margin:16px 0;align-items:flex-start">
  <div>
    <div style="font-size:0.8rem;font-weight:700;margin-bottom:8px;color:#666">ATTUALE — grigio anonimo</div>
    <div style="display:grid;grid-template-columns:repeat(4,40px);border:2px solid #ccc;width:fit-content">
      <div style="width:40px;height:40px;background:#E8E8E8"></div>
      <div style="width:40px;height:40px;background:#B8B8B8"></div>
      <div style="width:40px;height:40px;background:#E8E8E8"></div>
      <div style="width:40px;height:40px;background:#B8B8B8"></div>
      <div style="width:40px;height:40px;background:#B8B8B8"></div>
      <div style="width:40px;height:40px;background:#E8E8E8"></div>
      <div style="width:40px;height:40px;background:#B8B8B8"></div>
      <div style="width:40px;height:40px;background:#E8E8E8"></div>
      <div style="width:40px;height:40px;background:#E8E8E8"></div>
      <div style="width:40px;height:40px;background:#B8B8B8"></div>
      <div style="width:40px;height:40px;background:#E8E8E8"></div>
      <div style="width:40px;height:40px;background:#B8B8B8"></div>
      <div style="width:40px;height:40px;background:#B8B8B8"></div>
      <div style="width:40px;height:40px;background:#E8E8E8"></div>
      <div style="width:40px;height:40px;background:#B8B8B8"></div>
      <div style="width:40px;height:40px;background:#E8E8E8"></div>
    </div>
    <div style="font-size:0.72rem;color:#999;margin-top:4px">#E8E8E8 / #B8B8B8</div>
  </div>
  <div>
    <div style="font-size:0.8rem;font-weight:700;margin-bottom:8px;color:#2E7D32">PROPOSTO — marrone tradizionale (Lichess)</div>
    <div style="display:grid;grid-template-columns:repeat(4,40px);border:2px solid #b58863;width:fit-content">
      <div style="width:40px;height:40px;background:#f0d9b5"></div>
      <div style="width:40px;height:40px;background:#b58863"></div>
      <div style="width:40px;height:40px;background:#f0d9b5"></div>
      <div style="width:40px;height:40px;background:#b58863"></div>
      <div style="width:40px;height:40px;background:#b58863"></div>
      <div style="width:40px;height:40px;background:#f0d9b5"></div>
      <div style="width:40px;height:40px;background:#b58863"></div>
      <div style="width:40px;height:40px;background:#f0d9b5"></div>
      <div style="width:40px;height:40px;background:#f0d9b5"></div>
      <div style="width:40px;height:40px;background:#b58863"></div>
      <div style="width:40px;height:40px;background:#f0d9b5"></div>
      <div style="width:40px;height:40px;background:#b58863"></div>
      <div style="width:40px;height:40px;background:#b58863"></div>
      <div style="width:40px;height:40px;background:#f0d9b5"></div>
      <div style="width:40px;height:40px;background:#b58863"></div>
      <div style="width:40px;height:40px;background:#f0d9b5"></div>
    </div>
    <div style="font-size:0.72rem;color:#999;margin-top:4px">#f0d9b5 / #b58863</div>
  </div>
  <div>
    <div style="font-size:0.8rem;font-weight:700;margin-bottom:8px;color:#1565C0">ALTERNATIVA — blu/crema (Chess.com)</div>
    <div style="display:grid;grid-template-columns:repeat(4,40px);border:2px solid #7fa650;width:fit-content">
      <div style="width:40px;height:40px;background:#eeeed2"></div>
      <div style="width:40px;height:40px;background:#769656"></div>
      <div style="width:40px;height:40px;background:#eeeed2"></div>
      <div style="width:40px;height:40px;background:#769656"></div>
      <div style="width:40px;height:40px;background:#769656"></div>
      <div style="width:40px;height:40px;background:#eeeed2"></div>
      <div style="width:40px;height:40px;background:#769656"></div>
      <div style="width:40px;height:40px;background:#eeeed2"></div>
      <div style="width:40px;height:40px;background:#eeeed2"></div>
      <div style="width:40px;height:40px;background:#769656"></div>
      <div style="width:40px;height:40px;background:#eeeed2"></div>
      <div style="width:40px;height:40px;background:#769656"></div>
      <div style="width:40px;height:40px;background:#769656"></div>
      <div style="width:40px;height:40px;background:#eeeed2"></div>
      <div style="width:40px;height:40px;background:#769656"></div>
      <div style="width:40px;height:40px;background:#eeeed2"></div>
    </div>
    <div style="font-size:0.72rem;color:#999;margin-top:4px">#eeeed2 / #769656</div>
  </div>
</div>

Il marrone tradizionale (Lichess) è la raccomandazione: i bambini lo riconoscono dagli scacchi fisici, da Lichess, dalle app di scacchi. Crea familiarità immediata.

---

## Il FreezeOverlay — varianti

Il freeze è il momento più importante del metodo. Visivamente deve dire *"fermati, è il momento di pensare"* — non *"sei bloccato"*.

### Attuale vs varianti proposte

<div style="display:flex;gap:16px;flex-wrap:wrap;margin:16px 0;align-items:flex-start">

  <div style="text-align:center">
    <div style="font-size:0.78rem;font-weight:700;margin-bottom:8px;color:#666">ATTUALE — oppressivo</div>
    <div style="width:140px;height:140px;background:#b58863;border-radius:8px;position:relative;overflow:hidden;border:1px solid #ccc">
      <div style="position:absolute;inset:0;background:rgba(40,53,147,0.82);display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:8px">
        <span style="font-size:2.5rem;font-weight:800;color:#fff;line-height:1">3</span>
        <span style="font-size:0.65rem;color:rgba(255,255,255,0.9);margin-top:4px">Pensa prima di muovere</span>
      </div>
    </div>
  </div>

  <div style="text-align:center">
    <div style="font-size:0.78rem;font-weight:700;margin-bottom:8px;color:#1565C0">A — Vignette soft</div>
    <div style="width:140px;height:140px;background:#b58863;border-radius:8px;position:relative;overflow:hidden;border:1px solid #ccc">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(20,20,60,0.78) 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:8px">
        <span style="font-size:2rem;font-weight:800;color:#fff;line-height:1;text-shadow:0 2px 8px rgba(0,0,0,0.5)">3</span>
        <span style="font-size:0.6rem;color:rgba(255,255,255,0.95);margin-top:5px;font-weight:600">Cosa sta pensando?</span>
      </div>
    </div>
    <div style="font-size:0.7rem;color:#888;margin-top:4px">I pezzi restano visibili</div>
  </div>

  <div style="text-align:center">
    <div style="font-size:0.78rem;font-weight:700;margin-bottom:8px;color:#E64A19">B — Colore per attività (Detective)</div>
    <div style="width:140px;height:140px;background:#b58863;border-radius:8px;position:relative;overflow:hidden;border:1px solid #ccc">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at center, rgba(0,0,0,0) 30%, rgba(180,60,10,0.82) 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:8px">
        <span style="font-size:2rem;font-weight:800;color:#fff;line-height:1;text-shadow:0 2px 8px rgba(0,0,0,0.4)">3</span>
        <span style="font-size:0.6rem;color:rgba(255,255,255,0.95);margin-top:5px;font-weight:600">Trova il punto chiave…</span>
      </div>
    </div>
    <div style="font-size:0.7rem;color:#888;margin-top:4px">Arancio = detective</div>
  </div>

  <div style="text-align:center">
    <div style="font-size:0.78rem;font-weight:700;margin-bottom:8px;color:#2E7D32">B — Colore per attività (Candidate)</div>
    <div style="width:140px;height:140px;background:#b58863;border-radius:8px;position:relative;overflow:hidden;border:1px solid #ccc">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at center, rgba(0,0,0,0) 30%, rgba(15,100,40,0.82) 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:8px">
        <span style="font-size:2rem;font-weight:800;color:#fff;line-height:1;text-shadow:0 2px 8px rgba(0,0,0,0.4)">3</span>
        <span style="font-size:0.6rem;color:rgba(255,255,255,0.95);margin-top:5px;font-weight:600">Quali mosse hai?</span>
      </div>
    </div>
    <div style="font-size:0.7rem;color:#888;margin-top:4px">Verde = candidate</div>
  </div>

</div>

**Raccomandazione:** combinare A + B — vignette radiale con colore per tipo attività, testo motivazionale specifico, numero countdown piccolo. Il bambino impara ad associare il colore all'attività ancora prima di leggere la domanda.

### Testi motivazionali per tipo

| Attività | Testo freeze |
|---|---|
| Intent | *"Cosa sta pensando?"* |
| Detective | *"Trova il punto chiave…"* |
| Candidate | *"Quali mosse hai?"* |
| Move | *"Ora esegui…"* |
| Demo | *"Guarda bene…"* |

---

## Tipografia e bottoni

### Font — Nunito è la scelta giusta

<div style="background:#f9f9f9;border-radius:10px;padding:20px;margin:16px 0">
  <div style="font-family:'Nunito',sans-serif;margin-bottom:12px">
    <span style="font-size:0.7rem;color:#999;display:block;margin-bottom:2px">Nunito 800 — titoli lezione</span>
    <span style="font-size:1.6rem;font-weight:800;color:#212121">Ruy Lopez — Variante Berlino</span>
  </div>
  <div style="font-family:'Nunito',sans-serif;margin-bottom:12px">
    <span style="font-size:0.7rem;color:#999;display:block;margin-bottom:2px">Nunito 700 — domanda attività (attuale 1rem → proposto 1.1rem)</span>
    <span style="font-size:1.1rem;font-weight:700;color:#212121">Perché il Nero gioca ...c5 invece di ...e5?</span>
  </div>
  <div style="font-family:'Nunito',sans-serif;margin-bottom:12px">
    <span style="font-size:0.7rem;color:#999;display:block;margin-bottom:2px">Nunito 400 — testo corpo step</span>
    <span style="font-size:0.95rem;font-weight:400;color:#546E7A">Il Cavallo su c3 controlla la casa d5 e limita le opzioni del Nero nel centro.</span>
  </div>
  <div style="font-family:'Nunito',sans-serif">
    <span style="font-size:0.7rem;color:#999;display:block;margin-bottom:2px">Nunito 600 — label (minimo 0.75rem — attuale alcune a 0.65rem ⚠️)</span>
    <span style="font-size:0.75rem;font-weight:600;color:#90A4AE;text-transform:uppercase;letter-spacing:0.04em">Step 3 di 8 · Intermedio</span>
  </div>
</div>

Nunito è ottimo per bambini: tondo, amichevole, alta leggibilità. **Non cambiare font.** L'unica correzione necessaria è portare le label piccole da 0.65rem a minimo 0.75rem.

### Bottoni — prima e dopo

<div style="display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start;margin:16px 0">
  <div>
    <div style="font-size:0.78rem;font-weight:700;margin-bottom:10px;color:#666">ATTUALE</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <button style="padding:0.6rem 1.8rem;border:none;border-radius:8px;background:#283593;color:#fff;font-family:'Nunito',sans-serif;font-size:0.95rem;font-weight:700;cursor:default">Continua</button>
      <button style="padding:0.6rem 1.6rem;border:1.5px solid #283593;border-radius:8px;background:#fff;color:#283593;font-family:'Nunito',sans-serif;font-size:0.95rem;font-weight:700;cursor:default">Mostra risposta</button>
    </div>
  </div>
  <div style="display:flex;align-items:center;font-size:1.5rem;color:#ccc;padding-top:20px">→</div>
  <div>
    <div style="font-size:0.78rem;font-weight:700;margin-bottom:10px;color:#2E7D32">PROPOSTO</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <button style="padding:0.65rem 1.8rem;border:none;border-radius:12px;background:#283593;color:#fff;font-family:'Nunito',sans-serif;font-size:0.95rem;font-weight:700;cursor:default;box-shadow:0 4px 12px rgba(40,53,147,0.35)">Continua</button>
      <button style="padding:0.65rem 1.6rem;border:2px solid #283593;border-radius:12px;background:#fff;color:#283593;font-family:'Nunito',sans-serif;font-size:0.95rem;font-weight:700;cursor:default">Mostra risposta</button>
    </div>
    <div style="font-size:0.7rem;color:#888;margin-top:8px">+ scale(1.04) su hover/active</div>
  </div>
</div>

Le modifiche: border-radius da 8 → 12px, box-shadow sul primario, border più marcato sul secondario, transform scale su hover. La differenza è sottile ma il primario "ha peso" — si capisce che è l'azione principale.

### Opzioni Intent — prima e dopo

<div style="display:flex;gap:24px;flex-wrap:wrap;margin:16px 0">
  <div style="flex:1;min-width:220px">
    <div style="font-size:0.78rem;font-weight:700;margin-bottom:10px;color:#666">ATTUALE</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;align-items:center;gap:8px;padding:0.8rem 1.1rem;border:1.5px solid #E0E0E0;border-radius:8px;background:#fff;font-size:0.9rem;font-family:'Nunito',sans-serif">
        <input type="radio" style="accent-color:#283593" readonly/> Controllare il centro con d5
      </div>
      <div style="display:flex;align-items:center;gap:8px;padding:0.8rem 1.1rem;border:1.5px solid #283593;border-radius:8px;background:#E8EAF6;font-size:0.9rem;font-family:'Nunito',sans-serif">
        <input type="radio" style="accent-color:#283593" checked readonly/> Aprire la colonna c
      </div>
      <div style="display:flex;align-items:center;gap:8px;padding:0.8rem 1.1rem;border:1.5px solid #E0E0E0;border-radius:8px;background:#fff;font-size:0.9rem;font-family:'Nunito',sans-serif">
        <input type="radio" style="accent-color:#283593" readonly/> Attaccare il cavallo e4
      </div>
    </div>
  </div>
  <div style="flex:1;min-width:220px">
    <div style="font-size:0.78rem;font-weight:700;margin-bottom:10px;color:#2E7D32">PROPOSTO</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;align-items:center;gap:8px;padding:0.9rem 1.2rem;border:1.5px solid #E0E0E0;border-radius:12px;background:#fff;font-size:0.9rem;font-family:'Nunito',sans-serif;transition:all 0.2s">
        <input type="radio" style="accent-color:#1565C0" readonly/> Controllare il centro con d5
      </div>
      <div style="display:flex;align-items:center;gap:8px;padding:0.9rem 1.2rem;border:2px solid #1565C0;border-radius:12px;background:#E3F2FD;font-size:0.9rem;font-family:'Nunito',sans-serif;box-shadow:inset 0 1px 4px rgba(21,101,192,0.15)">
        <input type="radio" style="accent-color:#1565C0" checked readonly/> Aprire la colonna c
      </div>
      <div style="display:flex;align-items:center;gap:8px;padding:0.9rem 1.2rem;border:1.5px solid #E0E0E0;border-radius:12px;background:#fff;font-size:0.9rem;font-family:'Nunito',sans-serif">
        <input type="radio" style="accent-color:#1565C0" readonly/> Attaccare il cavallo e4
      </div>
    </div>
    <div style="font-size:0.7rem;color:#888;margin-top:8px">+ translateX(4px) su hover</div>
  </div>
</div>

---

## Palette e color coding attività

### Colore primario — proposta

<div style="display:flex;flex-wrap:wrap;gap:12px;margin:16px 0">
  <div style="text-align:center">
    <div style="width:80px;height:80px;background:#283593;border-radius:8px"></div>
    <div style="font-size:0.75rem;margin-top:6px;font-weight:600">Attuale<br/>#283593</div>
    <div style="font-size:0.7rem;color:#888">Freddo</div>
  </div>
  <div style="display:flex;align-items:center;font-size:1.2rem;color:#ccc">→</div>
  <div style="text-align:center">
    <div style="width:80px;height:80px;background:#1a3a5c;border-radius:8px"></div>
    <div style="font-size:0.75rem;margin-top:6px;font-weight:600">Proposto<br/>#1a3a5c</div>
    <div style="font-size:0.7rem;color:#888">Notte scacchiera</div>
  </div>
</div>

Alternativa: mantenere il primario globale neutro (solo per navigazione e UI shell) e usare il colore dell'attività come dominante nel pannello player.

### Color coding per tipo di attività

<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin:16px 0">
  <div style="border-radius:10px;overflow:hidden;border:1px solid #eee">
    <div style="background:#1565C0;padding:14px 16px">
      <div style="font-size:0.85rem;font-weight:800;color:#fff">INTENT</div>
      <div style="font-size:0.7rem;color:rgba(255,255,255,0.8);margin-top:2px">pensiero strategico</div>
    </div>
    <div style="padding:10px 12px;background:#fff">
      <div style="font-size:0.72rem;color:#666">#1565C0</div>
      <div style="font-size:0.72rem;color:#666">bg: #E3F2FD</div>
    </div>
  </div>
  <div style="border-radius:10px;overflow:hidden;border:1px solid #eee">
    <div style="background:#E64A19;padding:14px 16px">
      <div style="font-size:0.85rem;font-weight:800;color:#fff">DETECTIVE</div>
      <div style="font-size:0.7rem;color:rgba(255,255,255,0.8);margin-top:2px">scoperta</div>
    </div>
    <div style="padding:10px 12px;background:#fff">
      <div style="font-size:0.72rem;color:#666">#E64A19</div>
      <div style="font-size:0.72rem;color:#666">bg: #FBE9E7</div>
    </div>
  </div>
  <div style="border-radius:10px;overflow:hidden;border:1px solid #eee">
    <div style="background:#2E7D32;padding:14px 16px">
      <div style="font-size:0.85rem;font-weight:800;color:#fff">CANDIDATE</div>
      <div style="font-size:0.7rem;color:rgba(255,255,255,0.8);margin-top:2px">generazione idee</div>
    </div>
    <div style="padding:10px 12px;background:#fff">
      <div style="font-size:0.72rem;color:#666">#2E7D32</div>
      <div style="font-size:0.72rem;color:#666">bg: #E8F5E9</div>
    </div>
  </div>
  <div style="border-radius:10px;overflow:hidden;border:1px solid #eee">
    <div style="background:#6A1B9A;padding:14px 16px">
      <div style="font-size:0.85rem;font-weight:800;color:#fff">MOVE</div>
      <div style="font-size:0.7rem;color:rgba(255,255,255,0.8);margin-top:2px">esecuzione</div>
    </div>
    <div style="padding:10px 12px;background:#fff">
      <div style="font-size:0.72rem;color:#666">#6A1B9A</div>
      <div style="font-size:0.72rem;color:#666">bg: #F3E5F5</div>
    </div>
  </div>
  <div style="border-radius:10px;overflow:hidden;border:1px solid #eee">
    <div style="background:#4E342E;padding:14px 16px">
      <div style="font-size:0.85rem;font-weight:800;color:#fff">TEXT</div>
      <div style="font-size:0.7rem;color:rgba(255,255,255,0.8);margin-top:2px">lettura, contesto</div>
    </div>
    <div style="padding:10px 12px;background:#fff">
      <div style="font-size:0.72rem;color:#666">#4E342E</div>
      <div style="font-size:0.72rem;color:#666">bg: #EFEBE9</div>
    </div>
  </div>
  <div style="border-radius:10px;overflow:hidden;border:1px solid #eee">
    <div style="background:#F57F17;padding:14px 16px">
      <div style="font-size:0.85rem;font-weight:800;color:#fff">DEMO</div>
      <div style="font-size:0.7rem;color:rgba(255,255,255,0.8);margin-top:2px">il GM mostra</div>
    </div>
    <div style="padding:10px 12px;background:#fff">
      <div style="font-size:0.72rem;color:#666">#F57F17</div>
      <div style="font-size:0.72rem;color:#666">bg: #FFF8E1</div>
    </div>
  </div>
</div>

L'implementazione minima che differenzia senza toccare la struttura: **bordo superiore colorato** di 4px sul pannello attività (CSS: `border-top: 4px solid var(--activity-color)`). Il bambino riconosce il tipo di sfida a colpo d'occhio prima ancora di leggere.

---

## Celebrazioni e feedback emotivo

### Risposta corretta — prima e dopo

<div style="display:flex;gap:20px;flex-wrap:wrap;margin:16px 0">
  <div style="flex:1;min-width:200px">
    <div style="font-size:0.78rem;font-weight:700;margin-bottom:10px;color:#666">ATTUALE — statico</div>
    <div style="background:#E8F5E9;border:1.5px solid #558B2F;border-radius:12px;padding:20px;text-align:center">
      <div style="font-size:2.5rem;line-height:1;color:#2E7D32">✓</div>
      <div style="font-size:0.95rem;color:#212121;margin-top:8px">Esatto! Il Nero gioca ...c5 per creare tensione nel centro.</div>
      <button style="margin-top:12px;padding:0.6rem 1.8rem;border:none;border-radius:8px;background:#283593;color:#fff;font-family:'Nunito',sans-serif;font-size:0.95rem;font-weight:700;cursor:default">Continua →</button>
    </div>
  </div>
  <div style="flex:1;min-width:200px">
    <div style="font-size:0.78rem;font-weight:700;margin-bottom:10px;color:#2E7D32">PROPOSTO — con risposta emotiva</div>
    <div style="background:#E8F5E9;border:2px solid #2E7D32;border-radius:12px;padding:20px;text-align:center;box-shadow:0 0 0 3px rgba(46,125,50,0.15), 0 4px 16px rgba(46,125,50,0.2)">
      <div style="font-size:2.8rem;line-height:1;color:#2E7D32">✓</div>
      <div style="font-size:0.95rem;color:#212121;margin-top:8px">Esatto! Il Nero gioca ...c5 per creare tensione nel centro.</div>
      <button style="margin-top:12px;padding:0.65rem 1.8rem;border:none;border-radius:12px;background:#2E7D32;color:#fff;font-family:'Nunito',sans-serif;font-size:0.95rem;font-weight:700;cursor:default;box-shadow:0 4px 10px rgba(46,125,50,0.35)">Continua →</button>
    </div>
    <div style="font-size:0.7rem;color:#888;margin-top:6px">+ animazione pop (scale 0.95→1.05→1.0) all'apparizione</div>
  </div>
</div>

### Schermata completamento lezione — proposta

<div style="max-width:380px;margin:16px 0">
  <div style="background:linear-gradient(135deg,#1a3a5c 0%,#2E7D32 100%);border-radius:16px;padding:32px 24px;text-align:center;color:#fff">
    <div style="font-size:3rem;margin-bottom:8px">
      <span style="display:inline-block;transform:rotate(-15deg)">★</span>
      <span style="display:inline-block;font-size:3.5rem">★</span>
      <span style="display:inline-block;transform:rotate(15deg)">★</span>
    </div>
    <div style="font-size:1.7rem;font-weight:800;font-family:'Nunito',sans-serif;margin-bottom:8px">Lezione completata!</div>
    <div style="font-size:0.95rem;opacity:0.85;margin-bottom:24px">Ruy Lopez — Variante Berlino</div>
    <button style="padding:0.75rem 2rem;border:none;border-radius:12px;background:#fff;color:#1a3a5c;font-family:'Nunito',sans-serif;font-size:1rem;font-weight:800;cursor:default;box-shadow:0 4px 16px rgba(0,0,0,0.2)">Valuta la lezione →</button>
  </div>
  <div style="font-size:0.7rem;color:#888;margin-top:6px">stelle animate in sequenza (staggered 0.2s); sfondo gradiente fisso nel CSS</div>
</div>

---

## Checklist implementazione — Fase 2bis

### Immediato (basso sforzo, alto impatto visivo)
- [ ] Scacchiera: sostituire SVG pattern grigio con marrone Lichess (#f0d9b5 / #b58863)
- [ ] Coordinate scacchiera: font-size 0.7 → 0.8rem, colore più caldo
- [ ] Label: portare tutte le label sotto 0.75rem a minimo 0.75rem

### Breve termine (medio sforzo, alto impatto)
- [ ] FreezeOverlay: vignette radiale + colore per tipo attività + testo motivazionale specifico
- [ ] Color coding attività: `border-top: 4px solid` colorato per tipo sul pannello activity
- [ ] Bottoni: border-radius 12px, box-shadow sul primario, transform scale su hover/active
- [ ] Opzioni Intent: border-radius 12px, hover con translateX(4px), selected con box-shadow inset
- [ ] Pannello "Corretto!": animazione pop, glow border verde

### Medio termine (medio sforzo, medio impatto)
- [ ] Palette: aggiornare variabili CSS primario + sfondo in index.css
- [ ] Schermata completamento: sfondo gradiente, stelle animate in sequenza, titolo 800
- [ ] Domanda attività: font-size 1rem → 1.1rem, weight 800, colore per tipo
- [ ] Visual aids sistematici: aggiornare prompt IA per richiedere visualAids su ogni step con riferimenti a case

### Lungo termine (completamento sistema)
- [ ] Parsing automatico case nel testo: highlight su board per pattern [a-h][1-8] negli step text
- [ ] Brush custom Chessground: stile "hint" tratteggiato per aiuti opzionali
- [ ] Countdown circolare SVG in sostituzione del numero

---

## Cosa NON fare

- Cambiare la struttura layout (funziona)
- Aggiungere audio (fuori scope)
- Intervenire sulla Console Coach (è per adulti, va bene)
- Librerie JS per animazioni (tutto fattibile in CSS puro)
- Emoji nel contenuto didattico (appartengono all'UI shell, non alle lezioni)

---

*Documento creato: 2026-03-14 — Riferimenti: Sweller (1988) Cognitive Load Theory; Mayer & Moreno (2003) principio di contiguità*
