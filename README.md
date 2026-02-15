# NeuroScacchi - Applicazione Educativa

Applicazione web per l'allenamento strategico negli scacchi, progettata specificamente per studenti con ADHD e deficit di memoria di lavoro.

## 🚀 Come Caricare su Netlify

### Metodo 1: Drag & Drop (Più Semplice)

1. Vai su [netlify.com](https://www.netlify.com/)
2. Crea un account gratuito (se non ce l'hai)
3. Nella dashboard, trascina l'intera cartella `neuroscacchi` nell'area "Drop"
4. Netlify inizierà automaticamente il build
5. Dopo qualche minuto riceverai il link pubblico!

### Metodo 2: Netlify CLI

```bash
# Installa Netlify CLI
npm install -g netlify-cli

# Vai nella cartella del progetto
cd neuroscacchi

# Installa le dipendenze
npm install

# Fai il build
npm run build

# Deploy su Netlify
netlify deploy --prod
```

## 🛠️ Sviluppo Locale

Se vuoi testare l'app sul tuo computer prima di pubblicarla:

```bash
# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev
```

Apri il browser su `http://localhost:5173`

## 📁 Struttura del Progetto

```
neuroscacchi/
├── src/
│   ├── components/          # Componenti React
│   │   ├── Header.jsx
│   │   ├── ChessboardComponent.jsx
│   │   ├── IntentPanel.jsx
│   │   └── FeedbackBox.jsx
│   ├── data/               # Lezioni in formato JSON
│   │   └── lezione01.json
│   ├── App.jsx             # Componente principale
│   └── main.jsx            # Entry point
├── index.html
├── package.json
└── netlify.toml           # Configurazione Netlify
```

## 🎯 Caratteristiche Implementate

- ✅ Freeze Engine (blocco iniziale 1.5s)
- ✅ Intent Engine (3 pulsanti di scelta strategica)
- ✅ Feedback visivo e testuale
- ✅ Chunking visivo (evidenziazione case)
- ✅ Lezione 1: "Pensa prima di muovere"
- ✅ Design responsivo (desktop, tablet, mobile)
- ✅ Animazioni fluide e accessibili

## 📝 Note per lo Sviluppo Futuro

- Aggiungere sistema di suoni (attualmente preparato ma non implementato)
- Implementare Lezione 2 (Detective Mode)
- Aggiungere salvataggio progressi (LocalStorage)
- Sviluppare pannello Admin per creare nuove lezioni
- Implementare sistema gamification (vite, punti, badge)

## 🎨 Tecnologie Utilizzate

- React 18
- Vite (build tool veloce)
- Chess.js (logica scacchistica)
- react-chessboard (componente scacchiera)
- CSS moderno con variabili e animazioni

## 📞 Supporto

Per domande o problemi tecnici, consulta la documentazione completa nel file PDF del progetto.

---

**Versione:** 1.0.0 - MVP (Minimum Viable Product)  
**Data:** Febbraio 2026  
**Licenza:** Uso educativo e terapeutico
