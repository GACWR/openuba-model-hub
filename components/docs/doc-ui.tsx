import Link from "next/link";
import { ArrowRight, Info, AlertTriangle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

/* Prose primitives for docs pages — styled to match the Hub's dark design
   system (glass surfaces, blue accents, Inter + mono). Server-safe. */

export function DocHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
}) {
  return (
    <header className="mb-8 animate-fade-in">
      {eyebrow && (
        <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
          {eyebrow}
        </div>
      )}
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
      {intro && (
        <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
          {intro}
        </p>
      )}
    </header>
  );
}

export function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="scroll-mt-24 text-xl font-semibold mt-10 mb-3 pb-2 border-b border-blue-500/8"
    >
      {children}
    </h2>
  );
}

export function H3({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="scroll-mt-24 text-base font-semibold mt-6 mb-2">
      {children}
    </h3>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-7 text-muted-foreground my-4">{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="my-4 space-y-2 text-[15px] leading-7 text-muted-foreground list-disc pl-5 marker:text-blue-500/50">
      {children}
    </ul>
  );
}

export function OL({ children }: { children: React.ReactNode }) {
  return (
    <ol className="my-4 space-y-2 text-[15px] leading-7 text-muted-foreground list-decimal pl-5 marker:text-blue-400/70">
      {children}
    </ol>
  );
}

export function LI({ children }: { children: React.ReactNode }) {
  return <li>{children}</li>;
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-blue-950/40 px-1.5 py-0.5 font-mono text-[0.85em] text-blue-300">
      {children}
    </code>
  );
}

export function A({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  const cls = "text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

const calloutStyles = {
  note: { icon: Info, ring: "border-blue-500/20", bg: "bg-blue-950/30", tone: "text-blue-300" },
  tip: { icon: Lightbulb, ring: "border-emerald-500/20", bg: "bg-emerald-950/20", tone: "text-emerald-300" },
  warning: { icon: AlertTriangle, ring: "border-amber-500/20", bg: "bg-amber-950/20", tone: "text-amber-300" },
};

export function Callout({
  type = "note",
  title,
  children,
}: {
  type?: keyof typeof calloutStyles;
  title?: string;
  children: React.ReactNode;
}) {
  const s = calloutStyles[type];
  const Icon = s.icon;
  return (
    <div className={cn("my-5 rounded-lg border p-4 flex gap-3", s.ring, s.bg)}>
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", s.tone)} />
      <div className="text-sm leading-6 text-muted-foreground">
        {title && <div className={cn("font-semibold mb-1", s.tone)}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

export function Table({
  head,
  rows,
}: {
  head: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="my-5 glass-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-blue-500/8 text-left text-xs uppercase tracking-wider text-muted-foreground">
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-blue-500/5 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-top text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NextCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="group glass-card p-5 flex items-center justify-between gap-4 transition-all duration-300 hover:border-blue-500/25"
    >
      <div>
        <div className="text-sm font-semibold group-hover:text-blue-300 transition-colors">
          {title}
        </div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  );
}
