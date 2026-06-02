// src/models/types.ts

export enum Direction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
}

export enum RepeatPattern {
  UP_DOWN = 'up_down',
  LEFT_RIGHT = 'left_right',
}

// 단일 제스처 타입
export interface SimpleGesture {
  type: 'simple';
  direction: Direction;
}

// 복합(2단계) 제스처 타입
export interface CompositeGesture {
  type: 'composite';
  first: Direction;
  second: Direction;
}

// 반복 제스처 타입
export interface RepeatGesture {
  type: 'repeat';
  pattern: RepeatPattern;
  count: number; // 반복 횟수
}

export type Gesture = SimpleGesture | CompositeGesture | RepeatGesture;

// 제스처 시작점과 현재 포인트
export interface GesturePoint {
  x: number;
  y: number;
}

export interface GestureState {
  isActive: boolean;
  startPoint: GesturePoint;
  currentPoint: GesturePoint;
  paths: GesturePoint[];
  recognizedGesture: Gesture | null;
  previousDirection: Direction | null;
  directionChanges: {direction: Direction, timestamp: number}[];
}
