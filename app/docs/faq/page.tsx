import type { Metadata } from "next";
import { DocHeader, H2, P, A, InlineCode } from "@/components/docs/doc-ui";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "FAQ — OpenUBA Model Hub",
  description: "Frequently asked questions about the OpenUBA Model Hub.",
};

export default function Faq() {
  return (
    <>
      <DocHeader eyebrow="Help" title="FAQ" intro="Common questions about the Model Hub." />

      <H2 id="free">Is the Model Hub free?</H2>
      <P>
        Yes. OpenUBA and the Model Hub are open source (Apache 2.0). Model authors
        may choose how they distribute their own models.
      </P>

      <H2 id="server">Do I need a running OpenUBA server to use the Hub?</H2>
      <P>
        No. Browsing the catalog and installing models with the SDK works
        standalone. A server is only needed for server-backed features like
        remote training/inference and querying platform data.
      </P>

      <H2 id="trust">How do I know a model is safe?</H2>
      <P>
        Every model&apos;s source is readable on its model page before you install
        it — that transparency is the point. Installs also record file checksums
        in a local <InlineCode>manifest.json</InlineCode>. Review a model&apos;s
        code the same way you would any dependency.
      </P>

      <H2 id="frameworks">Which frameworks are supported?</H2>
      <P>
        scikit-learn, PyTorch, TensorFlow, NetworkX, and plain Python — declared
        as the model&apos;s <InlineCode>runtime</InlineCode> in its{" "}
        <A href="/docs/model-format">model.yaml</A>. Keras models run on the
        TensorFlow runtime.
      </P>

      <H2 id="contribute">How do I contribute a model?</H2>
      <P>
        Open a pull request against{" "}
        <A href="https://github.com/GACWR/openuba-model-hub">
          openuba-model-hub
        </A>
        . See <A href="/docs/publishing">Publishing a Model</A>.
      </P>

      <H2 id="help">Where can I get help?</H2>
      <P>
        Open an issue on{" "}
        <A href="https://github.com/GACWR/OpenUBA/issues">GitHub</A> or join the{" "}
        <A href="https://discord.gg/Ps9p9Wy">Discord</A>.
      </P>

      <DocFooter slug="faq" />
    </>
  );
}
