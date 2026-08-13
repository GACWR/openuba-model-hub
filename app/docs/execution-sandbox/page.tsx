import type { Metadata } from "next";
import { DocHeader, H2, H3, P, UL, OL, LI, InlineCode, A, Callout, Table } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Execution Sandbox — OpenUBA Docs",
  description:
    "How OpenUBA models actually run — the containerized model runner, the v2 Model class vs v1 execute() interface, the five ML runtime images, data-source loading, and Docker vs Kubernetes execution modes.",
};

export default function Page() {
  return (
    <>
      <DocHeader
        eyebrow="Models & Execution"
        title="Execution Sandbox"
        intro="Every OpenUBA model runs in an isolated, resource-limited container — never in the API process. This page covers the model runner that drives execution, the two model interfaces it supports, the five runtime images, how each data source is loaded, and how the same runner is dispatched under both Docker and Kubernetes."
      />

      <H2 id="overview">Why a sandbox</H2>
      <P>
        Models are untrusted, third-party code. Rather than importing them into the API server, OpenUBA runs each
        train or inference invocation inside a dedicated container built from a fixed runtime image. The container gets
        a read-only mount of the model code, resource limits, a non-root user, and{" "}
        <InlineCode>no-new-privileges</InlineCode>. The single entry point is{" "}
        <InlineCode>docker/model-runner/runner.py</InlineCode>, which loads the model, feeds it data, captures logs and
        metrics, and writes results back to Postgres.
      </P>
      <P>
        The <A href="/docs/models">orchestrator</A> creates a <InlineCode>ModelRun</InlineCode> and dispatches the work
        to a background thread, so the API returns a <InlineCode>run_id</InlineCode> immediately. That thread then runs
        the container either directly through Docker or, in cluster mode, by creating a Custom Resource that the
        operator turns into a Kubernetes Job.
      </P>

      <H2 id="interfaces">The v2 Model class vs the v1 execute() function</H2>
      <P>
        The runner supports two model interfaces and prefers the newer one. When it imports a model&apos;s{" "}
        <InlineCode>MODEL.py</InlineCode>, it looks for a <InlineCode>Model</InlineCode> class (v2) first and falls back
        to a module-level <InlineCode>execute()</InlineCode> function (v1).
      </P>
      <H3 id="v2">v2 — the Model class</H3>
      <P>
        A v2 model exposes a class with <InlineCode>train(ctx)</InlineCode> and <InlineCode>infer(ctx)</InlineCode>{" "}
        methods. The runner instantiates the class and calls the method that matches the run type. Each method receives
        a context object with three things: <InlineCode>ctx.df</InlineCode> (a pandas DataFrame already loaded from your
        chosen data source), <InlineCode>ctx.params</InlineCode> (the input configuration), and{" "}
        <InlineCode>ctx.logger</InlineCode> (a logger whose output is captured to the database).
      </P>
      <UL>
        <LI>
          <InlineCode>train(ctx)</InlineCode> returns a metrics dict; the runner then serializes the fitted model as a
          checkpoint artifact.
        </LI>
        <LI>
          <InlineCode>infer(ctx)</InlineCode> returns a pandas DataFrame of results; the runner converts its rows to the
          anomalies format and persists them.
        </LI>
      </UL>
      <CodeBlock
        language="python"
        title="A v2 model (abridged from model_sklearn/MODEL.py)"
        code={`import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

class Model:
    def __init__(self):
        self.model = IsolationForest(contamination=0.1, random_state=42)
        self.is_trained = False

    def train(self, ctx) -> dict:
        ctx.logger.info("Starting Isolation Forest training...")
        X = ctx.df.select_dtypes(include=[np.number]).values
        self.model.fit(X)
        self.is_trained = True
        return {"status": "success", "n_samples": len(X), "n_features": X.shape[1]}

    def infer(self, ctx) -> pd.DataFrame:
        X = ctx.df.select_dtypes(include=[np.number]).values
        preds = self.model.predict(X)          # -1 anomaly, 1 normal
        scores = self.model.decision_function(X)
        rows = []
        for i, (p, s) in enumerate(zip(preds, scores)):
            risk = min(100.0, abs(s) * 100 + 50) if p == -1 else max(0.0, (1 - s) * 20)
            rows.append({
                "entity_id": str(i),
                "risk_score": float(risk),
                "anomaly_type": "statistical_outlier" if p == -1 else "normal",
                "details": {"raw_score": float(s)},
            })
        return pd.DataFrame(rows)`}
      />
      <H3 id="v1">v1 — the execute() function (backward compatible)</H3>
      <P>
        A v1 model provides a module-level <InlineCode>execute(input_data)</InlineCode> that returns a dict. The runner
        normalizes the result to guarantee an <InlineCode>anomalies</InlineCode> key. If a v2 model has a{" "}
        <InlineCode>Model</InlineCode> class but the requested method is missing, the runner falls through to{" "}
        <InlineCode>execute()</InlineCode> when present. A model that has neither a <InlineCode>Model</InlineCode> class
        nor an <InlineCode>execute()</InlineCode> function is rejected.
      </P>
      <Callout type="note" title="Artifact loading before inference">
        For v2 inference, the runner loads a previously trained artifact into the instance before calling{" "}
        <InlineCode>infer()</InlineCode>, using the <InlineCode>ARTIFACT_PATH</InlineCode> env var. It restores a joblib
        pickle for sklearn, a state dict for PyTorch, a SavedModel for TensorFlow, or a generic pickle otherwise. For
        sklearn, a version mismatch or corrupt pickle is caught and the model is rebuilt with a fresh IsolationForest
        and retried, so a stale checkpoint never hard-fails a run.
      </Callout>

      <H2 id="runtimes">The five runtime images</H2>
      <P>
        A model&apos;s <InlineCode>runtime</InlineCode> selects one of five images, all built on a common base. The base
        image is <InlineCode>python:3.11-slim</InlineCode> with a headless JRE (for PySpark), pandas, numpy, requests,
        PyYAML, pyspark, elasticsearch, SQLAlchemy, and psycopg2. Each specialized image layers its framework on top.
        In Docker mode the orchestrator resolves the image tag as <InlineCode>openuba-model-runner:&lt;tag&gt;</InlineCode>,
        where <InlineCode>python-base</InlineCode> maps to the <InlineCode>base</InlineCode> tag.
      </P>
      <Table
        head={["Runtime", "Image tag", "Adds", "Artifact format"]}
        rows={[
          [<InlineCode key="b">python-base</InlineCode>, "base", "Nothing beyond the base (pandas/numpy/pyspark/ES/SQLAlchemy)", "generic pickle"],
          [<InlineCode key="s">sklearn</InlineCode>, "sklearn", "scikit-learn 1.5.2, joblib", "sklearn_pickle (joblib)"],
          [<InlineCode key="p">pytorch</InlineCode>, "pytorch", "torch + torchvision (CPU wheels)", "torch_pt (state dict)"],
          [<InlineCode key="t">tensorflow</InlineCode>, "tensorflow", "tensorflow + keras (+ libhdf5)", "tf_saved_model"],
          [<InlineCode key="n">networkx</InlineCode>, "networkx", "networkx", "generic pickle"],
        ]}
      />
      <Callout type="warning" title="Pin sklearn to avoid pickle drift">
        scikit-learn is pinned to <InlineCode>1.5.2</InlineCode> in both the sklearn runner image and the{" "}
        <A href="/docs/workspaces">workspace</A> image so that checkpoints pickled in a notebook load cleanly in the
        runner. Version drift between where a model is trained and where it runs is the classic cause of pickle load
        failures.
      </Callout>

      <H2 id="data-sources">Loading data sources</H2>
      <P>
        Before calling <InlineCode>train</InlineCode> or <InlineCode>infer</InlineCode>, the runner builds{" "}
        <InlineCode>ctx.df</InlineCode> from the <InlineCode>data_source</InlineCode> in your input. The loader lives
        entirely inside the runner (the container has no <InlineCode>core.*</InlineCode> package) and returns a pandas
        DataFrame. Numeric columns are auto-coerced: a column becomes numeric only if more than half its values parse
        cleanly.
      </P>
      <Table
        head={["data_source", "How the runner loads it", "Required fields"]}
        rows={[
          [<InlineCode key="e">elasticsearch</InlineCode>, "HTTP _search against the index, docs flattened from hits", "index_name, query (defaults to match_all), optional size"],
          [<InlineCode key="s">spark</InlineCode>, "Local Spark session reads CSVs from the datasets PVC; table name parsed as dataset_logtype", "table_name"],
          [<InlineCode key="l">local_csv</InlineCode>, "pandas.read_csv of file_path/file_name", "file_path, file_name"],
          [<InlineCode key="sp">splunk</InlineCode>, "Runs an SPL search via the export API; result rows become the DataFrame", "splunk_search, optional splunk_index"],
        ]}
      />
      <P>
        For Spark, the table name follows the convention <InlineCode>{`{dataset}_{logtype}`}</InlineCode> — for example{" "}
        <InlineCode>toy_1_proxy</InlineCode> splits into dataset <InlineCode>toy_1</InlineCode> and log type{" "}
        <InlineCode>proxy</InlineCode> — and the runner picks CSV separators and encodings per log type (tab-separated
        for ssh/dns/dhcp, space-separated for proxy/bluecoat, and so on).
      </P>
      <Callout type="note" title="Source groups resolve upstream">
        A <InlineCode>source_group</InlineCode> is not one of the runner&apos;s loaders. When a run specifies{" "}
        <InlineCode>source_group_slug</InlineCode>, the API resolves the named group into a concrete source (one of the
        above) before the runner is dispatched. See <A href="/docs/data-pipelines">Data Pipelines</A>.
      </Callout>

      <H2 id="lifecycle">A run, step by step</H2>
      <OL>
        <LI>The API creates a <InlineCode>ModelRun</InlineCode> (status <InlineCode>pending</InlineCode>) and returns its id.</LI>
        <LI>A background thread marks the run <InlineCode>dispatched</InlineCode> and starts the container.</LI>
        <LI>
          The runner updates the run to <InlineCode>running</InlineCode>, attaches a log handler that batches log lines
          into <InlineCode>model_logs</InlineCode>, and optionally verifies model file hashes.
        </LI>
        <LI>It loads the data source into <InlineCode>ctx.df</InlineCode> and calls <InlineCode>train</InlineCode> or <InlineCode>infer</InlineCode>.</LI>
        <LI>
          On <InlineCode>train</InlineCode> success it serializes a checkpoint, inserts a{" "}
          <InlineCode>model_artifacts</InlineCode> row, and marks the run <InlineCode>succeeded</InlineCode>.
        </LI>
        <LI>
          On <InlineCode>infer</InlineCode> success it batch-inserts anomalies (5,000 rows at a time), marks the run{" "}
          <InlineCode>succeeded</InlineCode>, and prints the result JSON to stdout.
        </LI>
        <LI>Any failure sets the run to <InlineCode>failed</InlineCode> with an error message and flushes logs.</LI>
      </OL>
      <P>
        A <InlineCode>MetricReporter</InlineCode> can post live training metrics and progress back to the platform&apos;s
        internal metrics endpoint, so the UI can show epoch/loss progress over server-sent events during long runs.
      </P>

      <H2 id="docker-mode">Docker mode</H2>
      <P>
        When <InlineCode>EXECUTION_MODE=docker</InlineCode> (the default), the orchestrator runs the container directly.
        It mounts the model directory read-only at <InlineCode>/model</InlineCode>, the runner script at{" "}
        <InlineCode>/app/runner.py</InlineCode>, and a saved-models volume read-write for checkpoints. It passes
        configuration through environment variables and enforces limits: 2 GB memory, 2 CPU cores, a non-root user{" "}
        <InlineCode>1000:1000</InlineCode>, and <InlineCode>no-new-privileges</InlineCode>. Host database and
        Elasticsearch URLs are rewritten to <InlineCode>host.docker.internal</InlineCode> for container networking.
      </P>
      <Table
        head={["Env var", "Meaning"]}
        rows={[
          [<InlineCode key="1">MODEL_PATH</InlineCode>, "Mount point of the model code (/model)"],
          [<InlineCode key="2">RUN_TYPE</InlineCode>, "train or infer"],
          [<InlineCode key="3">RUN_ID / EXECUTION_ID</InlineCode>, "Identifiers used to update model_runs / execution_logs"],
          [<InlineCode key="4">INPUT_DATA / INPUT_DATA_FILE</InlineCode>, "Data-source config as JSON or a file path"],
          [<InlineCode key="5">MODEL_RUNTIME</InlineCode>, "Selects artifact (de)serialization behavior"],
          [<InlineCode key="6">MODEL_SLUG / MODEL_VERSION</InlineCode>, "Used to lay out saved artifacts by slug/version/run"],
          [<InlineCode key="7">ARTIFACT_PATH</InlineCode>, "Trained checkpoint to load before inference"],
          [<InlineCode key="8">SAVED_MODELS_PATH</InlineCode>, "Where trained checkpoints are written"],
          [<InlineCode key="9">DATABASE_URL / ELASTICSEARCH_HOST</InlineCode>, "Connections for status/log writes and ES loads"],
        ]}
      />

      <H2 id="k8s-mode">Kubernetes mode</H2>
      <P>
        When <InlineCode>EXECUTION_MODE=kubernetes</InlineCode>, the orchestrator does not run Docker itself. Instead it
        writes the input JSON to a shared volume and creates a Custom Resource in the{" "}
        <InlineCode>openuba.io/v1alpha1</InlineCode> API group — a <InlineCode>UBAInference</InlineCode> for infer runs
        or a <InlineCode>UBATraining</InlineCode> for train runs. The operator watches these resources and dispatches a
        Kubernetes <strong>Job</strong> running the same runner image. The orchestrator then polls the resource&apos;s{" "}
        <InlineCode>status.phase</InlineCode> until it reaches <InlineCode>Succeeded</InlineCode> or{" "}
        <InlineCode>Failed</InlineCode>, reading results from the shared output path.
      </P>
      <CodeBlock
        language="yaml"
        title="A UBAInference resource created by the orchestrator"
        code={`apiVersion: openuba.io/v1alpha1
kind: UBAInference
metadata:
  name: inf-<execution_id>
  namespace: openuba
spec:
  modelRef: model_sklearn
  runtime: sklearn
  inputPath: /system/inference/<execution_id>/input.json
  outputPath: /system/inference/<execution_id>/output.json
  runId: "<run_id>"
  executionId: "<execution_id>"
  modelSlug: model-sklearn
  modelVersion: "1.0.0"
  artifactPath: /opt/openuba/saved_models/model-sklearn/1.0.0/<run_id>/model.pkl`}
      />
      <Callout type="note" title="Who persists anomalies">
        The two modes differ in where results are written. In Docker mode the orchestrator reads the result dict and
        inserts anomalies. In Kubernetes mode the runner writes anomalies to the database directly (tagged with the
        run id), and the orchestrator re-reads them in batches to feed the rule engine. Either way the rule engine
        evaluates the run&apos;s anomalies after inference.
      </Callout>
      <P>
        The CRDs, operator, and Jobs are covered end to end in <A href="/docs/kubernetes">Kubernetes</A>.
      </P>

      <H2 id="next">Where to go next</H2>
      <OL>
        <LI>
          <A href="/docs/models">Models &amp; Lifecycle</A> — the entity, statuses, versions, and artifacts that the
          sandbox operates on.
        </LI>
        <LI>
          <A href="/docs/registry-adapters">Registry &amp; Adapters</A> — where the code that runs here comes from and
          how it is verified.
        </LI>
        <LI>
          <A href="/docs/workspaces">Workspaces</A> — an interactive Jupyter environment for authoring models before
          they hit the sandbox.
        </LI>
        <LI>
          <A href="/docs/kubernetes">Kubernetes</A> — the operator and Job dispatch behind cluster mode.
        </LI>
      </OL>

      <DocFooter slug="execution-sandbox" />
    </>
  );
}
