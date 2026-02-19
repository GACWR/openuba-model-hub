"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  Boxes,
  Grid3X3,
  List,
  Package,
  Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAllModels, getFrameworks, type ModelEntry } from "@/lib/models";
import {
  trackSearch,
  trackFrameworkFilter,
  trackViewToggle,
  trackModelCardClick,
  trackClearFilters,
} from "@/lib/analytics";

const frameworkColors: Record<string, string> = {
  Python: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  "scikit-learn": "bg-sky-500/15 text-sky-300 border-sky-500/20",
  TensorFlow: "bg-indigo-500/15 text-indigo-300 border-indigo-500/20",
  PyTorch: "bg-blue-600/15 text-blue-300 border-blue-600/20",
  Keras: "bg-blue-400/15 text-blue-200 border-blue-400/20",
  NetworkX: "bg-slate-500/15 text-slate-300 border-slate-500/20",
};

function ModelCard({
  model,
  view,
}: {
  model: ModelEntry;
  view: "grid" | "list";
}) {
  const installCmd = `openuba install ${model.name}`;

  if (view === "list") {
    return (
      <Link href={`/models/${model.slug}`} onClick={() => trackModelCardClick(model.name, "hub")}>
        <div className="glass-card p-4 transition-all duration-300 flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <Package className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-sm truncate">{model.name}</h3>
              <Badge variant="outline" className="text-[10px] shrink-0">
                v{model.version}
              </Badge>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${
                  frameworkColors[model.framework] ??
                  "bg-slate-500/15 text-slate-300 border-slate-500/20"
                }`}
              >
                {model.framework}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {model.description}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {model.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950/50 text-blue-300/60"
              >
                {t}
              </span>
            ))}
          </div>
          <code className="hidden lg:block text-[10px] text-muted-foreground font-mono bg-blue-950/40 px-2.5 py-1 rounded shrink-0">
            $ {installCmd}
          </code>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/models/${model.slug}`} onClick={() => trackModelCardClick(model.name, "hub")}>
      <div className="glass-card p-5 h-full transition-all duration-300 cursor-pointer group flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Package className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm group-hover:text-blue-400 transition-colors">
                {model.name}
              </h3>
              <span className="text-[10px] text-muted-foreground">
                {model.author}
              </span>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0">
            v{model.version}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground mb-4 line-clamp-2 flex-1">
          {model.description}
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border ${
                frameworkColors[model.framework] ??
                "bg-slate-500/15 text-slate-300 border-slate-500/20"
              }`}
            >
              {model.framework}
            </span>
            {model.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950/50 text-blue-300/60"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-blue-950/30 rounded px-2.5 py-1.5 border border-blue-500/8">
            <Download className="h-3 w-3 text-blue-400/60" />
            <code className="text-[10px] text-blue-300/70 font-mono flex-1 truncate">
              {installCmd}
            </code>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ModelsPage() {
  const allModels = getAllModels();
  const frameworks = getFrameworks();

  const [query, setQuery] = useState("");
  const [activeFramework, setActiveFramework] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (!query.trim()) return;
    const timer = setTimeout(() => trackSearch(query, filtered.length), 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const filtered = useMemo(() => {
    let result = allModels;
    if (activeFramework) {
      result = result.filter((m) => m.framework === activeFramework);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.framework.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [allModels, query, activeFramework]);

  return (
    <main className="pt-24 pb-16 px-4 min-h-screen">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Boxes className="h-7 w-7 text-blue-400" />
            <h1 className="text-3xl font-bold">Model Hub</h1>
          </div>
          <p className="text-muted-foreground">
            Search and discover anomaly detection models.{" "}
            <span className="text-blue-400/80">{allModels.length} packages</span>{" "}
            available.
          </p>
        </div>

        {/* Search */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                className="pl-9 bg-transparent border-blue-500/10 focus-visible:ring-blue-500/30"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 mr-2">
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <button
                onClick={() => { setActiveFramework(null); trackFrameworkFilter(null); }}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                  activeFramework === null
                    ? "bg-blue-600/20 text-blue-300 border border-blue-500/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              {frameworks.map((fw) => (
                <button
                  key={fw}
                  onClick={() => {
                    const next = activeFramework === fw ? null : fw;
                    setActiveFramework(next);
                    trackFrameworkFilter(next);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                    activeFramework === fw
                      ? "bg-blue-600/20 text-blue-300 border border-blue-500/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {fw}
                </button>
              ))}
              <div className="w-px h-5 bg-border mx-1" />
              <Button
                size="sm"
                variant={view === "grid" ? "secondary" : "ghost"}
                onClick={() => { setView("grid"); trackViewToggle("grid"); }}
                className="h-7 w-7 p-0"
              >
                <Grid3X3 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant={view === "list" ? "secondary" : "ghost"}
                onClick={() => { setView("list"); trackViewToggle("list"); }}
                className="h-7 w-7 p-0"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="text-xs text-muted-foreground mb-4">
          {filtered.length === allModels.length
            ? `${allModels.length} packages`
            : `${filtered.length} of ${allModels.length} packages`}
          {activeFramework && (
            <span className="ml-1 text-blue-400/70">
              — filtered by {activeFramework}
            </span>
          )}
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 glass-card">
            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No models found matching &quot;{query}&quot;
            </p>
            <button
              onClick={() => {
                setQuery("");
                setActiveFramework(null);
                trackClearFilters();
              }}
              className="text-blue-400 text-sm mt-2 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((m) => (
              <ModelCard key={m.slug} model={m} view="grid" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((m) => (
              <ModelCard key={m.slug} model={m} view="list" />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
