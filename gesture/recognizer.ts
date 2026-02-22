// src/gesture/recognizer.ts
import { Direction, GesturePattern } from '../types/gesture';

export interface RecognizerOptions {
  thresholdPx?: number;   // Minimum segment length in pixels
  maxSegments?: number;   // Maximum number of direction segments
}

/** Computes gesture patterns from mouse trajectories */
export class GestureRecognizer {
  private segments: Direction[] = [];
  private lastPoint = { x: 0, y: 0 };
  private readonly THRESH: number;
  private readonly MAX_SEG: number;

  constructor(opts: RecognizerOptions = {}) {
    this.THRESH   = opts.thresholdPx ?? 60;
    this.MAX_SEG  = opts.maxSegments ?? 4;
  }

  /** Called on mousedown */
  start(x: number, y: number) {
    this.segments = [];
    this.lastPoint = { x, y };
  }

  /** Called on mousemove */
  track(x: number, y: number, onChange?: (segments: Direction[]) => void) {
    const dx = x - this.lastPoint.x;
    const dy = y - this.lastPoint.y;
    const dir = this.calcDirection(dx, dy);
    if (
      dir &&
      dir !== this.segments[this.segments.length - 1] &&
      this.segments.length < this.MAX_SEG
    ) {
      this.segments.push(dir);
      this.lastPoint = { x, y };
      onChange?.([...this.segments]); // Real-time feedback
    }
  }

  /** Called on mouseup → returns final pattern */
  finish(): GesturePattern {
    return this.normalize(this.segments);
  }

  getThresholdPx() {
    return this.THRESH;
  }

  // ──────────────────────────────────────────── private

  private calcDirection(dx: number, dy: number): Direction | null {
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > this.THRESH) return dx > 0 ? 'right' : 'left';
    } else {
      if (Math.abs(dy) > this.THRESH) return dy > 0 ? 'down' : 'up';
    }
    return null;
  }

  /** Deduplicate consecutive directions, normalize alternating patterns */
  private normalize(seg: Direction[]): GesturePattern {
    const condensed = seg.filter((d, i, a) => i === 0 || d !== a[i - 1]);

    // Single horizontal/vertical alternation (2-step) → special token
    if (condensed.length === 2 && condensed[0] !== condensed[1]) {
      const pair = new Set([condensed[0], condensed[1]]);
      if (pair.has('left') && pair.has('right')) return ['LR-LR'];
      if (pair.has('up') && pair.has('down')) return ['UD-UD'];
    }

    // 4-step alternating patterns are no longer used
    return condensed.slice(0, 2); // Max 2-step
  }
}
