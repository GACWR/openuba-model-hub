"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Database, Cpu, BarChart3, LayoutDashboard } from "lucide-react";
import { useTrackSectionView } from "@/hooks/use-track-section-view";

function StepIcon({
  icon: Icon,
  gradient,
}: {
  icon: LucideIcon;
  gradient: string;
}) {
  return (
    <div className="relative mb-4">
      <div
        className={`absolute inset-0 rounded-full blur-lg opacity-30 ${gradient}`}
      />
      <div
        className={`relative w-16 h-16 rounded-full flex items-center justify-center ring-1 ring-white/[0.08] ${gradient}`}
      >
        <Icon className="h-7 w-7 text-white" strokeWidth={1.5} />
      </div>
    </div>
  );
}

const steps = [
  {
    icon: Database,
    label: "Ingest",
    desc: "Connect to Elasticsearch, Spark, or CSV data sources",
    gradient: "bg-gradient-to-br from-blue-500 to-blue-700",
  },
  {
    icon: Cpu,
    label: "Analyze",
    desc: "Run anomaly detection models on K8s",
    gradient: "bg-gradient-to-br from-indigo-500 to-violet-700",
  },
  {
    icon: BarChart3,
    label: "Score",
    desc: "Generate risk scores and classifications",
    gradient: "bg-gradient-to-br from-sky-500 to-cyan-700",
  },
  {
    icon: LayoutDashboard,
    label: "Act",
    desc: "Visualize, alert, and investigate in the dashboard",
    gradient: "bg-gradient-to-br from-blue-400 to-indigo-600",
  },
];

export function ArchitectureSection() {
  const sectionRef = useTrackSectionView("architecture");
  return (
    <section id="architecture" ref={sectionRef} className="py-24 px-4 relative">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From raw data to actionable intelligence — OpenUBA handles the full
            detection pipeline.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          <div className="hidden lg:block absolute top-8 left-[12%] right-[12%] h-px bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-blue-400/20" />

          {steps.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="flex flex-col items-center text-center"
            >
              <StepIcon icon={s.icon} gradient={s.gradient} />
              <span className="text-xs text-muted-foreground mb-1">
                Step {i + 1}
              </span>
              <h3 className="font-semibold mb-1">{s.label}</h3>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
