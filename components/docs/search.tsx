"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { Search, CornerDownLeft, FileText } from "lucide-react";
import { SEARCH_DOCS, type SearchDoc } from "@/lib/search-index";

const OPEN_EVENT = "open-docs-search";

/* Trigger button — dispatches a window event so it can live anywhere
   (sidebar, mobile bar) while a single modal handles the rest. */
export function SearchTrigger({ className = "" }: { className?: string }) {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className={`group flex w-full items-center gap-2 rounded-lg border border-blue-500/10 bg-white/[0.02] px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-blue-500/25 hover:bg-white/[0.04] ${className}`}
    >
      <Search className="h-4 w-4" />
      <span className="flex-1 text-left">Search docs…</span>
      <kbd className="hidden sm:inline-flex items-center rounded border border-blue-500/15 bg-blue-950/40 px-1.5 py-0.5 font-mono text-[10px] text-blue-300/70">
        ⌘K
      </kbd>
    </button>
  );
}

export function DocsSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const fuse = useMemo(
    () =>
      new Fuse(SEARCH_DOCS, {
        keys: [
          { name: "title", weight: 0.5 },
          { name: "keywords", weight: 0.3 },
          { name: "description", weight: 0.15 },
          { name: "group", weight: 0.05 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    []
  );

  const results: SearchDoc[] = useMemo(() => {
    const q = query.trim();
    if (!q) return SEARCH_DOCS;
    return fuse.search(q).map((r) => r.item);
  }, [query, fuse]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  const go = useCallback(
    (doc: SearchDoc | undefined) => {
      if (!doc) return;
      close();
      router.push(doc.href);
    },
    [router, close]
  );

  // open via ⌘K / Ctrl+K and via the trigger event
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  // focus the input when opening
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 20);
  }, [open]);

  if (!open) return null;

  const onModalKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={close}
      />
      <div
        className="relative w-full max-w-xl glass-card overflow-hidden shadow-2xl shadow-black/40"
        onKeyDown={onModalKey}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center gap-3 border-b border-blue-500/8 px-4">
          <Search className="h-4 w-4 text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search the documentation…"
            className="w-full bg-transparent py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center rounded border border-blue-500/15 bg-blue-950/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            results.map((doc, i) => (
              <button
                key={doc.href}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(doc)}
                className={`flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                  i === active ? "bg-blue-500/10" : "hover:bg-white/[0.03]"
                }`}
              >
                <FileText
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    i === active ? "text-blue-300" : "text-muted-foreground"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {doc.title}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 shrink-0">
                      {doc.group}
                    </span>
                  </span>
                  {doc.description && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {doc.description}
                    </span>
                  )}
                </span>
                {i === active && (
                  <CornerDownLeft className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-300/70" />
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-blue-500/8 px-4 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-blue-500/15 px-1 font-mono">↑</kbd>
            <kbd className="rounded border border-blue-500/15 px-1 font-mono">↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-blue-500/15 px-1 font-mono">↵</kbd>
            open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-blue-500/15 px-1 font-mono">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
