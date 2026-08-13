import type { Metadata } from "next";
import Link from "next/link";
import {
  Rocket,
  Boxes,
  Workflow,
  Bell,
  Network,
  Database,
  Terminal,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { DocHeader, H2, P, A, UL, LI } from "@/components/docs/doc-ui";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Documentation — OpenUBA",
  description:
    "Documentation for OpenUBA — the open-source User & Entity Behavior Analytics platform: models, rules, anomalies, cases, Kubernetes-native execution, and the community Model Hub.",
};

const featureCards = [
  {
    href: "/docs/architecture",
    icon: Network,
    title: "Platform Architecture",
    desc: "FastAPI backend, Next.js UI, PostGraphile, a Kubernetes operator, and a Spark + Elasticsearch data layer.",
  },
  {
    href: "/docs/models",
    icon: Boxes,
    title: "Models & Execution",
    desc: "Install, train, and run detection models in an ephemeral, containerized sandbox.",
  },
  {
    href: "/docs/rule-canvas",
    icon: Workflow,
    title: "Rule Canvas",
    desc: "A visual, flow-based rule builder that turns model output into alerts.",
  },
  {
    href: "/docs/alerts",
    icon: Bell,
    title: "Alerts & Notifications",
    desc: "Realtime alerts over email (SMTP) and in-app, driven by your rules.",
  },
  {
    href: "/docs/data-pipelines",
    icon: Database,
    title: "Data Pipelines",
    desc: "Dual Elasticsearch + Spark pipelines, ingestion, and reusable source groups.",
  },
  {
    href: "/docs/sdk",
    icon: Terminal,
    title: "Python SDK",
    desc: "Install and run models, query anomalies, and raise alerts from Python.",
  },
];

export default function DocsIndex() {
  return (
    <>
      <DocHeader
        eyebrow="Documentation"
        title="OpenUBA"
        intro="The open-source User & Entity Behavior Analytics platform for security analytics — and the community Model Hub that feeds it."
      />

      <P>
        OpenUBA detects anomalous behavior across users and entities using machine
        learning models you can actually read. It pairs a Kubernetes-native
        platform — models, rules, anomalies, cases, dashboards, and a rule engine —
        with an open <A href="/models">Model Hub</A> where those models are
        discovered and shared. Nothing is a black box: every model&apos;s source,
        parameters, and behavior are inspectable.
      </P>

      <div className="grid sm:grid-cols-2 gap-4 my-8">
        {featureCards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group glass-card p-5 transition-all duration-300 hover:border-blue-500/25"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <c.icon className="h-4 w-4 text-blue-400" />
              </div>
              <h3 className="font-semibold group-hover:text-blue-300 transition-colors">
                {c.title}
              </h3>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all ml-auto" />
            </div>
            <p className="text-sm text-muted-foreground">{c.desc}</p>
          </Link>
        ))}
      </div>

      <H2 id="two-halves">Two halves, one project</H2>
      <P>
        The documentation covers both sides of OpenUBA:
      </P>
      <UL>
        <LI>
          <strong>The platform</strong> — the self-hosted UEBA application. Start
          with <A href="/docs/architecture">Architecture</A>, then explore{" "}
          <A href="/docs/rule-canvas">rules</A>,{" "}
          <A href="/docs/anomalies">anomalies</A>,{" "}
          <A href="/docs/cases">cases</A>, and{" "}
          <A href="/docs/kubernetes">Kubernetes-native execution</A>.
        </LI>
        <LI>
          <strong>The Model Hub</strong> — this site. Learn how to{" "}
          <A href="/docs/installing-models">install models</A>, use the{" "}
          <A href="/docs/sdk">SDK</A>, and{" "}
          <A href="/docs/publishing">publish your own</A>.
        </LI>
      </UL>

      <H2 id="paths">Where to start</H2>
      <div className="grid gap-4 mt-4">
        <Link
          href="/docs/quickstart"
          className="group glass-card p-5 flex items-center justify-between gap-4 transition-all hover:border-blue-500/25"
        >
          <div className="flex items-center gap-3">
            <Rocket className="h-5 w-5 text-blue-400" />
            <div>
              <div className="text-sm font-semibold group-hover:text-blue-300 transition-colors">
                Quickstart
              </div>
              <div className="text-sm text-muted-foreground">
                Install the SDK and run your first model in minutes.
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-400 shrink-0" />
        </Link>
        <Link
          href="/docs/installation"
          className="group glass-card p-5 flex items-center justify-between gap-4 transition-all hover:border-blue-500/25"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-blue-400" />
            <div>
              <div className="text-sm font-semibold group-hover:text-blue-300 transition-colors">
                Install the platform
              </div>
              <div className="text-sm text-muted-foreground">
                Stand up the full OpenUBA stack locally or on a server.
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-400 shrink-0" />
        </Link>
      </div>

      <DocFooter slug="" />
    </>
  );
}
