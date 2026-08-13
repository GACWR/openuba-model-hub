import type { Metadata } from "next";
import { DocHeader, H2, P, A, InlineCode, Callout, Table } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Installing Models — OpenUBA Model Hub",
  description: "Browse the catalog and install models with the OpenUBA CLI or Python SDK.",
};

export default function InstallingModels() {
  return (
    <>
      <DocHeader
        eyebrow="Using the Hub"
        title="Installing Models"
        intro="Find models in the catalog and pull them with the CLI or the SDK."
      />

      <H2 id="browse">Browse the catalog</H2>
      <P>
        The <A href="/models">Model Hub</A> lists every published model. Filter
        by framework, search by name or tag, and open a model to read its full
        source, parameters, and install command before you pull it.
      </P>

      <H2 id="cli">Install with the CLI</H2>
      <P>The SDK ships an <InlineCode>openuba</InlineCode> command-line tool:</P>
      <CodeBlock
        language="bash"
        code={`# list available models
openuba list

# install a model by name
openuba install basic_model

# remove an installed model
openuba uninstall basic_model`}
      />

      <H2 id="python">Install from Python</H2>
      <P>The same operations are available programmatically:</P>
      <CodeBlock
        language="python"
        code={`import openuba

openuba.install("basic_model")     # download into ~/.openuba/models/
openuba.list_installed()            # what's installed locally
openuba.get_model("basic_model")   # registry metadata + install status`}
      />

      <H2 id="where">Where models are stored</H2>
      <P>
        Installed models live under <InlineCode>~/.openuba/models/&lt;name&gt;/</InlineCode>{" "}
        by default. Each install writes a <InlineCode>manifest.json</InlineCode>{" "}
        recording the version and file checksums it pulled.
      </P>
      <Table
        head={["Environment variable", "Purpose"]}
        rows={[
          [<InlineCode key="1">OPENUBA_MODEL_DIR</InlineCode>, "Override where models are installed."],
          [<InlineCode key="2">OPENUBA_HUB_URL</InlineCode>, "Point the SDK at a different registry JSON."],
          [<InlineCode key="3">OPENUBA_API_URL</InlineCode>, "The OpenUBA server used when running models remotely."],
          [<InlineCode key="4">OPENUBA_TOKEN</InlineCode>, "Bearer token for that server."],
        ]}
      />

      <Callout type="tip" title="Pin a version">
        Pass an explicit version to install exactly what you tested against:
        <br />
        <InlineCode>openuba.install(&quot;basic_model&quot;, version=&quot;1.0.0&quot;)</InlineCode>
      </Callout>

      <DocFooter slug="installing-models" />
    </>
  );
}
