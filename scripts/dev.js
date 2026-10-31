import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(scriptDir, "..");
const backendDir = path.resolve(frontendDir, "..", "backend");
const backendUrl =
  process.env.VITE_BACKEND_PROXY_TARGET || "http://127.0.0.1:3000";
const backendHealthUrl = new URL("/api/health", backendUrl);
const children = new Set();
let stopping = false;

function stopChildren() {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill();
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopChildren();
    process.exitCode = signal === "SIGINT" ? 130 : 143;
  });
}

function launchNode(args, cwd) {
  const child = spawn(process.execPath, args, { cwd, stdio: "inherit" });
  children.add(child);
  return child;
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({ code, signal }));
  });
}

async function backendIsReady() {
  try {
    const response = await fetch(backendHealthUrl, {
      signal: AbortSignal.timeout(1000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForBackend(child) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (await backendIsReady()) return;
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error("The backend exited before its health check passed.");
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(
    `Backend did not become ready at ${backendHealthUrl} within 30 seconds.`,
  );
}

async function main() {
  let ownedBackend = null;
  try {
    if (await backendIsReady()) {
      console.log(`Using existing backend at ${backendUrl}`);
    } else {
      console.log(`Starting backend from ${backendDir}`);
      ownedBackend = launchNode(["src/server.js"], backendDir);
      await waitForBackend(ownedBackend);
      console.log(`Backend is ready at ${backendHealthUrl}`);
    }

    const frontend = launchNode(
      [
        path.join(frontendDir, "node_modules", "vite", "bin", "vite.js"),
        "--host",
        "127.0.0.1",
        "--port",
        "5173",
      ],
      frontendDir,
    );

    const { code, signal } = await waitForExit(frontend);
    if (ownedBackend && ownedBackend.exitCode === null) ownedBackend.kill();
    process.exitCode = code ?? (signal ? 1 : 0);
  } catch (error) {
    console.error(`[Calibr8 dev] ${error.message}`);
    process.exitCode = 1;
    stopChildren();
  }
}

main();
