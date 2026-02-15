# 🎉 NeuroScacchi v3.0 - Manuale Completo

## ✨ NOVITÀ VERSIONE 3.0

### **Funzionalità Implementate**

✅ **Header Minimale** (40px) con pulsante Exit  
✅ **Schermata Selezione Lezioni** con griglia card  
✅ **Upload Lezioni** (JSON singolo con validazione automatica)  
✅ **Detective Mode Completo** (3 tentativi, mostra soluzione)  
✅ **Profilassi Livello 3** (Radar + Checklist obbligatoria)  
✅ **Gestione LocalStorage** (lezioni, progressi, impostazioni)  
✅ **Modalità Debug** (`?debug=true` per test rapidi)  
✅ **Reset Progressi** per singola lezione  

---

## 🚀 QUICK START

### **1. Deploy su Netlify**
1. Estrai `neuroscacchi-v3.zip`
2. Trascina la cartella su Netlify
3. Attendi il build (3-5 minuti)
4. Ricevi il link dell'app

### **2. Primo Utilizzo**
1. Apri l'app → vedi schermata lezioni
2. Una lezione di test è già caricata
3. Clicca sulla card per iniziare
4. Dopo aver completato, clicca "Reset" per riprovare

### **3. Caricare Nuove Lezioni**
1. Clicca "📤 Carica Lezione"
2. Seleziona file `.json`
3. Controlla validazione automatica
4. Se valido → clicca "Carica Lezione"

---

## 📖 MODALITÀ DEBUG

Aggiungi `?debug=true` all'URL per attivare:
- Auto-complete lezioni Intent
- Skip tempi di attesa
- Logs in console

**Esempio:** `https://tuo-sito.netlify.app/?debug=true`

---

## 🎮 TIPI DI LEZIONE

### **1. Intent Mode** (Standard)
Flow: Freeze → Domanda → Scelta → Chunking → Mossa

**Quando usare:** Allenare pianificazione strategica

**File JSON esempio:**
```json
{
  "tipo_modulo": "intent",
  "domanda": "Quale piano?",
  "opzioni_risposta": ["A", "B", "C"],
  "risposta_corretta": "B"
}
```

### **2. Detective Mode**
Flow: Freeze → Domanda → Click casa → Feedback

**Quando usare:** Allenare riconoscimento visivo

**File JSON esempio:**
```json
{
  "tipo_modulo": "detective",
  "modalita_detective": {
    "attiva": true,
    "domanda": "Trova la casa debole",
    "risposta_corretta_casa": "d5"
  }
}
```

### **3. Profilassi Attiva**
Appare PRIMA di eseguire la mossa

**Quando usare:** Posizioni tatticamente critiche

**File JSON esempio:**
```json
{
  "parametri": {
    "usa_profilassi": true,
    "tipo_profilassi": "radar_checklist",
    "domande_checklist": [
      "Il mio Re è sicuro?",
      "Non lascio pezzi indifesi?",
      "Cosa può fare l'avversario?"
    ]
  }
}
```

---

## 📁 STRUTTURA FILE LEZIONE

### **Campi Obbligatori**
```json
{
  "id": "stringa_univoca",
  "titolo": "Nome lezione",
  "tipo_modulo": "intent" | "detective",
  "fen": "posizione_scacchiera",
  "feedback_positivo": "Messaggio OK",
  "feedback_negativo": "Messaggio errore"
}
```

### **Campi Opzionali**
```json
{
  "descrizione": "Testo descrittivo",
  "difficolta": "facile" | "medio" | "difficile",
  "categoria": "aperture" | "mediogioco" | "finali" | "tattica",
  "tempo_stimato": "2 min",
  "parametri": {
    "tempo_freeze": 1500,
    "orientamento_scacchiera": "white" | "black",
    "mostra_chunk_visivo": ["d4", "e5"],
    "frecce_pattern": [
      { "from": "c6", "to": "d4" }
    ],
    "usa_profilassi": false
  }
}
```

---

## 🛠️ RISOLUZIONE PROBLEMI

### **Lezione non si carica**
- Verifica JSON valido (usa validator online)
- Controlla campo `tipo_modulo` corretto
- Verifica FEN valida

### **Profilassi non appare**
- Controlla `parametri.usa_profilassi: true`
- Solo per lezioni Intent (non Detective)

### **Scacchiera troppo grande/piccola**
- Per ora: usa zoom browser (Ctrl + / Ctrl -)
- Futuro: impostazioni dimensione

### **Debug mode non funziona**
- URL deve contenere esattamente `?debug=true`
- Ricarica pagina con F5

---

## 📊 DATI SALVATI (LocalStorage)

- **Lezioni caricate**: `neuroscacchi_lessons`
- **Progressi**: `neuroscacchi_progress`
- **Impostazioni**: `neuroscacchi_settings`
- **Playlist**: `neuroscacchi_playlists` (futuro)

**Reset tutto:** Console browser → `localStorage.clear()`

---

## 🎯 PROSSIME IMPLEMENTAZIONI

⏳ **Playlist con prerequisiti**  
⏳ **Impostazioni UI complete**  
⏳ **Audio e suoni**  
⏳ **Statistiche avanzate**  
⏳ **Esportazione dati**  
⏳ **Sequenze multi-step**  

---

## 📞 SUPPORTO

**Problemi comuni:** Vedi sezione "Risoluzione Problemi"  
**Bug trovati:** Documenta e segnala con screenshot  
**Feature request:** Compila wishlist

---

**Versione:** 3.0.0  
**Data:** Febbraio 2026  
**Licenza:** Uso educativo
