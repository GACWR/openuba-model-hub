import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, Rocket, Package, Upload, ArrowRight } from "lucide-react";
import { DocHeader, H2, P, A } from "@/components/docs/doc-ui";
import { NextCard } from "@/components/docs/doc-ui";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Documentation — OpenUBA Model Hub",
  description:
    "Learn how to discover, install, and publish anomaly detection models on the OpenUBA Model Hub.",
};

const cards = [
  {
    href: "/docs/quickstart",
    icon: Rocket,
    title: "Quickstart",
    desc: "Install your first model and run it in a few minutes.",
  },
  {
    href: "/docs/installing-models",
    icon: Package,
    title: "Installing Models",
    desc: "Browse the catalog and pull models with the CLI or SDK.",
  },
  {
    href: "/docs/model-format",
    icon: Boxes,
    title: "Model Format",
    desc: "The MODEL.py + model.yaml contract every model follows.",
  },
  {
    href: "/docs/publishing",
    icon: Upload,
    title: "Publishing a Model",
    desc: "Share your own model with the community.",
  },
];

export default function DocsIndex() {
  return (
    <>
      <DocHeader
        eyebrow="Documentation"
        title="OpenUBA Model Hub"
        intro="The community registry for User & Entity Behavior Analytics models. Discover open, inspectable anomaly-detection models — and publish your own — for the OpenUBA platform."
      />

      <P>
        The Model Hub is the open marketplace behind{" "}
        <A href="https://github.com/GACWR/OpenUBA">OpenUBA</A>, an open-source
        UEBA platform for security analytics. Every model here is transparent by
        design: you can read the source, see its parameters, and install it into
        your own OpenUBA deployment with a single command. No black boxes.
      </P>

      <div className="grid sm:grid-cols-2 gap-4 my-8">
        {cards.map((c) => (
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

      <H2 id="what-you-can-do">What you can do here</H2>
      <P>
        Browse the <A href="/models">model catalog</A> to find detection models
        by framework (scikit-learn, PyTorch, TensorFlow, NetworkX and more),
        install them with the <code className="font-mono text-blue-300">openuba</code>{" "}
        CLI or Python SDK, and publish models you have built so other analysts
        can reuse them.
      </P>

      <H2 id="new-here">New here?</H2>
      <P>
        Start with the Quickstart, then read Core Concepts to understand how the
        registry, the SDK, and the OpenUBA platform fit together.
      </P>

      <div className="grid gap-4 mt-6">
        <NextCard
          href="/docs/quickstart"
          title="Quickstart →"
          description="Install and run a model in minutes."
        />
      </div>

      <DocFooter slug="" />
    </>
  );
}
