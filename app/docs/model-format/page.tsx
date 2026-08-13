import type { Metadata } from "next";
import { DocHeader, H2, P, A, InlineCode, Callout, Table } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Model Format — OpenUBA Model Hub",
  description: "The MODEL.py + model.yaml contract every Hub model follows.",
};

export default function ModelFormat() {
  return (
    <>
      <DocHeader
        eyebrow="Publishing"
        title="Model Format"
        intro="Every model is a small folder with a MODEL.py and a model.yaml."
      />

      <H2 id="layout">Folder layout</H2>
      <CodeBlock
        language="text"
        code={`models/my_model/
├── MODEL.py        # model logic
├── model.yaml      # metadata
└── __init__.py     # optional`}
      />

      <H2 id="model-py">MODEL.py</H2>
      <P>
        Implement a <InlineCode>Model</InlineCode> class with{" "}
        <InlineCode>train</InlineCode> and <InlineCode>infer</InlineCode> methods.
        Inference returns a list of anomalies — each a dict with at least an{" "}
        <InlineCode>entity_id</InlineCode> and a <InlineCode>risk_score</InlineCode>.
      </P>
      <CodeBlock
        language="python"
        title="MODEL.py"
        code={`class Model:
    def train(self, ctx):
        df = ctx.data                      # input data as a DataFrame
        # ... fit your estimator ...
        return {"status": "trained"}

    def infer(self, ctx):
        df = ctx.data
        anomalies = []
        for _, row in df.iterrows():
            score = self.score(row)
            if score > ctx.params.get("threshold", 0.8):
                anomalies.append({
                    "entity_id": row["user"],
                    "entity_type": "user",
                    "risk_score": float(score),
                    "anomaly_type": "behavioral",
                })
        return {"anomalies": anomalies}`}
      />

      <Callout type="note" title="Simple interface">
        A single <InlineCode>execute(input_data)</InlineCode> function is also
        supported for lightweight models. Prefer the <InlineCode>Model</InlineCode>{" "}
        class for anything with a training phase.
      </Callout>

      <H2 id="model-yaml">model.yaml</H2>
      <CodeBlock
        language="yaml"
        title="model.yaml"
        code={`name: my_model
version: 1.0.0
framework: scikit-learn
description: One-line summary of what this detects.
author: your-handle
tags: [proxy, anomaly, unsupervised]
parameters:
  - name: threshold
    type: float
    default: 0.8
    description: Score above which an entity is flagged.`}
      />

      <Table
        head={["Field", "Required", "Notes"]}
        rows={[
          [<InlineCode key="1">name</InlineCode>, "yes", "Unique, lowercase, matches the folder name."],
          [<InlineCode key="2">version</InlineCode>, "yes", "Semantic version."],
          [<InlineCode key="3">framework</InlineCode>, "yes", "scikit-learn, PyTorch, TensorFlow, NetworkX, Python…"],
          [<InlineCode key="4">description</InlineCode>, "yes", "Shown in the catalog."],
          [<InlineCode key="5">parameters</InlineCode>, "no", "Tunable knobs surfaced on the model page."],
        ]}
      />

      <P>
        Ready to ship? See <A href="/docs/publishing">Publishing a Model</A>.
      </P>

      <DocFooter slug="model-format" />
    </>
  );
}
