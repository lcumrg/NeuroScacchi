# NeuroScacchi — Roadmap

> Questo file viene aggiornato ad ogni sessione di sviluppo.
> Ultimo aggiornamento: 18 Febbraio 2026

---

## FASE 1: Completamento Metacognizione

### Domande post-errore random con Si/No
- [ ] Dopo un errore, mostrare domande metacognitive casuali tipo "Hai ragionato o hai risposto d'istinto?", "Hai controllato le minacce del Nero?" con semplice risposta Si/No
- **Stato attuale:** dopo un errore chiede "Perche hai sbagliato?" con 4 opzioni (fretta/non guardato/non capito/altro)
- **Obiettivo:** lo scopo non e capire il perche, ma provocare auto-osservazione senza giudizio

### Schermata post-lezione con 3 domande
- [ ] (1) Difficolta percepita (Difficile/Normale/Facile con emoji)
- [ ] (2) "Come hai usato il tempo?" (con calma / in fretta)
- [ ] (3) "C'e un momento in cui hai capito da solo l'errore?" (Si/No)
- **Stato attuale:** dopo la lezione c'e 1 sola domanda "Come ti sei sentito?" con 4 emoji
- **Obiettivo:** servono tutte e 3 per costruire i pattern settimanali futuri

---

## FASE 2: Completamento Modalita (~3h)

### Candidate mode in sequenze
- [x] Sequenze miste che mescolano step Intent + Detective + Candidate nello stesso esercizio
- **Completato:** componente `MixedSequencePlayer` implementato, supporta step di tipo intent, detective, candidate, esame nella stessa lezione

### Report confronto Esame vs Guidato
- [ ] Dopo l'esame, mostrare un report che confronti cosa l'allievo ha ricordato da solo vs cosa aveva sbagliato con gli aiuti
- **Stato attuale:** l'Esame mode toglie gli aiuti e basta — alla fine non dice nulla sul confronto
- **Obiettivo:** misurare l'interiorizzazione, es. "Nella versione guidata avevi sbagliato lo step 3, nell'esame lo hai azzeccato" oppure "Senza aiuti hai perso lo step 2 che prima avevi fatto giusto"

---

## FASE 3: Firebase (~10-12h)

### Creare progetto Firebase
- [x] Aprire la console Firebase, creare il progetto "neuroscacchi", configurare le env vars (VITE_FIREBASE_*)
- **Completato:** progetto Firebase creato, env vars configurate su Netlify

### Configurare Authentication
- [x] Attivare i provider di login: email/password + Google OAuth. Definire i domini autorizzati (localhost + dominio Netlify)
- **Completato:** provider attivati nella console Firebase

### UI Login/Signup
- [x] Schermate di login, registrazione e "password dimenticata" nell'app React
- **Completato:** componente `LoginScreen` con form login, registrazione, reset password, Google Sign-In

### Security rules Firestore
- [x] Regole di sicurezza: ogni utente legge/scrive solo i propri dati, lezioni pubbliche leggibili da tutti
- **Completato:** file `firestore.rules` deployato

### Migrazione LocalStorage → Firestore
- [x] Quando l'utente fa login, migrare i dati locali nel cloud. Sync bidirezionale per disponibilita su qualsiasi device
- **Completato:** `firebaseService` e `storageManager` aggiornati per scrivere sotto percorsi per-utente

### Cloud Functions
- [ ] Cron settimanale che aggrega le sessioni e genera i pattern/insights
- [ ] Trigger che aggiorna il rating e il conteggio plays di ogni lezione dopo ogni sessione completata

---

## FASE 4: Analytics e Pattern (~12-15h)

### Dashboard con grafici
- [ ] Pagina con grafici visivi: tempo medio di risposta nel tempo, percentuale errori per categoria, numero sessioni per giorno
- [ ] Filtri per periodo (ultima settimana, ultimo mese)
- [ ] Export CSV per analisi esterna

### Algoritmi aggregazione e pattern detection
- [ ] Backend che analizza le sessioni e trova correlazioni: "sbagli di piu al 3o step", "quando vai in fretta sbagli il 78% in piu", "con la profilassi sbagli il 65% in meno"
- [ ] Calcola errori per step, per categoria, correlazione fretta-errori, impatto profilassi

### Insights automatici in linguaggio naturale
- [ ] Trasformare i numeri in frasi comprensibili per un ragazzino: "Hai notato che quando usi la profilassi sbagli molto meno?"
- [ ] Mai giudicanti ("Hai notato che..." non "Devi...") — sono lo specchio del proprio comportamento

### UI "I Tuoi Pattern"
- [ ] Schermata accessibile dal menu principale che mostra insights + grafici semplici
- [ ] Immediata da capire, con linguaggio naturale e nessun dato tecnico esposto

### Confronto temporale
- [ ] "Questa settimana vs la scorsa": trend di miglioramento (o peggioramento) su errori, tempo, uso profilassi
- [ ] Rinforzo positivo quando migliora

---

## FASE 5: Console Admin (~20-25h) — la killer feature

### Scacchiera interattiva
- [ ] Scacchiera dove il coach puo costruire posizioni manualmente: drag-and-drop pezzi, rimuovere pezzi, importare da FEN
- [ ] La scacchiera e sia lo strumento di costruzione che l'anteprima

### Import PGN con navigazione mosse
- [ ] Incollare una partita PGN (copiata da Chess.com/Lichess) e navigarla con frecce avanti/indietro
- [ ] "Fermare" la posizione interessante e usarla come base per uno step
- [ ] Serve un parser PGN → mosse

### Editor step multi-modalita
- [ ] Form per configurare ogni step: scegliere tipo (Intent/Detective/Candidate), scrivere domanda, aggiungere opzioni risposta, specificare mosse corrette, scrivere feedback
- [ ] La UI si adatta al tipo scelto

### Chunking e frecce via click/drag
- [ ] Click su una casa della scacchiera → la aggiunge alle case evidenziate (chunking)
- [ ] Drag da una casa all'altra → crea una freccia pattern
- [ ] Preview in tempo reale direttamente sulla scacchiera

### Anteprima live
- [ ] Modal che simula esattamente come l'allievo vedra la lezione: freeze, intent panel, scacchiera con aiuti visivi
- [ ] Permette di testare senza uscire dall'editor

### Validazione real-time
- [ ] Barra laterale che mostra in tempo reale errori e warning: "Step 3: nessuna mossa corretta", "FEN non valida", "Consigliato 3-6 step"
- [ ] Il coach sa subito se la lezione e valida

### Export JSON + salvataggio Firestore
- [ ] Tre opzioni: (1) salva nel cloud (se loggato), (2) scarica file .json, (3) carica direttamente nell'app
- [ ] Elimina completamente la necessita di scrivere JSON a mano

### Template pre-configurati
- [ ] 5+ scheletri pronti: "Sviluppo Apertura" (3 step), "Attacco al Re" (5 step con profilassi), "Finale di pedoni" (4 step detective)
- [ ] Il coach parte da un template e lo personalizza

---

## FASE 6: Polish (~8-10h)

### Audio feedback
- [ ] Suoni per: mossa corretta (soddisfacente), errore (gentile, non punitivo), completamento lezione (celebrativo)
- [ ] Opzionale: musica di sottofondo ambient
- [ ] Tutto disattivabile

### Tema scuro
- [ ] Switch CSS variables per tema scuro
- [ ] Utile per sessioni serali e ridurre affaticamento visivo
- [ ] Toggle nel menu impostazioni

### PWA completa
- [ ] Service Worker per funzionamento offline (lezioni gia scaricate)
- [ ] Installabilita come app nativa su desktop/mobile
- [ ] Icona home screen, splash screen

### Animazioni e transizioni
- [ ] Transizioni fluide tra schermate (fade/slide)
- [ ] Animazioni sui feedback (comparsa morbida)
- [ ] Loading states durante caricamento lezioni

### Mobile optimization
- [ ] Layout responsive per la console admin su tablet
- [ ] Touch gestures per navigazione lezioni (swipe)
- [ ] Dimensioni scacchiera adattive (l'app studente e gia responsive, ma l'admin no)
