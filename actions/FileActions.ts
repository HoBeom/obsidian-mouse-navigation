// src/actions/FileActions.ts

import { TFile } from "obsidian";
import { Action, ActionContext } from "./ActionInterface";

export const FileActions: Action[] = [
  {
    id: 'move-to-next-file',
    name: '같은 폴더 아래 파일로 이동',
    description: '같은 폴더 내에서 다음 파일로 이동합니다.',
    icon: '⬐',
    execute: (context: ActionContext): boolean => {
      const { app } = context;
      const currentFile = app.workspace.getActiveFile();
      
      if (currentFile) {
        const folder = currentFile.parent;
        const files = folder ? app.vault.getMarkdownFiles().filter((file: TFile) => file.parent === folder) : [];
        files.sort((a, b) => a.basename.localeCompare(b.basename));
        
        const currentIndex = files.findIndex((file: TFile) => file.path === currentFile.path);
        if (currentIndex !== -1 && files.length > 1) {
          const nextIndex = (currentIndex + 1) % files.length;
          void app.workspace.openLinkText(files[nextIndex].path, currentFile.path, true);
          return true;
        }
      }
      return false;
    }
  },
  {
    id: 'move-to-prev-file',
    name: '같은 폴더 위 파일로 이동',
    description: '같은 폴더 내에서 이전 파일로 이동합니다.',
    icon: '⬑',
    execute: (context: ActionContext): boolean => {
      const { app } = context;
      const currentFile = app.workspace.getActiveFile();
      
      if (currentFile) {
        const folder = currentFile.parent;
        const files = folder ? app.vault.getMarkdownFiles().filter((file: TFile) => file.parent === folder) : [];
        files.sort((a, b) => a.basename.localeCompare(b.basename));
        
        const currentIndex = files.findIndex((file: TFile) => file.path === currentFile.path);
        if (currentIndex !== -1 && files.length > 1) {
          const prevIndex = (currentIndex - 1 + files.length) % files.length;
          void app.workspace.openLinkText(files[prevIndex].path, currentFile.path, true);
          return true;
        }
      }
      return false;
    }
  },
  {
    id: 'open-search',
    name: '검색창 열기',
    description: '검색창을 엽니다.',
    icon: '🔍',
    execute: (context: ActionContext): boolean => {
      const { app } = context;
      // Obsidian API를 사용하여 검색 뷰 열기
      app.commands.executeCommandById('global-search:open');
      return true;
    }
  },
  {
    id: 'reopen-closed-tab',
    name: '닫은 탭 다시 열기',
    description: '최근에 닫은 탭을 다시 엽니다.',
    icon: '🔄',
    execute: (context: ActionContext): boolean => {
      const { app } = context;
      // Obsidian API를 사용하여 최근 닫은 탭 다시 열기
      app.commands.executeCommandById('app:reopen-closed-tab');
      return true;
    }
  },
];
