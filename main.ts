import { App, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';
import GestureRecognizer, { Gesture } from './src/gesture/GestureRecognizer';
import GestureActionMap from './src/gesture/GestureActionMap';
import ObsidianActions from './src/actions/ObsidianActions';

interface GestureNavSettings {
  trigerkey: number;
  enableDrawing: boolean;
  strokeColor: string;
  customStrokeColor: string;
  lineWidth: number;
}

const DEFAULT_SETTINGS: GestureNavSettings = {
  trigerkey: 2,
  enableDrawing: true,
  strokeColor: 'accent',
  customStrokeColor: '',
  lineWidth: 5,
};

export default class GestureNav extends Plugin {
  settings: GestureNavSettings;
  private recognizer = new GestureRecognizer();
  private actionMap = new GestureActionMap(new ObsidianActions(this.app));

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private drawing = false;

  async onload() {
    await this.loadSettings();
    this.actionMap = new GestureActionMap(new ObsidianActions(this.app));
    this.registerEvents(window);
    this.addSettingTab(new GestureNavSettingTab(this.app, this));
  }

  onunload() {
    if (this.canvas) document.body.removeChild(this.canvas);
    this.canvas = null;
    this.ctx = null;
  }

  private registerEvents(currentWindow: Window) {
    const doc = currentWindow.document;
    doc.addEventListener('mousedown', (evt) => {
      if (evt.button === this.settings.trigerkey) {
        this.recognizer.start(evt.clientX, evt.clientY);
        this.startDrawing(evt);
      }
    });

    doc.addEventListener('mousemove', (evt) => {
      if (this.drawing) {
        this.draw(evt.clientX, evt.clientY);
        this.recognizer.addPoint(evt.clientX, evt.clientY);
      }
    });

    doc.addEventListener('mouseup', (evt) => {
      if (evt.button === this.settings.trigerkey) {
        this.stopDrawing();
        const gesture = this.recognizer.end();
        this.actionMap.execute(gesture);
        this.showGestureOverlay(gesture);
      }
    });
  }

  private startDrawing(evt: MouseEvent) {
    if (!this.settings.enableDrawing) return;
    this.drawing = true;
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.classList.add('gesture-canvas');
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      document.body.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
      let strokeColor = this.settings.strokeColor;
      if (strokeColor === 'accent') {
        const styles = getComputedStyle(document.body);
        strokeColor = styles.getPropertyValue('--interactive-accent').trim();
      } else if (strokeColor === 'custom') {
        strokeColor = this.settings.customStrokeColor || '#000000';
      }
      if (this.ctx) {
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = this.settings.lineWidth;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
      }
    }
    if (this.ctx) {
      this.ctx.beginPath();
      this.ctx.moveTo(evt.clientX, evt.clientY);
    }
  }

  private draw(x: number, y: number) {
    if (!this.drawing || !this.ctx) return;
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  private stopDrawing() {
    this.drawing = false;
    if (this.canvas) {
      document.body.removeChild(this.canvas);
      this.canvas = null;
      this.ctx = null;
    }
  }

  private showGestureOverlay(gesture: Gesture | null) {
    if (!gesture) return;
    const overlay = document.createElement('div');
    overlay.classList.add('gesture-overlay');
    overlay.innerText = gesture;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 700);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class GestureNavSettingTab extends PluginSettingTab {
  constructor(public app: App, private plugin: GestureNav) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    (containerEl as HTMLElement).innerHTML = '';
    new Setting(containerEl)
      .setName('Trigger mouse key')
      .setDesc('Select the mouse key to trigger the gesture')
      .addDropdown((dropdown: any) =>
        dropdown
          .addOptions({ '2': 'Right click', '1': 'Wheel click' })
          .setValue(String(this.plugin.settings.trigerkey))
          .onChange(async (value: string) => {
            this.plugin.settings.trigerkey = parseInt(value);
            await this.plugin.saveSettings();
          })
      );
    new Setting(containerEl)
      .setName('Enable drawing')
      .setDesc('Toggle gesture drawing')
      .addToggle((toggle: any) =>
        toggle
          .setValue(this.plugin.settings.enableDrawing)
          .onChange(async (value: boolean) => {
            this.plugin.settings.enableDrawing = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
