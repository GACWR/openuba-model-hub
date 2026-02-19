declare global {
  interface Window {
    gtag: (
      command: string,
      targetOrEvent: string,
      params?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

/* ── Low-level wrappers ── */

export function pageview(url: string) {
  if (!GA_ID) return;
  window.gtag("config", GA_ID, { page_path: url });
}

export function event(action: string, params: Record<string, unknown> = {}) {
  if (!GA_ID) return;
  window.gtag("event", action, params);
}

/* ── Event categories ── */

export const EventCategory = {
  Navigation: "navigation",
  Hero: "hero",
  CTA: "cta",
  ModelHub: "model_hub",
  ModelDetail: "model_detail",
  ModelShowcase: "model_showcase",
  Resources: "resources",
  Footer: "footer",
  SectionView: "section_view",
  Search: "search",
} as const;

/* ── Navigation ── */

export function trackNavClick(label: string, destination: string) {
  event("nav_click", {
    event_category: EventCategory.Navigation,
    link_label: label,
    link_destination: destination,
  });
}

export function trackMobileMenuToggle(state: "open" | "close") {
  event("mobile_menu_toggle", {
    event_category: EventCategory.Navigation,
    menu_state: state,
  });
}

/* ── Hero ── */

export function trackHeroClick(buttonLabel: string, destination: string) {
  event("hero_cta_click", {
    event_category: EventCategory.Hero,
    button_label: buttonLabel,
    link_destination: destination,
  });
}

/* ── CTA section ── */

export function trackCtaClick(buttonLabel: string, destination: string) {
  event("cta_click", {
    event_category: EventCategory.CTA,
    button_label: buttonLabel,
    link_destination: destination,
  });
}

/* ── Model Hub page ── */

export function trackSearch(query: string, resultCount: number) {
  event("model_search", {
    event_category: EventCategory.Search,
    search_term: query,
    result_count: resultCount,
  });
}

export function trackFrameworkFilter(framework: string | null) {
  event("framework_filter", {
    event_category: EventCategory.ModelHub,
    framework: framework ?? "all",
  });
}

export function trackViewToggle(view: "grid" | "list") {
  event("view_toggle", {
    event_category: EventCategory.ModelHub,
    view_mode: view,
  });
}

export function trackModelCardClick(modelName: string, source: "hub" | "showcase") {
  event("model_card_click", {
    event_category: source === "hub" ? EventCategory.ModelHub : EventCategory.ModelShowcase,
    model_name: modelName,
  });
}

export function trackClearFilters() {
  event("clear_filters", { event_category: EventCategory.ModelHub });
}

/* ── Model Detail ── */

export function trackBackToModels() {
  event("back_to_models", { event_category: EventCategory.ModelDetail });
}

export function trackSourceButtonClick(modelName: string) {
  event("source_button_click", {
    event_category: EventCategory.ModelDetail,
    model_name: modelName,
  });
}

export function trackCopyCode(modelName: string, codeBlock: string) {
  event("copy_code", {
    event_category: EventCategory.ModelDetail,
    model_name: modelName,
    code_block: codeBlock,
  });
}

/* ── Model Showcase ── */

export function trackBrowseAllModels() {
  event("browse_all_models", { event_category: EventCategory.ModelShowcase });
}

/* ── Resources ── */

export function trackResourceClick(title: string, href: string) {
  event("resource_click", {
    event_category: EventCategory.Resources,
    resource_title: title,
    link_url: href,
  });
}

/* ── Footer ── */

export function trackFooterClick(label: string, destination: string) {
  event("footer_link_click", {
    event_category: EventCategory.Footer,
    link_label: label,
    link_destination: destination,
  });
}

/* ── Section visibility ── */

export function trackSectionView(sectionName: string) {
  event("section_view", {
    event_category: EventCategory.SectionView,
    section_name: sectionName,
  });
}
