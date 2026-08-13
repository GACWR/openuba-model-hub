import type { Metadata } from "next";
import { DocHeader, H2, P, A, InlineCode, Table } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Python SDK — OpenUBA Model Hub",
  description: "The openuba Python SDK: install, run, and manage UBA models.",
};

export default function Sdk() {
  return (
    <>
      <DocHeader
        eyebrow="Using the Hub"
        title="Python SDK"
        intro="The openuba package is the client for the Hub and the OpenUBA platform."
      />

      <H2 id="install">Install</H2>
      <CodeBlock language="bash" code={`pip install openuba`} />

      <H2 id="configure">Configure</H2>
      <P>
        Point the SDK at an OpenUBA server (only needed for remote runs and
        server-backed features). Values can also come from environment variables.
      </P>
      <CodeBlock
        language="python"
        code={`import openuba

openuba.configure(
    api_url="http://localhost:8000",   # or OPENUBA_API_URL
    token="<your-token>",              # or OPENUBA_TOKEN
)`}
      />

      <H2 id="models">Working with models</H2>
      <CodeBlock
        language="python"
        code={`openuba.list_models()                 # catalog from the Hub
openuba.install("basic_model")        # install locally
openuba.run("basic_model", data="events.csv")  # run over a local data file
openuba.list_installed()              # what's installed`}
      />

      <H2 id="alerts">Raising alerts from a model</H2>
      <P>
        When running against an OpenUBA server, a model can raise an alert
        directly — and optionally trigger realtime notifications (email + in-app):
      </P>
      <CodeBlock
        language="python"
        code={`openuba.send_alert(
    "impossible travel detected",
    severity="high",
    entity_id="u123",
    notify=True,                       # email + in-app notification
)`}
      />

      <H2 id="reference">Common functions</H2>
      <Table
        head={["Function", "Description"]}
        rows={[
          [<InlineCode key="1">configure(...)</InlineCode>, "Set the server URL, token, and registry."],
          [<InlineCode key="2">list_models()</InlineCode>, "List models available in the Hub registry."],
          [<InlineCode key="3">install(name, version=None)</InlineCode>, "Install a model locally."],
          [<InlineCode key="4">run(name, data=...)</InlineCode>, "Run an installed model."],
          [<InlineCode key="5">list_installed()</InlineCode>, "List locally installed models."],
          [<InlineCode key="6">query_anomalies(...)</InlineCode>, "Query anomalies from the platform."],
          [<InlineCode key="7">send_alert(...)</InlineCode>, "Raise an alert (optionally notify)."],
        ]}
      />

      <P>
        The SDK is developed alongside the platform in the{" "}
        <A href="https://github.com/GACWR/OpenUBA/tree/master/sdk">OpenUBA repo</A>.
      </P>

      <DocFooter slug="sdk" />
    </>
  );
}
