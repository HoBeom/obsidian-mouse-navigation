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

	 private registerEvents(currentWindow: Window) {
        const doc: Document = currentWindow.document;

		function preventDefault (event) {
			if (event.isTrusted) {
			event.preventDefault();
			event.stopPropagation();
			}
		}
		doc.addEventListener('contextmenu', preventDefault, true);

		this.registerDomEvent(doc, 'click', (evt: MouseEvent) => {
			new Notice('Click!! Position: '+ evt.clientX + ' ' + evt.clientY);
		});
		

		// Right Click Event disable (show context menu)
		// this.registerDomEvent(doc, 'contextmenu', (evt: MouseEvent) => {
		// 	new Notice('Context menu event!! (Right Click) Position: '+ evt.clientX + ' ' + evt.clientY);
		// 	evt.preventDefault();
		// 	evt.stopPropagation();
		// });
		 
		let startClientX = 0;
		let startClientY = 0;
		this.registerDomEvent(doc, 'mousedown', (evt: MouseEvent) => {
			if (evt.button === 2) {
				globalMouseDown = true;
				new Notice('Right Mouse Key Down!! Position: '+ evt.clientX + ' ' + evt.clientY);
				startClientX = evt.clientX;
				startClientY = evt.clientY;
			}
		});

		var gesture_margin = 100;
		// trigger contextmenu when right click up
		this.registerDomEvent(doc, 'mouseup', (evt: MouseEvent) => {
			if (evt.button === 2) {
				globalMouseDown = false;
				new Notice('Right Mouse Key UP!! Position: '+ evt.clientX + ' ' + evt.clientY);
				if (Math.abs(evt.clientX - startClientX) > gesture_margin &&
					Math.abs(evt.clientY - startClientY) < gesture_margin) {
					// horizontal gesture
					if (evt.clientX > startClientX) {
						new Notice('Right Gesture!!');
						// move forward page
						window.history.forward();
					}
					else {
						new Notice('Left Gesture!!');
						// move back page
						window.history.back();
					}
				}
				else if (Math.abs(evt.clientX - startClientX) < gesture_margin &&
					Math.abs(evt.clientY - startClientY) > gesture_margin) {
					// vertical gesture
					if (evt.clientY > startClientY) {
						new Notice('Down Gesture!!');
						this.scrollToBottom();
					}
					else {
						new Notice('Up Gesture!!')
						this.scrollToTop();						
					}
				}
				else {
					new Notice('Show contextmenu'+ (evt.clientX - startClientX) + ' ' + (evt.clientY - startClientY));
					// trigger contextmenu
					// doc.addEventListener('contextmenu', preventDefault, true);
					doc.elementFromPoint(evt.clientX, evt.clientY).dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: evt.clientX, clientY: evt.clientY}));
				}
			}
		});

		// let clinetX = 0;
		// let clinetY = 0;
		// this.registerDomEvent(doc, 'drag', (evt: MouseEvent) => {
		// 	if (evt.clientX !== clinetX && evt.clientY !== clinetY) {
		// 		clinetX = evt.clientX;
		// 		clinetY = evt.clientY;
		// 		new Notice('Drag!! Position: '+ evt.clientX + ' ' + evt.clientY);
		// 	}
		// });

		// this.registerDomEvent(doc, 'dragend', (evt: MouseEvent) => {
		// 	new Notice('Drag End!! Position: '+ evt.clientX + ' ' + evt.clientY);
		// });

		// this.registerDomEvent(doc, 'dragenter', (evt: MouseEvent) => {
		// 	new Notice('Drag Enter!! Position: '+ evt.clientX + ' ' + evt.clientY);
		// });

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
