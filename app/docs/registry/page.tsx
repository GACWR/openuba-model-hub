import type { Metadata } from "next";
import { DocHeader, H2, P, A, InlineCode, Table } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Registry Reference — OpenUBA Model Hub",
  description: "The registry/models.json format that powers the Hub catalog and SDK.",
};

export default function Registry() {
  return (
    <>
      <DocHeader
        eyebrow="Publishing"
        title="Registry Reference"
        intro="One JSON file is the source of truth for the whole catalog."
      />

      <P>
        The catalog and the SDK both read a single registry document,{" "}
        <InlineCode>registry/models.json</InlineCode>, published at{" "}
        <A href="https://openuba.org/registry/models.json">
          openuba.org/registry/models.json
        </A>
        .
      </P>

      <H2 id="shape">Document shape</H2>
      <CodeBlock
        language="json"
        code={`{
  "version": "1.0.0",
  "updated": "2026-01-01",
  "models": [
    {
      "name": "basic_model",
      "slug": "basic-model",
      "version": "1.0.0",
      "framework": "Python",
      "description": "Baseline example model for getting started.",
      "path": "models/basic_model",
      "tags": ["example", "baseline"],
      "parameters": [
        { "name": "threshold", "type": "float", "default": 0.8 }
      ]
    }
  ]
}`}
      />

      <H2 id="fields">Model fields</H2>
      <Table
        head={["Field", "Type", "Notes"]}
        rows={[
          [<InlineCode key="1">name</InlineCode>, "string", "Unique install name."],
          [<InlineCode key="2">slug</InlineCode>, "string", "URL slug for the model page."],
          [<InlineCode key="3">version</InlineCode>, "string", "Semantic version."],
          [<InlineCode key="4">framework</InlineCode>, "string", "Displayed and filterable in the catalog."],
          [<InlineCode key="5">description</InlineCode>, "string", "One-line summary."],
          [<InlineCode key="6">path</InlineCode>, "string", "Folder holding MODEL.py + model.yaml."],
          [<InlineCode key="7">tags</InlineCode>, "string[]", "Optional search tags."],
          [<InlineCode key="8">parameters</InlineCode>, "object[]", "Optional tunable parameters."],
        ]}
      />

      <P>
        The SDK resolves a model by <InlineCode>name</InlineCode> or{" "}
        <InlineCode>slug</InlineCode> and downloads the files under{" "}
        <InlineCode>path</InlineCode>. To point the SDK at a fork or a private
        mirror, set <InlineCode>OPENUBA_HUB_URL</InlineCode> to your registry URL.
      </P>

      <DocFooter slug="registry" />
    </>
  );
}
