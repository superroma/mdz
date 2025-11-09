import { spawn } from "node:child_process";
import { once } from "node:events";
import { resolve } from "node:path";
import process from "node:process";
import { FRONTEND_URL, HEALTH_ENDPOINT } from "./constants";

type ManagedProcess = {
  name: string;
  command: string;
  args: string[];
  readyUrl: string;
  cwd: string;
  instance?: ReturnType<typeof spawn>;
};

const repoRoot = resolve(process.cwd(), "..", "..");
const isWindows = process.platform === "win32";

function binPath(name: string) {
  return resolve(
    repoRoot,
    "node_modules",
    ".bin",
    isWindows ? `${name}.cmd` : name
  );
}

const processes: ManagedProcess[] = [
  {
    name: "backend",
    command: binPath("tsx"),
    args: ["src/server.ts"],
    cwd: resolve(repoRoot, "packages", "backend"),
    readyUrl: HEALTH_ENDPOINT
  },
  {
    name: "frontend",
    command: binPath("vite"),
    args: ["--host", "127.0.0.1", "--port", "3202"],
    cwd: resolve(repoRoot, "packages", "frontend"),
    readyUrl: `${FRONTEND_URL}/`
  }
];

let started = false;

async function waitForUrl(url: string, timeout = 60_000, interval = 500) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.ok || (response.status >= 300 && response.status < 400)) {
        return;
      }
    } catch {
      // ignore failures until timeout
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, interval));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function spawnProcess(entry: ManagedProcess) {
  if (entry.instance) {
    return entry.instance;
  }

  const pagesRoot = process.env.TEST_PAGES_ROOT || resolve(repoRoot, "pages");

  const env: Record<string, string> = {
    ...process.env,
    NODE_ENV: "test",
    PAGES_ROOT: pagesRoot
  };

  // Set backend port
  if (entry.name === "backend") {
    env.PORT = "3201";
  }

  // Set frontend port and API URL
  if (entry.name === "frontend") {
    env.VITE_API_URL = "http://127.0.0.1:3201";
  }

  const child = spawn(entry.command, entry.args, {
    cwd: entry.cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout?.on("data", (chunk) => {
    process.stdout.write(`[${entry.name}] ${chunk}`);
  });

  child.stderr?.on("data", (chunk) => {
    process.stderr.write(`[${entry.name}] ${chunk}`);
  });

  entry.instance = child;
  return child;
}

export async function ensureServersRunning() {
  if (started) {
    return;
  }

  for (const proc of processes) {
    spawnProcess(proc);
    await waitForUrl(proc.readyUrl);
  }

  started = true;
}

export async function shutdownServers() {
  const promises = processes
    .map((proc) => proc.instance)
    .filter((child): child is ReturnType<typeof spawn> => Boolean(child))
    .map(async (child) => {
      child.removeAllListeners("exit");
      child.kill("SIGTERM");
      try {
        await once(child, "exit");
      } catch {
        // ignore
      }
    });

  await Promise.all(promises);
  for (const proc of processes) {
    proc.instance = undefined;
  }
  started = false;
}

process.on("exit", () => {
  void shutdownServers();
});

process.on("SIGINT", () => {
  void shutdownServers().then(() => process.exit(0));
});

