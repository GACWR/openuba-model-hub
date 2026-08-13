import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { prevNext, docHref } from "@/lib/docs";

export function DocFooter({ slug }: { slug: string }) {
  const { prev, next } = prevNext(slug);
  return (
    <div className="mt-12 pt-6 border-t border-blue-500/8 grid grid-cols-2 gap-4">
      {prev ? (
        <Link
          href={docHref(prev.slug)}
          className="group glass-card p-4 flex items-center gap-3 transition-all hover:border-blue-500/25"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-blue-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Previous</div>
            <div className="text-sm font-medium truncate">{prev.title}</div>
          </div>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={docHref(next.slug)}
          className="group glass-card p-4 flex items-center justify-end gap-3 text-right transition-all hover:border-blue-500/25"
        >
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Next</div>
            <div className="text-sm font-medium truncate">{next.title}</div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-400 shrink-0" />
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
