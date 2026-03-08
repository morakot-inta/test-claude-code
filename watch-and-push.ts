#!/usr/bin/env bun
// Auto-commit and push changes to GitHub on file save

import fs from "node:fs";

const WATCH_DIR = import.meta.dir;
const DEBOUNCE_MS = 2000; // wait 2s after last change before committing

let timer: ReturnType<typeof setTimeout> | null = null;
let pending = false;

async function syncToGit() {
  const status = Bun.$`git -C ${WATCH_DIR} status --porcelain`.text();
  const changes = (await status).trim();
  if (!changes) return;

  console.log(`[auto-sync] Changes detected:\n${changes}`);

  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  try {
    await Bun.$`git -C ${WATCH_DIR} add -A`;
    await Bun.$`git -C ${WATCH_DIR} commit -m ${"auto: " + timestamp}`;
    await Bun.$`git -C ${WATCH_DIR} push origin main`;
    console.log(`[auto-sync] Pushed at ${timestamp}`);
  } catch (e) {
    console.error("[auto-sync] Error:", e);
  }
}

function schedule() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    if (pending) return;
    pending = true;
    await syncToGit();
    pending = false;
  }, DEBOUNCE_MS);
}

const watcher = fs.watch(WATCH_DIR, { recursive: true }, (event, filename) => {
  if (!filename) return;
  // Ignore git internals, node_modules, and this script's own changes
  if (
    filename.startsWith(".git") ||
    filename.startsWith("node_modules") ||
    filename === "watch-and-push.ts"
  )
    return;
  console.log(`[auto-sync] ${event}: ${filename}`);
  schedule();
});

console.log(`[auto-sync] Watching ${WATCH_DIR} — changes will auto-push to GitHub`);
console.log("[auto-sync] Press Ctrl+C to stop\n");

process.on("SIGINT", () => {
  watcher.close();
  process.exit(0);
});
