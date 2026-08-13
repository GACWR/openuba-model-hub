/* Docs navigation manifest — the single source of truth for the sidebar,
   the mobile menu, search, and prev/next links. Order = reading order. */

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
      { slug: "installation", title: "Installation" },
    ],
  },
  {
    title: "Platform",
    items: [
      { slug: "architecture", title: "Architecture" },
      { slug: "kubernetes", title: "Kubernetes-Native" },
      { slug: "data-pipelines", title: "Data Pipelines" },
      { slug: "graphql", title: "GraphQL API" },
      { slug: "authentication", title: "Authentication & RBAC" },
      { slug: "observability", title: "Observability" },
    ],
  },
  {
    title: "Detection & Investigation",
    items: [
      { slug: "anomalies", title: "Anomalies & Entity Risk" },
      { slug: "cases", title: "Cases" },
      { slug: "rule-canvas", title: "Rule Canvas" },
      { slug: "alerts", title: "Alerts & Notifications" },
      { slug: "scheduling", title: "Scheduling" },
      { slug: "assistant", title: "LLM Investigation Assistant" },
    ],
  },
  {
    title: "Models & Execution",
    items: [
      { slug: "models", title: "Models & Lifecycle" },
      { slug: "execution-sandbox", title: "Execution Sandbox" },
      { slug: "workspaces", title: "Workspaces" },
      { slug: "registry-adapters", title: "Registry & Adapters" },
    ],
  },
  {
    title: "Integrations",
    items: [
      { slug: "integrations", title: "Overview" },
      { slug: "splunk", title: "Splunk" },
    ],
  },
  {
    title: "Using the Hub",
    items: [
      { slug: "installing-models", title: "Installing Models" },
      { slug: "sdk", title: "Python SDK" },
      { slug: "model-format", title: "Model Format" },
      { slug: "publishing", title: "Publishing a Model" },
      { slug: "registry", title: "Registry Reference" },
    ],
  },
  {
    title: "Help",
    items: [
      { slug: "troubleshooting", title: "Troubleshooting" },
      { slug: "faq", title: "FAQ" },
    ],
  },
];

export const DOCS_FLAT: DocLink[] = DOCS_NAV.flatMap((g) => g.items);

export function docHref(slug: string): string {
  return slug ? `/docs/${slug}` : "/docs";
}

export function groupOf(slug: string): string | undefined {
  return DOCS_NAV.find((g) => g.items.some((i) => i.slug === slug))?.title;
}

export function prevNext(slug: string): { prev?: DocLink; next?: DocLink } {
  const i = DOCS_FLAT.findIndex((d) => d.slug === slug);
  if (i === -1) return {};
  return {
    prev: i > 0 ? DOCS_FLAT[i - 1] : undefined,
    next: i < DOCS_FLAT.length - 1 ? DOCS_FLAT[i + 1] : undefined,
  };
}
