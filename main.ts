import { App, MarkdownView, Notice, Plugin, TFile } from "obsidian";
import { execSync } from "child_process";
import { statSync } from "fs";

function getFilePath(app: App): string | null {
  const view = app.workspace.getActiveViewOfType(MarkdownView);
  if (!view || !view.file) return null;
  const vaultPath = (app.vault.adapter as any).basePath as string;
  return `${vaultPath}/${view.file.path}`;
}

function isLocked(filePath: string): boolean {
  try {
    const mode = statSync(filePath).mode;
    // Locked if user write bit (0o200) is unset
    return (mode & 0o200) === 0;
  } catch {
    return false;
  }
}

function lockFile(filePath: string): void {
  execSync(`chmod a-w "${filePath}"`);
}

function unlockFile(filePath: string): void {
  execSync(`chmod u+w "${filePath}"`);
}

export default class NoteLockPlugin extends Plugin {
  private statusBarItem: HTMLElement;

  async onload() {
    if (process.platform !== "darwin") {
      new Notice("Note Lock: This plugin requires macOS.");
      return;
    }

    // Status bar item
    this.statusBarItem = this.addStatusBarItem();
    this.statusBarItem.addClass("obsidian-note-lock-status-bar");
    this.statusBarItem.setText("🔓 Unlocked");
    this.statusBarItem.addEventListener("click", () => this.toggleLock());

    // Command
    this.addCommand({
      id: "toggle-obsidian-note-lock",
      name: "Toggle note lock",
      callback: () => this.toggleLock(),
    });

    // Update status bar when active leaf changes
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.updateStatusBar();
      })
    );

    // Block switching to editing mode when the file is locked
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        this.enforceReadingView();
      })
    );

    this.updateStatusBar();
  }

  private toggleLock(): void {
    const filePath = getFilePath(this.app);
    if (!filePath) {
      new Notice("Note Lock: No active note.");
      return;
    }

    try {
      const locked = isLocked(filePath);
      if (locked) {
        unlockFile(filePath);
        new Notice("🔓 Note unlocked.");
        this.setEditingView();
      } else {
        lockFile(filePath);
        new Notice("🔒 Note locked.");
        this.setReadingView();
      }
      this.updateStatusBar();
    } catch (err: any) {
      new Notice(`Note Lock: Error — ${err.message}`);
    }
  }

  private updateStatusBar(): void {
    const filePath = getFilePath(this.app);
    if (!filePath) {
      this.statusBarItem.setText("");
      this.statusBarItem.removeClass("is-locked", "is-unlocked");
      return;
    }

    try {
      const locked = isLocked(filePath);
      if (locked) {
        this.statusBarItem.setText("🔒 Locked");
        this.statusBarItem.removeClass("is-unlocked");
        this.statusBarItem.addClass("is-locked");
      } else {
        this.statusBarItem.setText("🔓 Unlocked");
        this.statusBarItem.removeClass("is-locked");
        this.statusBarItem.addClass("is-unlocked");
      }
    } catch {
      this.statusBarItem.setText("");
    }
  }

  // Called on every layout-change to block editing mode on locked files
  private enforceReadingView(): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view || !view.file) return;
    if (view.getMode() === "preview") return;

    const vaultPath = (this.app.vault.adapter as any).basePath as string;
    const filePath = `${vaultPath}/${view.file.path}`;

    if (isLocked(filePath)) {
      view.setState({ ...view.getState(), mode: "preview" }, { history: false });
      new Notice("🔒 이 노트는 잠겨 있습니다. 먼저 잠금을 해제하세요.");
    }
  }

  private setReadingView(): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view && view.getMode() !== "preview") {
      view.setState({ ...view.getState(), mode: "preview" }, { history: false });
    }
  }

  private setEditingView(): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view && view.getMode() !== "source") {
      view.setState({ ...view.getState(), mode: "source" }, { history: false });
    }
  }
}
