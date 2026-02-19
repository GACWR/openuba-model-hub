"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  Activity,
  Users,
  AlertTriangle,
  Database,
  BarChart3,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTrackSectionView } from "@/hooks/use-track-section-view";

function Highlight({
  icon: Icon,
  gradient,
  title,
  desc,
}: {
  icon: LucideIcon;
  gradient: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="relative shrink-0">
        <div
          className={`absolute inset-0 rounded-xl blur-lg opacity-30 ${gradient}`}
        />
        <div
          className={`relative w-11 h-11 rounded-xl ${gradient} flex items-center justify-center ring-1 ring-white/[0.08]`}
        >
          <Icon className="h-5 w-5 text-white" strokeWidth={1.5} />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-1">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

const highlights = [
  {
    icon: Users,
    gradient: "bg-gradient-to-br from-blue-500 to-blue-700",
    title: "Entity Monitoring",
    desc: "Track 10,000+ users with real-time risk scoring and behavioral baselines across your entire organization.",
  },
  {
    icon: AlertTriangle,
    gradient: "bg-gradient-to-br from-amber-500 to-orange-700",
    title: "Anomaly Detection",
    desc: "Surface high-risk users and anomalous behavior patterns automatically with ML-powered models.",
  },
  {
    icon: Database,
    gradient: "bg-gradient-to-br from-indigo-500 to-violet-700",
    title: "Multi-Source Ingestion",
    desc: "Connect Spark, Elasticsearch, and CSV data sources. Monitor ingestion volumes and job status live.",
  },
  {
    icon: BarChart3,
    gradient: "bg-gradient-to-br from-sky-500 to-cyan-700",
    title: "Risk Trending",
    desc: "Visualize security risk over time with interactive charts. Spot escalations before they become incidents.",
  },
  {
    icon: Activity,
    gradient: "bg-gradient-to-br from-blue-400 to-indigo-600",
    title: "Job Orchestration",
    desc: "Run ingestion and model training jobs on demand. Track completion status, row counts, and failures.",
  },
  {
    icon: Shield,
    gradient: "bg-gradient-to-br from-slate-400 to-slate-600",
    title: "Case Management",
    desc: "Investigate anomalies with built-in case workflows. Triage, escalate, and resolve from a single pane.",
  },
];

export function DashboardPreview() {
  const sectionRef = useTrackSectionView("dashboard_preview");
  return (
    <section ref={sectionRef} className="py-24 px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-blue-600/4 rounded-full blur-[160px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600/4 rounded-full blur-[140px] -z-10" />

      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            The{" "}
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              OpenUBA
            </span>{" "}
            Dashboard
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A unified security operations interface for monitoring user behavior,
            managing data pipelines, and investigating anomalies at scale.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Screenshot */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative"
          >
            {/* Glow behind the screenshot */}
            <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl blur-2xl -z-10" />
            <div className="overflow-hidden rounded-xl">
              <Image
                src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/screenshot.png`}
                alt="OpenUBA Dashboard — entity monitoring, risk scoring, data management, and anomaly detection"
                width={1400}
                height={900}
                className="w-full h-auto"
                priority={false}
              />
            </div>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } },
            }}
            className="space-y-6"
          >
            {highlights.map((h) => (
              <motion.div
                key={h.title}
                variants={{
                  hidden: { opacity: 0, x: 20 },
                  visible: {
                    opacity: 1,
                    x: 0,
                    transition: { duration: 0.4 },
                  },
                }}
              >
                <Highlight
                  icon={h.icon}
                  gradient={h.gradient}
                  title={h.title}
                  desc={h.desc}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
