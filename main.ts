import { App, Editor, View, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface GestureNavSettings {
	mySetting: string;
	trigerkey: TrigerKey;
}

enum TrigerKey {
	// LEFT_CLICK = 'left_click',
	RIGHT_CLICK = 'right_click',
	// WHEEL_CLICK = 'wheel_click',
	// DOUBLE_LEFT_CLICK = 'double_left_click',
	// DOUBLE_RIGHT_CLICK = 'double_right_click'
}

const DEFAULT_SETTINGS: GestureNavSettings = {
	mySetting: 'default',
	trigerkey: TrigerKey.RIGHT_CLICK
}

const isPreview = (markdownView: MarkdownView) => {
	const mode = markdownView.getMode();
	return mode === "preview";
}

const isSource = (markdownView: MarkdownView) => {
	const mode = markdownView.getMode();
	return mode === "source";
}

let globalMarkdownView: MarkdownView | null = null;
let globalMouseDown = false;

export default class GestureNav extends Plugin {
	settings: GestureNavSettings;

	async onload() {
		await this.loadSettings();

        this.registerEvent(
            this.app.workspace.on("window-open", (newWindow: WorkspaceWindow) => this.registerEvents(newWindow.win))
        );
        this.registerEvents(window);

		this.addSettingTab(new SampleSettingTab(this.app, this));	

        console.log("Loaded: Mouse Gesture Control")
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
	private overlay: HTMLElement | null = null; // Declare overlay at the class level
	private currentGesture: 'left' | 'right' | 'up' | 'down' | null = null; // Declare currentGesture at the class level
	
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
		let gesture_margin = 100;
		
		// Detect when the right mouse button is pressed
		this.registerDomEvent(doc, 'mousedown', (evt: MouseEvent) => {
			if (evt.button === 2) {
				globalMouseDown = true;
				new Notice('Right Mouse Key Down!! Position: ' + evt.clientX + ' ' + evt.clientY);
				startClientX = evt.clientX;
				startClientY = evt.clientY;
				this.currentGesture = null; // Reset the gesture
			}
		});

		// Track mouse movement to detect gestures, but do not execute actions yet
		this.registerDomEvent(doc, 'mousemove', (evt: MouseEvent) => {
			if (globalMouseDown) {
				const deltaX = evt.clientX - startClientX;
				const deltaY = evt.clientY - startClientY;
				let detectedGesture: 'left' | 'right' | 'up' | 'down' | null = null;

				// Detect horizontal gestures (left/right)
				if (Math.abs(deltaX) > gesture_margin && Math.abs(deltaY) < gesture_margin) {
					detectedGesture = deltaX > 0 ? 'right' : 'left';
				}
				// Detect vertical gestures (up/down)
				else if (Math.abs(deltaY) > gesture_margin && Math.abs(deltaX) < gesture_margin) {
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
			if (evt.button === 2) {
				globalMouseDown = false;
				new Notice('Right Mouse Key UP!! Position: ' + evt.clientX + ' ' + evt.clientY);

				// Execute actions based on the detected gesture
				if (this.currentGesture === 'right') {
					this.executeGestureAction('right', () => window.history.forward());
				} else if (this.currentGesture === 'left') {
					this.executeGestureAction('left', () => window.history.back());
				} else if (this.currentGesture === 'down') {
					this.executeGestureAction('down', this.scrollToBottom.bind(this));
				} else if (this.currentGesture === 'up') {
					this.executeGestureAction('up', this.scrollToTop.bind(this));
				} else {
					// If no gesture is detected, show the context menu
					new Notice('Show contextmenu');
					doc.elementFromPoint(evt.clientX, evt.clientY).dispatchEvent(new MouseEvent('contextmenu', {
						bubbles: true, 
						cancelable: true, 
						clientX: evt.clientX, 
						clientY: evt.clientY
					}));
				}
				this.currentGesture = null; // Reset gesture on mouse up
				if (this.overlay) {
					this.overlay.remove(); // Remove overlay when mouse is released
				}
			}
		});

	}
	
	// Function to execute a gesture action and show overlay
	private executeGestureAction(gesture: 'left' | 'right' | 'up' | 'down', action: () => void) {
		this.showGestureOverlay(gesture);
		action(); // Execute the action (e.g., go forward, go back)
	}
	private showGestureOverlay(gesture: 'left' | 'right' | 'up' | 'down') {
		if (this.overlay) {
			this.overlay.remove(); // Remove previous overlay before adding a new one
		}
	
		this.overlay = document.createElement('div');
		this.overlay.style.position = 'fixed';
		this.overlay.style.top = '50%';
		this.overlay.style.left = '50%';
		this.overlay.style.transform = 'translate(-50%, -50%)';
		this.overlay.style.zIndex = '1000';
		this.overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
		this.overlay.style.borderRadius = '50%'; // Make the overlay a perfect circle
		this.overlay.style.width = '150px'; // Equal width and height for a perfect circle
		this.overlay.style.height = '150px';
		this.overlay.style.display = 'flex';
		this.overlay.style.flexDirection = 'column';
		this.overlay.style.alignItems = 'center';
		this.overlay.style.justifyContent = 'center';
		this.overlay.style.padding = '20px';
		this.overlay.style.color = 'white';
		this.overlay.style.textAlign = 'center';
		this.overlay.style.fontSize = '36px'; // Make the arrow larger
	
		// Use Unicode arrows to represent the gesture
		let arrowSymbol = '';
		if (gesture === 'right') {
			arrowSymbol = '→'; // Right arrow
		} else if (gesture === 'left') {
			arrowSymbol = '←'; // Left arrow
		} else if (gesture === 'up') {
			arrowSymbol = '↑'; // Up arrow
		} else if (gesture === 'down') {
			arrowSymbol = '↓'; // Down arrow
		}
	
		// Add the arrow symbol to the overlay
		const arrow = document.createElement('div');
		arrow.innerText = arrowSymbol;
		this.overlay.appendChild(arrow);
	
		// Add text below the arrow based on gesture direction
		const text = document.createElement('div');
		text.innerText = gesture === 'right' ? 'Next Page' : 
						 gesture === 'left' ? 'Previous Page' : 
						 gesture === 'up' ? 'Scroll Up' : 'Scroll Down';
		text.style.marginTop = '10px';
		text.style.fontSize = '16px'; // Smaller font size for the text
		this.overlay.appendChild(text);
	
		document.body.appendChild(this.overlay);
	}

	public getCurrentViewOfType() {
		// get the current active view
		let markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// To distinguish whether the current view is hidden or not markdownView
		let currentView = this.app.workspace.getActiveViewOfType(View) as MarkdownView;
		// solve the problem of closing always focus new tab setting
		if (markdownView !== null) {
			globalMarkdownView = markdownView;
		} else {
			// fix the plugin shutdown problem when the current view is not exist
			if (currentView == null || currentView?.file?.extension == "md") {
				markdownView = globalMarkdownView
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
			this.app.workspace.setActiveLeaf(markdownView!.leaf, {
				focus: true,
			});
		} else {
			isPreview(markdownView) && preview.applyScroll(0);
		}
		
	}

	private scrollToBottom = async () => {
		const markdownView = this.getCurrentViewOfType();
		
		const file = this.app.workspace.getActiveFile()
		const content = await (this.app as any).vault.cachedRead(file);
		const lines = content.split('\n');
		let numberOfLines = lines.length;
		//in preview mode don't count empty lines at the end
		if (markdownView.getMode() === 'preview') {
			while (numberOfLines > 0 && lines[numberOfLines - 1].trim() === '') {
				numberOfLines--;
			}
		}
		markdownView.currentMode.applyScroll((numberOfLines - 1))
		
	}

}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: GestureNav;

	constructor(app: App, plugin: GestureNav) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Triger Mouse Key')
			.setDesc('Select the mouse key to trigger the gesture')
			.addDropdown(dropdown => dropdown
				.addOptions({
					// [TrigerKey.LEFT_CLICK]: 'Left Click',
					[TrigerKey.RIGHT_CLICK]: 'Right Click',
					// [TrigerKey.WHEEL_CLICK]: 'Wheel Click',
					// [TrigerKey.DOUBLE_LEFT_CLICK]: 'Double Left Click',
					// [TrigerKey.DOUBLE_RIGHT_CLICK]: 'Double Right Click'
				})
				.setValue(this.plugin.settings.trigerkey)
				.onChange(async (value) => {
					this.plugin.settings.trigerkey = value as TrigerKey;
					await this.plugin.saveSettings();
				}));

	}
}
