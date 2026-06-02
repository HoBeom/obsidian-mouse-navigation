// src/actions/NavigationActions.ts

import { Action, ActionContext } from "./ActionInterface";

export const NavigationActions: Action[] = [
  {
    id: 'navigate-next',
    name: '다음 페이지',
    description: '다음 페이지로 이동합니다.',
    icon: '→',
    execute: (context: ActionContext): boolean => {
      context.app.commands.executeCommandById('app:go-forward');
      return true;
    }
  },
  {
    id: 'navigate-prev',
    name: '이전 페이지',
    description: '이전 페이지로 이동합니다.',
    icon: '←',
    execute: (context: ActionContext): boolean => {
      context.app.commands.executeCommandById('app:go-back');
      return true;
    }
  },
  {
    id: 'scroll-top',
    name: '맨 위로',
    description: '문서의 맨 위로 스크롤합니다.',
    icon: '↑',
    execute: (context: ActionContext): boolean => {
      const { editor } = context;
      if (editor) {
        editor.scrollTo(0, 0);
        return true;
      }
      return false;
    }
  },
  {
    id: 'scroll-bottom',
    name: '맨 아래로',
    description: '문서의 맨 아래로 스크롤합니다.',
    icon: '↓',
    execute: (context: ActionContext): boolean => {
      const { editor } = context;
      if (editor) {
        const lastLine = editor.lastLine();
        editor.scrollTo(lastLine, 0);
        return true;
      }
      return false;
    }
  },
  {
    id: 'refresh',
    name: '새로고침',
    description: '현재 페이지를 새로고침합니다.',
    icon: '⇅',
    execute: (context: ActionContext): boolean => {
      window.location.reload();
      return true;
    }
  },
  {
    id: 'undo',
    name: '실행 취소',
    description: '마지막 명령을 취소합니다.',
    icon: '⇄',
    execute: (context: ActionContext): boolean => {
      const { editor } = context;
      if (editor && editor.undo) {
        editor.undo();
        return true;
      }
      return false;
    }
  },
];
