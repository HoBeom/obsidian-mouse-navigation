import { App, MarkdownView } from 'obsidian';

export default class ObsidianActions {
  constructor(private app: App) {}

  nextPage() {
    window.history.forward();
  }

  previousPage() {
    window.history.back();
  }

  scrollToTop() {
    const view = this.getMarkdownView();
    view?.currentMode.applyScroll(0);
  }

  scrollToBottom() {
    const view = this.getMarkdownView();
    view?.currentMode.applyScroll(Number.MAX_SAFE_INTEGER);
  }

  cycleTabLeft() {
    this.app.commands.executeCommandById('workspace:activate-previous-tab');
  }

  cycleTabRight() {
    this.app.commands.executeCommandById('workspace:activate-next-tab');
  }

  closeTab() {
    this.app.commands.executeCommandById('workspace:close-active-leaf');
  }

  newTab() {
    this.app.commands.executeCommandById('workspace:new-tab');
  }

  minimizeWindow() {
    this.app.commands.executeCommandById('app:minimize');
  }

  maximizeWindow() {
    this.app.commands.executeCommandById('app:maximize');
  }

  nextSiblingFile() {
    this.app.commands.executeCommandById('file-explorer:next-sibling');
  }

  previousSiblingFile() {
    this.app.commands.executeCommandById('file-explorer:previous-sibling');
  }

  refresh() {
    this.app.commands.executeCommandById('app:reload');
  }

  undo() {
    this.app.commands.executeCommandById('editor:undo');
  }

  openSearch() {
    this.app.commands.executeCommandById('app:open-search');
  }

  newWindow() {
    this.app.commands.executeCommandById('window:new');
  }

  reopenClosedTab() {
    this.app.commands.executeCommandById('workspace:open-closed-tab');
  }

  toggleFullScreen() {
    this.app.commands.executeCommandById('window:toggle-fullscreen');
  }

  private getMarkdownView(): MarkdownView | null {
    return this.app.workspace.getActiveViewOfType<MarkdownView>(null as any);
  }
}
