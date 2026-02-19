"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { getAllModels } from "@/lib/models";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package } from "lucide-react";
import { trackModelCardClick, trackBrowseAllModels } from "@/lib/analytics";
import { useTrackSectionView } from "@/hooks/use-track-section-view";

const frameworkColors: Record<string, string> = {
  Python: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  "scikit-learn": "bg-sky-500/15 text-sky-300 border-sky-500/20",
  TensorFlow: "bg-indigo-500/15 text-indigo-300 border-indigo-500/20",
  PyTorch: "bg-blue-600/15 text-blue-300 border-blue-600/20",
  Keras: "bg-blue-400/15 text-blue-200 border-blue-400/20",
  NetworkX: "bg-slate-500/15 text-slate-300 border-slate-500/20",
};

export function ModelShowcase() {
  const models = getAllModels();
  const sectionRef = useTrackSectionView("model_showcase");

  return (
    <section id="models" ref={sectionRef} className="py-24 px-4 relative">
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/4 rounded-full blur-[140px] -z-10" />
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl blur-lg opacity-30 bg-gradient-to-br from-blue-500 to-indigo-600" />
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-1 ring-white/[0.08]">
                <Package className="h-6 w-6 text-white" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">Model Library</h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Browse community-driven anomaly detection models. Install them like
            packages — each model follows the Open Model Standard.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {models.map((m) => (
            <motion.div
              key={m.slug}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
              }}
            >
              <Link href={`/models/${m.slug}`} onClick={() => trackModelCardClick(m.name, "showcase")}>
                <div className="glass-card p-5 h-full transition-all duration-300 cursor-pointer group hover:ring-1 hover:ring-white/[0.06]">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-sm group-hover:text-blue-400 transition-colors">
                      {m.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-[10px] shrink-0 ml-2"
                    >
                      v{m.version}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                    {m.description}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        frameworkColors[m.framework] ??
                        "bg-slate-500/15 text-slate-300 border-slate-500/20"
                      }`}
                    >
                      {m.framework}
                    </span>
                    {m.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950/50 text-blue-300/60"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link href="/models" onClick={() => trackBrowseAllModels()}>
            <Button
              variant="outline"
              className="border-blue-500/20 text-blue-300 hover:bg-blue-500/10 gap-2"
            >
              Browse All Models <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
