// src/actions/ActionInterface.ts

import { App, Editor, MarkdownView } from "obsidian";

export interface CommandApp extends App {
  commands: {
    executeCommandById(id: string): boolean | void;
  };
}

export interface ActionContext {
  app: CommandApp;
  editor?: Editor;
  view?: MarkdownView;
}

export interface Action {
  id: string;
  name: string;
  description: string;
  icon: string;
  execute: (context: ActionContext) => boolean;
}
