# 📦 GUIDA RAPIDA - Come Pubblicare NeuroScacchi

## 🎯 METODO CONSIGLIATO: Drag & Drop su Netlify

### Passo 1: Prepara la Cartella
Hai già tutto pronto! La cartella `neuroscacchi` contiene tutti i file necessari.

### Passo 2: Vai su Netlify
1. Apri il browser
2. Vai su: https://app.netlify.com/
3. Clicca su "Sign up" se non hai un account (è gratis!)
4. Puoi registrarti con GitHub, GitLab, Bitbucket o email

### Passo 3: Deploy con Drag & Drop
1. Dopo il login, vedrai la dashboard
2. In fondo alla pagina c'è scritto: **"Want to deploy a new site without connecting to Git? Drag and drop your site output folder here"**
3. Trascina l'INTERA cartella `neuroscacchi` in quella zona
4. Netlify farà automaticamente:
   - Upload dei file
   - Installazione delle dipendenze (npm install)
   - Build del progetto (npm run build)
   - Pubblicazione

### Passo 4: Attendi il Build
- Vedrai una barra di progresso
- Il processo richiede 2-5 minuti
- NON chiudere la pagina!

### Passo 5: Ottieni il Link
Quando il build è completo:
- Netlify ti darà un URL del tipo: `https://random-name-123456.netlify.app`
- Puoi testare l'app cliccando sul link
- Puoi cambiare il nome in Impostazioni > Site settings > Change site name

---

## 🔧 METODO ALTERNATIVO: Netlify CLI (da Terminale)

Se preferisci usare il terminale:

```bash
# 1. Installa Netlify CLI globalmente
npm install -g netlify-cli

# 2. Vai nella cartella
cd neuroscacchi

# 3. Login a Netlify
netlify login

# 4. Installa dipendenze
npm install

# 5. Build del progetto
npm run build

# 6. Deploy
netlify deploy --prod
```

---

## ⚠️ PROBLEMI COMUNI

### "Build Failed" o "Deploy Failed"
**Causa:** Node.js versione non compatibile

**Soluzione:** 
1. Vai su Netlify
2. Site settings > Build & deploy > Environment
3. Aggiungi variabile: `NODE_VERSION` = `18`
4. Riprova il deploy

### "Cannot find module 'react'"
**Causa:** Le dipendenze non si sono installate

**Soluzione:**
- Aspetta che finisca il build completo
- Se persiste, cancella il sito e riprova

### Pulsanti non funzionano / Scacchiera non appare
**Causa:** JavaScript non caricato correttamente

**Soluzione:**
- Svuota cache del browser (Ctrl+Shift+R)
- Prova su browser diverso

---

## 🎨 PERSONALIZZAZIONI POST-DEPLOY

### Cambiare il Nome del Sito
1. Dashboard Netlify > Site settings
2. General > Site details > Change site name
3. Scegli un nome (es: `neuroscacchi-beta`)
4. Il nuovo URL sarà: `https://neuroscacchi-beta.netlify.app`

### Dominio Personalizzato (Opzionale)
Se vuoi un dominio tipo `www.neuroscacchi.it`:
1. Acquista il dominio (es: su Namecheap, GoDaddy)
2. Netlify > Domain settings > Add custom domain
3. Segui le istruzioni DNS

---

## 📱 TESTARE L'APP

Dopo il deploy, testa su:
- ✅ Desktop (Chrome, Firefox)
- ✅ Tablet (iPad, Android)
- ✅ Smartphone (iPhone, Android)

**Cosa verificare:**
- [ ] La scacchiera appare correttamente
- [ ] I pulsanti si vedono e sono cliccabili
- [ ] Il freeze iniziale funziona (1.5 secondi)
- [ ] Cliccando il pulsante corretto ("Sviluppare i pezzi...") si sblocca la scacchiera
- [ ] Si può muovere il cavallo da b8 a c6
- [ ] Appare il feedback positivo verde

---

## 🆘 HAI BISOGNO DI AIUTO?

Se qualcosa non funziona:

1. **Controlla i Log di Build**
   - Netlify > Deploys > (ultimo deploy) > Deploy log
   - Cerca righe rosse con "ERROR"

2. **Console del Browser**
   - Apri l'app
   - Tasto destro > Ispeziona > Console
   - Cerca errori in rosso

3. **Condividi con me:**
   - Screenshot dell'errore
   - URL del sito Netlify
   - Cosa stavi facendo quando è successo

---

## ✅ CHECKLIST FINALE

Prima di condividere l'app con tuo figlio:

- [ ] Il sito è pubblicato e accessibile
- [ ] Ho testato su almeno 2 dispositivi
- [ ] La lezione si completa senza errori
- [ ] Il pulsante "Ripeti Esercizio" funziona
- [ ] Ho cambiato il nome del sito Netlify (opzionale)
- [ ] Ho condiviso il link con te stesso per salvarlo

**Link del tuo sito:** ___________________________

**Data primo deploy:** ___________________________

**Note personali:**
_________________________________________________
_________________________________________________
_________________________________________________

---

🎉 **Congratulazioni!** Hai pubblicato la prima versione di NeuroScacchi!
