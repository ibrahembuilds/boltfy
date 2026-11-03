import { Link } from "react-router-dom";
import source from "../../docs/platform.md?raw";
import { SimpleMarkdown } from "@/components/SimpleMarkdown";
import { markdownSections } from "@/lib/simple-markdown";
import { SEO } from "@/components/layout/SEO";
import { ModeToggle } from "@/components/mode-toggle";

const sections = markdownSections(source);

export default function Docs() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="How Boltfy works"
        description="How Boltfy collects form responses, how to connect an HTML page, and how an agent uses the same API."
      />
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <Link to="/" className="text-sm font-semibold tracking-tight">Boltfy</Link>
          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link to="/connect" className="hover:text-foreground">Connect</Link>
            <Link to="/docs" className="text-foreground">Docs</Link>
            <ModeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12">
        <p className="mb-8 text-sm text-muted-foreground">
          Same guide for people and agents. Agents can also read the plain file at{" "}
          <a className="text-foreground underline-offset-4 hover:underline" href="http://127.0.0.1:8787/docs/platform.md">/docs/platform.md</a> on the Connect API.
        </p>
        <nav aria-label="On this page" className="mb-10 flex flex-wrap gap-2">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
            >
              {section.text}
            </a>
          ))}
        </nav>
        <SimpleMarkdown source={source} />
      </main>
    </div>
  );
}
