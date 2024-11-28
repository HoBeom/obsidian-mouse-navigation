import {
	App,
	// View,
	MarkdownView,
	// Notice,
	// Menu,
	Plugin,
	PluginSettingTab,
	Setting,
	Notice,
} from 'obsidian';
import DollarRecognizer, { Point } from './dollar'
import * as strokes from './strokes.js';

// Code from https://github.com/dodrio/dollar1-unistroke-recognizer
const pointMaker = ({ x, y }) => new Point(x, y)
class GestureRecognizer {
  constructor({ defaultStrokes = true } = {}) {
    this.dollarRecognizer = new DollarRecognizer({ defaultStrokes })
  }
  recognize(points, useProtractor) {
    return this.dollarRecognizer.Recognize(
      points.map(pointMaker),
      useProtractor
    )
  }
  add(name, points) {
    return this.dollarRecognizer.AddGesture(name, points.map(pointMaker))
  }
}

interface GestureNavSettings {
	trigerkey: TrigerKey;
	enableDrawing: boolean;
	strokeColor: string; 
	customStrokeColor: string; 
	lineWidth: number;   
}

enum TrigerKey {
	RIGHT_CLICK = 2,
	WHEEL_CLICK = 1,
}

const DEFAULT_SETTINGS: GestureNavSettings = {
	trigerkey: TrigerKey.RIGHT_CLICK,
	enableDrawing: true, 
	strokeColor: 'accent', 
	customStrokeColor: '', 
	lineWidth: 5,          
};

const isPreviewMode = (markdownView: MarkdownView) => {
	if (markdownView === null) return false;
	const mode = markdownView.getMode();
	return mode === 'preview' && markdownView.previewMode !== null;
};

const isEditMode = (markdownView: MarkdownView) => {
	if (markdownView === null) return false;
	const mode = markdownView.getMode();
	return mode === 'source' && markdownView.editor !== null;
};

// const globalMarkdownView: MarkdownView | null = null;
let globalMouseDown = false;


export default class GestureNav extends Plugin {
	settings: GestureNavSettings;

	async onload() {
		await this.loadSettings();

		this.registerEvent(
			this.app.workspace.on('window-open', (newWindow: WorkspaceWindow) =>
				this.registerEvents(newWindow.win),
			),
		);
		this.registerEvents(window);

		this.addSettingTab(new GestureNavSettingTab(this.app, this));
	}

	onunload() {
		// Remove the canvas if it exists
		if (this.canvas) {
			document.body.removeChild(this.canvas);
			this.canvas = null;
			this.ctx = null;
		}

		// Remove the overlay if it exists
		if (this.overlay) {
			this.overlay.remove();
			this.overlay = null;
		}

		// Reset drawing state
		this.drawing = false;
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private overlay: HTMLElement | null = null; // Declare overlay at the class level
	// private currentGesture: 'left' | 'right' | 'up' | 'down' | null = null; // Declare currentGesture at the class level
	private currentGesture: string | null = null; // Declare currentGesture at the class level
	private canvas: HTMLCanvasElement | null = null;
	private ctx: CanvasRenderingContext2D | null = null;
	private drawing = false; // Keep track if we are currently drawing
	private strokeData: Array<{ x: number; y: number }> = []; // To store stroke points

	private registerEvents(currentWindow: Window) {
		const doc: Document = currentWindow.document;

		const gr = new GestureRecognizer({ defaultStrokes: false })
		// gr.add('next-page', strokes.rightStroke)
		// gr.add('pre-page', strokes.leftStroke)
		// gr.add('scroll-top', strokes.upStroke)
		// gr.add('scroll-bottom', strokes.downStroke)
		// gr.add('close-tab', strokes.downRightStroke)
		// gr.add('reopen-tab', strokes.downLeftStroke)
		// gr.add('new-tab', strokes.upRightStroke)
		// gr.add('new-file', strokes.upLeftStroke)
		// gr.add('maximize', strokes.rightUpStroke)
		// gr.add('minimize', strokes.rightDownStroke)
		// gr.add('fullscreen', strokes.leftUpStroke)
		// gr.add('search', strokes.leftDownStroke)
		// gr.add('refresh', strokes.downUpStroke)
		// gr.add('refresh2', strokes.upDownStroke)
		// gr.add('undo', strokes.leftRightStroke)
		// gr.add('undo2', strokes.rightLeftStroke)
		gr.add('downRight', strokes.downRightStroke)
		gr.add('downLeft', strokes.downLeftStroke)
		gr.add('upRight', strokes.upRightStroke)
		gr.add('upLeft', strokes.upLeftStroke)
		gr.add('rightUp', strokes.rightUpStroke)
		gr.add('rightDown', strokes.rightDownStroke)
		gr.add('leftUp', strokes.leftUpStroke)
		gr.add('leftDown', strokes.leftDownStroke)
		gr.add('downUp', strokes.downUpStroke)
		gr.add('upDown', strokes.upDownStroke)
		gr.add('leftRight', strokes.leftRightStroke)
		gr.add('rightLeft', strokes.rightLeftStroke)

		// Prevent default right-click context menu
		function preventDefault(event) {
			const target = event.target as HTMLElement;
			if (target.closest('.workspace-leaf')?.classList.contains('nav-folder')) {
				return;
			}		
			if (event.isTrusted) {
				event.preventDefault();
				event.stopPropagation();
			}
		}
		// doc.addEventListener('contextmenu', preventDefault, true);

		let startClientX = 0;
		let startClientY = 0;
		const gesture_margin = 75;

		// Detect when the right mouse button is pressed
		this.registerDomEvent(doc, 'mousedown', (evt: MouseEvent) => {
			if (evt.button === this.settings.trigerkey) {
				if (isEditMode(this.getCurrentViewOfType())) {
					doc.addEventListener('contextmenu', preventDefault, true);
					this.startDrawing(evt);
					globalMouseDown = true;
					startClientX = evt.clientX;
					startClientY = evt.clientY;
					this.currentGesture = null; // Reset the gesture
				} else {
					doc.removeEventListener('contextmenu', preventDefault, true);
				}
			}
		});

		// Track mouse movement to detect gestures, but do not execute actions yet
		this.registerDomEvent(doc, 'mousemove', (evt: MouseEvent) => {
			if (this.drawing) {
				this.draw(evt.clientX, evt.clientY);
			}
			if (globalMouseDown) {
				const deltaX = evt.clientX - startClientX;
				const deltaY = evt.clientY - startClientY;
				let detectedGesture = null;

				// Detect horizontal gestures (left/right)
				if (
					Math.abs(deltaX) > gesture_margin &&
					Math.abs(deltaY) < gesture_margin
				) {
					detectedGesture = deltaX > 0 ? 'right' : 'left';
				}
				// Detect vertical gestures (up/down)
				else if (
					Math.abs(deltaY) > gesture_margin &&
					Math.abs(deltaX) < gesture_margin
				) {
					detectedGesture = deltaY > 0 ? 'down' : 'up';
				}
				else if (
					Math.abs(deltaY) > gesture_margin &&
					Math.abs(deltaX) > gesture_margin
				) {
					const result = gr.recognize(this.strokeData, false)
					if (result.Score > 0.8)
						new Notice('Gesture: ' + result.Name + ' Score: ' + result.Score);
						detectedGesture = result.Name
				}
				// If gesture has changed, update the overlay
				if (detectedGesture !== this.currentGesture) {
					this.currentGesture = detectedGesture;
					this.showGestureOverlay(this.currentGesture); // Update overlay with the new gesture
				}
			}
		});

		// When the right mouse button is released, execute the corresponding gesture action
		this.registerDomEvent(doc, 'mouseup', (evt: MouseEvent) => {
			this.stopDrawing();
			if (evt.button === this.settings.trigerkey) {
				globalMouseDown = false;
				// new Notice('Right Mouse Key UP!! Position: ' + evt.clientX + ' ' + evt.clientY);

				// Execute actions based on the detected gesture
				if (this.currentGesture === 'right') {
					this.executeGestureAction('right', () =>
						window.history.forward(),
					);
				} else if (this.currentGesture === 'left') {
					this.executeGestureAction('left', () =>
						window.history.back(),
					);
				} else if (this.currentGesture === 'down') {
					this.executeGestureAction(
						'down',
						this.scrollToBottom.bind(this),
					);
				} else if (this.currentGesture === 'up') {
					this.executeGestureAction(
						'up',
						this.scrollToTop.bind(this),
					);
				} else {
					// this.selectTextUnderCursor(evt);
					this.showContextMenu(evt);
					// doc.elementFromPoint(
					// 	evt.clientX,
					// 	evt.clientY,
					// ).dispatchEvent(
					// 	new MouseEvent('contextmenu', {
					// 		bubbles: true,
					// 		cancelable: true,
					// 		clientX: evt.clientX,
					// 		clientY: evt.clientY,
					// 	}),
					// );
				}
				this.currentGesture = null; // Reset gesture on mouse up
				if (this.overlay) {
					this.overlay.remove(); // Remove overlay when mouse is released
				}
			}
		});
	}
	private startDrawing(evt: MouseEvent) {
		// Check if drawing is enabled
		if (!this.settings.enableDrawing) {
			return; // Exit early if drawing is disabled
		}

		this.drawing = true;
		this.strokeData = []; // Reset the stroke data

		// Create a canvas if it doesn't exist
		if (!this.canvas) {
			this.canvas = document.createElement('canvas');
			this.canvas.classList.add('gesture-canvas'); 
	
			this.canvas.width = window.innerWidth;
			this.canvas.height = window.innerHeight;
	
			document.body.appendChild(this.canvas);
			this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
	
			let strokeColor = this.settings.strokeColor;
			if (strokeColor === 'accent') {
				const obsidianStyles = getComputedStyle(document.body);
				strokeColor = obsidianStyles.getPropertyValue('--interactive-accent').trim();
			} else if (strokeColor === 'custom') {
				strokeColor = this.settings.customStrokeColor || '#000000'; // Fallback to black if custom color is not provided
			}
	
			// Set the drawing style using the selected stroke color
			if (this.ctx) {
				this.ctx.strokeStyle = strokeColor;
				this.ctx.lineWidth = this.settings.lineWidth;
				this.ctx.lineJoin = 'round';
				this.ctx.lineCap = 'round';
			}
		}
	
		// Begin path at the current mouse position
		if (this.ctx) {
			this.ctx.beginPath();
			this.ctx.moveTo(evt.clientX, evt.clientY);
			this.strokeData.push({ x: evt.clientX, y: evt.clientY });
		}
	}
	
	// Draw the line to the current mouse position
	private draw(x: number, y: number) {
		if (!this.drawing || !this.settings.enableDrawing) {
			return;
		}
		if (this.ctx) {
			this.ctx.lineTo(x, y); // Draw line to this point
			this.ctx.stroke(); // Actually render the line

			// Sample the points for gesture recognition
			// const lastPoint = this.strokeData[this.strokeData.length - 1];
			// const distance =
			// 	lastPoint &&
			// 	Math.sqrt(Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2));
	
			// if (!lastPoint || distance > 5) { // 5px minimum distance between points
			// 	this.strokeData.push({ x, y });
			// }
			this.strokeData.push({ x, y });
		}
	}
	
	// Stop drawing and remove the canvas if necessary
	private stopDrawing() {
		if (!this.settings.enableDrawing) {
			return; // Do nothing if drawing is disabled
		}
	
		this.drawing = false;

		const strokeDataCopy = [...this.strokeData];
		this.writeStrokeDataToMarkdown(strokeDataCopy);

		this.strokeData = []; // Clear the stroke data
		if (this.canvas) {
			document.body.removeChild(this.canvas);
			this.canvas = null;
			this.ctx = null;
		}
	}

	private async writeStrokeDataToMarkdown(strokeData: Array<{ x: number; y: number }>) {
		const markdownView = this.getCurrentViewOfType();
		if (!markdownView) {
			new Notice('No active markdown view to write stroke data.');
			return;
		}
	
		const strokeDataJson = await new Promise<string>((resolve) => {
			setTimeout(() => resolve(JSON.stringify(strokeData, null, 2)), 0);
		});
	
		const editor = markdownView.editor;
		if (editor) {
			editor.replaceRange(
				`\n\n\`\`\`json\n${strokeDataJson}\n\`\`\`\n`,
				{ line: editor.lastLine() + 1, ch: 0 }
			);
			new Notice('Stroke data written to markdown document.');
		} else {
			new Notice('No editor found to write stroke data.');
		}
	}

	// Execute gesture actions and show the overlay
	private executeGestureAction(
		gesture: 'left' | 'right' | 'up' | 'down',
		action: () => void,
	) {
		this.showGestureOverlay(gesture);
		action();
	}

	private selectTextUnderCursor(evt: MouseEvent) {
		// TODO: Implement text selection under cursor
	}	


	private showContextMenu(evt: MouseEvent) {
		const markdownView = this.getCurrentViewOfType();
		if (isEditMode(markdownView)) {
			this.showEditModeContextMenu(evt);
		} else if (isPreviewMode(markdownView)) {
			this.showPreviewContextMenu(evt);
		}
	}

	private showEditModeContextMenu(evt: MouseEvent) {
		const doc = document;
		doc.elementFromPoint(evt.clientX, evt.clientY).dispatchEvent(
			new MouseEvent('contextmenu', {
				bubbles: true,
				cancelable: true,
				clientX: evt.clientX,
				clientY: evt.clientY,
			}),
		);
	}

	private showPreviewContextMenu(evt: MouseEvent) {
		// TODO: Implement original context menu in preview mode

	}

	private showGestureOverlay(gesture: string) {
		if (this.overlay) {
			this.overlay.remove();
		}
	
		this.overlay = document.createElement('div');
		this.overlay.classList.add('gesture-overlay');
	
		let arrowSymbol = '';
		let actionText = '';
		if (gesture === 'right') {
			arrowSymbol = '→'; // Right arrow
			actionText = 'Next page';
		} else if (gesture === 'left') {
			arrowSymbol = '←'; // Left arrow
			actionText = 'Previous page';
		} else if (gesture === 'up') {
			arrowSymbol = '↑'; // Up arrow
			actionText = 'Scroll to top';
		} else if (gesture === 'down') {
			arrowSymbol = '↓'; // Down arrow
			actionText = 'Scroll to bottom';
		} else if (gesture === 'downRight') {
			arrowSymbol = '↳'; // Down right arrow
			actionText = 'Close tab';
		} else if (gesture === 'downLeft') {
			arrowSymbol = '↲'; // Down left arrow
			actionText = 'Reopen tab';
		} else if (gesture === 'upRight') {
			arrowSymbol = '↱'; // Up right arrow
			actionText = 'New tab';
		} else if (gesture === 'upLeft') {
			arrowSymbol = '↰'; // Up left arrow
			actionText = 'New file';
		} else if (gesture === 'rightUp') {
			arrowSymbol = '⬏'; // Right up arrow
			actionText = 'Maximize';
		} else if (gesture === 'rightDown') {
			arrowSymbol = '⬎'; // Right down arrow
			actionText = 'Minimize';
		} else if (gesture === 'leftUp') {
			arrowSymbol = '⬑'; // Left up arrow
			actionText = 'Fullscreen';
		} else if (gesture === 'leftDown') {
			arrowSymbol = '⬐'; // Left down arrow
			actionText = 'Search';
		} else if (gesture === 'downUp') {
			arrowSymbol = '⇅'; // Down up arrow
			actionText = 'Refresh';
		} else if (gesture === 'upDown') {
			arrowSymbol = '⇵'; // Up down arrow
			actionText = 'Refresh';
		} else if (gesture === 'leftRight') {
			arrowSymbol = '⇄'; // Left right arrow
			actionText = 'Undo';
		} else if (gesture === 'rightLeft') {
			arrowSymbol = '⇆'; // Right left arrow
			actionText = 'Undo';
		} else {
			arrowSymbol = '✕'; // Cancel symbol
			this.overlay.classList.add('gesture-overlay-cancel'); // Extra class for cancel symbol
		}
	
		// Add the arrow symbol to the overlay
		const arrow = document.createElement('div');
		arrow.innerText = arrowSymbol;
		this.overlay.appendChild(arrow);
	
		// Add text below the arrow based on gesture direction
		const text = document.createElement('div');
		text.innerText = actionText;
		text.classList.add('gesture-text');
		this.overlay.appendChild(text);
	
		document.body.appendChild(this.overlay);
	}
	

	public getCurrentViewOfType() {
		// get the current active view
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// // To distinguish whether the current view is hidden or not markdownView
		// const currentView = this.app.workspace.getActiveViewOfType(
		// 	View,
		// );
		// // solve the problem of closing always focus new tab setting
		// if (markdownView !== null) {
		// 	globalMarkdownView = markdownView;
		// } else {
		// 	// fix the plugin shutdown problem when the current view is not exist
		// 	if (currentView == null || !(currentView instanceof EditableFileView) && currentView?.file?.extension == 'md') {
		// 		markdownView = globalMarkdownView;
		// 	}
		// }
		return markdownView;
	}

	private scrollToTop() {
		const markdownView = this.getCurrentViewOfType();
		if (markdownView === null) return;
		markdownView.currentMode.applyScroll(0);
	}

	private scrollToBottom = async () => {
		const markdownView = this.getCurrentViewOfType();
		if (markdownView === null) return;
		markdownView.currentMode.applyScroll(Number.MAX_SAFE_INTEGER);
	};
}


class GestureNavSettingTab extends PluginSettingTab {
	plugin: GestureNav;

	constructor(app: App, plugin: GestureNav) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Triger mouse key')
			.setDesc('Select the mouse key to trigger the gesture')
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						[TrigerKey.RIGHT_CLICK]: 'Right click',
						// [TrigerKey.WHEEL_CLICK]: 'Wheel click',
					})
					.setValue(this.plugin.settings.trigerkey)
					.onChange(async (value) => {
						this.plugin.settings.trigerkey = value as TrigerKey;
						await this.plugin.saveSettings();
					}),
			);

		// Drawing toggle
		new Setting(containerEl)
			.setName('Enable drawing')
			.setDesc('Toggle to enable or disable gesture drawing on the screen')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableDrawing)
					.onChange(async (value) => {
						this.plugin.settings.enableDrawing = value;
						await this.plugin.saveSettings();
					}),
			);

		// Stroke color settings
		new Setting(containerEl)
			.setName('Stroke color')
			.setDesc('Select the color for the gesture stroke')
			.addDropdown((dropdown) => {
				dropdown
					.addOptions({
						'accent': 'Accent color',
						'red': 'Red',
						'orange': 'Orange',
						'yellow': 'Yellow',
						'green': 'Green',
						'blue': 'Blue',
						'purple': 'Purple',
						'custom': 'Custom',
					})
					.setValue(this.plugin.settings.strokeColor || 'accent') // Default to accent
					.onChange(async (value) => {
						this.plugin.settings.strokeColor = value;
						await this.plugin.saveSettings();

						// Enable custom color input only if custom is selected
						customColorSetting.setDisabled(value !== 'custom');
					});
			});

		// Custom color input
		const customColorSetting = new Setting(containerEl)
			.setName('Custom stroke color')
			.setDesc('Enter a custom color (hex or valid CSS color)')
			.addText((text) =>
				text
					.setPlaceholder('#000000')
					.setValue(this.plugin.settings.customStrokeColor || '')
					.onChange(async (value) => {
						this.plugin.settings.customStrokeColor = value;
						await this.plugin.saveSettings();
					}),
			)
			.setDisabled(this.plugin.settings.strokeColor !== 'custom'); // Disable unless custom is selected
	
		// Line width setting
		new Setting(containerEl)
			.setName('Line width')
			.setDesc('Set the thickness of the gesture stroke')
			.addSlider((slider) =>
				slider
					.setLimits(1, 10, 1) // Set range between 1 and 10
					.setValue(this.plugin.settings.lineWidth)
					.onChange(async (value) => {
						this.plugin.settings.lineWidth = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
