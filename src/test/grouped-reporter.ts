import type { Reporter, TestCase, TestModule } from "vitest/node";

type GroupStats = {
  files: number;
  started: number;
  done: number;
  passed: number;
  failed: number;
  skipped: number;
  failList: string[];
};

const SPIN = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export default class GroupedReporter implements Reporter {
  private groups = new Map<string, GroupStats>();
  private active = new Map<string, number>();
  private spinIdx = 0;
  private errored: string[] = [];

  private get isTTY(): boolean {
    return Boolean(process.stdout?.isTTY && !process.env.NO_COLOR);
  }

  private groupOf(mod: TestModule): string {
    const p = (mod as any)?.moduleId ?? "";
    const norm = p.replace(/\\/g, "/");
    const idx = norm.indexOf("src/");
    const parts = (idx === -1 ? norm : norm.slice(idx)).split("/");
    if (parts[0] === "src" && parts[1] === "components" && parts.length >= 4) {
      return `components/${parts[2]}`;
    }
    if (parts[0] === "src" && parts[1] !== "components" && parts.length >= 3) {
      return parts[1];
    }
    return parts.slice(0, 2).join("/") || "(root)";
  }

  private stats(g: string): GroupStats {
    let s = this.groups.get(g);
    if (!s) {
      s = { files: 0, started: 0, done: 0, passed: 0, failed: 0, skipped: 0, failList: [] };
      this.groups.set(g, s);
    }
    return s;
  }

  private spinner() {
    return this.isTTY ? SPIN[this.spinIdx % SPIN.length] : ">";
  }

  private renderStatus() {
    if (!this.isTTY) return;
    const running: string[] = [];
    let done = 0;
    let total = 0;
    let failed = 0;
    for (const [name, s] of this.groups) {
      total += s.files;
      done += s.done;
      failed += s.failed;
      const act = this.active.get(name) ?? 0;
      if (act > 0) running.push(`${name} (${act})`);
    }
    const line = `${this.spinner()} running: ${running.join(", ") || "—"}  |  ✗ ${failed} failed  ·  ${done}/${total} files`;
    try {
      process.stdout.write(`\r\u001b[2K${line.slice(0, (process.stdout.columns || 90) - 1)}`);
    } catch {
      // ignore
    }
  }

  onTestModuleQueued(mod: TestModule): void {
    const g = this.groupOf(mod);
    this.stats(g).files++;
  }

  onTestModuleStart(mod: TestModule): void {
    const g = this.groupOf(mod);
    const s = this.stats(g);
    s.started++;
    this.active.set(g, (this.active.get(g) ?? 0) + 1);
    this.renderStatus();
  }

  onTestCaseResult(testCase: TestCase): void {
    const mod = testCase.module;
    const g = this.groupOf(mod);
    const s = this.stats(g);
    const st = (testCase.result() as any)?.state ?? "passed";
    if (st === "failed") {
      s.failed++;
      const id = (mod as any)?.moduleId ?? "";
      const norm = String(id).replace(/\\/g, "/");
      if (!s.failList.includes(norm)) s.failList.push(norm);
      if (!this.errored.includes(norm)) this.errored.push(norm);
    } else if (st === "skipped") {
      s.skipped++;
    } else {
      s.passed++;
    }
    this.spinIdx++;
    this.renderStatus();
  }

  onTestModuleEnd(mod: TestModule): void {
    const g = this.groupOf(mod);
    const s = this.stats(g);
    s.done++;
    this.active.set(g, Math.max(0, (this.active.get(g) ?? 0) - 1));
    if (s.done >= s.files) {
      const mark = s.failed > 0 ? "✗" : "✓";
      const tot = s.passed + s.failed;
      const pct = tot === 0 ? 0 : Math.round((s.passed / tot) * 100);
      if (this.isTTY) process.stdout.write(`\r\u001b[2K`);
      console.log(
        `${mark} ${g}  ─  ${s.passed}/${tot} passed (${pct}%)  ·  ${s.done}/${s.files} files${s.skipped ? `  (${s.skipped} skipped)` : ""}${s.failList.length ? "  ✗ " + s.failList.join(", ") : ""}`
      );
    }
    this.renderStatus();
  }

  onTestRunEnd(): void {
    if (this.isTTY) process.stdout.write(`\r\u001b[2K`);
    let tp = 0,
      tf = 0,
      ts = 0,
      tfiles = 0;
    for (const s of this.groups.values()) {
      tp += s.passed;
      tf += s.failed;
      ts += s.skipped;
      tfiles += s.files;
    }
    if (this.errored.length) {
      console.log("");
      console.log("Failed files:");
      for (const f of [...new Set(this.errored)]) console.log(`   ✗ ${f}`);
    }
    console.log(
      `TOTAL: ${tp + tf} tests  ─  ✓ ${tp} passed · ✗ ${tf} failed · ${ts} skipped  (${tfiles} files)`
    );
    console.log("");
  }
}