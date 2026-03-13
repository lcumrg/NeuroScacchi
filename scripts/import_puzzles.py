"""
import_puzzles.py — Importa puzzle Lichess in Firestore (NeuroScacchi 3.0)

Uso:
  python3 import_puzzles.py

Prerequisiti:
  pip3 install firebase-admin requests

Il file CSV lichess_db_puzzle.csv deve essere nella stessa cartella
di questo script, oppure specificare il percorso in CSV_PATH.

Il file service account JSON deve essere in ~/Downloads/ con il nome
specificato in SERVICE_ACCOUNT_PATH.
"""

import csv
import os
import sys
import time
import urllib.request

import firebase_admin
from firebase_admin import credentials, firestore

# ─── Configurazione ────────────────────────────────────────────────────────────

SERVICE_ACCOUNT_PATH = os.path.expanduser(
    "~/Downloads/neuroscacchi-a63de-firebase-adminsdk-fbsvc-6deae9c4d5.json"
)

# Percorso del CSV — se non esiste, lo script lo scarica automaticamente
CSV_PATH = os.path.expanduser("~/Downloads/lichess_db_puzzle.csv")
CSV_URL = "https://database.lichess.org/lichess_db_puzzle.csv.zst"

# Filtri qualità
MIN_POPULARITY = 50       # tieni solo puzzle con buon gradimento (-100/+100)
MIN_NB_PLAYS   = 500      # tieni solo puzzle giocati almeno 500 volte

# Batch size per Firestore (max 500 per batch)
BATCH_SIZE = 400

# Limite massimo puzzle da importare (None = tutti)
# Metti un numero basso (es. 1000) per un test rapido
MAX_PUZZLES = None

# ───────────────────────────────────────────────────────────────────────────────


def init_firebase():
    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)
    return firestore.client()


def download_csv():
    """Scarica e decomprime il CSV da Lichess se non è già presente."""
    if os.path.exists(CSV_PATH):
        print(f"CSV già presente: {CSV_PATH}")
        return

    zst_path = CSV_PATH + ".zst"
    print(f"Download CSV puzzle Lichess (~80MB compressi)...")
    print("Potrebbe richiedere qualche minuto...")

    urllib.request.urlretrieve(CSV_URL, zst_path)
    print("Download completato. Decompressione...")

    try:
        import zstandard as zstd
        dctx = zstd.ZstdDecompressor()
        with open(zst_path, "rb") as ifh, open(CSV_PATH, "wb") as ofh:
            dctx.copy_stream(ifh, ofh)
        os.remove(zst_path)
        print("Decompressione completata.")
    except ImportError:
        print("\nERRORE: installa zstandard per decomprimere automaticamente:")
        print("  pip3 install zstandard")
        print(f"\nOppure decomprimi manualmente {zst_path} con:")
        print("  brew install zstd && zstd -d " + zst_path)
        sys.exit(1)


def import_puzzles(db):
    collection = db.collection("puzzles")
    batch = db.batch()
    batch_count = 0
    total_imported = 0
    total_skipped = 0
    start_time = time.time()

    print(f"\nInizio importazione da: {CSV_PATH}")
    print(f"Filtri: popularity >= {MIN_POPULARITY}, nb_plays >= {MIN_NB_PLAYS}")
    if MAX_PUZZLES:
        print(f"Limite: {MAX_PUZZLES} puzzle")
    print()

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            # Applica filtri qualità
            try:
                popularity = int(row["Popularity"]) if row["Popularity"] else 0
                nb_plays   = int(row["NbPlays"])    if row["NbPlays"]    else 0
            except ValueError:
                total_skipped += 1
                continue

            if popularity < MIN_POPULARITY or nb_plays < MIN_NB_PLAYS:
                total_skipped += 1
                continue

            # Costruisci il documento
            puzzle_id = row["PuzzleId"]
            themes     = row["Themes"].split()       if row["Themes"]      else []
            opening    = row["OpeningTags"].split()  if row["OpeningTags"] else []

            doc = {
                "fen":         row["FEN"],
                "moves":       row["Moves"],
                "rating":      int(row["Rating"])          if row["Rating"]          else None,
                "ratingDev":   int(row["RatingDeviation"]) if row["RatingDeviation"] else None,
                "popularity":  popularity,
                "nbPlays":     nb_plays,
                "themes":      themes,
                "openingTags": opening,
                "gameUrl":     row.get("GameUrl", ""),
            }

            # Aggiungi al batch
            doc_ref = collection.document(puzzle_id)
            batch.set(doc_ref, doc)
            batch_count += 1
            total_imported += 1

            # Commit ogni BATCH_SIZE documenti
            if batch_count >= BATCH_SIZE:
                batch.commit()
                batch = db.batch()
                batch_count = 0
                elapsed = time.time() - start_time
                rate = total_imported / elapsed if elapsed > 0 else 0
                print(f"  {total_imported:>8,} importati | {total_skipped:>8,} saltati | {rate:.0f} doc/s")

            if MAX_PUZZLES and total_imported >= MAX_PUZZLES:
                break

    # Commit eventuale batch finale
    if batch_count > 0:
        batch.commit()

    elapsed = time.time() - start_time
    print(f"\n✅ Importazione completata!")
    print(f"   Puzzle importati: {total_imported:,}")
    print(f"   Puzzle saltati:   {total_skipped:,}")
    print(f"   Tempo totale:     {elapsed/60:.1f} minuti")


def create_indexes_reminder():
    print("""
─────────────────────────────────────────────────────────────────────
IMPORTANTE — Crea gli indici compositi su Firestore:

Vai su console.firebase.google.com → NeuroScacchi → Firestore
→ Indici → Indici compositi → Aggiungi indice:

  Collection: puzzles
  Campi: rating (Ascending), themes (Arrays)

  Collection: puzzles
  Campi: themes (Arrays), rating (Ascending)

Senza questi indici le query per tema + rating non funzionano.
─────────────────────────────────────────────────────────────────────
""")


def main():
    print("=== Import puzzle Lichess → Firestore ===\n")

    # Verifica file service account
    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        print(f"ERRORE: file service account non trovato:")
        print(f"  {SERVICE_ACCOUNT_PATH}")
        print("\nScaricalo da Firebase Console → Impostazioni progetto → Account di servizio")
        sys.exit(1)

    # Scarica CSV se necessario
    download_csv()

    # Inizializza Firebase
    print("Connessione a Firebase...")
    db = init_firebase()
    print("Connesso.\n")

    # Importa
    import_puzzles(db)

    # Promemoria indici
    create_indexes_reminder()


if __name__ == "__main__":
    main()
