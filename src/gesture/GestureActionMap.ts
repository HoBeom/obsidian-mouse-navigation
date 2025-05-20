import ObsidianActions from '../actions/ObsidianActions';
import type { Gesture } from './GestureRecognizer';

export default class GestureActionMap {
  constructor(private actions: ObsidianActions) {}

  execute(gesture: Gesture | null) {
    if (!gesture) return;
    switch (gesture) {
      case 'left':
        this.actions.nextPage();
        break;
      case 'right':
        this.actions.previousPage();
        break;
      case 'up':
        this.actions.scrollToTop();
        break;
      case 'down':
        this.actions.scrollToBottom();
        break;
      case 'down+left':
        this.actions.cycleTabLeft();
        break;
      case 'down+right':
        this.actions.cycleTabRight();
        break;
      case 'up+left':
        this.actions.closeTab();
        break;
      case 'up+right':
        this.actions.newTab();
        break;
      case 'right+down':
        this.actions.minimizeWindow();
        break;
      case 'right+up':
        this.actions.maximizeWindow();
        break;
      case 'left+down':
        this.actions.nextSiblingFile();
        break;
      case 'left+up':
        this.actions.previousSiblingFile();
        break;
      case 'UD_REPEAT':
        this.actions.refresh();
        break;
      case 'LR_REPEAT':
        this.actions.undo();
        break;
    }
  }
}
