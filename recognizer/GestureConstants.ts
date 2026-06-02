// src/recognizer/GestureConstants.ts

import { CompositeGesture, Direction, RepeatPattern, SimpleGesture, RepeatGesture } from "../models/types";

// 단일 방향 제스처 상수
export const SIMPLE_GESTURES = {
  UP: { type: 'simple', direction: Direction.UP } as SimpleGesture,
  DOWN: { type: 'simple', direction: Direction.DOWN } as SimpleGesture,
  LEFT: { type: 'simple', direction: Direction.LEFT } as SimpleGesture,
  RIGHT: { type: 'simple', direction: Direction.RIGHT } as SimpleGesture,
};

// 복합 제스처 상수
export const COMPOSITE_GESTURES = {
  DOWN_LEFT: { type: 'composite', first: Direction.DOWN, second: Direction.LEFT } as CompositeGesture,
  DOWN_RIGHT: { type: 'composite', first: Direction.DOWN, second: Direction.RIGHT } as CompositeGesture,
  UP_LEFT: { type: 'composite', first: Direction.UP, second: Direction.LEFT } as CompositeGesture,
  UP_RIGHT: { type: 'composite', first: Direction.UP, second: Direction.RIGHT } as CompositeGesture,
  RIGHT_DOWN: { type: 'composite', first: Direction.RIGHT, second: Direction.DOWN } as CompositeGesture,
  RIGHT_UP: { type: 'composite', first: Direction.RIGHT, second: Direction.UP } as CompositeGesture,
  LEFT_DOWN: { type: 'composite', first: Direction.LEFT, second: Direction.DOWN } as CompositeGesture,
  LEFT_UP: { type: 'composite', first: Direction.LEFT, second: Direction.UP } as CompositeGesture,
};

// 반복 제스처 상수
export const REPEAT_GESTURES = {
  UP_DOWN: { type: 'repeat', pattern: RepeatPattern.UP_DOWN, count: 2 } as RepeatGesture,
  LEFT_RIGHT: { type: 'repeat', pattern: RepeatPattern.LEFT_RIGHT, count: 2 } as RepeatGesture,
};

// 제스처 아이콘 정의
export const GESTURE_ICONS = {
  [Direction.LEFT]: '←',
  [Direction.RIGHT]: '→',
  [Direction.UP]: '↑',
  [Direction.DOWN]: '↓',
  [`${Direction.DOWN}${Direction.LEFT}`]: '↵',
  [`${Direction.DOWN}${Direction.RIGHT}`]: '↳',
  [`${Direction.UP}${Direction.LEFT}`]: '↰',
  [`${Direction.UP}${Direction.RIGHT}`]: '↱',
  [`${Direction.RIGHT}${Direction.DOWN}`]: '⬎',
  [`${Direction.RIGHT}${Direction.UP}`]: '⬏',
  [`${Direction.LEFT}${Direction.DOWN}`]: '⬐',
  [`${Direction.LEFT}${Direction.UP}`]: '⬑',
  [RepeatPattern.UP_DOWN]: '⇅',
  [RepeatPattern.LEFT_RIGHT]: '⇄',
};
