# DOMANDE-APERTE.md

*Domande specifiche che nascono da cose viste nel codice e che non riesco a interpretare da solo. Servono per darti consigli migliori nelle prossime sessioni.*

---

## Architettura e scelte attive

1. **Pipeline tattica in standby — per quanto?** Tutti i file (`lessonPipeline.js`, `puzzleEnricher.js`, `lessonPlanPrompt.js`, `lessonBuildPrompt.js`, database puzzle su Firestore) sono completi, ma la Console Coach espone solo il form aperture. È un congelamento temporaneo (riaprirà quando le aperture saranno "costantemente positive", come dice la roadmap) oppure un cambio di strategia duraturo? Conta perché influenza se trattare quel codice come "vivo da mantenere" o "museale da non toccare".

2. **`functions/index.js` è ancora vivo?** Usa lo schema dati 2.x (`users/{uid}/sessions`, campi `profilassiUsed`, `metacognitive`, `intentErrors`) che non è prodotto da nessuna funzione/pagina della 3.0. Il workflow `deploy-functions.yml` lo deploya su ogni push a main che tocca `functions/`. È codice da archiviare, da migrare, o da riusare quando arriverà la Fase 3 (scheda studente)?

3. **Doppio `ai-chat` su `/api/ai-chat`.** L'edge function `netlify/edge-functions/ai-chat.js` (multi-provider, streaming) e la normale `netlify/functions/ai-chat.js` (Gemini only, non-streaming, supporta Vision) dichiarano lo stesso path. L'edge intercetta per prima. Ma la seconda ha il supporto multimodale che l'edge non ha. Quale è la "verità" attuale e come si usa la Vision per l'ingestion KB?

---

## Sicurezza

4. **Netlify Functions senza auth.** `lesson-save`, `lesson-delete`, `kb-save`, `kb-delete`, `feedback-save` usano Admin SDK (bypassano le Firestore rules) e non verificano nessun token. È consapevole (ambiente interno, "nessuno conosce gli URL") oppure una svista da chiudere prima di condividere l'app con chiunque fuori dalla famiglia?

5. **Firestore rules e dati di dominio.** Le rules proteggono solo `users/{uid}/**` e bloccano tutto il resto. Le collection `lessons`, `lessonFeedback`, `knowledgeChunks`, `puzzles` sono dunque accessibili solo via Admin SDK (via Netlify). Vuoi che resti così — tutti gli accessi client mediati da Functions — o in futuro il client leggerà Firestore direttamente (richiederebbe rules reali)?

6. **`AuthContext.jsx` esiste ma nessuno lo usa.** C'è stato un tentativo di auth interrotto, o è preparato di proposito per essere cablato alla Fase 7 ("multi-utente")? Serve a me sapere se "non usato" = "temporaneamente in pausa" o "abbandonato".

---

## Contenuti e qualità

7. **Quante lezioni approvate ci sono oggi su Firestore?** La pipeline aperture ha generato la prima Ruy Lopez testata sui figli. Quante altre sono in produzione? Se ce ne sono poche, le decisioni di migrazione schema sono a basso costo; se ce ne sono cento, no.

8. **KB-1 è stato testato sulle 26 pagine del manuale della Spagnola?** La roadmap lo dà come "prossimo passo" al 2026-03-28. Oggi 2026-04-16: l'ingestion ha girato davvero? Ci sono chunk in `knowledgeChunks`? Serve sapere se la KB è vuota (allora KB-2 non ha senso ora) o popolata (allora KB-2 è il collo di bottiglia).

9. **Il test con studenti veri (figli) sta dando feedback utilizzabile?** Vedo `FeedbackPage`, `lessonFeedback` collection, form 5 stelle + note per step. C'è un riassunto di cosa sta funzionando e cosa no nei contenuti generati, oppure la raccolta è ancora grezza e da digerire insieme?

---

## Debito documentale

10. **`ANALISI-CODICE.md` va aggiornato o archiviato?** È fermo al 2026-03-13 e alcuni punti sono stati risolti, altri no. Vuoi che rimanga come istantanea storica (aggiungerci una data di freeze e smetterla di modificarlo) oppure che venga aggiornato a ogni sessione come fa ROADMAP.md?

11. **README.md è una stub.** Dice "Claude API" (è Claude + Gemini), "Netlify Function" (è edge function streaming). Va riscritto per il pubblico che legge il repo (terzi? SIAE? te stesso?), o tenuto volutamente minimalista?

---

## Scelte tecniche minori ma durature

12. **Inline style vs CSS modulare.** Alcuni componenti usano `style={{ ... }}` in JSX (es. `App.jsx`), altri file `.css` accanto al componente. Convive consapevolmente o stai convergendo verso uno stile?

13. **TypeScript fuori programma?** Lo schema lezione è validato a runtime, i contratti tra pipeline e prompt sono leggibili. Per un progetto con quattro pipeline, cinque provider esterni e zero test, TS darebbe molto. È una scelta o una non-decisione?

14. **Dev server e feature flagging.** Vedo `DevFeedbackSidebar` e `SviluppoPage`: c'è un'idea di "modalità sviluppatore" accessibile dalla UI? Se sì, è un pattern da estendere (es. toggle pipeline legacy/nuova) o resta circoscritto al feedback per-step?

15. **Dipendenze vulnerabili.** `npm audit` mostra 3 high (rollup, node-forge, fast-xml-parser). La maggioranza sono transitive di firebase-admin e vite. Le vuoi ignorare come rumore da ecosistema o programmare un upgrade (vite 5→7, firebase-admin minor)?
