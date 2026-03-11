export const LESSON_VERSION = '3.0.0';

export const STEP_TYPES = ['intent', 'detective', 'candidate', 'move', 'text', 'demo'];
export const CATEGORIES = ['openings', 'middlegame', 'endgame', 'tactics', 'strategy'];
export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

const ORIGINS = ['coach', 'ai', 'collaborative'];
const STATUSES = ['draft', 'published'];
const ORIENTATIONS = ['white', 'black'];
const METACOGNITION_TRIGGERS = ['post_activity', 'post_error', 'post_move'];

const FEN_REGEX = /^([pnbrqkPNBRQK1-8]{1,8}\/){7}[pnbrqkPNBRQK1-8]{1,8}\s[wb]\s[KQkq-]{1,4}\s[a-h1-8-]{1,2}\s\d+\s\d+$/;
const SQUARE_REGEX = /^[a-h][1-8]$/;
const UCI_MOVE_REGEX = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

function isNonEmptyString(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

function isValidFen(fen) {
  if (typeof fen !== 'string') return false;
  return FEN_REGEX.test(fen.trim());
}

function isValidSquare(sq) {
  return typeof sq === 'string' && SQUARE_REGEX.test(sq);
}

function isValidUciMove(m) {
  return typeof m === 'string' && UCI_MOVE_REGEX.test(m);
}

function validateVisualAids(aids, path, errors) {
  if (aids === null || aids === undefined) return;
  if (typeof aids !== 'object') {
    errors.push(`${path}: must be an object or null`);
    return;
  }
  if (aids.arrows) {
    if (!Array.isArray(aids.arrows)) {
      errors.push(`${path}.arrows: must be an array`);
    } else {
      aids.arrows.forEach((a, i) => {
        if (!isValidSquare(a.from)) errors.push(`${path}.arrows[${i}].from: invalid square`);
        if (!isValidSquare(a.to)) errors.push(`${path}.arrows[${i}].to: invalid square`);
      });
    }
  }
  if (aids.circles) {
    if (!Array.isArray(aids.circles)) {
      errors.push(`${path}.circles: must be an array`);
    } else {
      aids.circles.forEach((c, i) => {
        if (!isValidSquare(c.square)) errors.push(`${path}.circles[${i}].square: invalid square`);
      });
    }
  }
}

function validateFeedback(fb, path, errors) {
  if (!fb || typeof fb !== 'object') {
    errors.push(`${path}: feedback is required`);
    return;
  }
  if (!isNonEmptyString(fb.correct)) errors.push(`${path}.correct: required non-empty string`);
  if (!isNonEmptyString(fb.incorrect)) errors.push(`${path}.incorrect: required non-empty string`);
}

function validateTransition(transition, path, errors) {
  if (transition === null || transition === undefined) return;
  if (typeof transition !== 'object') {
    errors.push(`${path}: must be an object or null`);
    return;
  }
  if (!Array.isArray(transition.moves) || transition.moves.length === 0) {
    errors.push(`${path}.moves: must be a non-empty array of UCI moves`);
  } else {
    transition.moves.forEach((m, i) => {
      if (!isValidUciMove(m)) errors.push(`${path}.moves[${i}]: invalid UCI move "${m}"`);
    });
  }
  if (!isValidFen(transition.resultingFen)) {
    errors.push(`${path}.resultingFen: invalid FEN`);
  }
}

export function validateStep(step, index) {
  const errors = [];
  const warnings = [];
  const path = index !== undefined ? `steps[${index}]` : 'step';

  if (!step || typeof step !== 'object') {
    errors.push(`${path}: must be an object`);
    return { valid: false, errors, warnings };
  }

  if (!STEP_TYPES.includes(step.type)) {
    errors.push(`${path}.type: must be one of ${STEP_TYPES.join(', ')}, got "${step.type}"`);
  }

  if (step.type !== 'text' && step.type !== 'demo') {
    if (!isValidFen(step.fen)) {
      errors.push(`${path}.fen: invalid or missing FEN`);
    }
  }

  validateTransition(step.transition, `${path}.transition`, errors);

  switch (step.type) {
    case 'intent':
      validateIntentStep(step, path, errors);
      break;
    case 'detective':
      validateDetectiveStep(step, path, errors);
      break;
    case 'candidate':
      validateCandidateStep(step, path, errors);
      break;
    case 'move':
      validateMoveStep(step, path, errors);
      break;
    case 'text':
      validateTextStep(step, path, errors);
      break;
    case 'demo':
      validateDemoStep(step, path, errors);
      break;
  }

  return { valid: errors.length === 0, errors, warnings };
}

function validateIntentStep(step, path, errors) {
  if (!isNonEmptyString(step.question)) {
    errors.push(`${path}.question: required non-empty string`);
  }

  if (!Array.isArray(step.options) || step.options.length < 2 || step.options.length > 4) {
    errors.push(`${path}.options: must have 2-4 options`);
  } else {
    const correctCount = step.options.filter(o => o.correct === true).length;
    if (correctCount !== 1) {
      errors.push(`${path}.options: must have exactly 1 correct option, found ${correctCount}`);
    }
    step.options.forEach((o, i) => {
      if (!isNonEmptyString(o.text)) {
        errors.push(`${path}.options[${i}].text: required non-empty string`);
      }
    });
  }

  if (!Array.isArray(step.allowedMoves) || step.allowedMoves.length === 0) {
    errors.push(`${path}.allowedMoves: must be a non-empty array`);
  } else {
    step.allowedMoves.forEach((m, i) => {
      if (!isValidUciMove(m)) errors.push(`${path}.allowedMoves[${i}]: invalid UCI move "${m}"`);
    });
  }

  if (!Array.isArray(step.correctMoves) || step.correctMoves.length === 0) {
    errors.push(`${path}.correctMoves: must be a non-empty array`);
  } else {
    step.correctMoves.forEach((m, i) => {
      if (!isValidUciMove(m)) errors.push(`${path}.correctMoves[${i}]: invalid UCI move "${m}"`);
    });
    if (Array.isArray(step.allowedMoves)) {
      const notAllowed = step.correctMoves.filter(m => !step.allowedMoves.includes(m));
      if (notAllowed.length > 0) {
        errors.push(`${path}.correctMoves: moves [${notAllowed.join(', ')}] are not in allowedMoves`);
      }
    }
  }

  validateFeedback(step.feedback, `${path}.feedback`, errors);
  validateVisualAids(step.visualAids, `${path}.visualAids`, errors);
}

function validateDetectiveStep(step, path, errors) {
  if (!isNonEmptyString(step.question)) {
    errors.push(`${path}.question: required non-empty string`);
  }
  if (!isValidSquare(step.correctSquare)) {
    errors.push(`${path}.correctSquare: must be a valid square (a-h, 1-8), got "${step.correctSquare}"`);
  }
  if (step.maxAttempts !== undefined && (typeof step.maxAttempts !== 'number' || step.maxAttempts < 1)) {
    errors.push(`${path}.maxAttempts: must be a positive number`);
  }
  if (step.hints !== undefined) {
    if (!Array.isArray(step.hints)) {
      errors.push(`${path}.hints: must be an array`);
    }
  }
  validateFeedback(step.feedback, `${path}.feedback`, errors);
  validateVisualAids(step.visualAids, `${path}.visualAids`, errors);
}

function validateCandidateStep(step, path, errors) {
  if (!Array.isArray(step.candidateMoves) || step.candidateMoves.length === 0) {
    errors.push(`${path}.candidateMoves: must be a non-empty array`);
  } else {
    step.candidateMoves.forEach((m, i) => {
      if (!isValidUciMove(m)) errors.push(`${path}.candidateMoves[${i}]: invalid UCI move "${m}"`);
    });
  }

  if (typeof step.requiredCount !== 'number' || step.requiredCount < 1) {
    errors.push(`${path}.requiredCount: must be a positive number`);
  } else if (Array.isArray(step.candidateMoves) && step.requiredCount > step.candidateMoves.length) {
    errors.push(`${path}.requiredCount: ${step.requiredCount} exceeds candidateMoves length ${step.candidateMoves.length}`);
  }

  if (!isValidUciMove(step.bestMove)) {
    errors.push(`${path}.bestMove: invalid UCI move "${step.bestMove}"`);
  } else if (Array.isArray(step.candidateMoves) && !step.candidateMoves.includes(step.bestMove)) {
    errors.push(`${path}.bestMove: "${step.bestMove}" is not in candidateMoves`);
  }

  validateFeedback(step.feedback, `${path}.feedback`, errors);
  validateVisualAids(step.visualAids, `${path}.visualAids`, errors);
}

function validateMoveStep(step, path, errors) {
  if (!Array.isArray(step.correctMoves) || step.correctMoves.length === 0) {
    errors.push(`${path}.correctMoves: must be a non-empty array`);
  } else {
    step.correctMoves.forEach((m, i) => {
      if (!isValidUciMove(m)) errors.push(`${path}.correctMoves[${i}]: invalid UCI move "${m}"`);
    });
  }
  validateFeedback(step.feedback, `${path}.feedback`, errors);
  validateVisualAids(step.visualAids, `${path}.visualAids`, errors);
}

function validateTextStep(step, path, errors) {
  if (!isNonEmptyString(step.content)) {
    errors.push(`${path}.content: required non-empty string`);
  }
}

function validateDemoStep(step, path, errors) {
  if (!Array.isArray(step.moves) || step.moves.length === 0) {
    errors.push(`${path}.moves: must be a non-empty array of UCI moves`);
  } else {
    step.moves.forEach((m, i) => {
      if (!isValidUciMove(m)) errors.push(`${path}.moves[${i}]: invalid UCI move "${m}"`);
    });
  }
  if (!isNonEmptyString(step.explanation)) {
    errors.push(`${path}.explanation: required non-empty string`);
  }
}

export function validateLesson(lesson) {
  const errors = [];
  const warnings = [];

  if (!lesson || typeof lesson !== 'object') {
    return { valid: false, errors: ['lesson must be an object'], warnings: [] };
  }

  if (lesson.version !== LESSON_VERSION) {
    errors.push(`version: must be "${LESSON_VERSION}", got "${lesson.version}"`);
  }

  if (!isNonEmptyString(lesson.id) || /\s/.test(lesson.id)) {
    errors.push('id: must be a non-empty string without spaces');
  }

  if (!isNonEmptyString(lesson.title)) errors.push('title: required non-empty string');
  if (!isNonEmptyString(lesson.description)) errors.push('description: required non-empty string');

  if (!Array.isArray(lesson.authors) || lesson.authors.length === 0) {
    errors.push('authors: must be a non-empty array');
  }

  if (!CATEGORIES.includes(lesson.category)) {
    errors.push(`category: must be one of ${CATEGORIES.join(', ')}`);
  }
  if (!DIFFICULTIES.includes(lesson.difficulty)) {
    errors.push(`difficulty: must be one of ${DIFFICULTIES.join(', ')}`);
  }

  if (lesson.themes !== undefined && !Array.isArray(lesson.themes)) {
    errors.push('themes: must be an array');
  }

  if (!isValidFen(lesson.initialFen)) {
    errors.push('initialFen: invalid FEN');
  }

  if (!ORIENTATIONS.includes(lesson.orientation)) {
    errors.push(`orientation: must be "white" or "black"`);
  }

  // Steps
  if (!Array.isArray(lesson.steps) || lesson.steps.length === 0) {
    errors.push('steps: must have at least 1 step');
  } else {
    lesson.steps.forEach((step, i) => {
      const result = validateStep(step, i);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    });

    // Transition chain validation
    const lastIndex = lesson.steps.length - 1;
    lesson.steps.forEach((step, i) => {
      if (i === lastIndex) {
        if (step.transition) {
          errors.push(`steps[${lastIndex}]: last step must not have a transition`);
        }
      } else {
        if (!step.transition) {
          warnings.push(`steps[${i}]: non-last step should have a transition`);
        } else if (step.transition.resultingFen && lesson.steps[i + 1]) {
          const nextFen = lesson.steps[i + 1].fen;
          if (nextFen && step.transition.resultingFen.trim() !== nextFen.trim()) {
            errors.push(
              `steps[${i}].transition.resultingFen does not match steps[${i + 1}].fen`
            );
          }
        }
      }
    });
  }

  // Config validation
  if (lesson.config) {
    validateConfig(lesson.config, 'config', errors);
  }

  if (lesson.status && !STATUSES.includes(lesson.status)) {
    errors.push(`status: must be one of ${STATUSES.join(', ')}`);
  }
  if (lesson.origin && !ORIGINS.includes(lesson.origin)) {
    errors.push(`origin: must be one of ${ORIGINS.join(', ')}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

function validateConfig(config, path, errors) {
  if (typeof config !== 'object') {
    errors.push(`${path}: must be an object`);
    return;
  }
  if (config.freeze) {
    if (typeof config.freeze.enabled !== 'boolean') {
      errors.push(`${path}.freeze.enabled: must be a boolean`);
    }
    if (config.freeze.durationMs !== undefined && (typeof config.freeze.durationMs !== 'number' || config.freeze.durationMs < 0)) {
      errors.push(`${path}.freeze.durationMs: must be a non-negative number`);
    }
  }
  if (config.metacognition) {
    if (config.metacognition.trigger && !METACOGNITION_TRIGGERS.includes(config.metacognition.trigger)) {
      errors.push(`${path}.metacognition.trigger: must be one of ${METACOGNITION_TRIGGERS.join(', ')}`);
    }
    if (config.metacognition.questions && !Array.isArray(config.metacognition.questions)) {
      errors.push(`${path}.metacognition.questions: must be an array`);
    }
  }
}

const DEFAULT_CONFIG = {
  freeze: {
    enabled: true,
    durationMs: 2000,
  },
  confidenceCalibration: {
    enabled: false,
  },
  metacognition: {
    enabled: false,
    trigger: 'post_activity',
    questions: [],
  },
  graduatedFeedback: {
    enabled: false,
  },
  visualAids: {
    showAfterCorrect: true,
  },
};

export function createEmptyLesson() {
  const now = new Date().toISOString();
  return {
    version: LESSON_VERSION,
    id: '',
    title: '',
    description: '',
    authors: [],
    category: 'tactics',
    difficulty: 'beginner',
    themes: [],
    targetRatingMin: null,
    targetRatingMax: null,
    estimatedMinutes: null,
    initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    orientation: 'white',
    steps: [createStep('move')],
    config: structuredClone(DEFAULT_CONFIG),
    status: 'draft',
    origin: 'coach',
    createdAt: now,
    updatedAt: now,
    sourcePuzzleIds: null,
  };
}

export function createStep(type) {
  if (!STEP_TYPES.includes(type)) {
    throw new Error(`Invalid step type: "${type}". Must be one of: ${STEP_TYPES.join(', ')}`);
  }

  const base = {
    type,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    configOverrides: null,
    transition: null,
  };

  switch (type) {
    case 'intent':
      return {
        ...base,
        question: '',
        options: [
          { text: '', correct: true },
          { text: '', correct: false },
        ],
        allowedMoves: [],
        correctMoves: [],
        feedback: { correct: '', incorrect: '' },
        visualAids: null,
      };

    case 'detective':
      return {
        ...base,
        question: '',
        correctSquare: 'e4',
        maxAttempts: 3,
        feedback: { correct: '', incorrect: '' },
        hints: [],
        visualAids: null,
      };

    case 'candidate':
      return {
        ...base,
        instruction: null,
        requiredCount: 2,
        candidateMoves: [],
        bestMove: 'e2e4',
        feedback: { correct: '', incorrect: '' },
        visualAids: null,
      };

    case 'move':
      return {
        ...base,
        instruction: null,
        correctMoves: [],
        feedback: { correct: '', incorrect: '' },
        visualAids: null,
      };

    case 'text':
      return {
        ...base,
        content: '',
      };

    case 'demo':
      return {
        ...base,
        moves: [],
        explanation: '',
        autoPlay: false,
        playbackSpeedMs: 1500,
      };
  }
}
