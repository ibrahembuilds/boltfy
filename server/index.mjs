import path from "node:path";
import { startConnectServer } from "./app.mjs";

const port = Number(process.env.PORT || 8787);
const allowDevSession = process.env.BOLTFY_ALLOW_DEV_SESSION !== "0";
const server = await startConnectServer({
  port,
  persistDevKey: true,
  allowDevSession,
  keyFile: path.resolve(process.cwd(), ".boltfy/dev-key"),
});

console.log(`Boltfy Connect API  ${server.url}`);
console.log(`OpenAPI             ${server.url}/api/v1/openapi.json`);
console.log(`Agent notes         ${server.url}/llms.txt`);
console.log("API key             .boltfy/dev-key  (or BOLTFY_API_KEY)");
