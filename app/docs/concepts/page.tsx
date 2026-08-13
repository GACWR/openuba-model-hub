import type { Metadata } from "next";
import { DocHeader, H2, P, A, InlineCode, Table, Callout } from "@/components/docs/doc-ui";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Core Concepts — OpenUBA Model Hub",
  description:
    "How the Model Hub registry, the OpenUBA SDK, and the OpenUBA platform fit together.",
};

export default function Concepts() {
  return (
    <>
      <DocHeader
        eyebrow="Getting Started"
        title="Core Concepts"
        intro="A quick mental model of how the pieces fit together."
      />

      <H2 id="the-hub">The Model Hub</H2>
      <P>
        The Model Hub is a <strong>registry</strong> of anomaly-detection models.
        It&apos;s a static, versioned catalog (this site) backed by a single{" "}
        <A href="/docs/registry">registry file</A> plus each model&apos;s source.
        Nothing here is a black box — every model&apos;s code is readable before
        you install it.
      </P>

      <H2 id="a-model">What is a model?</H2>
      <P>
        A model is a small, self-contained folder with two files (plus an
        optional package init):
      </P>
      <Table
        head={["File", "Purpose"]}
        rows={[
          [<InlineCode key="1">MODEL.py</InlineCode>, "The model logic — a Model class (train / infer) or an execute() function."],
          [<InlineCode key="2">model.yaml</InlineCode>, "Metadata: name, version, framework, description, parameters."],
          [<InlineCode key="3">__init__.py</InlineCode>, "Optional — makes the model importable as a package."],
        ]}
      />
      <P>
        See the <A href="/docs/model-format">Model Format</A> reference for the
        full contract.
      </P>

      <H2 id="the-sdk">The SDK</H2>
      <P>
        The <InlineCode>openuba</InlineCode> Python SDK is the client. It reads
        the registry, downloads model files into{" "}
        <InlineCode>~/.openuba/models/</InlineCode>, and can run a model locally
        or dispatch training/inference to an OpenUBA server. Browsing and
        installing work without any server.
      </P>

      <H2 id="the-platform">The platform</H2>
      <P>
        <A href="https://github.com/GACWR/OpenUBA">OpenUBA</A> is the full UEBA
        platform. Inside it, Hub models run as containerized jobs whose anomalies
        flow into the rule engine, cases, entities, and dashboards. The Hub is
        where those models are discovered and shared.
      </P>

      <Callout type="note" title="In one sentence">
        The <strong>Hub</strong> distributes models, the <strong>SDK</strong>{" "}
        installs and runs them, and the <strong>platform</strong> operationalizes
        their output for security analysts.
      </Callout>

      <DocFooter slug="concepts" />
    </>
  );
}
