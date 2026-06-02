// src/recognizer/GestureRecognizer.ts

import { Direction, Gesture, GesturePoint, GestureState, RepeatPattern } from "../models/types";

export interface GestureRecognizerOptions {
  minDistance: number;  // 제스처로 인식할 최소 이동 거리
  directionChangeThreshold: number; // 방향 변경 인식 임계값
  repeatRecognitionTime: number; // 반복 제스처 인식 시간 (ms)
}

export default class GestureRecognizer {
  protected options: GestureRecognizerOptions;

  constructor(options: Partial<GestureRecognizerOptions> = {}) {
    this.options = {
      minDistance: 50,
      directionChangeThreshold: 30,
      repeatRecognitionTime: 800,
      ...options
    };
  }

  public recognizeGesture(state: GestureState): Gesture | null {
    if (!state.isActive || state.paths.length < 2) {
      return null;
    }
    
    // 첫 번째 단계: 단일 방향 제스처 인식
    const primaryDirection = this.getPrimaryDirection(state.startPoint, state.currentPoint);
    
    if (!primaryDirection) {
      return null;
    }
    
    // 방향 변경 감지 및 복합 제스처 확인
    const compositeGesture = this.detectCompositeGesture(state);
    if (compositeGesture) {
      return compositeGesture;
    }
    
    // 반복 제스처 확인
    const repeatGesture = this.detectRepeatGesture(state);
    if (repeatGesture) {
      return repeatGesture;
    }
    
    // 단일 방향 제스처 반환
    return {
      type: 'simple',
      direction: primaryDirection
    };
  }
  
  protected getPrimaryDirection(start: GesturePoint, end: GesturePoint): Direction | null {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    
    // 최소 이동 거리보다 작을 경우 방향 인식하지 않음
    if (Math.sqrt(dx * dx + dy * dy) < this.options.minDistance) {
      return null;
    }
    
    // X축 이동이 Y축보다 큰 경우
    if (absX > absY) {
      return dx > 0 ? Direction.RIGHT : Direction.LEFT;
    } else {
      return dy > 0 ? Direction.DOWN : Direction.UP;
    }
  }
  
  protected detectCompositeGesture(state: GestureState): Gesture | null {
    if (state.directionChanges.length < 2) {
      return null;
    }
    
    // 가장 최근의 두 방향 변경을 가져옴
    const lastChanges = state.directionChanges.slice(-2);
    const [firstDirection, secondDirection] = lastChanges.map(change => change.direction);
    
    // 두 방향이 다른 경우에만 복합 제스처로 인식
    if (firstDirection !== secondDirection) {
      return {
        type: 'composite',
        first: firstDirection,
        second: secondDirection
      };
    }
    
    return null;
  }
  
  protected detectRepeatGesture(state: GestureState): Gesture | null {
    if (state.directionChanges.length < 4) {
      return null;
    }
    
    const changes = state.directionChanges;
    const lastFour = changes.slice(-4);
    
    // 상-하 반복 패턴 확인 (상-하-상-하)
    if (
      lastFour[0].direction === Direction.UP &&
      lastFour[1].direction === Direction.DOWN &&
      lastFour[2].direction === Direction.UP &&
      lastFour[3].direction === Direction.DOWN
    ) {
      const timeSpan = lastFour[3].timestamp - lastFour[0].timestamp;
      if (timeSpan <= this.options.repeatRecognitionTime) {
        return {
          type: 'repeat',
          pattern: RepeatPattern.UP_DOWN,
          count: 2
        };
      }
    }
    
    // 좌-우 반복 패턴 확인 (좌-우-좌-우)
    if (
      lastFour[0].direction === Direction.LEFT &&
      lastFour[1].direction === Direction.RIGHT &&
      lastFour[2].direction === Direction.LEFT &&
      lastFour[3].direction === Direction.RIGHT
    ) {
      const timeSpan = lastFour[3].timestamp - lastFour[0].timestamp;
      if (timeSpan <= this.options.repeatRecognitionTime) {
        return {
          type: 'repeat',
          pattern: RepeatPattern.LEFT_RIGHT,
          count: 2
        };
      }
    }
    
    return null;
  }
}
