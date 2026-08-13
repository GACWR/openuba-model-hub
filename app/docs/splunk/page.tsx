import type { Metadata } from "next";
import { DocHeader, H2, H3, P, UL, OL, LI, InlineCode, A, Callout, Table } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Splunk — OpenUBA",
  description:
    "Bidirectional Splunk integration: run an SPL search as a model data source (input) and forward detected anomalies to Splunk via the HTTP Event Collector (output). Configuration, run parameters, and the SplunkConnector.",
};

export default function SplunkPage() {
  return (
    <>
      <DocHeader
        eyebrow="Integrations"
        title="Splunk"
        intro="OpenUBA integrates with Splunk in both directions: pull data in by running an SPL search as a model data source, and push results out by forwarding detected anomalies to Splunk over the HTTP Event Collector (HEC)."
      />

      <Callout type="note" title="Two directions, one connector">
        <strong>Input</strong> runs a Splunk search and hands the rows to a model
        as a DataFrame. <strong>Output</strong> forwards each anomaly back to
        Splunk as an <InlineCode>openuba:anomaly</InlineCode> event. Both are backed
        by a single <InlineCode>SplunkConnector</InlineCode> built on plain{" "}
        <InlineCode>requests</InlineCode>, so it works unchanged inside the
        self-contained model-runner container.
      </Callout>

      <H2 id="configure">Configuration</H2>
      <P>
        Configure Splunk under <strong>Settings → Integrations → Splunk</strong>,
        or via the API (<InlineCode>PUT /api/v1/settings/integrations/splunk</InlineCode>).
        Config is stored in the <InlineCode>integration_settings</InlineCode> table
        (no secrets in manifests), and <InlineCode>token</InlineCode>,{" "}
        <InlineCode>hec_token</InlineCode>, and <InlineCode>password</InlineCode> are
        masked on read (see <A href="/docs/integrations">Integrations Overview</A>).
      </P>
      <Table
        head={["Field", "Purpose"]}
        rows={[
          [<InlineCode key="1">host</InlineCode>, "REST management endpoint, e.g. https://splunk:8089 (used for search)"],
          [<InlineCode key="2">token</InlineCode>, "REST bearer token (preferred), or…"],
          [<InlineCode key="3">username</InlineCode> , "…basic-auth username for the REST API"],
          [<InlineCode key="4">password</InlineCode>, "…basic-auth password for the REST API"],
          [<InlineCode key="5">hec_url</InlineCode>, "HTTP Event Collector base, e.g. https://splunk:8088 (used for output)"],
          [<InlineCode key="6">hec_token</InlineCode>, "HEC token"],
          [<InlineCode key="7">anomaly_index</InlineCode>, "Splunk index anomalies are forwarded to"],
          [<InlineCode key="8">forward_anomalies</InlineCode>, "When on, each inference run forwards its anomalies to Splunk"],
          [<InlineCode key="9">verify_ssl</InlineCode>, "Verify TLS certificates (default on)"],
        ]}
      />
      <P>
        Use <strong>Test</strong> in the settings panel to verify connectivity. The
        test builds a connector from the saved config and probes the REST
        management endpoint (<InlineCode>/services/server/info</InlineCode>), or the
        HEC health endpoint if only HEC is configured:
      </P>
      <CodeBlock
        language="python"
        title="core/api_routers/settings.py"
        code={`async def _test_splunk(config: dict) -> dict:
    '''verify Splunk connectivity via the shared SplunkConnector'''
    from core.integrations.splunk import SplunkConnector
    return SplunkConnector.from_config(config).test_connection()`}
      />
      <Callout type="tip" title="Runner environment fallback">
        The model-runner container reads the same values from the environment when
        it executes a search: <InlineCode>SPLUNK_HOST</InlineCode>,{" "}
        <InlineCode>SPLUNK_TOKEN</InlineCode>,{" "}
        <InlineCode>SPLUNK_USERNAME</InlineCode>,{" "}
        <InlineCode>SPLUNK_PASSWORD</InlineCode>,{" "}
        <InlineCode>SPLUNK_VERIFY_SSL</InlineCode>.
      </Callout>

      <H2 id="input">Input: Splunk as a data source</H2>
      <P>
        Select <InlineCode>splunk</InlineCode> as the data source when training or
        running a model, and pass an SPL search. The model{" "}
        <InlineCode>train</InlineCode> and <InlineCode>execute</InlineCode> requests
        accept two new parameters:
      </P>
      <Table
        head={["Parameter", "Meaning"]}
        rows={[
          [<InlineCode key="1">data_source</InlineCode>, <span key="2">Set to <InlineCode>splunk</InlineCode> to select this branch</span>],
          [<InlineCode key="3">splunk_search</InlineCode>, "The SPL query to run (required for the splunk source)"],
          [<InlineCode key="4">splunk_index</InlineCode>, "Optional index hint"],
        ]}
      />
      <CodeBlock
        language="bash"
        title="Run a model over a Splunk search"
        code={`curl -X POST "$API/api/v1/models/$MODEL_ID/execute" \\
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \\
  -d '{
        "data_source": "splunk",
        "splunk_search": "index=proxy sourcetype=access_combined",
        "splunk_index": "proxy"
      }'`}
      />
      <P>
        The runner&apos;s Splunk branch normalizes the query (prefixing{" "}
        <InlineCode>search</InlineCode> when it does not already start with{" "}
        <InlineCode>search</InlineCode> or a generating <InlineCode>|</InlineCode>{" "}
        command), calls the export endpoint, parses the newline-delimited JSON
        results, and returns a pandas DataFrame. Columns that are mostly numeric
        are coerced automatically:
      </P>
      <CodeBlock
        language="python"
        title="docker/model-runner/runner.py — the splunk branch (abridged)"
        code={`elif data_source == "splunk":
    search = input_data.get("splunk_search") or input_data.get("search")
    if not search:
        raise ValueError("splunk_search required for splunk data source")
    host = (input_data.get("host") or os.getenv("SPLUNK_HOST", "")).rstrip("/")
    token = os.getenv("SPLUNK_TOKEN", "")
    username, password = os.getenv("SPLUNK_USERNAME", ""), os.getenv("SPLUNK_PASSWORD", "")

    q = search.strip()
    if not (q.startswith("|") or q.lower().startswith("search ")):
        q = "search " + q
    payload = {
        "search": q, "output_mode": "json",
        "earliest_time": input_data.get("earliest_time", "-24h"),
        "latest_time":  input_data.get("latest_time", "now"),
        "count":        input_data.get("size", 10000),
    }
    resp = requests.post(f"{host}/services/search/jobs/export", data=payload, ...)
    rows = [obj["result"] for line in resp.text.splitlines()
            if (obj := _parse(line)) and isinstance(obj.get("result"), dict)]
    df = pd.DataFrame(rows)
    # coerce columns that are >50% numeric
    return df`}
      />

      <H2 id="output">Output: forwarding anomalies via HEC</H2>
      <P>
        Enable <strong>Forward anomalies to Splunk</strong> in the integration
        config. After each inference run, the orchestrator forwards every anomaly
        to HEC as an <InlineCode>openuba:anomaly</InlineCode> event in the
        configured <InlineCode>anomaly_index</InlineCode>. Forwarding is{" "}
        <strong>best-effort</strong> — it is wrapped so a Splunk outage never
        affects detection or persistence:
      </P>
      <CodeBlock
        language="python"
        title="core/services/model_orchestrator.py — _forward_anomalies_to_splunk (abridged)"
        code={`def _forward_anomalies_to_splunk(self, anomalies) -> None:
    if not anomalies:
        return
    try:
        with get_db_context() as db:
            row = db.execute(text(
                "SELECT config, enabled FROM integration_settings "
                "WHERE integration_type = 'splunk'"
            )).fetchone()
        if not row or not row[1]:                      # not enabled
            return
        config = dict(row[0]) if row[0] else {}
        if not config.get("forward_anomalies"):        # flag off
            return

        from core.integrations.splunk import SplunkConnector
        connector = SplunkConnector.from_config(config)
        sent = connector.send_anomalies(list(anomalies), index=config.get("anomaly_index"))
        logger.info(f"forwarded {sent}/{len(anomalies)} anomalies to splunk")
    except Exception as e:
        logger.warning(f"splunk anomaly forwarding failed: {e}")   # never raises`}
      />
      <P>
        Two conditions gate forwarding: the Splunk integration must be{" "}
        <InlineCode>enabled</InlineCode>, and <InlineCode>forward_anomalies</InlineCode>{" "}
        must be set in its config. When both hold, the run&apos;s anomalies are
        pushed after they are persisted.
      </P>

      <H2 id="connector">The SplunkConnector</H2>
      <P>
        <InlineCode>SplunkConnector</InlineCode> in{" "}
        <InlineCode>core/integrations/splunk.py</InlineCode> is the shared client.
        It takes constructor args with <InlineCode>SPLUNK_*</InlineCode> environment
        fallbacks, and a <InlineCode>from_config()</InlineCode> factory builds one
        from an <InlineCode>integration_settings</InlineCode> config dict.
      </P>
      <H3 id="auth">Authentication</H3>
      <P>
        A REST bearer <InlineCode>token</InlineCode> is preferred; when it is
        absent but a username is present, the connector falls back to HTTP basic
        auth. HEC uses its own <InlineCode>Authorization: Splunk {"{hec_token}"}</InlineCode>{" "}
        header:
      </P>
      <CodeBlock
        language="python"
        title="core/integrations/splunk.py — auth helpers"
        code={`def _rest_headers(self):
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    if self.token:
        headers["Authorization"] = f"Bearer {self.token}"
    return headers

def _rest_auth(self):
    '''basic auth tuple when no bearer token is configured'''
    if not self.token and self.username:
        return (self.username, self.password)
    return None`}
      />
      <H3 id="methods">Key methods</H3>
      <Table
        head={["Method", "Direction", "Behavior"]}
        rows={[
          [<InlineCode key="1">search(query, …)</InlineCode>, "input", "POSTs to /services/search/jobs/export, returns List[Dict] rows"],
          [<InlineCode key="2">send_event(event, …)</InlineCode>, "output", "POSTs one event to /services/collector/event, returns bool"],
          [<InlineCode key="3">send_anomaly(anomaly, index)</InlineCode>, "output", "send_event with sourcetype openuba:anomaly"],
          [<InlineCode key="4">send_anomalies(list, index)</InlineCode>, "output", "batch forward; returns the count successfully sent"],
          [<InlineCode key="5">test_connection()</InlineCode>, "probe", "server/info, or HEC health if only HEC is set"],
        ]}
      />
      <P>You can also forward events directly from Python:</P>
      <CodeBlock
        language="python"
        title="Direct forwarding from Python"
        code={`from core.integrations import SplunkConnector

splunk = SplunkConnector(hec_url="https://splunk:8088", hec_token="...")
splunk.send_anomaly({"entity_id": "u123", "risk_score": 0.97}, index="openuba")`}
      />

      <H2 id="how-it-fits">Putting it together</H2>
      <OL>
        <LI>
          Configure Splunk under Settings → Integrations and press{" "}
          <strong>Test</strong>.
        </LI>
        <LI>
          Train or run a model with <InlineCode>data_source=splunk</InlineCode> and
          a <InlineCode>splunk_search</InlineCode> to pull events in as a DataFrame.
        </LI>
        <LI>
          Turn on <InlineCode>forward_anomalies</InlineCode> (and set{" "}
          <InlineCode>anomaly_index</InlineCode>) to push each run&apos;s anomalies
          back to Splunk over HEC.
        </LI>
      </OL>

      <H2 id="related">Related</H2>
      <UL>
        <LI>
          <A href="/docs/integrations">Integrations Overview</A> — the central
          settings model, secret masking, and connectivity tests.
        </LI>
        <LI>
          <A href="/docs/models">Models &amp; Lifecycle</A> — where{" "}
          <InlineCode>data_source</InlineCode> and run parameters are set.
        </LI>
        <LI>
          <A href="/docs/anomalies">Anomalies &amp; Entity Risk</A> — what gets
          forwarded to Splunk.
        </LI>
      </UL>

      <DocFooter slug="splunk" />
    </>
  );
}
