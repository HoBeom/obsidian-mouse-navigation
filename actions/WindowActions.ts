// src/actions/WindowActions.ts

import { Action, ActionContext } from "./ActionInterface";

interface ElectronRemoteWindow {
  minimize(): void;
  maximize(): void;
  unmaximize(): void;
  isMaximized(): boolean;
  setFullScreen(fullscreen: boolean): void;
  isFullScreen(): boolean;
}

interface ElectronRemote {
  getCurrentWindow(): ElectronRemoteWindow;
}

interface ElectronModule {
  remote: ElectronRemote;
}

interface ElectronWindow extends Window {
  require(module: 'electron'): ElectronModule;
}

const getElectronWindow = (): ElectronRemoteWindow => {
  const electron = (window as ElectronWindow).require('electron');
  return electron.remote.getCurrentWindow();
};

export const WindowActions: Action[] = [
  {
    id: 'minimize-window',
    name: '창 최소화',
    description: '창을 최소화합니다.',
    icon: '⬎',
    execute: (context: ActionContext): boolean => {
      // Electron API를 사용하여 창 최소화
      try {
        const win = getElectronWindow();
        win.minimize();
        return true;
      } catch (error) {
        console.error('창 최소화에 실패했습니다:', error);
        return false;
      }
    }
  },
  {
    id: 'maximize-window',
    name: '창 최대화',
    description: '창을 최대화합니다.',
    icon: '⬏',
    execute: (context: ActionContext): boolean => {
      // Electron API를 사용하여 창 최대화
      try {
        const win = getElectronWindow();
        
        if (win.isMaximized()) {
          win.unmaximize();
        } else {
          win.maximize();
        }
        return true;
      } catch (error) {
        console.error('창 최대화에 실패했습니다:', error);
        return false;
      }
    }
  },
  {
    id: 'toggle-fullscreen',
    name: '전체화면',
    description: '전체화면 모드를 토글합니다.',
    icon: '⛶',
    execute: (context: ActionContext): boolean => {
      // Electron API를 사용하여 전체화면 토글
      try {
        const win = getElectronWindow();
        win.setFullScreen(!win.isFullScreen());
        return true;
      } catch (error) {
        console.error('전체화면 전환에 실패했습니다:', error);
        return false;
      }
    }
  },
];
