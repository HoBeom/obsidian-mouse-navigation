import {
	App,
	// Editor,
	View,
	MarkdownView,
	// Modal,
	// Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from 'obsidian';

interface GestureNavSettings {
	mySetting: string;
	trigerkey: TrigerKey;
}

enum TrigerKey {
	RIGHT_CLICK = 2,
	WHEEL_CLICK = 1,
}

const DEFAULT_SETTINGS: GestureNavSettings = {
	mySetting: 'default',
	trigerkey: TrigerKey.RIGHT_CLICK,
};

const isPreview = (markdownView: MarkdownView) => {
	const mode = markdownView.getMode();
	return mode === 'preview';
};

const isSource = (markdownView: MarkdownView) => {
	const mode = markdownView.getMode();
	return mode === 'source';
};

let globalMarkdownView: MarkdownView | null = null;
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

		this.addSettingTab(new SampleSettingTab(this.app, this));

		console.log('Loaded: Mouse Gesture Control');
	}

	onunload() {}

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
	private currentGesture: 'left' | 'right' | 'up' | 'down' | null = null; // Declare currentGesture at the class level

	private canvas: HTMLCanvasElement | null = null;
	private ctx: CanvasRenderingContext2D | null = null;
	private drawing = false; // Keep track if we are currently drawing

	private registerEvents(currentWindow: Window) {
		const doc: Document = currentWindow.document;

		// Prevent default right-click context menu
		function preventDefault(event) {
			if (event.isTrusted) {
				event.preventDefault();
				event.stopPropagation();
			}
		}
		doc.addEventListener('contextmenu', preventDefault, true);

		let startClientX = 0;
		let startClientY = 0;
		const gesture_margin = 75;

		// Detect when the right mouse button is pressed
		this.registerDomEvent(doc, 'mousedown', (evt: MouseEvent) => {
			if (evt.button === this.settings.trigerkey) {
				this.startDrawing(evt);
				globalMouseDown = true;
				// new Notice('Right Mouse Key Down!! Position: ' + evt.clientX + ' ' + evt.clientY);
				startClientX = evt.clientX;
				startClientY = evt.clientY;
				this.currentGesture = null; // Reset the gesture
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
				let detectedGesture: 'left' | 'right' | 'up' | 'down' | null =
					null;

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
					// If no gesture is detected, show the context menu
					// new Notice('Show contextmenu');
					doc.elementFromPoint(
						evt.clientX,
						evt.clientY,
					).dispatchEvent(
						new MouseEvent('contextmenu', {
							bubbles: true,
							cancelable: true,
							clientX: evt.clientX,
							clientY: evt.clientY,
						}),
					);
				}
				this.currentGesture = null; // Reset gesture on mouse up
				if (this.overlay) {
					this.overlay.remove(); // Remove overlay when mouse is released
				}
			}
		});
	}

	private startDrawing(evt: MouseEvent) {
		this.drawing = true;

		// Create a canvas if it doesn't exist
		if (!this.canvas) {
			this.canvas = document.createElement('canvas');
			this.canvas.style.position = 'fixed';
			this.canvas.style.top = '0';
			this.canvas.style.left = '0';
			this.canvas.width = window.innerWidth;
			this.canvas.height = window.innerHeight;
			this.canvas.style.zIndex = '1000';
			this.canvas.style.pointerEvents = 'none'; // Ensure it doesn't block other events

			document.body.appendChild(this.canvas);
			this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;

			// Get Obsidian's accent color from the active theme
			const obsidianStyles = getComputedStyle(document.body);
			const accentColor = obsidianStyles
				.getPropertyValue('--interactive-accent')
				.trim();

			// Set the drawing style
			if (this.ctx) {
				this.ctx.strokeStyle = accentColor || 'red'; // Use the accent color, fallback to red if not found
				this.ctx.lineWidth = 5; // Line thickness
				this.ctx.lineJoin = 'round'; // Smooth corners
				this.ctx.lineCap = 'round'; // Smooth line ends
			}
		}

		// Begin path at the current mouse position
		if (this.ctx) {
			this.ctx.beginPath();
			this.ctx.moveTo(evt.clientX, evt.clientY);
		}
	}

	// Draw the line to the current mouse position
	private draw(x: number, y: number) {
		if (this.ctx) {
			this.ctx.lineTo(x, y); // Draw line to this point
			this.ctx.stroke(); // Actually render the line
		}
	}

	// Stop drawing and remove the canvas if necessary
	private stopDrawing() {
		this.drawing = false;
		if (this.canvas) {
			document.body.removeChild(this.canvas);
			this.canvas = null;
			this.ctx = null;
		}
	}

	private executeGestureAction(
		gesture: 'left' | 'right' | 'up' | 'down',
		action: () => void,
	) {
		this.showGestureOverlay(gesture);
		action();
	}
	private showGestureOverlay(gesture: 'left' | 'right' | 'up' | 'down') {
		if (this.overlay) {
			this.overlay.remove(); 
		}

		this.overlay = document.createElement('div');
		this.overlay.style.position = 'fixed';
		this.overlay.style.top = '50%';
		this.overlay.style.left = '50%';
		this.overlay.style.transform = 'translate(-50%, -50%)';
		this.overlay.style.zIndex = '1001';
		this.overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
		this.overlay.style.borderRadius = '50%'; 
		this.overlay.style.width = '175px'; 
		this.overlay.style.height = '175px';
		this.overlay.style.display = 'flex';
		this.overlay.style.flexDirection = 'column';
		this.overlay.style.alignItems = 'center';
		this.overlay.style.justifyContent = 'center';
		this.overlay.style.padding = '20px';
		this.overlay.style.color = 'white';
		this.overlay.style.textAlign = 'center';
		this.overlay.style.fontSize = '36px'; 

		// Use Unicode arrows to represent the gesture
		let arrowSymbol = '';
		let actionText = '';
		if (gesture === 'right') {
			arrowSymbol = '→'; // Right arrow
			actionText = 'Next Page';
		} else if (gesture === 'left') {
			arrowSymbol = '←'; // Left arrow
			actionText = 'Previous Page';
		} else if (gesture === 'up') {
			arrowSymbol = '↑'; // Up arrow
			actionText = 'Scroll to Top';
		} else if (gesture === 'down') {
			arrowSymbol = '↓'; // Down arrow
			actionText = 'Scroll to Bottom';
		} else {
			arrowSymbol = '✕'; // Cancel symbol
			this.overlay.style.fontSize = '50px'; 
		}

		// Add the arrow symbol to the overlay
		const arrow = document.createElement('div');
		arrow.innerText = arrowSymbol;
		this.overlay.appendChild(arrow);

		// Add text below the arrow based on gesture direction
		const text = document.createElement('div');
		text.innerText = actionText;
		text.style.marginTop = '10px';
		text.style.fontSize = '16px'; // Smaller font size for the text
		this.overlay.appendChild(text);

		document.body.appendChild(this.overlay);
	}

	public getCurrentViewOfType() {
		// get the current active view
		let markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// To distinguish whether the current view is hidden or not markdownView
		const currentView = this.app.workspace.getActiveViewOfType(
			View,
		) as MarkdownView;
		// solve the problem of closing always focus new tab setting
		if (markdownView !== null) {
			globalMarkdownView = markdownView;
		} else {
			// fix the plugin shutdown problem when the current view is not exist
			if (currentView == null || currentView?.file?.extension == 'md') {
				markdownView = globalMarkdownView;
			}
		}
		return markdownView;
	}

	private scrollToTop() {
		const markdownView = this.getCurrentViewOfType();
		const preview = markdownView.previewMode;
		if (isSource(markdownView)) {
			const editor = markdownView.editor;
			// cursor set to start
			setTimeout(async () => {
				editor.setCursor(0, 0);
			}, 200);
			// not limited to the start of the editor text as with editor.exec("goStart");
			editor.scrollTo(0, 0);
			this.app.workspace.setActiveLeaf(markdownView.leaf, {
				focus: true,
			});
		} else {
			isPreview(markdownView) && preview.applyScroll(0);
		}
	}

	private scrollToBottom = async () => {
		const markdownView = this.getCurrentViewOfType();

		const file = this.app.workspace.getActiveFile();
		const content = await (this.app as unknown).vault.cachedRead(file);
		const lines = content.split('\n');
		let numberOfLines = lines.length;
		//in preview mode don't count empty lines at the end
		if (markdownView.getMode() === 'preview') {
			while (
				numberOfLines > 0 &&
				lines[numberOfLines - 1].trim() === ''
			) {
				numberOfLines--;
			}
		}
		markdownView.currentMode.applyScroll(numberOfLines - 1);
	};
}

// class SampleModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}

// 	onOpen() {
// 		const { contentEl } = this;
// 		contentEl.setText('Woah!');
// 	}

// 	onClose() {
// 		const { contentEl } = this;
// 		contentEl.empty();
// 	}
// }

class SampleSettingTab extends PluginSettingTab {
	plugin: GestureNav;

	constructor(app: App, plugin: GestureNav) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Triger Mouse Key')
			.setDesc('Select the mouse key to trigger the gesture')
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						[TrigerKey.RIGHT_CLICK]: 'Right Click',
						// [TrigerKey.WHEEL_CLICK]: 'Wheel Click',
					})
					.setValue(this.plugin.settings.trigerkey)
					.onChange(async (value) => {
						this.plugin.settings.trigerkey = value as TrigerKey;
						await this.plugin.saveSettings();
					}),
			);
	}
}
