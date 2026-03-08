import { Section } from './metodoComponents'
import { styles } from './metodoStyles'

export default function MetodoFondamenti() {
  return (
    <>
      <h3 style={styles.partTitle}>Il Metodo — Fondamenti Scientifici</h3>

      <Section status="solid" title="La visione">
        <p>
          NeuroScacchi nasce per scacchisti con ADHD che competono e vogliono migliorare.
          Non e' un'app "semplificata" — e' un allenatore che conosce il tuo funzionamento cognitivo
          e adatta il training di conseguenza.
        </p>
        <p>
          L'architettura del Metodo si fonda su un'ipotesi precisa: le difficolta delle funzioni
          esecutive non sono ostacoli insormontabili, ma <strong>variabili misurabili</strong> su cui
          costruire un percorso di allenamento personalizzato. Questa prospettiva si allinea con i
          modelli neuropsicologici contemporanei che vedono l'ADHD non come una mancanza di conoscenza,
          ma come una difficolta nell'applicazione della stessa nel <em>"punto di prestazione"</em>.
        </p>
      </Section>

      <Section status="solid" title="1. Inibizione comportamentale — Il Freeze">
        <p>
          Il controllo inibitorio e' spesso considerato il deficit primario nell'ADHD.
          Senza un'adeguata inibizione, il soggetto risponde agli stimoli in modo immediato e automatico,
          impedendo l'attivazione dei processi di pensiero superiore.
        </p>
        <div style={styles.implBox}>
          <strong>Applicazione</strong>: il "Freeze" impone un blocco forzato della scacchiera
          (da 1 a 5 secondi) prima di ogni posizione. Se l'impulsivita dell'utente e' alta,
          il blocco dura di piu.
        </div>
        <p>
          <strong>Fondamento scientifico:</strong> questo meccanismo agisce come una "protesi"
          per l'inibizione mancante. L'allenamento alla risposta ritardata e' una strategia cardine
          per spostare il processamento dal <strong>Sistema 1</strong> (intuitivo/impulsivo) al
          <strong> Sistema 2</strong> (analitico/riflessivo). Imponendo il tempo di latenza, si permette
          alla corteccia prefrontale di elaborare i dati prima che avvenga l'atto motorio.
        </p>
        <div style={styles.evolutionBox}>
          <strong>Evoluzione agonistica:</strong> l'estensione del freeze a ogni singola mossa della
          partita serve a contrastare il fenomeno del "decadimento della vigilanza", tipico dell'ADHD,
          dove la precisione cala drasticamente col passare dei minuti. Il profilo cognitivo calibra
          l'intensita: freeze lungo a inizio posizione, freeze breve sulle mosse successive, nessun
          freeze se l'impulsivita e' bassa.
        </div>
      </Section>

      <Section status="solid" title="2. Memoria di lavoro — La Profilassi guidata">
        <p>
          La memoria di lavoro e' il "taccuino" mentale che permette di mantenere e manipolare
          informazioni. Negli scacchi, questo significa ricordare le minacce dell'avversario
          mentre si calcola la propria mossa.
        </p>
        <div style={styles.implBox}>
          <strong>Applicazione</strong>: il sistema di "Profilassi" obbliga l'utente a identificare
          la mossa piu pericolosa dell'avversario prima di giocare. Se la consapevolezza e' bassa,
          questo passaggio viene richiesto sistematicamente.
        </div>
        <p>
          <strong>Fondamento scientifico:</strong> lo "scaffolding cognitivo" (impalcatura) riduce
          il carico sulla memoria di lavoro. Esternalizzando la domanda ("Cosa vuole fare l'altro?"),
          l'app libera risorse mentali per il calcolo profondo. Studi sulla riabilitazione cognitiva
          suggeriscono che automatizzare queste routine di pensiero aiuti a compensare i deficit di
          attenzione divisa.
        </p>
        <div style={styles.evolutionBox}>
          <strong>Evoluzione con Stockfish:</strong> oggi la profilassi mostra mosse legali,
          non necessariamente minacce reali. Con il motore, la domanda diventa significativa:
          la differenza tra "il cavallo puo andare in d5" e "il cavallo in d5 ti costa la
          qualita (-3.2)" e' enorme per chi deve imparare a valutare il pericolo.
        </div>
      </Section>

      <Section status="solid" title="3. Metacognizione — Monitoraggio dell'errore">
        <p>
          L'ADHD e' spesso associato a una scarsa auto-osservazione durante l'esecuzione
          di un compito (metacognizione).
        </p>
        <div style={styles.implBox}>
          <strong>Applicazione</strong>: dopo un errore, l'app pone domande dirette
          (es. "Avevi un piano in mente?"). La frequenza delle domande aumenta se la
          capacita metacognitiva dell'utente e' valutata come bassa.
        </div>
        <p>
          <strong>Fondamento scientifico:</strong> il monitoraggio dell'errore e' legato all'attivita
          della corteccia cingolata anteriore. Negli individui con ADHD, la risposta neurale
          all'errore e' spesso attenuata. Obbligare a una riflessione post-errore aiuta a "marcare"
          l'evento a livello cognitivo, favorendo l'apprendimento dai propri sbagli anziche
          la loro ripetizione impulsiva.
        </p>
        <div style={styles.evolutionBox}>
          <strong>Evoluzione con Stockfish:</strong> la metacognizione diventa contestuale.
          Non piu "Avevi un piano?" generico, ma "Hai perso 3 punti di valutazione nelle
          ultime 5 mosse. Stai andando troppo veloce?" — basato su dati reali del motore.
        </div>
      </Section>

      <Section status="critical" title="4. Regolazione emotiva — Il dilemma del feedback">
        <p>
          Il cervello ADHD e' estremamente sensibile ai segnali di errore e gratificazione,
          un fenomeno noto come <strong>Reward Deficiency Syndrome</strong>.
        </p>
        <div style={styles.warningBox}>
          <strong>Il problema del "muro rosso":</strong> un feedback binario (corretto/sbagliato)
          puo generare una saturazione di segnali negativi che porta alla demotivazione e
          all'abbandono della sessione. Per un giocatore ADHD con bassa tolleranza alla
          frustrazione, una sequenza di schermate rosse e' un muro contro cui si infrange
          la motivazione.
        </div>
        <p>
          <strong>Soluzione con Stockfish:</strong> feedback graduato basato sulla valutazione
          numerica (&#916;eval):
        </p>
        <ul style={styles.list}>
          <li style={{ color: '#2E7D32' }}><strong>Ottima</strong> — la mossa migliore o equivalente (&#916;eval &lt; 0.3)</li>
          <li style={{ color: '#1565C0' }}><strong>Buona</strong> — non la migliore, ma solida (&#916;eval 0.3-1.0)</li>
          <li style={{ color: '#F57F17' }}><strong>Imprecisione</strong> — perdita moderata (&#916;eval 1.0-2.5)</li>
          <li style={{ color: '#C62828' }}><strong>Errore</strong> — perdita significativa (&#916;eval &gt; 2.5)</li>
        </ul>
        <p>
          <strong>Fondamento scientifico:</strong> un feedback informativo e sfumato e' piu costruttivo
          di uno punitivo. "Buona mossa, ma c'era di meglio" e' piu costruttivo di "SBAGLIATO".
          Tuttavia, esiste un rischio opposto:
        </p>
        <div style={styles.warningBox}>
          <strong>Rischio:</strong> un giocatore ADHD che compete potrebbe usare il "buona" come scusa
          per non cercare la mossa migliore. La comodita del "abbastanza bene" puo diventare
          una trappola che impedisce il vero progresso. Chi vuole competere ha bisogno di sapere
          quando una mossa e' <em>sbagliata</em>, non solo "non ottimale".
        </div>
        <p>
          <strong>Soluzione ibrida:</strong> feedback graduato per default, con soglia di errore
          configurabile dal coach per ogni studente. La calibrazione della soglia e' un atto
          di bilanciamento clinico tra protezione della motivazione e spinta al progresso tecnico.
          Il profilo cognitivo (tolleranza frustrazione) influenza la soglia.
        </p>
        <p style={styles.note}>
          Questa decisione richiede validazione con dati reali: come reagiscono diversi profili ADHD
          al feedback graduato vs binario? Servono test con utenti reali prima di decidere.
        </p>
      </Section>

      <Section status="solid" title="5. Consolidamento mnestico — Ripetizione spaziata">
        <p>
          La difficolta nel consolidare gli schemi tattici e' un problema comune per chi ha
          deficit di memoria di lavoro e attenzione sostenuta.
        </p>
        <div style={styles.implBox}>
          <strong>Applicazione</strong>: il sistema Leitner ripete le posizioni a intervalli crescenti
          di 1, 3, 7, 14 e 30 giorni. Se sbagli, la posizione torna all'inizio. Se la azzecchi, avanza.
          Una posizione e' considerata "consolidata" solo dopo 5 successi consecutivi.
        </div>
        <p>
          <strong>Fondamento scientifico:</strong> la ripetizione spaziata sfrutta l'effetto
          di distanziamento (<em>spacing effect</em>), il modo piu efficace per trasferire le
          informazioni nella memoria a lungo termine. Per l'utente ADHD, questo sistema previene
          il sovraccarico e assicura che il tempo di studio sia ottimizzato sulle posizioni
          non ancora acquisite.
        </p>
      </Section>
    </>
  )
}
