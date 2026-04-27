import { spawn } from "node:child_process";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function run(name, args) {
  const child = spawn(npmCmd, args, {
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
  child.on("exit", (code, signal) => {
    if (signal) return;
    if (code && code !== 0) {
      // eslint-disable-next-line no-console
      console.error(`[dev] ${name} exited with code ${code}`);
      process.exitCode = code;
    }
  });
  return child;
}

const server = run("server", ["run", "dev", "-w", "server"]);
const client = run("client", ["run", "dev", "-w", "client"]);

function shutdown() {
  server.kill("SIGINT");
  client.kill("SIGINT");
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});
process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

server.on("exit", (code) => {
  if (code && code !== 0) client.kill("SIGINT");
});
client.on("exit", (code) => {
  if (code && code !== 0) server.kill("SIGINT");
});

