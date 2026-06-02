// src/actions/TabActions.ts

import { Action, ActionContext } from "./ActionInterface";

export const TabActions: Action[] = [
  {
    id: 'cycle-tabs-left',
    name: '탭 왼쪽으로 순환',
    description: '탭을 왼쪽으로 순환합니다.',
    icon: '↵',
    execute: (context: ActionContext): boolean => {
      const { app } = context;
      const activeLeaf = app.workspace.getLeaf(false);
      const leaves = app.workspace.getLeavesOfType(activeLeaf.view.getViewType());
      const activeIndex = leaves.findIndex(leaf => leaf === activeLeaf);
      
      if (activeIndex !== -1 && leaves.length > 1) {
        // 이전 탭으로 이동 (첫 번째 탭일 경우 마지막 탭으로)
        const prevIndex = (activeIndex - 1 + leaves.length) % leaves.length;
        app.workspace.setActiveLeaf(leaves[prevIndex], { focus: true });
        return true;
      }
      return false;
    }
  },
  {
    id: 'cycle-tabs-right',
    name: '탭 오른쪽으로 순환',
    description: '탭을 오른쪽으로 순환합니다.',
    icon: '↳',
    execute: (context: ActionContext): boolean => {
      const { app } = context;
      const activeLeaf = app.workspace.getLeaf(false);
      const leaves = app.workspace.getLeavesOfType(activeLeaf.view.getViewType());
      const activeIndex = leaves.findIndex(leaf => leaf === activeLeaf);
      
      if (activeIndex !== -1 && leaves.length > 1) {
        // 다음 탭으로 이동 (마지막 탭일 경우 첫 번째 탭으로)
        const nextIndex = (activeIndex + 1) % leaves.length;
        app.workspace.setActiveLeaf(leaves[nextIndex], { focus: true });
        return true;
      }
      return false;
    }
  },
  {
    id: 'close-tab',
    name: '탭 닫기',
    description: '현재 활성화된 탭을 닫습니다.',
    icon: '↰',
    execute: (context: ActionContext): boolean => {
      const { app } = context;
      app.workspace.getLeaf(false).detach();
      return true;
    }
  },
  {
    id: 'new-tab',
    name: '새 탭 열기',
    description: '새 탭을 엽니다.',
    icon: '↱',
    execute: (context: ActionContext): boolean => {
      const { app } = context;
      app.workspace.getLeaf('tab');
      return true;
    }
  },
];
