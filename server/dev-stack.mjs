import { spawn } from "node:child_process";
import { startConnectServer } from "./app.mjs";

const api = await startConnectServer({
  port: Number(process.env.PORT || 8787),
  persistDevKey: true,
  allowDevSession: process.env.BOLTFY_ALLOW_DEV_SESSION !== "0",
});
console.log(`Boltfy Connect API  ${api.url}`);

const vite = spawn(process.execPath, ["./node_modules/vite/bin/vite.js", "--host", "0.0.0.0", "--port", "8080"], {
  stdio: "inherit",
  cwd: process.cwd(),
});

let closing = false;
async function stop(code = 0) {
  if (closing) return;
  closing = true;
  vite.kill("SIGTERM");
  await api.close();
  process.exit(code);
}

process.on("SIGINT", () => { stop(0); });
process.on("SIGTERM", () => { stop(0); });
vite.on("exit", (code) => { stop(code ?? 0); });
