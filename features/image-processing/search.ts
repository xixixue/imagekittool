/**
 * Bounded binary search for the highest encode quality whose output size is at or
 * under a target byte budget. Used by "Compress Image to KB" (SPEC §4.5).
 *
 * Guarantees (SPEC §4.5 / §19):
 * - Never loops forever: capped by maxIterations and a time budget.
 * - If no quality meets the target, returns the closest result and reports met=false.
 * - Does not promise every image can reach an arbitrary target.
 */

export interface SearchOptions {
  targetBytes: number;
  maxIterations?: number;
  minQuality?: number;
  maxQuality?: number;
  /** Acceptable byte slack above the target still considered "met". */
  tolerance?: number;
  timeBudgetMs?: number;
}

export type StoppedReason = "met" | "maxIterations" | "timeBudget" | "minQualityFloor";

export interface SearchResult {
  quality: number;
  bytes: number;
  iterations: number;
  met: boolean;
  stoppedReason: StoppedReason;
}

/**
 * @param encode returns the byte size for a given quality (0..1). Must be
 *   monotonically non-increasing: lower quality → smaller-or-equal bytes.
 */
export async function findQualityForTargetSize(
  encode: (quality: number) => Promise<{ bytes: number }>,
  opts: SearchOptions,
): Promise<SearchResult> {
  const target = opts.targetBytes;
  const maxIterations = opts.maxIterations ?? 12;
  const minQ = opts.minQuality ?? 0.05;
  const maxQ = opts.maxQuality ?? 0.95;
  const tolerance = opts.tolerance ?? 0;
  const timeBudget = opts.timeBudgetMs ?? 4000;
  const start = Date.now();

  let lo = minQ;
  let hi = maxQ;
  let bestUnder: { quality: number; bytes: number } | null = null;
  let lastOver: { quality: number; bytes: number } | null = null;
  let iterations = 0;
  let stoppedReason: StoppedReason = "maxIterations";

  while (iterations < maxIterations) {
    if (Date.now() - start > timeBudget) {
      stoppedReason = "timeBudget";
      break;
    }
    const mid = (lo + hi) / 2;
    iterations += 1;
    const { bytes } = await encode(mid);

    if (bytes <= target + tolerance) {
      bestUnder = { quality: mid, bytes };
      lo = mid; // try higher quality
    } else {
      lastOver = { quality: mid, bytes };
      hi = mid; // try lower quality
    }

    if (hi - lo < 0.01) {
      stoppedReason = bestUnder ? "met" : "minQualityFloor";
      break;
    }
  }

  if (bestUnder) {
    return {
      quality: bestUnder.quality,
      bytes: bestUnder.bytes,
      iterations,
      met: true,
      stoppedReason: bestUnder ? stoppedReason : "maxIterations",
    };
  }

  // Nothing met the target: return the closest over (or the floor as last resort).
  if (!lastOver) {
    const floor = await encode(minQ);
    iterations += 1;
    return {
      quality: minQ,
      bytes: floor.bytes,
      iterations,
      met: false,
      stoppedReason: "minQualityFloor",
    };
  }
  return {
    quality: lastOver.quality,
    bytes: lastOver.bytes,
    iterations,
    met: false,
    stoppedReason: "minQualityFloor",
  };
}
