"use client";

import { motion } from "framer-motion";
import { FileCode, Settings2 } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useTrackSectionView } from "@/hooks/use-track-section-view";

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

const yamlSnippet = `name: model_sklearn
version: 1.0.0
runtime: sklearn
description: Isolation Forest Anomaly Detection
parameters:
  contamination:
    type: float
    default: 0.1
  random_state:
    type: integer
    default: 42`;

const pySnippet = `class Model:
    def train(self, ctx) -> Dict[str, Any]:
        X = ctx.df.select_dtypes(include=[np.number]).values
        self.model = IsolationForest(contamination=0.1)
        self.model.fit(X)
        return {"status": "success", "n_samples": len(X)}

    def infer(self, ctx) -> pd.DataFrame:
        predictions = self.model.predict(X)
        scores = self.model.decision_function(X)
        return pd.DataFrame(results)`;

export function OpenModelSection() {
  const sectionRef = useTrackSectionView("open_model_standard");
  return (
    <section ref={sectionRef} className="py-24 px-4 relative">
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-blue-600/4 rounded-full blur-[120px] -z-10" />
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Open Model Standard
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Every model follows a simple, standardized interface. A{" "}
            <code className="text-blue-400">model.yaml</code> for configuration
            and a <code className="text-blue-400">MODEL.py</code> with{" "}
            <code className="text-blue-400">train()</code> and{" "}
            <code className="text-blue-400">infer()</code> methods.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-blue-500/8">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Settings2 className="h-3.5 w-3.5 text-white" strokeWidth={2} />
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                model.yaml
              </span>
            </div>
            <SyntaxHighlighter
              language="yaml"
              style={syntaxTheme}
              showLineNumbers
              lineNumberStyle={{ color: "rgba(100,150,255,0.15)", fontSize: "0.75rem", minWidth: "2.5em" }}
            >
              {yamlSnippet}
            </SyntaxHighlighter>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-blue-500/8">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <FileCode className="h-3.5 w-3.5 text-white" strokeWidth={2} />
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                MODEL.py
              </span>
            </div>
            <SyntaxHighlighter
              language="python"
              style={syntaxTheme}
              showLineNumbers
              lineNumberStyle={{ color: "rgba(100,150,255,0.15)", fontSize: "0.75rem", minWidth: "2.5em" }}
            >
              {pySnippet}
            </SyntaxHighlighter>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
