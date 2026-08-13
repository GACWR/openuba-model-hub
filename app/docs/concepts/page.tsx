import type { Metadata } from "next";
import { DocHeader, H2, P, A, InlineCode, Table, Callout } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Core Concepts — OpenUBA Docs",
  description:
    "The vocabulary of OpenUBA: entities, models, anomalies, rules, alerts, cases, and how a detection flows end to end.",
};

export default function Concepts() {
  return (
    <>
      <DocHeader
        eyebrow="Getting Started"
        title="Core Concepts"
        intro="The vocabulary of OpenUBA and how a detection flows from raw data to an analyst's screen."
      />

      <H2 id="glossary">The vocabulary</H2>
      <Table
        head={["Concept", "What it is"]}
        rows={[
          [<strong key="1">Entity</strong>, "A subject being analyzed — typically a user, but also a host, service, or account."],
          [<strong key="2">Model</strong>, "An inspectable ML model that scores behavior. Installed from the Hub, run in a sandbox."],
          [<strong key="3">Anomaly</strong>, "A model's finding for an entity — a risk score plus context, persisted to Postgres."],
          [<strong key="4">Rule</strong>, "A flow graph (built on the Rule Canvas) that decides which anomalies become alerts."],
          [<strong key="5">Alert</strong>, "A fired detection. Can notify over email + in-app and open a case."],
          [<strong key="6">Case</strong>, "An investigation container that groups related alerts and findings."],
          [<strong key="7">Source Group</strong>, "A named, reusable definition of one or more data sources a model reads from."],
        ]}
      />

      <H2 id="flow">How a detection flows</H2>
      <P>
        The platform is built around one loop: data in, models score it, rules turn
        scores into alerts, analysts investigate.
      </P>
      <CodeBlock
        language="text"
        code={`data source            model run                rule engine            analyst
(ES / Spark /   ──▶   (sandbox job:    ──▶   (flow graph      ──▶   (alerts, cases,
 Splunk / CSV)         train / infer)          evaluated)            dashboards)
                              │                     │                     │
                          anomalies             alerts +              email / in-app
                          persisted             notifications         notifications`}
      />
      <P>
        Concretely: a model runs against a{" "}
        <A href="/docs/data-pipelines">data source</A> in an{" "}
        <A href="/docs/execution-sandbox">execution sandbox</A>, producing{" "}
        <A href="/docs/anomalies">anomalies</A>. After inference the{" "}
        <A href="/docs/rule-canvas">rule engine</A> evaluates enabled rules against
        those anomalies and fires <A href="/docs/alerts">alerts</A> — which can
        email your team, drop an in-app notification, and open a{" "}
        <A href="/docs/cases">case</A>.
      </P>

      <H2 id="model">What a model is</H2>
      <P>
        A model is a small, self-contained folder — a{" "}
        <InlineCode>MODEL.py</InlineCode> with a <InlineCode>Model</InlineCode>{" "}
        class (or an <InlineCode>execute()</InlineCode> function) plus a{" "}
        <InlineCode>model.yaml</InlineCode> of metadata. Inference returns a list of
        anomalies, each with at least an <InlineCode>entity_id</InlineCode> and a{" "}
        <InlineCode>risk_score</InlineCode>. See the{" "}
        <A href="/docs/model-format">Model Format</A> reference.
      </P>

      <H2 id="hub-vs-platform">The Hub vs. the platform</H2>
      <P>
        The <strong>Model Hub</strong> (this site) is a registry that distributes
        models. The <strong>platform</strong> (
        <A href="https://github.com/GACWR/OpenUBA">OpenUBA</A>) is where those
        models run and their output becomes an analyst workflow. The{" "}
        <A href="/docs/sdk">SDK</A> is the bridge — it installs models from the Hub
        and can run them locally or dispatch them to a platform server.
      </P>

      <Callout type="note" title="In one sentence">
        The <strong>Hub</strong> distributes models, the <strong>SDK</strong>{" "}
        installs and runs them, and the <strong>platform</strong> turns their
        anomalies into alerts, cases, and dashboards for analysts.
      </Callout>

      <H2 id="execution">Where models run</H2>
      <P>
        Models never run as always-on services. Each run is an ephemeral,
        containerized job using a framework-specific image (scikit-learn, PyTorch,
        TensorFlow, NetworkX, or a base Python image). In Kubernetes the{" "}
        <A href="/docs/kubernetes">operator</A> dispatches these as Jobs from custom
        resources; in local mode they run as Docker containers. See the{" "}
        <A href="/docs/execution-sandbox">Execution Sandbox</A>.
      </P>

      <DocFooter slug="concepts" />
    </>
  );
}
