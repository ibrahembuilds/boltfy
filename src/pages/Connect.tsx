import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PublicHeader } from "@/components/layout/PublicHeader";
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
import { Copy, Loader2 } from "lucide-react";

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
  const [html, setHtml] = useState("");
  const [endpoints, setEndpoints] = useState<ConnectEndpoint[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<ConnectSubmission[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showAnother, setShowAnother] = useState(false);
  const [searchParams] = useSearchParams();
  const wantExample = searchParams.get("example") === "1";
  const htmlRef = useRef<HTMLTextAreaElement>(null);

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
    if (!wantExample) return;
    setHtml(SAMPLE_LANDING_HTML);
    setShowAnother(true);
    const frame = window.requestAnimationFrame(() => htmlRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [wantExample]);

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
      const created = await createEndpoint(apiKey, { html, injectContact: true });
      setHtml("");
      setShowAnother(false);
      setNotice("Link ready. Put it on your form, or try it below.");
      await refresh(apiKey, created.slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the link.");
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
      setNotice("Test response saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(slug: string) {
    if (!window.confirm("Delete this link and its responses?")) return;
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
    setNotice("");
    if (!apiKey) return;
    const rows = await listSubmissions(apiKey, slug);
    setSubmissions(rows.submissions);
  }

  const composer = (
    <div className="space-y-4">
      <label htmlFor="endpoint-html" className="block text-sm font-medium">Paste your page</label>
      <Textarea
        id="endpoint-html"
        ref={htmlRef}
        value={html}
        onChange={(event) => setHtml(event.target.value)}
        className="min-h-[220px] font-mono text-xs"
        placeholder="Paste the HTML of your landing page or form"
      />
      <p className="text-sm text-muted-foreground">No form on the page? Boltfy adds name, email, and message.</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onCreate} disabled={busy || !apiKey || !html.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Get my link
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setHtml(SAMPLE_LANDING_HTML)}
        >
          Try an example
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      <main className="mx-auto max-w-2xl space-y-8 px-5 py-12">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Connect a page</h1>
          <p className="text-base leading-7 text-muted-foreground">
            Paste HTML. Copy the link. Responses show up here.{" "}
            <Link to="/docs" className="text-foreground underline-offset-4 hover:underline">How it works</Link>
          </p>
        </div>

        {apiUp === false && (
          <p className="rounded-xl border border-destructive/40 px-4 py-3 text-sm" role="alert">
            The API is stopped. Run <code className="rounded bg-muted px-1">npm run connect</code>, then reload.
          </p>
        )}

        {needsKey && (
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              refresh(apiKey).catch((err) => setError(err.message));
            }}
          >
            <Input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="API key" autoComplete="off" aria-label="API key" />
            <Button type="submit">Use key</Button>
          </form>
        )}

        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        {notice && <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">{notice}</p>}

        {(!endpoint || showAnother) && composer}

        {endpoint && (
          <section className="space-y-8">
            {endpoints.length > 1 && (
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Page</span>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={endpoint.slug}
                  onChange={(event) => choose(event.target.value)}
                >
                  {endpoints.map((item) => (
                    <option key={item.slug} value={item.slug}>{item.name} ({item.submissionCount})</option>
                  ))}
                </select>
              </label>
            )}

            <div className="space-y-3">
              <h2 className="text-xl font-semibold">{endpoint.name}</h2>
              <label className="block text-sm font-medium" htmlFor="ingest-url">Your form link</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input id="ingest-url" readOnly value={endpoint.ingestUrl} />
                <Button type="button" variant="outline" onClick={() => copy(endpoint.ingestUrl, "Link")}>
                  <Copy className="h-4 w-4" /> Copy link
                </Button>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <Button type="button" variant="secondary" onClick={onTest} disabled={busy}>Send a test</Button>
                <Button type="button" variant="outline" onClick={() => copy(endpoint.rewrittenHtml, "HTML")}>Copy HTML</Button>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Responses</h2>
              {submissions.length === 0 && (
                <p className="text-sm leading-6 text-muted-foreground">Nothing yet. Send a test, or submit the form below.</p>
              )}
              <div className="space-y-3">
                {submissions.map((row) => (
                  <article key={row.id} className="rounded-xl border border-border px-4 py-3 text-sm">
                    <time className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</time>
                    <dl className="mt-2 space-y-1">
                      {Object.entries(row.payload).filter(([key]) => key !== "_form").map(([key, value]) => (
                        <div key={key} className="grid grid-cols-[7rem_1fr] gap-2">
                          <dt className="text-muted-foreground">{key}</dt>
                          <dd className="break-words">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                ))}
              </div>
            </div>

            <details className="rounded-xl border border-border px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium">Try the form</summary>
              <iframe
                title="Connected page preview"
                sandbox="allow-forms allow-scripts allow-popups"
                srcDoc={endpoint.rewrittenHtml}
                className="mt-4 h-[420px] w-full rounded-lg border border-border bg-white"
              />
            </details>

            <div className="flex items-center justify-between text-sm">
              <button type="button" className="text-muted-foreground underline-offset-4 hover:underline" onClick={() => setShowAnother((open) => !open)}>
                {showAnother ? "Hide the box" : "Connect another page"}
              </button>
              <button type="button" className="text-muted-foreground underline-offset-4 hover:underline" onClick={() => onDelete(endpoint.slug)} disabled={busy}>
                Delete this link
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
