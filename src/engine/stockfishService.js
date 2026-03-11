const TIMEOUT_MS = 15000;

const CLASSIFICATION_THRESHOLDS = [
  { max: 30, label: 'ottima' },
  { max: 100, label: 'buona' },
  { max: 250, label: 'imprecisione' },
  { max: Infinity, label: 'errore' },
];

function classify(deltaEval) {
  return CLASSIFICATION_THRESHOLDS.find(t => deltaEval < t.max).label;
}

function parseInfoLine(line) {
  const tokens = line.split(' ');
  const info = {};

  for (let i = 0; i < tokens.length; i++) {
    switch (tokens[i]) {
      case 'depth':
        info.depth = parseInt(tokens[++i]);
        break;
      case 'multipv':
        info.multipv = parseInt(tokens[++i]);
        break;
      case 'score':
        if (tokens[i + 1] === 'cp') {
          info.eval = parseInt(tokens[i + 2]);
          info.mate = null;
          i += 2;
        } else if (tokens[i + 1] === 'mate') {
          info.mate = parseInt(tokens[i + 2]);
          info.eval = info.mate > 0 ? 100000 - info.mate : -100000 - info.mate;
          i += 2;
        }
        break;
      case 'pv':
        info.pv = tokens.slice(i + 1).join(' ');
        i = tokens.length;
        break;
    }
  }

  return info;
}

class StockfishService {
  constructor() {
    this._state = 'idle';
    this._worker = null;
    this._pendingResolve = null;
    this._pendingReject = null;
    this._timeoutId = null;
    this._analysisResults = new Map();
    this._currentDepth = 0;
  }

  getState() {
    return this._state;
  }

  init() {
    if (this._state === 'ready' || this._state === 'analyzing') {
      return Promise.resolve();
    }

    if (this._state === 'initializing') {
      return this._initPromise;
    }

    this._state = 'initializing';
    this._initPromise = new Promise((resolve, reject) => {
      try {
        this._worker = new Worker('/stockfish/stockfish-18-lite-single.js');
      } catch (err) {
        this._state = 'idle';
        reject(new Error(`Failed to create Stockfish worker: ${err.message}`));
        return;
      }

      let phase = 'uci';

      this._worker.onmessage = (e) => {
        const line = typeof e.data === 'string' ? e.data : String(e.data);

        if (phase === 'uci' && line === 'uciok') {
          phase = 'isready';
          this._worker.postMessage('isready');
          return;
        }

        if (phase === 'isready' && line === 'readyok') {
          phase = 'done';
          this._state = 'ready';
          this._setupMessageHandler();
          resolve();
          return;
        }
      };

      this._worker.onerror = (err) => {
        this._state = 'idle';
        reject(new Error(`Stockfish worker error: ${err.message}`));
      };

      this._worker.postMessage('uci');
    });

    return this._initPromise;
  }

  _setupMessageHandler() {
    this._worker.onmessage = (e) => {
      const line = typeof e.data === 'string' ? e.data : String(e.data);

      if (line.startsWith('info') && line.includes(' pv ')) {
        const info = parseInfoLine(line);
        if (info.depth != null && info.eval != null) {
          const key = info.multipv || 1;
          const existing = this._analysisResults.get(key);
          if (!existing || info.depth >= existing.depth) {
            this._analysisResults.set(key, info);
          }
          if (key === 1) {
            this._currentDepth = info.depth;
          }
        }
      }

      if (line.startsWith('bestmove')) {
        const bestMove = line.split(' ')[1];
        this._resolveAnalysis(bestMove);
      }

      if (line === 'readyok' && this._pendingResolve) {
        this._resolveAnalysis(null);
      }
    };

    this._worker.onerror = (err) => {
      if (this._pendingReject) {
        this._pendingReject(new Error(`Stockfish error: ${err.message}`));
        this._cleanup();
      }
    };
  }

  _resolveAnalysis(bestMove) {
    if (!this._pendingResolve) return;
    const resolve = this._pendingResolve;
    const results = new Map(this._analysisResults);
    this._cleanup();
    this._state = 'ready';
    resolve({ bestMove, results });
  }

  _cleanup() {
    clearTimeout(this._timeoutId);
    this._pendingResolve = null;
    this._pendingReject = null;
    this._timeoutId = null;
    this._analysisResults = new Map();
    this._currentDepth = 0;
  }

  _sendAnalysis(commands, timeoutMs = TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
      if (this._pendingResolve) {
        this._worker.postMessage('stop');
        const oldReject = this._pendingReject;
        this._cleanup();
        oldReject?.(new Error('Analysis interrupted'));
      }

      this._state = 'analyzing';
      this._pendingResolve = resolve;
      this._pendingReject = reject;

      this._timeoutId = setTimeout(() => {
        this._worker.postMessage('stop');
        const r = this._pendingReject;
        this._cleanup();
        this._state = 'ready';
        r?.(new Error('Analysis timed out'));
      }, timeoutMs);

      for (const cmd of commands) {
        this._worker.postMessage(cmd);
      }
    });
  }

  async _ensureReady() {
    if (this._state === 'idle') {
      await this.init();
    }
    if (this._state === 'initializing') {
      await this._initPromise;
    }
    if (this._state !== 'ready' && this._state !== 'analyzing') {
      throw new Error(`Stockfish not ready, current state: ${this._state}`);
    }
  }

  async evaluate(fen, { depth = 16 } = {}) {
    await this._ensureReady();

    const { bestMove, results } = await this._sendAnalysis([
      `position fen ${fen}`,
      `go depth ${depth}`,
    ]);

    const info = results.get(1);
    if (!info) {
      return { bestMove, eval: 0, pv: '', depth: 0, mate: null };
    }

    return {
      bestMove,
      eval: info.eval,
      pv: info.pv || '',
      depth: info.depth,
      mate: info.mate,
    };
  }

  async analyzeMove(fen, move, { depth = 16 } = {}) {
    await this._ensureReady();

    const evalBefore = await this.evaluate(fen, { depth });

    const { results } = await this._sendAnalysis([
      `position fen ${fen} moves ${move}`,
      `go depth ${depth}`,
    ]);

    const afterInfo = results.get(1);
    const rawEvalAfter = afterInfo ? afterInfo.eval : 0;
    const evalAfter = -rawEvalAfter;

    const deltaEval = Math.max(0, evalBefore.eval - evalAfter);

    return {
      evalBefore: evalBefore.eval,
      evalAfter,
      deltaEval,
      classification: classify(deltaEval),
      bestMove: evalBefore.bestMove,
    };
  }

  async getThreats(fen, { count = 3, depth = 16 } = {}) {
    await this._ensureReady();

    const parts = fen.split(' ');
    const flipped = [...parts];
    flipped[1] = parts[1] === 'w' ? 'b' : 'w';
    const opponentFen = flipped.join(' ');

    const { results } = await this._sendAnalysis([
      `setoption name MultiPV value ${count}`,
      `position fen ${opponentFen}`,
      `go depth ${depth}`,
    ]);

    this._worker.postMessage(`setoption name MultiPV value 1`);

    const threats = [];
    for (let i = 1; i <= count; i++) {
      const info = results.get(i);
      if (info) {
        threats.push({
          move: info.pv?.split(' ')[0] || '',
          eval: info.eval,
          pv: info.pv || '',
        });
      }
    }

    return threats;
  }

  async getBestMoves(fen, { count = 3, depth = 16 } = {}) {
    await this._ensureReady();

    const { results } = await this._sendAnalysis([
      `setoption name MultiPV value ${count}`,
      `position fen ${fen}`,
      `go depth ${depth}`,
    ]);

    this._worker.postMessage(`setoption name MultiPV value 1`);

    const moves = [];
    for (let i = 1; i <= count; i++) {
      const info = results.get(i);
      if (info) {
        moves.push({
          move: info.pv?.split(' ')[0] || '',
          eval: info.eval,
          pv: info.pv || '',
        });
      }
    }

    return moves;
  }

  stop() {
    if (this._state !== 'analyzing' || !this._worker) return;
    this._worker.postMessage('stop');
  }

  destroy() {
    if (this._worker) {
      this.stop();
      if (this._pendingReject) {
        this._pendingReject(new Error('Worker destroyed'));
        this._cleanup();
      }
      this._worker.terminate();
      this._worker = null;
    }
    this._state = 'idle';
    this._initPromise = null;
  }
}

const stockfishService = new StockfishService();

export { StockfishService };
export default stockfishService;
