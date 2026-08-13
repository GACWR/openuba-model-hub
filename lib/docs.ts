/* Docs navigation manifest — the single source of truth for the sidebar,
   the mobile menu, and prev/next links. Keep in the order pages should appear. */

export interface DocLink {
  slug: string; // route under /docs ("" is the index)
  title: string;
}

export interface DocGroup {
  title: string;
  items: DocLink[];
}

export const DOCS_NAV: DocGroup[] = [
  {
    title: "Getting Started",
    items: [
      { slug: "", title: "Introduction" },
      { slug: "quickstart", title: "Quickstart" },
      { slug: "concepts", title: "Core Concepts" },
    ],
  },
  {
    title: "Using the Hub",
    items: [
      { slug: "installing-models", title: "Installing Models" },
      { slug: "sdk", title: "Python SDK" },
    ],
  },
  {
    title: "Publishing",
    items: [
      { slug: "model-format", title: "Model Format" },
      { slug: "publishing", title: "Publishing a Model" },
      { slug: "registry", title: "Registry Reference" },
    ],
  },
  {
    title: "Help",
    items: [{ slug: "faq", title: "FAQ" }],
  },
];

export const DOCS_FLAT: DocLink[] = DOCS_NAV.flatMap((g) => g.items);

export function docHref(slug: string): string {
  return slug ? `/docs/${slug}` : "/docs";
}

export function prevNext(slug: string): { prev?: DocLink; next?: DocLink } {
  const i = DOCS_FLAT.findIndex((d) => d.slug === slug);
  if (i === -1) return {};
  return {
    prev: i > 0 ? DOCS_FLAT[i - 1] : undefined,
    next: i < DOCS_FLAT.length - 1 ? DOCS_FLAT[i + 1] : undefined,
  };
}
