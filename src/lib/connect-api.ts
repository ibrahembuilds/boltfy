export const CONNECT_API = import.meta.env.VITE_CONNECT_API ?? "http://127.0.0.1:8787";

export interface ConnectField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

export interface ConnectEndpoint {
  id: string;
  name: string;
  slug: string;
  ingestUrl: string;
  fields: ConnectField[];
  rewrittenHtml: string;
  submissionCount: number;
  createdAt: string;
  curl: string;
}

export interface ConnectSubmission {
  id: string;
  payload: Record<string, string>;
  createdAt: string;
}

export class ConnectError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, key: string | null, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (key) headers.set("Authorization", `Bearer ${key}`);
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${CONNECT_API}${path}`, { ...init, headers });
  } catch {
    throw new ConnectError(0, "The Connect API is not running. In the project folder, run npm run connect.");
  }
  const text = await response.text();
  let data: { error?: string } = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new ConnectError(response.status, "Connect API returned a response this page could not read.");
    }
  }
  if (!response.ok) throw new ConnectError(response.status, data.error || response.statusText);
  return data as T;
}

export function checkHealth() {
  return request<{ ok: boolean; service: string }>("/health", null);
}

export function devSession() {
  return request<{ apiKey: string; apiUrl: string }>("/api/v1/dev/session", null);
}

export function listEndpoints(key: string) {
  return request<{ endpoints: ConnectEndpoint[] }>("/api/v1/endpoints", key);
}

export function createEndpoint(key: string, input: { name?: string; html: string; injectContact: boolean }) {
  return request<ConnectEndpoint>("/api/v1/endpoints", key, { method: "POST", body: JSON.stringify(input) });
}

export function deleteEndpoint(key: string, slug: string) {
  return request<{ ok: boolean }>(`/api/v1/endpoints/${slug}`, key, { method: "DELETE" });
}

export function listSubmissions(key: string, slug: string) {
  return request<{ submissions: ConnectSubmission[] }>(`/api/v1/endpoints/${slug}/submissions`, key);
}

export function testEndpoint(key: string, slug: string) {
  return request<{ ok: boolean; payload: Record<string, string> }>(`/api/v1/endpoints/${slug}/test`, key, { method: "POST", body: "{}" });
}
