import type { Metadata } from "next";
import { DocHeader, H2, P, OL, LI, A, InlineCode, Callout } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Publishing a Model — OpenUBA Model Hub",
  description: "Share a model with the community by adding it to the registry.",
};

export default function Publishing() {
  return (
    <>
      <DocHeader
        eyebrow="Publishing"
        title="Publishing a Model"
        intro="Add your model to the Hub so other analysts can install it."
      />

      <P>
        The Hub catalog is open source. Publishing a model is a pull request that
        adds your model folder and registers it in the{" "}
        <A href="/docs/registry">registry file</A>.
      </P>

      <H2 id="steps">Steps</H2>
      <OL>
        <LI>
          Fork{" "}
          <A href="https://github.com/GACWR/openuba-model-hub">
            GACWR/openuba-model-hub
          </A>
          .
        </LI>
        <LI>
          Add your model under <InlineCode>models/&lt;name&gt;/</InlineCode> with a{" "}
          <A href="/docs/model-format">MODEL.py and model.yaml</A>.
        </LI>
        <LI>
          Register it in <InlineCode>registry/models.json</InlineCode> (name, slug,
          version, framework, description, and the folder <InlineCode>path</InlineCode>).
        </LI>
        <LI>Open a pull request. A preview deploy lets you verify how it looks.</LI>
      </OL>

      <H2 id="registry-entry">Example registry entry</H2>
      <CodeBlock
        language="json"
        code={`{
  "name": "my_model",
  "slug": "my-model",
  "version": "1.0.0",
  "framework": "scikit-learn",
  "description": "Detects unusual proxy activity per user.",
  "path": "models/my_model",
  "tags": ["proxy", "anomaly"]
}`}
      />

      <H2 id="verify">Verify before you submit</H2>
      <P>Install your model locally from your fork to confirm it resolves:</P>
      <CodeBlock
        language="bash"
        code={`OPENUBA_HUB_URL="https://raw.githubusercontent.com/<you>/openuba-model-hub/<branch>/registry/models.json" \\
  openuba install my_model`}
      />

      <Callout type="tip" title="Checklist">
        A good submission has a clear one-line description, documented parameters,
        a pinned framework version, and inference output that includes{" "}
        <InlineCode>entity_id</InlineCode> and <InlineCode>risk_score</InlineCode>.
      </Callout>

      <DocFooter slug="publishing" />
    </>
  );
}
