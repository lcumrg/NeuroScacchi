# 📚 GUIDA LEZIONI SEQUENZA - NeuroScacchi

## 🎯 NOVITÀ: Lezioni Multi-Step

Ora puoi creare lezioni che durano **3-5 minuti** con **più mosse consecutive** in un unico flusso!

---

## 🆕 TIPO: intent_sequenza

### **Cos'è?**
Una lezione composta da 2-10 **step consecutivi**, ognuno con:
- La sua domanda Intent
- La sua mossa da eseguire
- Il suo feedback

### **Quando usarla?**
- ✅ Insegnare **sequenze strategiche** complete (es. sviluppo completo)
- ✅ Allenare **profondità di pensiero** (piano → esecuzione)
- ✅ Simulare **mini-partite guidate**
- ✅ Evitare frammentazione eccessiva

### **Durata tipica:**
- 2 step = ~2 minuti
- 3-4 step = ~4 minuti
- 5-6 step = ~6 minuti
- 8-10 step = ~10 minuti (massimo consigliato)

---

## 📝 FORMATO JSON

```json
{
  "id": "lezione_sequenza_01",
  "titolo": "Titolo della sequenza completa",
  "descrizione": "Breve descrizione",
  "tipo_modulo": "intent_sequenza",
  "fen": "posizione_iniziale_FEN",
  "categoria": "aperture",
  "difficolta": "facile",
  "tempo_stimato": "4 min",
  "parametri": {
    "tempo_freeze": 1500,
    "orientamento_scacchiera": "black",
    "usa_profilassi": false
  },
  "steps": [
    {
      "numero": 1,
      "domanda": "Prima domanda strategica?",
      "opzioni_risposta": ["A", "B", "C"],
      "risposta_corretta": "B",
      "mosse_consentite": ["e7e6", "b7b5"],
      "mosse_corrette": ["e7e6"],
      "mostra_chunk_visivo": ["e6", "f8"],
      "frecce_pattern": [{ "from": "e7", "to": "e6" }],
      "feedback": "Bene! Prossimo step..."
    },
    {
      "numero": 2,
      "fen_aggiornata": "nuova_posizione_dopo_step1",
      "domanda": "Seconda domanda?",
      "opzioni_risposta": ["A", "B", "C"],
      "risposta_corretta": "A",
      "mosse_corrette": ["g8f6"],
      "feedback": "Ottimo! Continua..."
    },
    {
      "numero": 3,
      "fen_aggiornata": "posizione_dopo_step2",
      "domanda": "Terza domanda?",
      "opzioni_risposta": ["A", "B"],
      "risposta_corretta": "A",
      "mosse_corrette": ["f8e7"],
      "feedback_finale": "🎉 Sequenza completata!"
    }
  ],
  "feedback_positivo": "Sequenza eseguita correttamente!",
  "feedback_negativo": "Riprova con più attenzione."
}
```

---

## 🔑 CAMPI OBBLIGATORI

### **A Livello Lezione:**
- `tipo_modulo`: **"intent_sequenza"**
- `fen`: posizione iniziale
- `steps`: array di step (minimo 2)

### **Per Ogni Step:**
- `numero`: 1, 2, 3... (progressivo)
- `domanda`: testo della domanda Intent
- `opzioni_risposta`: array di 3 opzioni
- `risposta_corretta`: una delle opzioni
- `mosse_corrette`: array con mossa/e migliore/i

### **Opzionali per Step:**
- `fen_aggiornata`: se la posizione cambia (usa FEN dopo la mossa precedente)
- `mosse_consentite`: limita le mosse possibili
- `mostra_chunk_visivo`: case da evidenziare
- `frecce_pattern`: frecce da mostrare
- `feedback`: messaggio dopo questo step (breve!)
- `feedback_finale`: solo nell'ULTIMO step (più lungo)

---

## ✨ CARATTERISTICHE

### **Progress Bar**
Mostra automaticamente: **"Step 2 di 4"**

### **Feedback Intermedi**
Dopo ogni step: feedback breve per mantenere motivazione

### **Feedback Finale**
Ultimo step: feedback completo sulla sequenza

### **FEN Aggiornata**
Ogni step può avere una FEN diversa (posizione dopo la mossa precedente)

---

## 💡 BEST PRACTICES

### **1. Lunghezza Ottimale**
- ✅ **3-4 step** = ideale per principianti
- ✅ **5-6 step** = buono per intermedi
- ⚠️ **8+ step** = solo per avanzati (rischio noia/frustrazione ADHD)

### **2. Feedback Progressivi**
```json
"feedback": "Bene! Prossimo pezzo..."  // Step 1-2 (brevi)
"feedback": "Ottimo sviluppo! Ora..."   // Step 3-4 (brevi)
"feedback_finale": "🎉 Perfetto! Hai..."  // Ultimo (completo)
```

### **3. Chunk & Frecce**
- Usa aiuti visivi nei primi 1-2 step
- Riducili progressivamente (autonomia crescente)
- Ultimo step: minimo aiuto

### **4. Profilassi**
```json
"parametri": {
  "usa_profilassi": true  // Attiva per TUTTA la sequenza
}
```
Apparirà solo su mosse critiche

---

## 📚 ESEMPIO COMPLETO

Vedi file: `src/data/esempio_sequenza.json`

Lezione "GDA: Sviluppo Completo" con 4 step:
1. e6 (apri diagonale)
2. Cf6 (cavallo al centro)
3. Ae7 (alfiere solido)
4. 0-0 (arrocca)

Durata: ~4 minuti

---

## 🔄 CONVERSIONE LEZIONI ESISTENTI

**Prima (3 lezioni separate):**
```
lezione01.json → e6 (30s)
lezione02.json → Cf6 (30s)
lezione03.json → Ae7 (30s)
```

**Dopo (1 lezione sequenza):**
```
lezione_completa.json → e6 + Cf6 + Ae7 (3 min)
```

---

## ⚙️ COMPATIBILITÀ

- ✅ Funziona con Profilassi
- ✅ Funziona con Chunking/Frecce
- ✅ Supporta orientamento scacchiera
- ✅ Supporta difficoltà/categorie
- ⚠️ NON combinabile con Detective Mode (usa intent_sequenza O detective, non entrambi)

---

## 🚀 PROSSIMI PASSI

1. **Testa** l'esempio fornito
2. **Converti** le tue lezioni GDA in una sequenza
3. **Crea** nuove sequenze per altri temi
4. **Raccogli feedback** utente su durata ottimale

---

## ❓ FAQ

**Q: Posso mescolare Intent e Detective in una sequenza?**  
A: No, per ora solo Intent. Detective resta lezione separata.

**Q: Quanti step massimi?**  
A: Nessun limite tecnico, ma consiglio max 8-10 per ADHD.

**Q: Il Bianco muove automaticamente?**  
A: No, devi fornire tu le FEN aggiornate. (Partita Guidata arriverà in futuro)

**Q: Posso saltare step?**  
A: No, la sequenza è lineare. (Branching arriverà in futuro)

---

**Versione:** 3.1  
**Data:** Febbraio 2026  
**Feature:** Lezioni Multi-Step (Soluzione A)
