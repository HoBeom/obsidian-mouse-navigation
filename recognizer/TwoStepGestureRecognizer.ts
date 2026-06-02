// src/recognizer/TwoStepGestureRecognizer.ts

import GestureRecognizer, { GestureRecognizerOptions } from './GestureRecognizer';
import { Direction, Gesture, GesturePoint, GestureState } from '../models/types';

export interface TwoStepGestureRecognizerOptions extends GestureRecognizerOptions {
  directionChangeDelay: number; // 두 단계 간의 지연 시간 (ms)
  secondStepMinDistance: number; // 두 번째 방향 인식에 필요한 최소 거리
}

export default class TwoStepGestureRecognizer extends GestureRecognizer {
  protected options: TwoStepGestureRecognizerOptions;
  
  constructor(options: Partial<TwoStepGestureRecognizerOptions> = {}) {
    super(options);
    this.options = {
      ...this.options,
      directionChangeDelay: 200,
      secondStepMinDistance: 40,
      ...options
    };
  }
  
  public recognizeGesture(state: GestureState): Gesture | null {
    // 기본 제스처 인식 (기존 로직)
    const baseGesture = super.recognizeGesture(state);
    
    // 경로 점들을 분석하여 2단계 제스처를 더 정확하게 인식
    if (state.paths.length >= 3 && state.directionChanges.length >= 2) {
      const compositeGesture = this.analyzePathForTwoStepGesture(state);
      if (compositeGesture) {
        return compositeGesture;
      }
    }
    
    return baseGesture;
  }
  
  private analyzePathForTwoStepGesture(state: GestureState): Gesture | null {
    const paths = state.paths;
    
    // 경로를 세그먼트로 분할
    const segments = this.dividePathIntoSegments(paths);
    
    // 세그먼트가 2개 이상인 경우에만 복합 제스처 분석
    if (segments.length >= 2) {
      // 첫 번째 세그먼트의 주요 방향 결정
      const firstSegment = segments[0];
      const firstDirection = this.getSegmentDirection(
        firstSegment[0], 
        firstSegment[firstSegment.length - 1]
      );
      
      // 마지막 세그먼트의 주요 방향 결정
      const lastSegment = segments[segments.length - 1];
      const secondDirection = this.getSegmentDirection(
        lastSegment[0], 
        lastSegment[lastSegment.length - 1]
      );
      
      if (firstDirection && secondDirection && firstDirection !== secondDirection) {
        return {
          type: 'composite',
          first: firstDirection,
          second: secondDirection
        };
      }
    }
    
    return null;
  }
  
  private dividePathIntoSegments(paths: GesturePoint[]): GesturePoint[][] {
    const segments: GesturePoint[][] = [];
    let currentSegment: GesturePoint[] = [paths[0]];
    
    for (let i = 1; i < paths.length; i++) {
      const prevPoint = paths[i - 1];
      const currentPoint = paths[i];
      
      // 방향 변화 감지
      if (this.isDirectionChange(currentSegment, currentPoint)) {
        segments.push([...currentSegment]);
        currentSegment = [prevPoint, currentPoint];
      } else {
        currentSegment.push(currentPoint);
      }
    }
    
    // 마지막 세그먼트 추가
    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }
    
    return segments;
  }
  
  private isDirectionChange(segmentPoints: GesturePoint[], newPoint: GesturePoint): boolean {
    if (segmentPoints.length < 2) return false;
    
    const lastPoint = segmentPoints[segmentPoints.length - 1];
    const prevPoint = segmentPoints[segmentPoints.length - 2];
    
    const prevDx = lastPoint.x - prevPoint.x;
    const prevDy = lastPoint.y - prevPoint.y;
    const newDx = newPoint.x - lastPoint.x;
    const newDy = newPoint.y - lastPoint.y;
    
    const prevAngle = Math.atan2(prevDy, prevDx);
    const newAngle = Math.atan2(newDy, newDx);
    
    // 각도 차이 계산 (라디안)
    let angleDiff = Math.abs(prevAngle - newAngle);
    if (angleDiff > Math.PI) {
      angleDiff = 2 * Math.PI - angleDiff;
    }
    
    // 임계값보다 큰 각도 변화가 있을 때 방향 변화로 간주
    return angleDiff > Math.PI / 4;
  }
  
  private getSegmentDirection(start: GesturePoint, end: GesturePoint): Direction | null {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < this.options.secondStepMinDistance) {
      return null;
    }
    
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    
    if (absX > absY) {
      return dx > 0 ? Direction.RIGHT : Direction.LEFT;
    } else {
      return dy > 0 ? Direction.DOWN : Direction.UP;
    }
  }
}
