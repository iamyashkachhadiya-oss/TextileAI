/**
 * Algorithmic Weave Matrix Generators
 * ====================================
 * Each generator returns a 2D binary matrix:
 *   1 = warp over weft  (raiser)
 *   0 = weft over warp  (sinker)
 *
 * Based on: "Algorithmic Textile Pattern Generation: A Computational Framework
 * for Dobby Weaving Systems" research document.
 */

export type WeaveMatrix = number[][]

// ─── Utility ──────────────────────────────────────────────────────────────────

/** Greatest common divisor (Euclidean algorithm) */
export function gcd(a: number, b: number): number {
  while (b) { [a, b] = [b, a % b] }
  return a
}

/** Check if two numbers are coprime */
export function areCoprime(a: number, b: number): boolean {
  return gcd(a, b) === 1
}

/** Clamp a value between min and max */
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

/** Create an n×n zero matrix */
function zeros(rows: number, cols: number): WeaveMatrix {
  return Array.from({ length: rows }, () => Array(cols).fill(0))
}

// ─── 1. Plain Weave ───────────────────────────────────────────────────────────

/**
 * Plain weave: highest interlacement index (1).
 * pattern[i][j] = (i + j) % 2
 * Repeat size: 2×2
 */
export function generatePlain(): WeaveMatrix {
  return [
    [1, 0],
    [0, 1],
  ]
}

// ─── 2. Rib Weaves ────────────────────────────────────────────────────────────

/**
 * Warp rib: extends interlacement vertically.
 * Warp threads travel over n weft threads and under n weft threads.
 * @param n  float length (default 2 → 2/2 warp rib)
 */
export function generateWarpRib(n: number = 2): WeaveMatrix {
  n = clamp(n, 2, 8)
  const size = n * 2
  const m = zeros(size, 2)
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < 2; j++) {
      m[i][j] = Math.floor(i / n) % 2 === j % 2 ? 1 : 0
    }
  }
  return m
}

/**
 * Weft rib: extends interlacement horizontally.
 * @param n  float length (default 2)
 */
export function generateWeftRib(n: number = 2): WeaveMatrix {
  n = clamp(n, 2, 8)
  const size = n * 2
  const m = zeros(2, size)
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < size; j++) {
      m[i][j] = Math.floor(j / n) % 2 === i % 2 ? 1 : 0
    }
  }
  return m
}

// ─── 3. Basket / Matt Weave ───────────────────────────────────────────────────

/**
 * Basket (Matt) weave: symmetric extension of plain weave on both axes.
 * Kronecker product of plain [[1,0],[0,1]] ⊗ ones(n×n)
 * @param n  basket unit size (default 2 → 2/2 basket)
 */
export function generateBasket(n: number = 2): WeaveMatrix {
  n = clamp(n, 2, 6)
  const size = n * 2
  const m = zeros(size, size)
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const bi = Math.floor(i / n)
      const bj = Math.floor(j / n)
      m[i][j] = (bi + bj) % 2 === 0 ? 1 : 0
    }
  }
  return m
}

// ─── 4. Twill Weaves ─────────────────────────────────────────────────────────

/**
 * Standard twill: pattern[i][j] = ((i + j * dir) % repeat) < floatSize
 * dir: 1 = Z (right), -1 = S (left)
 * @param up    warp-up count (e.g. 3 for 3/1 twill)
 * @param down  warp-down count (e.g. 1 for 3/1 twill)
 * @param direction 'Z' | 'S'
 */
export function generateTwill(
  up: number = 3,
  down: number = 1,
  direction: 'Z' | 'S' = 'Z'
): WeaveMatrix {
  up = clamp(up, 1, 8)
  down = clamp(down, 1, 8)
  const repeat = up + down
  const dir = direction === 'Z' ? 1 : -1
  const m = zeros(repeat, repeat)
  for (let i = 0; i < repeat; i++) {
    for (let j = 0; j < repeat; j++) {
      m[i][j] = ((i + j * dir + repeat * 10) % repeat) < up ? 1 : 0
    }
  }
  return m
}

/**
 * Broken twill: disrupts the continuous diagonal by a non-linear phase shift.
 * The reversal prevents fabric from twisting off the loom.
 * @param up      warp-up count
 * @param down    warp-down count
 * @param jump    phase-shift amount (default: repeat/2)
 */
export function generateBrokenTwill(
  up: number = 3,
  down: number = 1,
  jump?: number
): WeaveMatrix {
  up = clamp(up, 1, 8)
  down = clamp(down, 1, 8)
  const repeat = up + down
  const j = jump ?? Math.floor(repeat / 2)
  const m = zeros(repeat * 2, repeat * 2)
  for (let i = 0; i < repeat * 2; i++) {
    for (let col = 0; col < repeat * 2; col++) {
      // Alternating Z then S direction blocks
      const half = col < repeat
      const dir = half ? 1 : -1
      const offset = half ? 0 : j
      m[i][col] = ((i + col * dir + offset + repeat * 20) % repeat) < up ? 1 : 0
    }
  }
  return m
}

/**
 * Herringbone: pointed twill where direction reversal is accompanied by phase shift.
 * Creates sharp "V" columns. Uses a pointed draft (column mirror).
 */
export function generateHerringbone(
  up: number = 2,
  down: number = 2
): WeaveMatrix {
  up = clamp(up, 1, 6)
  down = clamp(down, 1, 6)
  const half = up + down
  const full = half * 2
  const m = zeros(full, full)
  for (let i = 0; i < full; i++) {
    for (let j = 0; j < full; j++) {
      // Z direction for first half, S direction (mirrored) for second half
      const jLocal = j < half ? j : full - 1 - j
      m[i][j] = ((i + jLocal + half * 10) % half) < up ? 1 : 0
    }
  }
  return m
}

/**
 * Zig-Zag twill: reverses direction at every `period` picks.
 */
export function generateZigZag(
  up: number = 2,
  down: number = 2,
  period?: number
): WeaveMatrix {
  up = clamp(up, 1, 6)
  down = clamp(down, 1, 6)
  const repeat = up + down
  const p = period ?? repeat
  const height = p * 2
  const m = zeros(height, repeat)
  for (let i = 0; i < height; i++) {
    const dir = Math.floor(i / p) % 2 === 0 ? 1 : -1
    for (let j = 0; j < repeat; j++) {
      m[i][j] = ((i * dir + j + repeat * 20) % repeat) < up ? 1 : 0
    }
  }
  return m
}

// ─── 5. Satin / Sateen ────────────────────────────────────────────────────────

/**
 * Satin: maximizes float length, scatters interlacement points to eliminate twill line.
 * Uses coprime jump logic: interlacement at row i placed at column (i * step) % n.
 * Constraints from research:
 *   - gcd(n, step) === 1
 *   - step !== 1 and step !== n-1 (else it's just a twill)
 *   - n cannot be 6 (true satin mathematically impossible on 6 shafts)
 *
 * @param n     repeat size (minimum 5; 6 is invalid)
 * @param step  move number (must be coprime with n)
 */
export function generateSatin(n: number = 5, step: number = 2): WeaveMatrix {
  // Validate constraints
  if (n === 6) {
    console.warn('Satin: 6-shaft true satin is mathematically impossible. Using n=5.')
    n = 5
  }
  n = clamp(n, 5, 16)
  // Find a valid step if the provided one is invalid
  if (!areCoprime(n, step) || step === 1 || step === n - 1) {
    step = VALID_SATIN_STEPS[n]?.[0] ?? 2
  }

  const m = zeros(n, n)
  for (let i = 0; i < n; i++) {
    const j = (i * step) % n
    m[i][j] = 1
  }
  return m
}

/** Hardcoded valid satin move numbers per research table */
export const VALID_SATIN_STEPS: Record<number, number[]> = {
  5:  [2, 3],
  6:  [],             // impossible
  7:  [2, 3, 4, 5],
  8:  [3, 5],
  10: [3, 7],
  12: [5, 7],
  16: [3, 5, 7, 9, 11, 13],
  24: [5, 7, 11, 13, 17, 19],
}

/** Get all valid satin step values for a given repeat size */
export function getValidSatinSteps(n: number): number[] {
  if (VALID_SATIN_STEPS[n]) return VALID_SATIN_STEPS[n]
  // For prime n, any 2..n-2 is valid
  const isPrime = (x: number) => {
    for (let i = 2; i <= Math.sqrt(x); i++) if (x % i === 0) return false
    return x > 1
  }
  if (isPrime(n)) return Array.from({ length: n - 3 }, (_, i) => i + 2)
  // Otherwise enumerate coprimes
  return Array.from({ length: n - 3 }, (_, i) => i + 2).filter(s => areCoprime(n, s) && s !== 1 && s !== n - 1)
}

// ─── 6. Dobby Structures ─────────────────────────────────────────────────────

/**
 * Honeycomb: diamond base crossed by double diagonal. Creates cellular 3D texture.
 * Maximum float length ≤ n/2 per research constraint.
 * Minimum repeat: 6. Requires even repeat size.
 * @param n  repeat size (minimum 6, even)
 */
export function generateHoneycomb(n: number = 8): WeaveMatrix {
  n = Math.max(6, n % 2 === 0 ? n : n + 1)
  n = Math.min(n, 16)
  const m = zeros(n, n)
  const half = n / 2
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      // Diamond distance from center
      const di = Math.abs(i - half)
      const dj = Math.abs(j - half)
      const dist = di + dj
      // Ridges: near diamond edge → warp up (1)
      // Centers: float zone → warp down (0)
      m[i][j] = dist >= half - 1 ? 1 : (i + j) % 2
    }
  }
  return m
}

/**
 * Brighton Honeycomb: complex derivative requiring repeat divisible by 4, minimum 12.
 */
export function generateBrightonHoneycomb(n: number = 12): WeaveMatrix {
  // n must be multiple of 4, min 12
  n = Math.max(12, Math.round(n / 4) * 4)
  n = Math.min(n, 24)
  return generateHoneycomb(n) // Derived from base honeycomb with tighter constraints
}

/**
 * Birdseye: small symmetrical pattern from pointed twill with pointed treadling.
 * Requires minimum 4 shafts.
 */
export function generateBirdseye(n: number = 4): WeaveMatrix {
  n = Math.max(4, Math.min(n, 8))
  const m = generateHerringbone(Math.floor(n / 2), Math.floor(n / 2))
  return m
}

/**
 * Diamond Weave: symmetric diamond motif derived from pointed twill.
 */
export function generateDiamond(n: number = 8): WeaveMatrix {
  n = clamp(n, 4, 16)
  const m = zeros(n, n)
  const half = n / 2
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      // Pointed row and column with diamond intersection
      const ri = i < half ? i : n - 1 - i
      const rj = j < half ? j : n - 1 - j
      m[i][j] = ((ri + rj) % (half)) < Math.ceil(half / 2) ? 1 : 0
    }
  }
  return m
}

/**
 * Mock Leno: simulates leno (gauze) weave with alternating open and dense rows.
 */
export function generateMockLeno(n: number = 8): WeaveMatrix {
  n = Math.max(4, n % 2 === 0 ? n : n + 1)
  const m = zeros(n, n)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i % 2 === 0) {
        // Alternating warp/weft (open)
        m[i][j] = j % 2
      } else {
        // Dense interlacement row
        m[i][j] = 1
      }
    }
  }
  return m
}

/**
 * Crepe (Moss Crepe): pseudo-random distribution eliminating visible repeat.
 * Algorithm: start with plain weave base, randomly flip bits at target intensity.
 * Constraints per research: weft floats ≤ 3, warp floats ≤ 2.
 *
 * @param seed       deterministic seed for reproducibility
 * @param n          repeat size (default 8)
 * @param intensity  fraction of bits to flip (0.0–0.5, default 0.2)
 */
export function generateCrepe(seed: number = 42, n: number = 8, intensity: number = 0.2): WeaveMatrix {
  n = clamp(n, 6, 16)
  intensity = clamp(intensity, 0.05, 0.45)

  // Simple seeded PRNG (LCG)
  let rng = seed
  const rand = () => {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff
    return (rng >>> 0) / 0xffffffff
  }

  // Start with plain weave
  const m: WeaveMatrix = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i + j) % 2)
  )

  // Randomly flip bits
  const totalCells = n * n
  const flips = Math.floor(totalCells * intensity)
  for (let f = 0; f < flips; f++) {
    const i = Math.floor(rand() * n)
    const j = Math.floor(rand() * n)
    m[i][j] = m[i][j] ? 0 : 1
  }

  // Auto-correct: enforce weft floats ≤ 3, warp floats ≤ 2
  for (let i = 0; i < n; i++) {
    // Check consecutive 0s in row (weft floats)
    let runLen = 0
    for (let j = 0; j < n; j++) {
      if (m[i][j] === 0) {
        runLen++
        if (runLen > 3) { m[i][j] = 1; runLen = 0 } // auto-correct center bit
      } else { runLen = 0 }
    }
  }
  for (let j = 0; j < n; j++) {
    // Check consecutive 1s in column (warp floats)
    let runLen = 0
    for (let i = 0; i < n; i++) {
      if (m[i][j] === 1) {
        runLen++
        if (runLen > 2) { m[i][j] = 0; runLen = 0 }
      } else { runLen = 0 }
    }
  }

  return m
}

/**
 * Bedford Cord: prominent longitudinal warp lines.
 * Algorithmic repeat = cordEnds × 2.
 */
export function generateBedfordCord(cordEnds: number = 4): WeaveMatrix {
  cordEnds = clamp(cordEnds, 2, 8)
  const repeat = cordEnds * 2
  const m = zeros(repeat, repeat)
  for (let i = 0; i < repeat; i++) {
    for (let j = 0; j < repeat; j++) {
      if (j < cordEnds) {
        // Warp-dominant cord area
        m[i][j] = j % 2 === 0 ? 1 : (i % cordEnds === 0 ? 1 : 0)
      } else {
        // Sunken line area
        m[i][j] = (i + j) % 2
      }
    }
  }
  return m
}

/**
 * Houndstooth: color-and-weave effect on 2/2 balanced twill.
 * Structure is a simple 4/4 twill; visual houndstooth emerges from
 * alternating 4+4 color bands on both warp and weft.
 */
export function generateHoundstooth(): WeaveMatrix {
  // Base: 2/2 balanced twill on 8×8 repeat
  return generateTwill(2, 2, 'Z')
}

/** Color vectors for houndstooth effect: [1,1,1,1,0,0,0,0] repeat */
export const HOUNDSTOOTH_COLOR_VECTOR = [1, 1, 1, 1, 0, 0, 0, 0]

// ─── 7. Validation ────────────────────────────────────────────────────────────

/**
 * Validate a weave matrix:
 * - No row or column that is entirely 0 or entirely 1
 * - Warp float ≤ maxWarpFloat, weft float ≤ maxWeftFloat
 * - Max unique columns ≤ maxShafts
 * Returns array of validation messages (empty = valid).
 */
export function validateMatrix(
  m: WeaveMatrix,
  options: { maxWarpFloat?: number; maxWeftFloat?: number; maxShafts?: number; epi?: number } = {}
): string[] {
  const { maxWarpFloat = 8, maxWeftFloat = 8, maxShafts = 24 } = options
  // EPI-based float limit: max float = floor(EPI * 0.25) per research
  const floatLimit = options.epi ? Math.floor(options.epi * 0.25) : undefined

  const errors: string[] = []
  const rows = m.length
  if (!rows) return ['Empty matrix']
  const cols = m[0].length

  // Row/column all-zero or all-one check
  for (let i = 0; i < rows; i++) {
    const s = m[i].reduce((a, b) => a + b, 0)
    if (s === 0) errors.push(`Row ${i + 1} is entirely weft (never interlaces)`)
    if (s === cols) errors.push(`Row ${i + 1} is entirely warp (never interlaces)`)
  }
  for (let j = 0; j < cols; j++) {
    const s = m.reduce((a, r) => a + r[j], 0)
    if (s === 0) errors.push(`Column ${j + 1} is entirely weft`)
    if (s === rows) errors.push(`Column ${j + 1} is entirely warp`)
  }

  // Float length check: rows (weft floats = consecutive 0s)
  const weftMax = floatLimit ?? maxWeftFloat
  const warpMax = floatLimit ?? maxWarpFloat
  for (let i = 0; i < rows; i++) {
    let run = 0
    for (let j = 0; j < cols; j++) {
      run = m[i][j] === 0 ? run + 1 : 0
      if (run > weftMax) { errors.push(`Weft float > ${weftMax} at row ${i + 1}`); break }
    }
  }
  for (let j = 0; j < cols; j++) {
    let run = 0
    for (let i = 0; i < rows; i++) {
      run = m[i][j] === 1 ? run + 1 : 0
      if (run > warpMax) { errors.push(`Warp float > ${warpMax} at col ${j + 1}`); break }
    }
  }

  // Shaft limit: count unique column patterns
  const colSigs = new Set(m[0].map((_, j) => m.map(r => r[j]).join('')))
  if (colSigs.size > maxShafts) {
    errors.push(`Requires ${colSigs.size} shafts (limit: ${maxShafts}). Jacquard-only.`)
  }

  return errors
}

/** Count required shafts for a matrix */
export function countRequiredShafts(m: WeaveMatrix): number {
  if (!m.length) return 0
  const sigs = new Set(m[0].map((_, j) => m.map(r => r[j]).join('')))
  return sigs.size
}
