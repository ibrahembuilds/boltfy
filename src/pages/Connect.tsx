import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/mode-toggle";
import {
  checkHealth,
  createEndpoint,
  deleteEndpoint,
  devSession,
  listEndpoints,
  listSubmissions,
  testEndpoint,
  type ConnectEndpoint,
  type ConnectSubmission,
} from "@/lib/connect-api";
import { ArrowLeft, Copy, Loader2, Plug, Send, Trash2 } from "lucide-react";

const SAMPLE_LANDING_HTML = `<!doctype html>
<html>
<head><title>Northwind Bakery</title></head>
<body>
  <h1>Northwind Bakery</h1>
  <p>Order a cake or ask about catering.</p>
  <form id="order" name="order">
    <label for="customer">Your name</label>
    <input id="customer" name="customer" type="text" required>
    <label>Email <input name="email" type="email" required placeholder="you@bakery.test"></label>
    <label for="guests">Guests</label>
    <input id="guests" name="guests" type="number" min="1">
    <label for="cake">Cake</label>
    <select id="cake" name="cake">
      <option value="vanilla">Vanilla</option>
      <option value="chocolate">Chocolate</option>
    </select>
    <label for="notes">Notes</label>
    <textarea id="notes" name="notes"></textarea>
    <button type="submit">Request a quote</button>
  </form>
</body>
</html>`;

export default function Connect() {
  const [apiUp, setApiUp] = useState<boolean | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [needsKey, setNeedsKey] = useState(false);
  const [name, setName] = useState("");
  const [html, setHtml] = useState("");
  const [injectContact, setInjectContact] = useState(true);
  const [endpoints, setEndpoints] = useState<ConnectEndpoint[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<ConnectSubmission[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const endpoint = endpoints.find((item) => item.slug === selected) ?? null;

  const refresh = useCallback(async (key: string, slug?: string | null) => {
    const data = await listEndpoints(key);
    setEndpoints(data.endpoints);
    const next = slug && data.endpoints.some((item) => item.slug === slug) ? slug : data.endpoints[0]?.slug ?? null;
    setSelected(next);
    if (next) {
      const rows = await listSubmissions(key, next);
      setSubmissions(rows.submissions);
    } else {
      setSubmissions([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await checkHealth();
        if (cancelled) return;
        setApiUp(true);
        try {
          const session = await devSession();
          if (cancelled) return;
          setApiKey(session.apiKey);
          setNeedsKey(false);
          await refresh(session.apiKey);
        } catch {
          if (!cancelled) setNeedsKey(true);
        }
      } catch {
        if (!cancelled) setApiUp(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refresh]);

  useEffect(() => {
    if (!apiKey || !selected) return;
    const timer = window.setInterval(() => {
      listSubmissions(apiKey, selected).then((rows) => setSubmissions(rows.submissions)).catch(() => {});
      listEndpoints(apiKey).then((data) => setEndpoints(data.endpoints)).catch(() => {});
    }, 3000);
    return () => window.clearInterval(timer);
  }, [apiKey, selected]);

  async function onCreate() {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const created = await createEndpoint(apiKey, { name: name || undefined, html, injectContact });
      setNotice(`Endpoint ready. Any site can POST to ${created.ingestUrl}`);
      await refresh(apiKey, created.slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the endpoint.");
    } finally {
      setBusy(false);
    }
  }

  async function onTest() {
    if (!endpoint) return;
    setError("");
    setBusy(true);
    try {
      await testEndpoint(apiKey, endpoint.slug);
      const [rows, data] = await Promise.all([
        listSubmissions(apiKey, endpoint.slug),
        listEndpoints(apiKey),
      ]);
      setSubmissions(rows.submissions);
      setEndpoints(data.endpoints);
      setNotice("Sample submission stored. It is the first row below.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(slug: string) {
    if (!window.confirm("Delete this endpoint and its submissions?")) return;
    setBusy(true);
    setError("");
    try {
      await deleteEndpoint(apiKey, slug);
      await refresh(apiKey, null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setNotice(`${label} copied.`);
  }

  async function choose(slug: string) {
    setSelected(slug);
    setError("");
    if (!apiKey) return;
    const rows = await listSubmissions(apiKey, slug);
    setSubmissions(rows.submissions);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Boltfy
          </Link>
          <div className="flex items-center gap-2 font-semibold">
            <Plug className="w-4 h-4 text-primary" /> Connect
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="max-w-3xl space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">A backend for any HTML page</h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            A static site can look finished and still have nowhere for a form to go. Paste the page.
            Boltfy reads the form, gives you one POST URL, and puts every response in this dashboard.
            An agent can do the same steps through the Boltfy MCP server.
          </p>
        </div>

        {apiUp === false && (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle>Connect API is stopped</CardTitle>
              <CardDescription>The page is up. The API that stores submissions is not.</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="rounded-lg bg-muted px-4 py-3 text-sm overflow-x-auto">npm run connect</pre>
              <p className="text-sm text-muted-foreground mt-3">Leave that running, then reload. Postgres must be accepting connections on localhost.</p>
            </CardContent>
          </Card>
        )}

        {needsKey && (
          <Card>
            <CardHeader>
              <CardTitle>API key</CardTitle>
              <CardDescription>Paste the key from .boltfy/dev-key or from BOLTFY_API_KEY.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="bfy_..." autoComplete="off" />
              <Button onClick={() => refresh(apiKey).catch((err) => setError(err.message))}>Use key</Button>
            </CardContent>
          </Card>
        )}

        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        {notice && <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">{notice}</p>}

        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Paste HTML</CardTitle>
              <CardDescription>A full landing page or a single form. Field names become the API fields.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="endpoint-name" className="text-sm font-medium">Name</label>
                <Input id="endpoint-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Uses the page title if you leave this blank" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="endpoint-html" className="text-sm font-medium">HTML</label>
                <Textarea id="endpoint-html" value={html} onChange={(event) => setHtml(event.target.value)} className="min-h-[280px] font-mono text-xs" placeholder="<!doctype html>..." />
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={injectContact} onChange={(event) => setInjectContact(event.target.checked)} />
                <span>If this page has no form, add a name, email, and message form before creating the endpoint.</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <Button onClick={onCreate} disabled={busy || !apiKey || !html.trim()}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
                  Create endpoint
                </Button>
                <Button type="button" variant="outline" onClick={() => { setHtml(SAMPLE_LANDING_HTML); setName("Northwind Bakery"); setInjectContact(false); }}>
                  Use bakery sample
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endpoints</CardTitle>
              <CardDescription>Each one is a backend for one page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {endpoints.length === 0 && <p className="text-sm text-muted-foreground">Nothing connected yet.</p>}
              {endpoints.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => choose(item.slug)}
                  className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${item.slug === selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{item.name}</span>
                    <Badge variant="secondary">{item.submissionCount}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{item.fields.map((field) => field.name).join(", ")}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {endpoint && (
          <section className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>{endpoint.name}</CardTitle>
                  <CardDescription>POST form fields here from the static site. Unknown fields are dropped.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => onDelete(endpoint.slug)} disabled={busy}>
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input readOnly value={endpoint.ingestUrl} aria-label="Ingest URL" />
                  <Button type="button" variant="outline" onClick={() => copy(endpoint.ingestUrl, "Ingest URL")}><Copy className="w-4 h-4" /> Copy URL</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {endpoint.fields.map((field) => (
                    <Badge key={field.name} variant="outline">{field.label} · {field.type}{field.required ? " · required" : ""}</Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={onTest} disabled={busy}><Send className="w-4 h-4" /> Send a test submission</Button>
                  <Button type="button" variant="outline" onClick={() => copy(endpoint.curl, "curl command")}><Copy className="w-4 h-4" /> Copy curl</Button>
                  <Button type="button" variant="outline" onClick={() => copy(endpoint.rewrittenHtml, "Rewritten HTML")}><Copy className="w-4 h-4" /> Copy rewritten HTML</Button>
                </div>
                <pre className="rounded-lg bg-muted px-4 py-3 text-xs overflow-x-auto whitespace-pre-wrap">{endpoint.curl}</pre>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Live page</CardTitle>
                  <CardDescription>Submit this preview. The form posts to the ingest URL, then the row shows up on the right.</CardDescription>
                </CardHeader>
                <CardContent>
                  <iframe
                    title="Connected page preview"
                    sandbox="allow-forms allow-scripts allow-popups"
                    srcDoc={endpoint.rewrittenHtml}
                    className="w-full h-[420px] rounded-lg border border-border bg-white"
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Submissions</CardTitle>
                  <CardDescription>This list refreshes every few seconds.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[460px] overflow-y-auto">
                  {submissions.length === 0 && <p className="text-sm text-muted-foreground">No responses yet. Send a test, or submit the preview.</p>}
                  {submissions.map((row) => (
                    <article key={row.id} className="rounded-xl border border-border px-3 py-3 text-sm space-y-1">
                      <time className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</time>
                      {Object.entries(row.payload).filter(([key]) => key !== "_form").map(([key, value]) => (
                        <p key={key}><span className="font-medium">{key}: </span>{value}</p>
                      ))}
                    </article>
                  ))}
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        <Card>
          <CardHeader>
            <CardTitle>For agents</CardTitle>
            <CardDescription>The same API the dashboard uses. Agents should read AGENTS.md and llms.txt, then start the MCP server.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <pre className="rounded-lg bg-muted px-4 py-3 overflow-x-auto">npm run connect{"\n"}npm run mcp</pre>
            <p className="text-muted-foreground">Cursor config is in <code>.cursor/mcp.json</code>. Tools: create an endpoint from HTML, send a test, list submissions.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
