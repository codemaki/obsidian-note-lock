var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => NoteLockPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var import_child_process = require("child_process");
var import_fs = require("fs");
function getFilePath(app) {
  const view = app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
  if (!view || !view.file)
    return null;
  const vaultPath = app.vault.adapter.basePath;
  return `${vaultPath}/${view.file.path}`;
}
function isLocked(filePath) {
  try {
    const mode = (0, import_fs.statSync)(filePath).mode;
    return (mode & 128) === 0;
  } catch (e) {
    return false;
  }
}
function lockFile(filePath) {
  (0, import_child_process.execSync)(`chmod a-w "${filePath}"`);
}
function unlockFile(filePath) {
  (0, import_child_process.execSync)(`chmod u+w "${filePath}"`);
}
var NoteLockPlugin = class extends import_obsidian.Plugin {
  async onload() {
    if (process.platform !== "darwin") {
      new import_obsidian.Notice("Note Lock: This plugin requires macOS.");
      return;
    }
    this.statusBarItem = this.addStatusBarItem();
    this.statusBarItem.addClass("obsidian-note-lock-status-bar");
    this.statusBarItem.setText("\u{1F513} Unlocked");
    this.statusBarItem.addEventListener("click", () => this.toggleLock());
    this.addCommand({
      id: "toggle-obsidian-note-lock",
      name: "Toggle note lock",
      callback: () => this.toggleLock()
    });
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.updateStatusBar();
      })
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        this.enforceReadingView();
      })
    );
    this.updateStatusBar();
  }
  toggleLock() {
    const filePath = getFilePath(this.app);
    if (!filePath) {
      new import_obsidian.Notice("Note Lock: No active note.");
      return;
    }
    try {
      const locked = isLocked(filePath);
      if (locked) {
        unlockFile(filePath);
        new import_obsidian.Notice("\u{1F513} Note unlocked.");
        this.setEditingView();
      } else {
        lockFile(filePath);
        new import_obsidian.Notice("\u{1F512} Note locked.");
        this.setReadingView();
      }
      this.updateStatusBar();
    } catch (err) {
      new import_obsidian.Notice(`Note Lock: Error \u2014 ${err.message}`);
    }
  }
  updateStatusBar() {
    const filePath = getFilePath(this.app);
    if (!filePath) {
      this.statusBarItem.setText("");
      this.statusBarItem.removeClass("is-locked", "is-unlocked");
      return;
    }
    try {
      const locked = isLocked(filePath);
      if (locked) {
        this.statusBarItem.setText("\u{1F512} Locked");
        this.statusBarItem.removeClass("is-unlocked");
        this.statusBarItem.addClass("is-locked");
      } else {
        this.statusBarItem.setText("\u{1F513} Unlocked");
        this.statusBarItem.removeClass("is-locked");
        this.statusBarItem.addClass("is-unlocked");
      }
    } catch (e) {
      this.statusBarItem.setText("");
    }
  }
  // Called on every layout-change to block editing mode on locked files
  enforceReadingView() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    if (!view || !view.file)
      return;
    if (view.getMode() === "preview")
      return;
    const vaultPath = this.app.vault.adapter.basePath;
    const filePath = `${vaultPath}/${view.file.path}`;
    if (isLocked(filePath)) {
      view.setState({ ...view.getState(), mode: "preview" }, { history: false });
      new import_obsidian.Notice("\u{1F512} \uC774 \uB178\uD2B8\uB294 \uC7A0\uACA8 \uC788\uC2B5\uB2C8\uB2E4. \uBA3C\uC800 \uC7A0\uAE08\uC744 \uD574\uC81C\uD558\uC138\uC694.");
    }
  }
  setReadingView() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    if (view && view.getMode() !== "preview") {
      view.setState({ ...view.getState(), mode: "preview" }, { history: false });
    }
  }
  setEditingView() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    if (view && view.getMode() !== "source") {
      view.setState({ ...view.getState(), mode: "source" }, { history: false });
    }
  }
};
