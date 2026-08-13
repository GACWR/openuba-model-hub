import type { Metadata } from "next";
import { DocHeader, H2, H3, P, UL, LI, InlineCode, A, Callout, Table, NextCard } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Integrations Overview — OpenUBA",
  description:
    "Every external integration in OpenUBA is configured centrally under Settings → Integrations, stored in the integration_settings table, with a connectivity test and secret masking. Elasticsearch, Spark, Splunk, SMTP email, and LLM providers.",
};

export default function IntegrationsPage() {
  return (
    <>
      <DocHeader
        eyebrow="Integrations"
        title="Integrations Overview"
        intro="One place configures every external system OpenUBA talks to. Settings → Integrations writes to a single integration_settings table, exposes a per-integration connectivity test, and masks secrets on read — no credentials in manifests."
      />

      <H2 id="model">One table, one pattern</H2>
      <P>
        Every integration — data engines, the Splunk connector, and the LLM
        providers behind the <A href="/docs/assistant">assistant</A> — is a single
        row in the <InlineCode>integration_settings</InlineCode> table, keyed by a
        unique <InlineCode>integration_type</InlineCode> with an{" "}
        <InlineCode>enabled</InlineCode> flag and a JSONB{" "}
        <InlineCode>config</InlineCode>:
      </P>
      <CodeBlock
        language="python"
        title="core/db/models.py — IntegrationSetting"
        code={`class IntegrationSetting(Base):
    __tablename__ = "integration_settings"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    integration_type = Column(Text, unique=True, nullable=False)   # e.g. "elasticsearch"
    enabled          = Column(Boolean, default=False)
    config           = Column(JSONB, nullable=False, default={})
    created_at       = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at       = Column(TIMESTAMP(timezone=True), server_default=func.now())`}
      />
      <P>
        The set of recognized types is fixed in the settings router. Anything not
        in this set is rejected with a 400:
      </P>
      <CodeBlock
        language="python"
        title="core/api_routers/settings.py"
        code={`VALID_INTEGRATION_TYPES = {
    "ollama", "openai", "claude", "gemini",   # LLM providers
    "elasticsearch", "spark",                 # data engines
    "splunk",                                 # bidirectional SIEM
}`}
      />

      <H2 id="api">The settings API</H2>
      <P>
        Four endpoints under <InlineCode>/api/v1/settings/integrations</InlineCode>{" "}
        cover the whole lifecycle. All require the{" "}
        <InlineCode>settings</InlineCode> permission (writes require{" "}
        <InlineCode>settings:write</InlineCode>):
      </P>
      <Table
        head={["Method + path", "Purpose"]}
        rows={[
          [<InlineCode key="1">GET …/integrations</InlineCode>, "List every integration (configured + defaults), secrets masked"],
          [<InlineCode key="2">GET …/integrations/{"{type}"}</InlineCode>, "Read one integration, secrets masked"],
          [<InlineCode key="3">PUT …/integrations/{"{type}"}</InlineCode>, "Create or update (upsert) enabled + config"],
          [<InlineCode key="4">GET …/integrations/{"{type}"}/test</InlineCode>, "Probe live connectivity for that integration"],
        ]}
      />
      <P>
        Writes are an upsert — <InlineCode>INSERT … ON CONFLICT (integration_type)
        DO UPDATE</InlineCode> — so saving the same type twice edits it in place.
        The list endpoint even synthesizes empty default rows for types you have
        not configured yet, so the settings UI can render every card.
      </P>

      <H3 id="masking">Secret masking</H3>
      <P>
        GET responses never return cleartext secrets. Sensitive keys are masked to
        their first and last four characters (or <InlineCode>****</InlineCode> when
        short). The masked fields are <InlineCode>api_key</InlineCode>,{" "}
        <InlineCode>token</InlineCode>, <InlineCode>hec_token</InlineCode>, and{" "}
        <InlineCode>password</InlineCode>:
      </P>
      <CodeBlock
        language="python"
        title="core/api_routers/settings.py — _mask_sensitive_fields"
        code={`def _mask_sensitive_fields(config: dict) -> dict:
    masked = dict(config)
    for key in ("api_key", "token", "hec_token", "password"):
        if key in masked and masked[key]:
            val = str(masked[key])
            masked[key] = (val[:4] + "..." + val[-4:]) if len(val) > 8 else "****"
    return masked`}
      />
      <Callout type="warning" title="Masking, not encryption">
        Masking hides secrets in API responses; it is not encryption at rest.
        Values live as plaintext JSONB in the database, so protect the database and
        its backups accordingly.
      </Callout>

      <H3 id="test">Connectivity tests</H3>
      <P>
        The <InlineCode>/test</InlineCode> endpoint dispatches per integration and
        returns a small status object — <InlineCode>{"{ status: \"connected\", ... }"}</InlineCode>{" "}
        on success or <InlineCode>{"{ status: \"error\", message }"}</InlineCode> on
        failure. In the settings UI, <strong>Test</strong> first saves the current
        form, then calls this endpoint and shows a pass/fail badge.
      </P>
      <CodeBlock
        language="bash"
        title="Testing an integration"
        code={`curl "$API/api/v1/settings/integrations/elasticsearch/test" \\
  -H "Authorization: Bearer $TOKEN"
# { "status": "connected", "cluster_name": "openuba", "version": "8.13.0" }`}
      />

      <H2 id="catalog">The integrations</H2>
      <P>
        Data-engine and Splunk connectors live in{" "}
        <InlineCode>core/integrations/</InlineCode> as plain Python classes; the
        LLM providers are implemented inside{" "}
        <InlineCode>ChatService</InlineCode> rather than as separate connector
        files.
      </P>
      <Table
        head={["Integration", "Type key(s)", "Config", "Test probes"]}
        rows={[
          ["Elasticsearch", <InlineCode key="1">elasticsearch</InlineCode>, <span key="2"><InlineCode>host</InlineCode>, <InlineCode>api_key</InlineCode>, <InlineCode>verify_ssl</InlineCode></span>, "GET host/ (cluster info)"],
          ["Apache Spark", <InlineCode key="3">spark</InlineCode>, <span key="4"><InlineCode>master_url</InlineCode>, <InlineCode>deploy_mode</InlineCode></span>, "Spark master web UI /json/"],
          ["Splunk", <InlineCode key="5">splunk</InlineCode>, <span key="6"><InlineCode>host</InlineCode>, <InlineCode>token</InlineCode>, <InlineCode>hec_url</InlineCode>, <InlineCode>hec_token</InlineCode>, …</span>, "server/info or HEC health"],
          ["LLM: Ollama", <InlineCode key="7">ollama</InlineCode>, <span key="8"><InlineCode>host</InlineCode>, <InlineCode>model</InlineCode></span>, "GET host/api/tags"],
          ["LLM: OpenAI", <InlineCode key="9">openai</InlineCode>, <span key="10"><InlineCode>api_key</InlineCode>, <InlineCode>base_url</InlineCode>, <InlineCode>model</InlineCode></span>, "GET /models"],
          ["LLM: Claude", <InlineCode key="11">claude</InlineCode>, <span key="12"><InlineCode>api_key</InlineCode>, <InlineCode>model</InlineCode></span>, "anthropic.com/v1/models"],
          ["LLM: Gemini", <InlineCode key="13">gemini</InlineCode>, <span key="14"><InlineCode>api_key</InlineCode>, <InlineCode>model</InlineCode></span>, "generativelanguage …/models"],
        ]}
      />

      <H3 id="es">Elasticsearch</H3>
      <P>
        The primary event store and search backend.{" "}
        <InlineCode>ElasticsearchConnector</InlineCode> indexes anomalies, searches
        events with DSL, manages indices, and reports index stats — the same index
        stats surfaced by the <A href="/docs/observability">metrics endpoint</A>.
        Configured with <InlineCode>host</InlineCode>, an optional{" "}
        <InlineCode>api_key</InlineCode>, and <InlineCode>verify_ssl</InlineCode>.
      </P>

      <H3 id="spark">Apache Spark</H3>
      <P>
        The distributed compute engine for large-scale data processing.{" "}
        <InlineCode>SparkConnector</InlineCode> builds a Spark session, reads and
        writes Parquet/CSV/JSON, and lists catalog tables (whose counters also feed
        the metrics endpoint). Configured with a{" "}
        <InlineCode>master_url</InlineCode> (e.g.{" "}
        <InlineCode>spark://spark-master:7077</InlineCode> or{" "}
        <InlineCode>local[*]</InlineCode>) and a <InlineCode>deploy_mode</InlineCode>.
        See <A href="/docs/data-pipelines">Data Pipelines</A>.
      </P>

      <H3 id="splunk-summary">Splunk</H3>
      <P>
        A bidirectional bridge to Splunk: run an SPL search as a model{" "}
        <em>data source</em> (input) and forward anomalies to Splunk over the HTTP
        Event Collector (output). It authenticates by REST token or
        username/password, with a separate HEC token for output. Full details on
        the dedicated page.
      </P>

      <H3 id="smtp">SMTP email</H3>
      <P>
        Outbound email is the <InlineCode>smtp</InlineCode> integration type,
        configured under <strong>Settings → Notifications</strong> and stored in
        the same <InlineCode>integration_settings</InlineCode> table (host, port,
        credentials, from address, and default recipients; the password is masked
        on read). It powers realtime alert delivery — see{" "}
        <A href="/docs/alerts">Alerts &amp; Notifications</A> for how rules trigger
        it and how to send from the SDK.
      </P>

      <H3 id="llm">LLM providers</H3>
      <P>
        Ollama, OpenAI, Claude, and Gemini power the{" "}
        <A href="/docs/assistant">investigation assistant</A>. They share the same
        settings row model as the data engines, and the chat service reads the
        active provider&apos;s config at request time. Ollama additionally falls
        back to environment variables so a local install works with no keys.
      </P>

      <H2 id="frontend">The settings panel</H2>
      <P>
        The frontend renders each integration from a declarative definition — its
        icon, category (LLM, data, or notifications), and typed fields (text,
        password, select, toggle). The panel fetches the list on mount, opens a per-integration form,
        and wires the <strong>Test</strong> and <strong>Save</strong> buttons to
        the API endpoints above.
      </P>

      <H2 id="next">Explore each integration</H2>
      <div className="grid gap-3">
        <NextCard
          href="/docs/splunk"
          title="Splunk"
          description="SPL search as a data source, plus anomaly forwarding over HEC."
        />
        <NextCard
          href="/docs/assistant"
          title="LLM Investigation Assistant"
          description="Configure Ollama, OpenAI, Claude, or Gemini for the chat window."
        />
        <NextCard
          href="/docs/alerts"
          title="Alerts & Notifications"
          description="SMTP email and other notification channels."
        />
        <NextCard
          href="/docs/data-pipelines"
          title="Data Pipelines"
          description="Elasticsearch and Apache Spark as data engines."
        />
      </div>

      <DocFooter slug="integrations" />
    </>
  );
}
