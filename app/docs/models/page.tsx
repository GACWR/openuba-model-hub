import type { Metadata } from "next";
import { DocHeader, H2, H3, P, UL, OL, LI, InlineCode, A, Callout, Table } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Models & Lifecycle — OpenUBA Docs",
  description:
    "The model as a first-class entity in OpenUBA — registering, installing, training, and running inference. Statuses, versions, artifacts, runs, and the REST + SDK surface.",
};

export default function Page() {
  return (
    <>
      <DocHeader
        eyebrow="Models & Execution"
        title="Models & Lifecycle"
        intro="In OpenUBA a model is a first-class database entity with its own lifecycle — registered, installed, trained, and executed for inference. This page walks the full lifecycle, the status machine, the version and artifact hierarchy, the reference models shipped in the model library, and every REST endpoint and SDK equivalent that drives it."
      />

      <H2 id="overview">The model as a first-class entity</H2>
      <P>
        Unlike a plain script, an OpenUBA model is tracked in Postgres across four related tables. A{" "}
        <InlineCode>Model</InlineCode> record is the top-level identity; each <InlineCode>ModelVersion</InlineCode>{" "}
        pins a specific revision of the code and manifest; each training run produces a{" "}
        <InlineCode>ModelArtifact</InlineCode> (a serialized checkpoint); and every train or inference invocation is
        recorded as a <InlineCode>ModelRun</InlineCode>. Together they let the platform reproduce, version, and audit
        exactly what ran and what it produced.
      </P>
      <Table
        head={["Table", "Purpose", "Key fields"]}
        rows={[
          [
            <InlineCode key="m">models</InlineCode>,
            "Top-level model identity and current status",
            "slug, name, version, source_type, runtime, status, enabled, manifest, default_version_id",
          ],
          [
            <InlineCode key="v">model_versions</InlineCode>,
            "A specific installed revision of a model",
            "model_id, version, status, code_path, file_hash, manifest",
          ],
          [
            <InlineCode key="c">model_components</InlineCode>,
            "Individual code/data files and their SHA-256 hashes",
            "filename, component_type, file_hash, data_hash, file_size",
          ],
          [
            <InlineCode key="a">model_artifacts</InlineCode>,
            "Serialized trained checkpoints per version",
            "model_version_id, kind, format, path, metrics, file_hash",
          ],
          [
            <InlineCode key="r">model_runs</InlineCode>,
            "Each train/infer invocation and its outcome",
            "model_version_id, artifact_id, run_type, status, result_summary, k8s_job_name",
          ],
        ]}
      />
      <Callout type="note" title="Runtime, not just framework">
        Every model carries a <InlineCode>runtime</InlineCode> field — one of <InlineCode>python-base</InlineCode>,{" "}
        <InlineCode>sklearn</InlineCode>, <InlineCode>pytorch</InlineCode>, <InlineCode>tensorflow</InlineCode>, or{" "}
        <InlineCode>networkx</InlineCode>. The runtime selects which container image runs the model. See{" "}
        <A href="/docs/execution-sandbox">Execution Sandbox</A> for the image matrix.
      </Callout>

      <H2 id="statuses">Model statuses</H2>
      <P>
        A model moves through a small status machine. The <InlineCode>status</InlineCode> field is validated against a
        fixed set both when listing and when updating, and training or inference is gated on it — a model must be{" "}
        <InlineCode>installed</InlineCode> or <InlineCode>active</InlineCode> before it can run.
      </P>
      <Table
        head={["Status", "Meaning", "Can train / execute?"]}
        rows={[
          [
            <InlineCode key="p">pending</InlineCode>,
            "Registered in the database but code not yet pulled and verified.",
            "No",
          ],
          [
            <InlineCode key="i">installed</InlineCode>,
            "Code downloaded, checksums verified, components recorded. Ready to run.",
            "Yes",
          ],
          [
            <InlineCode key="ac">active</InlineCode>,
            "Installed and in active use (e.g. wired into scheduled runs).",
            "Yes",
          ],
          [
            <InlineCode key="d">disabled</InlineCode>,
            "Retained but excluded from execution.",
            "No",
          ],
        ]}
      />
      <P>
        The default status on <InlineCode>create</InlineCode> is <InlineCode>pending</InlineCode>. The installer
        transitions a model to <InlineCode>installed</InlineCode> once its files pass hash verification. The separate{" "}
        <InlineCode>enabled</InlineCode> boolean is an independent on/off toggle that filters models in listings without
        changing their lifecycle status.
      </P>

      <H2 id="register">1. Register a model</H2>
      <P>
        Registering creates the <InlineCode>models</InlineCode> row. You supply a name, version, and{" "}
        <InlineCode>source_type</InlineCode> (one of <InlineCode>openuba_hub</InlineCode>, <InlineCode>github</InlineCode>,{" "}
        <InlineCode>huggingface</InlineCode>, <InlineCode>kubeflow</InlineCode>, or <InlineCode>local_fs</InlineCode>). The
        slug is derived automatically from the name by lowercasing and replacing spaces and underscores with dashes. A
        name plus version must be unique — re-registering the same pair returns a 400.
      </P>
      <CodeBlock
        language="bash"
        title="POST /api/v1/models — register"
        code={`curl -X POST http://localhost:8000/api/v1/models \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "model_sklearn",
    "version": "1.0.0",
    "source_type": "local_fs",
    "runtime": "sklearn",
    "description": "Isolation Forest anomaly detection",
    "enabled": true
  }'`}
      />
      <Callout type="tip" title="Local discovery">
        You rarely register reference models by hand. Every call to <InlineCode>GET /api/v1/models</InlineCode> first
        runs <InlineCode>ModelInstaller.discover_local_models()</InlineCode>, which scans the model storage path and
        auto-registers any directory containing a <InlineCode>manifest.json</InlineCode>, a{" "}
        <InlineCode>model.yaml</InlineCode>, or Python files — recording each file&apos;s SHA-256 as a component. Those
        appear with <InlineCode>source_type = local</InlineCode> and status <InlineCode>installed</InlineCode>.
      </Callout>

      <H2 id="install">2. Install a model</H2>
      <P>
        Installing pulls the code down from its registry, verifies each file against the manifest hashes, records the
        components, creates a <InlineCode>ModelVersion</InlineCode>, and flips the status to{" "}
        <InlineCode>installed</InlineCode>. If the model has no source information, the endpoint simply marks it
        installed. Attempting to install a model that is already installed returns a 400.
      </P>
      <CodeBlock
        language="bash"
        title="POST /api/v1/models/{model_id}/install"
        code={`curl -X POST http://localhost:8000/api/v1/models/$MODEL_ID/install \\
  -H "Authorization: Bearer $TOKEN"`}
      />
      <P>
        Under the hood the endpoint calls <InlineCode>ModelInstaller.install_model()</InlineCode>, which fetches the
        manifest and files through the <A href="/docs/registry-adapters">registry adapters</A>, verifies SHA-256
        checksums (strict by default), moves the code into the model storage path, and persists components. Weights can
        optionally be pulled from a separate weights registry and dropped into a <InlineCode>weights/</InlineCode>{" "}
        subdirectory. Read the full flow in <A href="/docs/registry-adapters">Registry &amp; Adapters</A>.
      </P>

      <H2 id="versions">Versions &amp; artifacts</H2>
      <P>
        Each installed revision is a <InlineCode>ModelVersion</InlineCode>. The parent model keeps a{" "}
        <InlineCode>default_version_id</InlineCode> pointer, set to the first version installed. Training and inference
        target the default version unless you pass an explicit <InlineCode>version_id</InlineCode>.
      </P>
      <P>
        When a training run succeeds, the runner serializes the fitted model and writes a{" "}
        <InlineCode>ModelArtifact</InlineCode> of kind <InlineCode>checkpoint</InlineCode>. Its{" "}
        <InlineCode>format</InlineCode> depends on the runtime — for example <InlineCode>sklearn_pickle</InlineCode>{" "}
        (joblib), <InlineCode>torch_pt</InlineCode> (a state dict), <InlineCode>tf_saved_model</InlineCode>, or a generic{" "}
        <InlineCode>pickle</InlineCode>. Every artifact records its <InlineCode>path</InlineCode>, its training{" "}
        <InlineCode>metrics</InlineCode>, and a SHA-256 <InlineCode>file_hash</InlineCode>. On a successful train, the
        version&apos;s status advances to <InlineCode>trained</InlineCode>.
      </P>
      <P>
        At inference time, if you don&apos;t name an <InlineCode>artifact_id</InlineCode> the orchestrator selects the
        latest <InlineCode>checkpoint</InlineCode> artifact for the target version and mounts it so the runner can load
        the trained weights before predicting.
      </P>

      <H2 id="train">3. Train a model</H2>
      <P>
        Training enqueues a run to the execution sandbox. The endpoint accepts the data-source selection either as a
        JSON body or as query parameters (body takes precedence). It creates a <InlineCode>ModelRun</InlineCode> with{" "}
        <InlineCode>run_type = train</InlineCode>, records a <InlineCode>Job</InlineCode> so the run shows up on the Jobs
        page, and returns a <InlineCode>run_id</InlineCode> immediately — execution happens in the background.
      </P>
      <Table
        head={["data_source", "Required params", "Loaded by the runner as"]}
        rows={[
          [<InlineCode key="e">elasticsearch</InlineCode>, "index_name, query (defaults to match_all)", "An ES _search over the index"],
          [<InlineCode key="s">spark</InlineCode>, "table_name", "CSV files under the datasets path via local Spark"],
          [<InlineCode key="l">local_csv</InlineCode>, "file_path, file_name", "pandas.read_csv"],
          [<InlineCode key="sg">source_group</InlineCode>, "source_group_slug", "A named group of sources"],
        ]}
      />
      <CodeBlock
        language="bash"
        title="POST /api/v1/models/{model_id}/train"
        code={`# train on an Elasticsearch index
curl -X POST http://localhost:8000/api/v1/models/$MODEL_ID/train \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "data_source": "elasticsearch",
    "index_name": "auth-logs-2026",
    "query": { "match_all": {} }
  }'

# or train on a Spark table via query params
curl -X POST "http://localhost:8000/api/v1/models/$MODEL_ID/train?data_source=spark&table_name=toy_1_proxy" \\
  -H "Authorization: Bearer $TOKEN"`}
      />
      <P>
        The response is <InlineCode>{`{ "model_id": "...", "run_id": "...", "status": "dispatched" }`}</InlineCode>.
        Poll the run or job to watch progress; the runner streams logs into the <InlineCode>model_logs</InlineCode> table
        and reports live metrics back to the platform.
      </P>

      <H2 id="execute">4. Run inference</H2>
      <P>
        Inference uses the same data-source contract as training but sets <InlineCode>run_type = infer</InlineCode>. You
        may additionally pass an <InlineCode>artifact_id</InlineCode> to pin a specific trained checkpoint; omit it to
        use the latest. Results — anomalies with entity IDs and risk scores — are persisted to the{" "}
        <InlineCode>anomalies</InlineCode> table and then fed to the rule engine.
      </P>
      <CodeBlock
        language="bash"
        title="POST /api/v1/models/{model_id}/execute"
        code={`curl -X POST http://localhost:8000/api/v1/models/$MODEL_ID/execute \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "data_source": "elasticsearch",
    "index_name": "auth-logs-2026",
    "artifact_id": "0f3c...optional-checkpoint-uuid"
  }'`}
      />
      <P>
        A successful inference run returns an <InlineCode>anomalies</InlineCode> list; each entry carries an{" "}
        <InlineCode>entity_id</InlineCode>, <InlineCode>entity_type</InlineCode>, <InlineCode>risk_score</InlineCode>,{" "}
        <InlineCode>anomaly_type</InlineCode>, and free-form <InlineCode>details</InlineCode>. Anomalies scoring 50 or
        higher are flagged high-risk. For exactly how the container turns your data into this shape, see{" "}
        <A href="/docs/execution-sandbox">Execution Sandbox</A>.
      </P>

      <H2 id="sdk">SDK equivalents</H2>
      <P>
        The <InlineCode>openuba</InlineCode> Python SDK mirrors the REST surface for local development and for use inside{" "}
        <A href="/docs/workspaces">workspaces</A>, where it is preinstalled. The SDK can install and run reference
        models standalone without a full server.
      </P>
      <CodeBlock
        language="python"
        title="SDK lifecycle"
        code={`import openuba

# discover and install a reference model from the Hub
openuba.install("model_sklearn")

# run inference over a local data file
result = openuba.run("model_sklearn", data="events.csv")

for row in result["results"]:
    print(row.get("entity_id"), row.get("risk_score"), row.get("anomaly_type"))`}
      />

      <H2 id="model-library">The reference model library</H2>
      <P>
        OpenUBA ships a <InlineCode>model_library</InlineCode> of reference models — one per runtime — that double as
        working examples and smoke tests. Each is a directory with a <InlineCode>MODEL.py</InlineCode> and a{" "}
        <InlineCode>model.yaml</InlineCode> manifest declaring its name, version, runtime, and tunable parameters.
      </P>
      <Table
        head={["Reference model", "Runtime", "What it demonstrates"]}
        rows={[
          [<InlineCode key="b">basic_model</InlineCode>, "python-base", "Spark / Elasticsearch / local_csv data adapters with a threshold parameter"],
          [<InlineCode key="s">model_sklearn</InlineCode>, "sklearn", "Isolation Forest anomaly detection with train + infer"],
          [<InlineCode key="p">model_pytorch</InlineCode>, "pytorch", "A PyTorch model saved as a state dict checkpoint"],
          [<InlineCode key="t">model_tensorflow / model_keras</InlineCode>, "tensorflow", "A Keras/TF SavedModel checkpoint"],
          [<InlineCode key="n">model_networkx</InlineCode>, "networkx", "Graph-based detection over entity relationships"],
        ]}
      />
      <P>
        A reference model&apos;s <InlineCode>model.yaml</InlineCode> looks like this, and its parameters surface in the
        UI and as tunables for runs:
      </P>
      <CodeBlock
        language="yaml"
        title="core/model_library/model_sklearn/model.yaml"
        code={`name: model_sklearn
version: 1.0.0
runtime: sklearn
description: Isolation Forest Anomaly Detection
parameters:
  contamination:
    type: float
    default: 0.1
    description: Proportion of outliers expected in the data set.
  random_state:
    type: integer
    default: 42
    description: Random state for reproducibility`}
      />

      <H2 id="rest-reference">REST reference</H2>
      <Table
        head={["Method & path", "Description"]}
        rows={[
          [<InlineCode key="1">POST /api/v1/models</InlineCode>, "Register a new model (requires models:write)"],
          [<InlineCode key="2">GET /api/v1/models</InlineCode>, "List models; filters: status, source_type, enabled, limit, offset"],
          [<InlineCode key="3">GET /api/v1/models/search</InlineCode>, "Unified search across code & weights registries"],
          [<InlineCode key="4">{"GET /api/v1/models/{id}"}</InlineCode>, "Fetch a model by id"],
          [<InlineCode key="5">{"POST /api/v1/models/{id}/install"}</InlineCode>, "Pull code, verify checksums, mark installed"],
          [<InlineCode key="6">{"GET /api/v1/models/{id}/code"}</InlineCode>, "Return the model source code"],
          [<InlineCode key="7">{"POST /api/v1/models/{id}/train"}</InlineCode>, "Dispatch a training run"],
          [<InlineCode key="8">{"POST /api/v1/models/{id}/execute"}</InlineCode>, "Dispatch an inference run"],
          [<InlineCode key="9">{"PATCH /api/v1/models/{id}"}</InlineCode>, "Update status/enabled/manifest/runtime"],
          [<InlineCode key="10">{"DELETE /api/v1/models/{id}"}</InlineCode>, "Delete a model"],
        ]}
      />
      <Callout type="warning" title="Permissions">
        Write operations (register, install, train, execute, update, delete) require the{" "}
        <InlineCode>models:write</InlineCode> permission; reading code requires <InlineCode>models:read</InlineCode>.
        Listing and fetching are open reads.
      </Callout>

      <H2 id="next">Where to go next</H2>
      <OL>
        <LI>
          <A href="/docs/execution-sandbox">Execution Sandbox</A> — how the containerized runner turns a train/infer
          dispatch into a real container and loads your data.
        </LI>
        <LI>
          <A href="/docs/registry-adapters">Registry &amp; Adapters</A> — where code and weights come from, and how
          install-time integrity verification works.
        </LI>
        <LI>
          <A href="/docs/kubernetes">Kubernetes</A> — how runs become Jobs via the operator in cluster mode.
        </LI>
        <LI>
          <A href="/docs/data-pipelines">Data Pipelines</A> — the data sources you train and infer against.
        </LI>
      </OL>

      <DocFooter slug="models" />
    </>
  );
}
