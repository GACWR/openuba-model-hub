"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Copy, Check, Terminal } from "lucide-react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      aria-label="Copy code"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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

export function CodeBlock({
  code,
  language = "bash",
  title,
  showLineNumbers = false,
}: {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
}) {
  return (
    <div className="glass-card overflow-hidden my-5">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-blue-500/8">
        <div className="flex items-center gap-2.5">
          <Terminal className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs font-mono text-muted-foreground">
            {title ?? language}
          </span>
        </div>
        <CopyButton text={code} />
      </div>
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={syntaxTheme}
          showLineNumbers={showLineNumbers}
          lineNumberStyle={{
            color: "rgba(100,150,255,0.15)",
            fontSize: "0.75rem",
            minWidth: "2.5em",
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
