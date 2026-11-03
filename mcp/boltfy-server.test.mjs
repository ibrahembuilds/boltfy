import { spawn } from "node:child_process";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startConnectServer } from "../server/app.mjs";

const databaseUrl = "postgres://postgres:postgres@127.0.0.1:5432/boltfy_connect_mcp_test";

function frame(message) {
  const json = JSON.stringify(message);
  return `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`;
}

function readFrames(child) {
  let buffer = Buffer.alloc(0);
  const frames = [];
  let waiters = [];
  child.stdout.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (true) {
      const headerEnd = buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) break;
      const header = buffer.slice(0, headerEnd).toString("utf8");
      const match = /Content-Length:\s*(\d+)/i.exec(header);
      if (!match) break;
      const length = Number(match[1]);
      const start = headerEnd + 4;
      if (buffer.length < start + length) break;
      const body = buffer.slice(start, start + length).toString("utf8");
      buffer = buffer.slice(start + length);
      const message = JSON.parse(body);
      if (waiters.length) waiters.shift()(message);
      else frames.push(message);
    }
  });
  return () => new Promise((resolve) => {
    if (frames.length) resolve(frames.shift());
    else waiters.push(resolve);
  });
}

describe("boltfy MCP", () => {
  let api;
  let child;
  let next;

  beforeAll(async () => {
    api = await startConnectServer({ databaseUrl, persistDevKey: false, allowDevSession: false, rateLimit: 30 });
    child = spawn(process.execPath, [path.resolve("mcp/boltfy-server.mjs")], {
      env: {
        ...process.env,
        BOLTFY_API_URL: api.url,
        BOLTFY_API_KEY: api.devKey,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });
    next = readFrames(child);
  });

  afterAll(async () => {
    child?.kill();
    if (api) await api.close();
  });

  it("lists tools, creates an endpoint from HTML, tests it, and reads the submission", async () => {
    child.stdin.write(frame({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "0" } },
    }));
    const initialized = await next();
    expect(initialized.result.serverInfo.name).toBe("boltfy-connect");

    child.stdin.write(frame({ jsonrpc: "2.0", method: "notifications/initialized" }));
    child.stdin.write(frame({ jsonrpc: "2.0", id: 2, method: "tools/list" }));
    const tools = await next();
    const names = tools.result.tools.map((tool) => tool.name);
    expect(names).toContain("boltfy_create_endpoint");
    expect(names).toContain("boltfy_test_endpoint");
    expect(names).toContain("boltfy_list_submissions");

    child.stdin.write(frame({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "boltfy_create_endpoint",
        arguments: {
          name: "Agent form",
          html: `<form><label>Email <input name="email" type="email" required></label><textarea name="message"></textarea></form>`,
        },
      },
    }));
    const createdMessage = await next();
    expect(createdMessage.result.isError).toBe(false);
    const created = JSON.parse(createdMessage.result.content[0].text);
    expect(created.ingestUrl).toContain("/api/v1/ingest/");

    child.stdin.write(frame({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: "boltfy_test_endpoint", arguments: { slug: created.slug } },
    }));
    const tested = JSON.parse((await next()).result.content[0].text);
    expect(tested.payload.email).toBe("qa@boltfy.test");

    child.stdin.write(frame({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: { name: "boltfy_list_submissions", arguments: { slug: created.slug } },
    }));
    const listed = JSON.parse((await next()).result.content[0].text);
    expect(listed.submissions).toHaveLength(1);
    expect(listed.submissions[0].payload.message).toBe("Test from Boltfy");
  });
});
