/**
 * import-lichess-puzzles.js
 *
 * Downloads the Lichess puzzle database (CSV, bz2-compressed) and imports
 * it into a local SQLite database at data/puzzles.db.
 *
 * Usage:
 *   npm run import:puzzles            # download (if needed) + import
 *   npm run import:puzzles -- --force  # re-download even if CSV exists
 *
 * Requires: bunzip2 on PATH, better-sqlite3 as devDependency.
 */

import { createRequire } from 'node:module';
import { createWriteStream, existsSync, mkdirSync, statSync, unlinkSync, createReadStream } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import https from 'node:https';
import http from 'node:http';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const DATA_DIR = join(PROJECT_ROOT, 'data');
const CSV_PATH = join(DATA_DIR, 'lichess_db_puzzle.csv');
const DB_PATH = join(DATA_DIR, 'puzzles.db');
const DOWNLOAD_URL = 'https://database.lichess.org/lichess_db_puzzle.csv.bz2';

const BATCH_SIZE = 10_000;
const PROGRESS_EVERY = 100_000;

const forceDownload = process.argv.includes('--force');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem}s` : `${s}s`;
}

/**
 * Follow HTTP(S) redirects and return the final response.
 */
function fetchFollowRedirects(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
        const location = res.headers.location;
        if (!location) return reject(new Error('Redirect without Location header'));
        res.resume(); // drain
        return resolve(fetchFollowRedirects(location, maxRedirects - 1));
      }
      resolve(res);
    }).on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------------

async function downloadAndDecompress() {
  if (existsSync(CSV_PATH) && !forceDownload) {
    const size = statSync(CSV_PATH).size;
    console.log(`CSV already exists (${formatBytes(size)}), skipping download. Use --force to re-download.`);
    return;
  }

  if (existsSync(CSV_PATH)) {
    unlinkSync(CSV_PATH);
  }

  console.log(`Downloading ${DOWNLOAD_URL} ...`);
  console.log('This may take several minutes depending on your connection.');

  const res = await fetchFollowRedirects(DOWNLOAD_URL);

  if (res.statusCode !== 200) {
    throw new Error(`Download failed: HTTP ${res.statusCode}`);
  }

  const totalBytes = parseInt(res.headers['content-length'], 10) || 0;
  let downloadedBytes = 0;
  let lastProgressPct = -1;

  // Pipe: HTTP response -> bunzip2 -> CSV file
  const bunzip2 = spawn('bunzip2', ['-c'], { stdio: ['pipe', 'pipe', 'pipe'] });
  const outStream = createWriteStream(CSV_PATH);

  // Track download progress on the compressed stream
  res.on('data', (chunk) => {
    downloadedBytes += chunk.length;
    if (totalBytes > 0) {
      const pct = Math.floor((downloadedBytes / totalBytes) * 100);
      if (pct !== lastProgressPct && pct % 5 === 0) {
        lastProgressPct = pct;
        process.stdout.write(`\r  Download: ${pct}% (${formatBytes(downloadedBytes)} / ${formatBytes(totalBytes)})`);
      }
    } else {
      // No content-length, show raw bytes
      if (downloadedBytes % (5 * 1024 * 1024) < 65536) {
        process.stdout.write(`\r  Downloaded: ${formatBytes(downloadedBytes)}`);
      }
    }
  });

  // Handle bunzip2 stderr
  let stderrData = '';
  bunzip2.stderr.on('data', (chunk) => { stderrData += chunk.toString(); });

  // Wire up: response -> bunzip2 stdin, bunzip2 stdout -> file
  const pipeIn = pipeline(res, bunzip2.stdin);
  const pipeOut = pipeline(bunzip2.stdout, outStream);

  await Promise.all([pipeIn, pipeOut]);

  // Check bunzip2 exit code
  const exitCode = await new Promise((resolve) => {
    if (bunzip2.exitCode !== null) return resolve(bunzip2.exitCode);
    bunzip2.on('close', resolve);
  });

  if (exitCode !== 0) {
    throw new Error(`bunzip2 failed with exit code ${exitCode}: ${stderrData}`);
  }

  console.log(`\n  Download + decompression complete.`);
  const size = statSync(CSV_PATH).size;
  console.log(`  CSV size: ${formatBytes(size)}`);
}

// ---------------------------------------------------------------------------
// SQLite import
// ---------------------------------------------------------------------------

function createDatabase() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = OFF'); // faster for bulk import
  db.pragma('cache_size = -64000'); // 64 MB

  db.exec('DROP TABLE IF EXISTS puzzles');
  db.exec(`
    CREATE TABLE puzzles (
      id TEXT PRIMARY KEY,
      fen TEXT NOT NULL,
      moves TEXT NOT NULL,
      rating INTEGER NOT NULL,
      rating_deviation INTEGER,
      popularity INTEGER,
      nb_plays INTEGER,
      themes TEXT,
      game_url TEXT,
      opening_tags TEXT
    )
  `);

  return db;
}

function createIndexes(db) {
  console.log('Creating indexes...');
  db.exec('CREATE INDEX idx_rating ON puzzles(rating)');
  db.exec('CREATE INDEX idx_popularity ON puzzles(popularity)');
  db.exec('CREATE INDEX idx_themes ON puzzles(themes)');
  db.exec('CREATE INDEX idx_nb_plays ON puzzles(nb_plays)');
  console.log('  Indexes created.');
}

/**
 * Parse a single CSV line, respecting quoted fields.
 * Returns an array of field values.
 */
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

async function importCSV(db) {
  console.log('Importing CSV into SQLite...');

  const insert = db.prepare(`
    INSERT OR REPLACE INTO puzzles
      (id, fen, moves, rating, rating_deviation, popularity, nb_plays, themes, game_url, opening_tags)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const beginTxn = db.prepare('BEGIN');
  const commitTxn = db.prepare('COMMIT');

  const rl = createInterface({
    input: createReadStream(CSV_PATH, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let count = 0;
  let skippedHeader = false;
  let batchCount = 0;
  let inTransaction = false;

  for await (const line of rl) {
    // Skip header line
    if (!skippedHeader) {
      skippedHeader = true;
      if (line.startsWith('PuzzleId')) continue;
    }

    if (line.trim() === '') continue;

    const fields = parseCSVLine(line);
    if (fields.length < 7) {
      // Malformed line, skip
      continue;
    }

    const [id, fen, moves, rating, ratingDev, popularity, nbPlays, themes, gameUrl, openingTags] = fields;

    if (!id || !fen || !moves || !rating) continue;

    if (!inTransaction) {
      beginTxn.run();
      inTransaction = true;
      batchCount = 0;
    }

    insert.run(
      id,
      fen,
      moves,
      parseInt(rating, 10),
      ratingDev ? parseInt(ratingDev, 10) : null,
      popularity ? parseInt(popularity, 10) : null,
      nbPlays ? parseInt(nbPlays, 10) : null,
      themes || null,
      gameUrl || null,
      openingTags || null,
    );

    count++;
    batchCount++;

    if (batchCount >= BATCH_SIZE) {
      commitTxn.run();
      inTransaction = false;
    }

    if (count % PROGRESS_EVERY === 0) {
      console.log(`  ${count.toLocaleString()} puzzles imported...`);
    }
  }

  // Commit remaining rows
  if (inTransaction) {
    commitTxn.run();
  }

  return count;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const startTime = Date.now();
  console.log('=== Lichess Puzzle Database Importer ===\n');

  ensureDataDir();

  // Step 1: Download
  await downloadAndDecompress();

  if (!existsSync(CSV_PATH)) {
    throw new Error(`CSV file not found at ${CSV_PATH}`);
  }

  // Step 2: Create DB
  console.log(`\nCreating database at ${DB_PATH} ...`);
  const db = createDatabase();

  // Step 3: Import
  const totalPuzzles = await importCSV(db);

  // Step 4: Create indexes
  createIndexes(db);

  db.close();

  // Step 5: Summary
  const elapsed = Date.now() - startTime;
  const dbSize = statSync(DB_PATH).size;

  console.log('\n=== Import Complete ===');
  console.log(`  Puzzles imported: ${totalPuzzles.toLocaleString()}`);
  console.log(`  Database size:    ${formatBytes(dbSize)}`);
  console.log(`  Time elapsed:     ${formatDuration(elapsed)}`);
  console.log(`  Database path:    ${DB_PATH}`);
}

main().catch((err) => {
  console.error('\nFATAL:', err.message || err);
  process.exit(1);
});
