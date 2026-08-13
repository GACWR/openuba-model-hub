import { DocsSidebar } from "@/components/docs/sidebar";
import { DocsSearch } from "@/components/docs/search";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="pt-24 pb-20 px-4 min-h-screen">
      <div className="mx-auto max-w-7xl flex gap-10">
        <DocsSidebar />
        <article className="min-w-0 flex-1 max-w-3xl">{children}</article>
      </div>
      <DocsSearch />
    </main>
  );
}
