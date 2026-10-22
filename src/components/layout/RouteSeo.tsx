import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { resolveDocument } from "@/seo/documents";
import { SEO } from "./SEO";

export function RouteSeo() {
  const { pathname } = useLocation();
  const doc = useMemo(() => resolveDocument(pathname), [pathname]);

  if (pathname === "/f" || pathname.startsWith("/f/")) {
    return null;
  }

  return (
    <SEO
      title={doc.title}
      description={doc.description}
      canonicalPath={doc.path}
      keywords={doc.keywords}
      image={doc.image}
      type={doc.type}
      robots={doc.robots}
      jsonLd={doc.jsonLd}
      publishedTime={doc.published}
      modifiedTime={doc.modified}
      author={doc.author}
    />
  );
}
