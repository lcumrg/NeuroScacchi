# CLAUDE.md - Istruzioni per Claude Code

## Workflow
- Dopo aver completato le modifiche, pusha sul branch claude/*
- La GitHub Action `auto-merge-claude.yml` crea e mergia la PR automaticamente
- Non serve fornire token GitHub: è tutto gestito dal workflow

## Regola fondamentale: pagina Metodo come fonte di verità

**OBBLIGATORIO**: la pagina Metodo (`src/v2/pages/MetodoPage.jsx`) è il documento di riferimento centrale del progetto. Ogni modifica al codice, alla roadmap, o a qualsiasi aspetto del progetto DEVE riflettersi in questa pagina.

In particolare, ad ogni sessione di lavoro:

1. **Se implementi una feature**: aggiorna la roadmap visuale nella pagina Metodo — spunta l'item corrispondente (`done: true`), aggiorna lo stato della fase se necessario (`next` → `done`), e sposta il badge "Prossimo" alla fase successiva.

2. **Se prendi una decisione di design**: aggiorna la sezione scientifica corrispondente — cambia lo status da `open`/`critical` a `solid` se la questione è risolta, aggiungi nuovi box "Applicazione" o "Evoluzione" se cambia qualcosa.

3. **Se aggiungi nuovi task alla roadmap**: aggiungili nella sezione roadmap visuale della pagina Metodo, mappandoli al pilastro scientifico di riferimento.

4. **Se cambia lo stato di una criticità**: aggiorna il badge di stato nella sezione corrispondente (da "Critico" a "Da approfondire" a "Validato").

5. **Se modifichi il profilo cognitivo o il layer cognitivo**: verifica che le card dei 4 parametri e le sezioni scientifiche siano ancora accurate.

6. **Aggiorna sempre anche `ROADMAP-V2.md`** in parallelo — le due fonti devono restare sincronizzate.

La pagina Metodo deve essere sempre leggibile da sola come documento completo e aggiornato del progetto, sia per il coach che per lo sviluppatore.
