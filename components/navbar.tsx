"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Github } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#models", label: "Models" },
  { href: "/#architecture", label: "Architecture" },
  { href: "/models", label: "Model Hub" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-blue-500/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/logo-w.png`}
              alt="OpenUBA"
              width={120}
              height={32}
              className="h-7 w-auto"
            />
            <span className="text-sm font-normal text-muted-foreground">
              Model Hub
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <a
              href="https://github.com/GACWR/OpenUBA"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>

          <button
            className="md:hidden text-muted-foreground"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 glass",
          open ? "max-h-64" : "max-h-0"
        )}
      >
        <div className="px-4 pb-4 pt-2 space-y-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-sm text-muted-foreground hover:text-foreground py-2"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
