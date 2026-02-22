// src/gesture/recognizer.ts
import { Direction, GesturePattern } from '../types/gesture';

export interface RecognizerOptions {
  thresholdPx?: number;   // 한 세그먼트 최소 길이
  maxSegments?: number;   // 허용할 최대 방향 개수
}

/** 마우스 궤적으로부터 제스처 패턴을 산출하는 클래스 */
export class GestureRecognizer {
  private segments: Direction[] = [];
  private lastPoint = { x: 0, y: 0 };
  private readonly THRESH: number;
  private readonly MAX_SEG: number;

  constructor(opts: RecognizerOptions = {}) {
    this.THRESH   = opts.thresholdPx ?? 60;
    this.MAX_SEG  = opts.maxSegments ?? 4;
  }

  /** mousedown 시 호출 */
  start(x: number, y: number) {
    this.segments = [];
    this.lastPoint = { x, y };
  }

  /** mousemove 시 호출 */
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
      onChange?.([...this.segments]); // 실시간 피드백
    }
  }

  /** mouseup 시 호출 → 최종 패턴 반환 */
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

  /** 연속 중복 제거, 왕복 패턴 정규화 */
  private normalize(seg: Direction[]): GesturePattern {
    const condensed = seg.filter((d, i, a) => i === 0 || d !== a[i - 1]);

    // 좌우·상하 1회 왕복 (2-step) ⇢ 특수 토큰
    if (condensed.length === 2 && condensed[0] !== condensed[1]) {
      const pair = new Set([condensed[0], condensed[1]]);
      if (pair.has('left') && pair.has('right')) return ['LR-LR'];
      if (pair.has('up') && pair.has('down')) return ['UD-UD'];
    }

    // 4-step 왕복 패턴은 더 이상 사용하지 않음
    return condensed.slice(0, 2); // 최대 2-step
  }
}
