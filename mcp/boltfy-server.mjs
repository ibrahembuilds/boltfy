#!/usr/bin/env node
// MCP server for Boltfy Connect. Speaks LSP-style Content-Length framing on
// stdio, which is what Cursor and other MCP clients expect. stdout is reserved
// for protocol messages; logs go to stderr.
import { readFileSync } from "node:fs";
import path from "node:path";

const API = (process.env.BOLTFY_API_URL || "http://127.0.0.1:8787").replace(/\/$/, "");

function loadKey() {
  if (process.env.BOLTFY_API_KEY?.trim()) return process.env.BOLTFY_API_KEY.trim();
  const file = process.env.BOLTFY_KEY_FILE || path.resolve(process.cwd(), ".boltfy/dev-key");
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    return "";
  }
}

const TOOLS = [
  {
    name: "boltfy_connection",
    description: "Show how this agent is connected to Boltfy Connect: API base URL, whether an API key is loaded, and the OpenAPI and llms.txt addresses. Does not reveal the key.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "boltfy_create_endpoint",
    description: "Turn an HTML page or form into a Boltfy ingest endpoint. Returns the public POST URL, the rewritten HTML (form action pointed at Boltfy), the detected fields, and a curl command. Set injectContact true when the page has no <form> and a contact form should be added.",
    inputSchema: {
      type: "object",
      properties: {
        html: { type: "string", description: "Full HTML page or a single <form>." },
        name: { type: "string", description: "Name shown in the dashboard." },
        injectContact: { type: "boolean", description: "Add name, email, and message when the page has no form." },
      },
      required: ["html"],
      additionalProperties: false,
    },
  },
  {
    name: "boltfy_list_endpoints",
    description: "List HTML endpoints and how many submissions each has.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "boltfy_get_endpoint",
    description: "Get one endpoint, including rewritten HTML and the curl test command.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string" } },
      required: ["slug"],
      additionalProperties: false,
    },
  },
  {
    name: "boltfy_list_submissions",
    description: "Read recent submissions for an endpoint. This is the dashboard data.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string" },
        limit: { type: "integer", minimum: 1, maximum: 100 },
      },
      required: ["slug"],
      additionalProperties: false,
    },
  },
  {
    name: "boltfy_test_endpoint",
    description: "Store one sample submission built from the endpoint's fields, so you can prove the dashboard is receiving data before the real site goes live.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string" } },
      required: ["slug"],
      additionalProperties: false,
    },
  },
  {
    name: "boltfy_delete_endpoint",
    description: "Delete an endpoint and every submission stored for it.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string" } },
      required: ["slug"],
      additionalProperties: false,
    },
  },
];

function send(message) {
  const json = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`);
}

function result(id, text, isError = false) {
  send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text }], isError } });
}

async function api(method, pathname, body) {
  const key = loadKey();
  if (!key) {
    throw new Error("No Boltfy API key. Start the API with npm run connect, then retry. The key is written to .boltfy/dev-key, or set BOLTFY_API_KEY.");
  }
  const response = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  if (!response.ok) throw new Error(json?.error || `Boltfy API ${response.status}`);
  return json;
}

async function callTool(name, args) {
  if (name === "boltfy_connection") {
    return {
      apiUrl: API,
      keyLoaded: Boolean(loadKey()),
      openapi: `${API}/api/v1/openapi.json`,
      llms: `${API}/llms.txt`,
      docs: "AGENTS.md",
      mcp: "node mcp/boltfy-server.mjs",
    };
  }
  if (name === "boltfy_create_endpoint") {
    return api("POST", "/api/v1/endpoints", {
      html: args.html,
      name: args.name,
      injectContact: Boolean(args.injectContact),
    });
  }
  if (name === "boltfy_list_endpoints") return api("GET", "/api/v1/endpoints");
  if (name === "boltfy_get_endpoint") return api("GET", `/api/v1/endpoints/${encodeURIComponent(args.slug)}`);
  if (name === "boltfy_list_submissions") {
    const limit = args.limit ? `?limit=${encodeURIComponent(args.limit)}` : "";
    return api("GET", `/api/v1/endpoints/${encodeURIComponent(args.slug)}/submissions${limit}`);
  }
  if (name === "boltfy_test_endpoint") return api("POST", `/api/v1/endpoints/${encodeURIComponent(args.slug)}/test`, {});
  if (name === "boltfy_delete_endpoint") return api("DELETE", `/api/v1/endpoints/${encodeURIComponent(args.slug)}`);
  throw new Error(`Unknown tool ${name}`);
}

async function handle(message) {
  if (!message || message.jsonrpc !== "2.0") return;
  if (message.method === "notifications/initialized" || message.method === "notifications/cancelled") return;
  if (message.id == null && message.method?.startsWith("notifications/")) return;

  if (message.method === "initialize") {
    const requested = message.params?.protocolVersion;
    const supported = ["2025-03-26", "2024-11-05"];
    send({
      jsonrpc: "2.0",
      id: message.id,
      result: {
        protocolVersion: supported.includes(requested) ? requested : "2024-11-05",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "boltfy-connect", version: "1.0.0" },
        instructions: "Boltfy Connect is a backend for HTML forms. Use boltfy_create_endpoint with the page HTML, then boltfy_test_endpoint, then boltfy_list_submissions. The public ingest URL can be posted from any static site.",
      },
    });
    return;
  }
  if (message.method === "ping") {
    send({ jsonrpc: "2.0", id: message.id, result: {} });
    return;
  }
  if (message.method === "tools/list") {
    send({ jsonrpc: "2.0", id: message.id, result: { tools: TOOLS } });
    return;
  }
  if (message.method === "tools/call") {
    const name = message.params?.name;
    const args = message.params?.arguments || {};
    try {
      const value = await callTool(name, args);
      result(message.id, JSON.stringify(value, null, 2));
    } catch (error) {
      result(message.id, error.message || "Tool failed", true);
    }
    return;
  }
  if (message.id != null) {
    send({ jsonrpc: "2.0", id: message.id, error: { code: -32601, message: `Method not found: ${message.method}` } });
  }
}

let buffer = Buffer.alloc(0);
process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  while (buffer.length) {
    if (buffer[0] === 0x7b) {
      const newline = buffer.indexOf(0x0a);
      if (newline === -1) return;
      const line = buffer.slice(0, newline).toString("utf8").trim();
      buffer = buffer.slice(newline + 1);
      if (!line) continue;
      handle(JSON.parse(line)).catch((error) => console.error(error));
      continue;
    }
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) return;
    const header = buffer.slice(0, headerEnd).toString("utf8");
    const match = /Content-Length:\s*(\d+)/i.exec(header);
    if (!match) {
      buffer = Buffer.alloc(0);
      console.error("MCP client sent a frame without Content-Length");
      return;
    }
    const length = Number(match[1]);
    const start = headerEnd + 4;
    if (buffer.length < start + length) return;
    const body = buffer.slice(start, start + length).toString("utf8");
    buffer = buffer.slice(start + length);
    handle(JSON.parse(body)).catch((error) => console.error(error));
  }
});

process.stdin.on("end", () => process.exit(0));
console.error(`boltfy-connect MCP → ${API}`);
