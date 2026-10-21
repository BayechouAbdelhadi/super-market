import { jsonLdGraph, serializeJsonLd, type JsonLd as JsonLdNode } from "@/lib/seo/structured-data";

/** Structured data for search engines (schema.org JSON-LD), as one `@graph` of the given nodes. */
export function JsonLd({ nodes }: { nodes: JsonLdNode[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLdGraph(nodes)) }} />;
}
