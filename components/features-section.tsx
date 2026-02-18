"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ShieldCheck,
  Brain,
  Workflow,
  Bell,
  Container,
  ScrollText,
} from "lucide-react";

/* ── Premium icon wrapper with gradient glow ── */
function FeatureIcon({
  icon: Icon,
  gradient,
}: {
  icon: LucideIcon;
  gradient: string;
}) {
  return (
    <div className="relative mb-5">
      {/* Glow behind */}
      <div
        className={`absolute inset-0 rounded-2xl blur-xl opacity-40 ${gradient}`}
      />
      {/* Icon container */}
      <div
        className={`relative w-14 h-14 rounded-2xl flex items-center justify-center ring-1 ring-white/[0.08] ${gradient}`}
      >
        <Icon className="h-7 w-7 text-white" strokeWidth={1.5} />
      </div>
    </div>
  );
}

const features = [
  {
    icon: ShieldCheck,
    title: "Role-Based Access Control",
    description:
      "Fine-grained RBAC with permission-based navigation. Control who sees what across the entire platform.",
    gradient: "bg-gradient-to-br from-blue-500 to-blue-700",
  },
  {
    icon: Brain,
    title: "LLM AI Agent",
    description:
      "Built-in AI assistant powered by LLMs. Ask questions, get insights, and automate investigation workflows.",
    gradient: "bg-gradient-to-br from-indigo-500 to-violet-700",
  },
  {
    icon: Workflow,
    title: "Rule Studio",
    description:
      "Visual flow-graph rule builder for complex detection logic. Drag-and-drop nodes to create sophisticated alert rules.",
    gradient: "bg-gradient-to-br from-sky-500 to-cyan-700",
  },
  {
    icon: Bell,
    title: "Real-Time Alerts",
    description:
      "Rules fire alerts in real-time. Investigate, triage, and escalate anomalies as they happen.",
    gradient: "bg-gradient-to-br from-amber-500 to-orange-700",
  },
  {
    icon: Container,
    title: "K8s Model Orchestration",
    description:
      "Kubernetes-native operator with custom CRDs. Ephemeral containers for model training and inference jobs.",
    gradient: "bg-gradient-to-br from-blue-400 to-indigo-600",
  },
  {
    icon: ScrollText,
    title: "Job Logging & Monitoring",
    description:
      "Real-time training and inference job logs with GraphQL subscriptions. Monitor model performance live.",
    gradient: "bg-gradient-to-br from-slate-400 to-slate-600",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 relative">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/4 rounded-full blur-[140px] -z-10" />
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            What&apos;s New in{" "}
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              OpenUBA
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A complete rewrite with enterprise-grade features for security
            operations, powered by modern AI and data engineering.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={cardVariants}
              className="glass-card p-6 group transition-all duration-300 hover:ring-1 hover:ring-white/[0.06]"
            >
              <FeatureIcon icon={f.icon} gradient={f.gradient} />
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
