import type { Metadata } from "next";
import { DocHeader, H2, P, UL, LI, A, InlineCode, Callout } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Quickstart — OpenUBA Model Hub",
  description: "Install the OpenUBA SDK, pull a model from the Hub, and run it.",
};

export default function Quickstart() {
  return (
    <>
      <DocHeader
        eyebrow="Getting Started"
        title="Quickstart"
        intro="Install the OpenUBA SDK, pull a model from the Hub, and run it — in a few minutes."
      />

      <H2 id="install-sdk">1. Install the SDK</H2>
      <P>
        The <InlineCode>openuba</InlineCode> Python SDK is the client for the
        Model Hub. It works standalone — you don&apos;t need a running OpenUBA
        server just to browse and install models.
      </P>
      <CodeBlock language="bash" code={`pip install openuba`} />

      <Callout type="note" title="Requirements">
        Python 3.9+ is recommended. The SDK talks to the public registry at{" "}
        <A href="https://openuba.org">openuba.org</A> and installs models into{" "}
        <InlineCode>~/.openuba/models/</InlineCode>.
      </Callout>

      <H2 id="browse">2. Find a model</H2>
      <P>
        Browse the <A href="/models">catalog</A> in your browser, or list models
        from the command line:
      </P>
      <CodeBlock language="bash" code={`openuba list`} />
      <P>Every model page shows its framework, version, parameters, and full source.</P>

      <H2 id="install">3. Install a model</H2>
      <P>
        Install by name. This downloads the model&apos;s files from the Hub into
        your local model directory:
      </P>
      <CodeBlock language="bash" code={`openuba install basic_model`} />

      <H2 id="run">4. Run it</H2>
      <P>From Python, load an installed model and run inference over your data:</P>
      <CodeBlock
        language="python"
        code={`import openuba

# run an installed model on a dataframe / list of records
result = openuba.run("basic_model", data=my_events)

for anomaly in result["anomalies"]:
    print(anomaly["entity_id"], anomaly["risk_score"])`}
      />

      <Callout type="tip" title="Using it inside OpenUBA">
        Inside a full OpenUBA deployment, the same models run as containerized
        training/inference jobs and feed the rule engine, cases, and dashboards.
        See <A href="/docs/concepts">Core Concepts</A>.
      </Callout>

      <H2 id="next">Next steps</H2>
      <UL>
        <LI>
          <A href="/docs/concepts">Core Concepts</A> — how the registry, SDK, and
          platform fit together.
        </LI>
        <LI>
          <A href="/docs/sdk">Python SDK</A> — the full client reference.
        </LI>
        <LI>
          <A href="/docs/publishing">Publishing a Model</A> — share your own.
        </LI>
      </UL>

      <DocFooter slug="quickstart" />
    </>
  );
}
