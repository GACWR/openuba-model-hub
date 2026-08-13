"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { DOCS_NAV, docHref } from "@/lib/docs";
import { SearchTrigger } from "@/components/docs/search";

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-6">
      {DOCS_NAV.map((group) => (
        <div key={group.title}>
          <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            {group.title}
          </div>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const href = docHref(item.slug);
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      "block rounded-md px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-blue-500/10 text-blue-300 font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function DocsSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* mobile bar: search + menu toggle */}
      <div className="lg:hidden mb-5 flex items-center gap-3">
        <SearchTrigger />
        <button
          onClick={() => setOpen(true)}
          aria-label="Open docs menu"
          className="inline-flex items-center gap-2 rounded-lg border border-blue-500/10 bg-white/[0.02] px-3 py-2 text-sm text-muted-foreground hover:text-foreground shrink-0"
        >
          <Menu className="h-4 w-4" /> Menu
        </button>
      </div>

      {/* desktop sidebar */}
      <aside className="hidden lg:block w-60 shrink-0">
        <div className="sticky top-24 space-y-5">
          <SearchTrigger />
          <div>
            <div className="flex items-center gap-2 px-3 mb-4 text-sm font-semibold">
              <BookOpen className="h-4 w-4 text-blue-400" />
              Documentation
            </div>
            <NavItems />
          </div>
        </div>
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[80vw] glass border-r border-blue-500/10 p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="h-4 w-4 text-blue-400" />
                Documentation
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavItems onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
