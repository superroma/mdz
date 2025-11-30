import { spawn } from "node:child_process";
import { once } from "node:events";
import { resolve } from "node:path";
import process from "node:process";
import { createServer } from "node:net";
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
    args: ["src/dev-server.ts"],
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

const REQUIRED_PORTS = [
  { port: 3201, name: "backend" },
  { port: 3202, name: "frontend" }
];

async function checkPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    
    server.once("listening", () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port, "127.0.0.1");
  });
}

async function checkRequiredPorts(): Promise<void> {
  const busyPorts: string[] = [];
  
  for (const { port, name } of REQUIRED_PORTS) {
    const available = await checkPortAvailable(port);
    if (!available) {
      busyPorts.push(`${port} (${name})`);
    }
  }
  
  if (busyPorts.length > 0) {
    throw new Error(
      `Required ports are already in use: ${busyPorts.join(", ")}.\n` +
      `Please kill any existing test servers:\n` +
      `  pkill -f "tsx.*server.ts"\n` +
      `  pkill -f "vite.*3202"`
    );
  }
}

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

  // Check if required ports are available before starting servers
  await checkRequiredPorts();

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
      
      // Try graceful shutdown first
      child.kill("SIGTERM");
      
      // Wait for graceful shutdown with timeout
      const gracefulTimeout = new Promise((resolve) => setTimeout(resolve, 3000));
      const gracefulExit = once(child, "exit").catch(() => {});
      
      const result = await Promise.race([
        gracefulExit.then(() => "exited"),
        gracefulTimeout.then(() => "timeout")
      ]);
      
      // Force kill if still running after timeout
      if (result === "timeout" && child.exitCode === null) {
        child.kill("SIGKILL");
        
        // Wait for force kill with shorter timeout
        const forceTimeout = new Promise((resolve) => setTimeout(resolve, 2000));
        const forceExit = once(child, "exit").catch(() => {});
        
        await Promise.race([forceExit, forceTimeout]);
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

