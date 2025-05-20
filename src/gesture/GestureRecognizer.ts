export type SimpleDirection = 'left' | 'right' | 'up' | 'down';
export type Gesture =
  | SimpleDirection
  | `${SimpleDirection}+${SimpleDirection}`
  | 'UD_REPEAT'
  | 'LR_REPEAT';

export default class GestureRecognizer {
  private directions: SimpleDirection[] = [];
  private lastX = 0;
  private lastY = 0;
  private threshold = 75;

  start(x: number, y: number) {
    this.directions = [];
    this.lastX = x;
    this.lastY = y;
  }

  addPoint(x: number, y: number) {
    const dx = x - this.lastX;
    const dy = y - this.lastY;
    let dir: SimpleDirection | null = null;
    if (Math.abs(dx) > this.threshold && Math.abs(dy) < this.threshold) {
      dir = dx > 0 ? 'right' : 'left';
    } else if (Math.abs(dy) > this.threshold && Math.abs(dx) < this.threshold) {
      dir = dy > 0 ? 'down' : 'up';
    }
    if (dir && this.directions[this.directions.length - 1] !== dir) {
      this.directions.push(dir);
      this.lastX = x;
      this.lastY = y;
    }
  }

  end(): Gesture | null {
    if (this.directions.length === 0) return null;
    if (this.isRepeat('up', 'down')) return 'UD_REPEAT';
    if (this.isRepeat('left', 'right')) return 'LR_REPEAT';
    if (this.directions.length === 1) return this.directions[0];
    return `${this.directions[0]}+${this.directions[1]}` as Gesture;
  }

  private isRepeat(a: SimpleDirection, b: SimpleDirection): boolean {
    if (this.directions.length < 4) return false;
    for (let i = 0; i < this.directions.length; i++) {
      const expected = i % 2 === 0 ? a : b;
      const expectedAlt = i % 2 === 0 ? b : a;
      if (this.directions[i] !== expected && this.directions[i] !== expectedAlt)
        return false;
    }
    return true;
  }
}
