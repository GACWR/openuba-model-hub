"use client";

import { useState } from "react";
import Link from "next/link";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Copy,
  Check,
  FileCode,
  Settings2,
  Package,
  Tag,
  User,
  ExternalLink,
  Download,
} from "lucide-react";
import type { ModelEntry } from "@/lib/models";
import { trackBackToModels, trackSourceButtonClick, trackCopyCode } from "@/lib/analytics";

const frameworkColors: Record<string, string> = {
  Python: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  "scikit-learn": "bg-sky-500/15 text-sky-300 border-sky-500/20",
  TensorFlow: "bg-indigo-500/15 text-indigo-300 border-indigo-500/20",
  PyTorch: "bg-blue-600/15 text-blue-300 border-blue-600/20",
  Keras: "bg-blue-400/15 text-blue-200 border-blue-400/20",
  NetworkX: "bg-slate-500/15 text-slate-300 border-slate-500/20",
};

function CopyButton({ text, modelName, codeBlock }: { text: string; modelName?: string; codeBlock?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        if (modelName && codeBlock) trackCopyCode(modelName, codeBlock);
      }}
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-400" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}

const syntaxTheme: Record<string, React.CSSProperties> = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...(oneDark['pre[class*="language-"]'] as React.CSSProperties),
    background: "transparent",
    margin: 0,
    padding: "1rem",
    fontSize: "0.8125rem",
  },
  'code[class*="language-"]': {
    ...(oneDark['code[class*="language-"]'] as React.CSSProperties),
    background: "transparent",
    fontSize: "0.8125rem",
  },
};

function CodeBlock({
  title,
  icon: Icon,
  iconGradient,
  code,
  language,
  modelName,
}: {
  title: string;
  icon: typeof FileCode;
  iconGradient: string;
  code: string;
  language: string;
  modelName: string;
}) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-500/8">
        <div className="flex items-center gap-2.5">
          <div className={`w-6 h-6 rounded-md ${iconGradient} flex items-center justify-center`}>
            <Icon className="h-3.5 w-3.5 text-white" strokeWidth={2} />
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {title}
          </span>
        </div>
        <CopyButton text={code} modelName={modelName} codeBlock={title} />
      </div>
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <SyntaxHighlighter
          language={language}
          style={syntaxTheme}
          showLineNumbers
          lineNumberStyle={{ color: "rgba(100,150,255,0.15)", fontSize: "0.75rem", minWidth: "2.5em" }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export function ModelDetailClient({
  model,
  modelPy,
  modelYaml,
}: {
  model: ModelEntry;
  modelPy: string;
  modelYaml: string;
}) {
  const installCmd = `openuba install ${model.name}`;

  return (
    <main className="pt-24 pb-16 px-4 min-h-screen">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/models"
          onClick={() => trackBackToModels()}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Models
        </Link>

        {/* Header card */}
        <div className="glass-card p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl blur-lg opacity-30 bg-gradient-to-br from-blue-500 to-indigo-600" />
                  <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-1 ring-white/[0.08]">
                    <Package className="h-5 w-5 text-white" strokeWidth={1.5} />
                  </div>
                </div>
                <h1 className="text-2xl font-bold">{model.name}</h1>
                <Badge variant="outline">v{model.version}</Badge>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border ${
                    frameworkColors[model.framework] ??
                    "bg-slate-500/15 text-slate-300 border-slate-500/20"
                  }`}
                >
                  {model.framework}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                {model.description}
              </p>
            </div>
            <a
              href={`https://github.com/GACWR/openuba-model-hub/tree/master/${model.path}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackSourceButtonClick(model.name)}
            >
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-blue-500/20 text-blue-300 hover:bg-blue-500/10 shrink-0"
              >
                <ExternalLink className="h-3 w-3" /> Source
              </Button>
            </a>
          </div>

          {/* Install command */}
          <div className="flex items-center gap-3 bg-blue-950/40 rounded-md px-4 py-3 border border-blue-500/10 mb-4">
            <Download className="h-4 w-4 text-blue-400 shrink-0" />
            <code className="text-sm font-mono flex-1 text-blue-300">
              $ {installCmd}
            </code>
            <CopyButton text={installCmd} modelName={model.name} codeBlock="install" />
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" /> {model.author}
            </div>
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3" /> {model.runtime}
            </div>
            <div className="flex items-center gap-1">
              License: {model.license}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {model.tags.map((t) => (
            <span
              key={t}
              className="text-xs px-2.5 py-1 rounded-full bg-blue-950/50 text-blue-300/70 border border-blue-500/10"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Parameters table */}
        {model.parameters.length > 0 && (
          <div className="glass-card overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-blue-500/8">
              <h2 className="text-sm font-semibold">Parameters</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-blue-500/8 text-xs text-muted-foreground uppercase">
                    <th className="text-left px-4 py-2 font-medium">Name</th>
                    <th className="text-left px-4 py-2 font-medium">Type</th>
                    <th className="text-left px-4 py-2 font-medium">Default</th>
                    <th className="text-left px-4 py-2 font-medium">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {model.parameters.map((p) => (
                    <tr
                      key={p.name}
                      className="border-b border-blue-500/5 last:border-0"
                    >
                      <td className="px-4 py-2 font-mono text-blue-300">
                        {p.name}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {p.type}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {String(p.default)}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {p.description}
                        {p.enum && (
                          <span className="ml-1 text-xs text-blue-400/50">
                            ({p.enum.join(", ")})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Source code */}
        <div className="space-y-6">
          <CodeBlock
            title="model.yaml"
            icon={Settings2}
            iconGradient="bg-gradient-to-br from-amber-500 to-orange-600"
            code={modelYaml}
            language="yaml"
            modelName={model.name}
          />
          <CodeBlock
            title="MODEL.py"
            icon={FileCode}
            iconGradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            code={modelPy}
            language="python"
            modelName={model.name}
          />
        </div>
      </div>
    </main>
  );
}
