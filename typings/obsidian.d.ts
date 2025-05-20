declare module 'obsidian' {
  export interface App {
    commands: {
      executeCommandById(id: string): void;
    };
    workspace: {
      getActiveViewOfType<T>(type: any): T | null;
    };
  }
  export interface MarkdownView {
    currentMode: {
      applyScroll(pos: number): void;
    };
  }
  export class Plugin {
    app: App;
    addSettingTab(tab: PluginSettingTab): void;
    loadData(): Promise<any>;
    saveData(data: any): Promise<void>;
  }
  export class PluginSettingTab {
    app: App;
    constructor(app: App, plugin: Plugin);
    containerEl: HTMLElement;
    display(): void;
  }
  export class Setting {
    constructor(el: HTMLElement);
    setName(name: string): this;
    setDesc(desc: string): this;
    addDropdown(cb: (drop: any) => any): this;
    addToggle(cb: (toggle: any) => any): this;
  }
}
