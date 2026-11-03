import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { parseMarkdown, safeHref, type MarkdownBlock } from "@/lib/simple-markdown";

function Inline({ text }: { text: string }) {
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const token = match[0];
    if (token.startsWith("`")) {
      nodes.push(<code key={key} className="rounded bg-muted px-1 py-0.5 text-[0.9em]">{token.slice(1, -1)}</code>);
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={key} className="font-semibold text-foreground">{token.slice(2, -2)}</strong>);
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      const label = link?.[1] ?? token;
      const href = link ? safeHref(link[2]) : null;
      if (href?.startsWith("/")) {
        nodes.push(<Link key={key} to={href} className="text-primary underline-offset-4 hover:underline">{label}</Link>);
      } else if (href) {
        nodes.push(<a key={key} href={href} className="text-primary underline-offset-4 hover:underline">{label}</a>);
      } else {
        nodes.push(label);
      }
    }
    key += 1;
    cursor = match.index + token.length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return <>{nodes}</>;
}

function BlockView({ block }: { block: MarkdownBlock }) {
  if (block.type === "h") {
    const className = block.level === 1
      ? "text-4xl font-bold tracking-tight text-foreground"
      : block.level === 2
        ? "text-2xl font-semibold tracking-tight text-foreground pt-8"
        : "text-lg font-semibold text-foreground pt-4";
    const Tag = `h${block.level}` as "h1" | "h2" | "h3";
    return <Tag id={block.id} className={className}><Inline text={block.text} /></Tag>;
  }
  if (block.type === "p") {
    return <p className="text-base leading-7 text-muted-foreground"><Inline text={block.text} /></p>;
  }
  if (block.type === "ul") {
    return (
      <ul className="list-disc space-y-2 pl-5 text-base leading-7 text-muted-foreground">
        {block.items.map((item) => <li key={item}><Inline text={item} /></li>)}
      </ul>
    );
  }
  if (block.type === "ol") {
    return (
      <ol className="list-decimal space-y-2 pl-5 text-base leading-7 text-muted-foreground">
        {block.items.map((item) => <li key={item}><Inline text={item} /></li>)}
      </ol>
    );
  }
  return (
    <pre className="overflow-x-auto rounded-xl bg-muted px-4 py-3 text-sm leading-6 text-foreground">
      <code>{block.text}</code>
    </pre>
  );
}

export function SimpleMarkdown({ source }: { source: string }) {
  const blocks = parseMarkdown(source);
  return (
    <article className="space-y-4">
      {blocks.map((block, index) => <BlockView key={index} block={block} />)}
    </article>
  );
}
