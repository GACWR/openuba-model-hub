import type { Metadata } from "next";
import { DocHeader, H2, H3, P, UL, OL, LI, InlineCode, A, Callout, Table } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Registry & Adapters — OpenUBA Docs",
  description:
    "OpenUBA's multi-backend model registry — code registries (local FS, GitHub, OpenUBA Hub) and weights registries (local FS, HuggingFace, Kubeflow), unified search, and install-time SHA-256 integrity verification.",
};

export default function Page() {
  return (
    <>
      <DocHeader
        eyebrow="Models & Execution"
        title="Registry & Adapters"
        intro="OpenUBA fetches model code and trained weights from many backends behind one uniform interface. This page covers the adapter pattern, the code and weights adapters, unified cross-registry search, and the install-time SHA-256 verification that gates a model before it can ever run."
      />

      <H2 id="overview">One interface, many backends</H2>
      <P>
        A model&apos;s <InlineCode>source_type</InlineCode> — <InlineCode>local_fs</InlineCode>,{" "}
        <InlineCode>github</InlineCode>, <InlineCode>openuba_hub</InlineCode>, <InlineCode>huggingface</InlineCode>, or{" "}
        <InlineCode>kubeflow</InlineCode> — decides where its files come from. Rather than special-casing each backend
        throughout the codebase, OpenUBA hides them behind adapters. The <InlineCode>RegistryService</InlineCode> is the
        single entry point; it holds a dictionary of code adapters and a dictionary of weights adapters and dispatches
        by source type.
      </P>
      <P>
        The registry is split into two families because a model has two distinct parts. <strong>Code registries</strong>{" "}
        supply the model definition — the <InlineCode>MODEL.py</InlineCode>, its manifest, and its components.{" "}
        <strong>Weights registries</strong> supply trained parameters that are downloaded separately and dropped into a{" "}
        <InlineCode>weights/</InlineCode> subdirectory next to the code.
      </P>

      <H2 id="adapter-pattern">The adapter pattern</H2>
      <P>
        Every code adapter extends <InlineCode>BaseRegistryAdapter</InlineCode> and implements four methods:{" "}
        <InlineCode>list_models(query)</InlineCode>, <InlineCode>fetch_model(model_id)</InlineCode>,{" "}
        <InlineCode>get_manifest(model_id)</InlineCode>, <InlineCode>download_model(model_id, destination)</InlineCode>,
        plus <InlineCode>get_source_type()</InlineCode>. The base class provides{" "}
        <InlineCode>normalize_manifest()</InlineCode>, which flattens any backend&apos;s raw metadata into a common shape
        — name, slug, version, author, description, framework, runtime, tags, parameters, license, dependencies,{" "}
        <InlineCode>components</InlineCode>, source type, and source URL.
      </P>
      <P>
        Weights adapters extend <InlineCode>BaseWeightsAdapter</InlineCode> with the parallel trio{" "}
        <InlineCode>list_weights(model_name)</InlineCode>, <InlineCode>fetch_weights(weights_id)</InlineCode>, and{" "}
        <InlineCode>download_weights(weights_id, destination)</InlineCode>, and normalize to a manifest that includes{" "}
        <InlineCode>format</InlineCode>, <InlineCode>size</InlineCode>, and a <InlineCode>checksum</InlineCode>.
      </P>
      <Callout type="note" title="Graceful degradation">
        Adapters are constructed at startup inside try/except blocks. If an adapter can&apos;t initialize (missing token,
        unreachable host, absent optional dependency), it is simply skipped and logged as unavailable — the rest of the
        registry keeps working.
      </Callout>

      <H2 id="code-adapters">Code registries</H2>
      <Table
        head={["source_type", "Backend", "How it fetches code"]}
        rows={[
          [<InlineCode key="l">local_fs</InlineCode>, "Local filesystem model directory", "Reads model.yaml per subdirectory; downloads by copying the directory tree"],
          [<InlineCode key="g">github</InlineCode>, "GitHub repositories", "Searches topic:openuba-model, reads model.yaml (main then master), downloads by git clone"],
          [<InlineCode key="h">openuba_hub</InlineCode>, "The OpenUBA public Hub", "Lists and fetches manifests over HTTP from the Hub API"],
        ]}
      />
      <H3 id="local-fs">Local filesystem</H3>
      <P>
        The default in development. It scans the model library path (default{" "}
        <InlineCode>core/model_library</InlineCode>, overridable with <InlineCode>LOCAL_MODEL_PATH</InlineCode>) for
        subdirectories containing a <InlineCode>model.yaml</InlineCode>, normalizes each manifest, and installs by copying
        the tree into place. This is what makes the reference models available out of the box.
      </P>
      <H3 id="github">GitHub</H3>
      <P>
        Discovers community models via the GitHub search API filtered to the <InlineCode>openuba-model</InlineCode>{" "}
        topic, reads each repo&apos;s <InlineCode>model.yaml</InlineCode> (trying the <InlineCode>main</InlineCode> branch
        then <InlineCode>master</InlineCode>), and installs by cloning. An optional <InlineCode>GITHUB_TOKEN</InlineCode>{" "}
        raises rate limits and enables private repos. A model id is either a full repo URL or{" "}
        <InlineCode>owner/repo</InlineCode>.
      </P>
      <H3 id="openuba-hub">OpenUBA Hub</H3>
      <P>
        The public registry at <InlineCode>https://openuba.org</InlineCode> (overridable via{" "}
        <InlineCode>OPENUBA_HUB_URL</InlineCode>). It lists models from the Hub&apos;s <InlineCode>/ml/</InlineCode>{" "}
        endpoint and fetches per-model manifests from <InlineCode>/ml/&lt;id&gt;</InlineCode>. Hub results are preferred
        during deduplication because they carry the richest metadata.
      </P>
      <Callout type="tip" title="Which code registry is the default?">
        The default code registry depends on <InlineCode>ENVIRONMENT</InlineCode>: <InlineCode>local_fs</InlineCode> in
        development and <InlineCode>github</InlineCode> in production. Override it explicitly with{" "}
        <InlineCode>DEFAULT_CODE_REGISTRY</InlineCode>.
      </Callout>

      <H2 id="weights-adapters">Weights registries</H2>
      <Table
        head={["source_type", "Backend", "How it fetches weights"]}
        rows={[
          [<InlineCode key="l">local_fs</InlineCode>, "Local filesystem", "The default weights registry; reads from a local directory"],
          [<InlineCode key="h">huggingface</InlineCode>, "Hugging Face Hub", "Searches openuba-tagged models; downloads via snapshot_download (git-clone fallback)"],
          [<InlineCode key="k">kubeflow</InlineCode>, "Kubeflow model registry", "Lists/fetches over the registry API; downloads and unzips an artifact bundle"],
        ]}
      />
      <P>
        The default weights registry is <InlineCode>local_fs</InlineCode>, overridable with{" "}
        <InlineCode>DEFAULT_WEIGHTS_REGISTRY</InlineCode>. The Hugging Face adapter honors{" "}
        <InlineCode>HUGGINGFACE_TOKEN</InlineCode>, and the Kubeflow adapter reads{" "}
        <InlineCode>KUBEFLOW_REGISTRY_URL</InlineCode>. Weights download is optional — a model installs fine with code
        alone; if weights are requested and fail, installation continues and logs a warning.
      </P>

      <H2 id="search">Unified search</H2>
      <P>
        <InlineCode>GET /api/v1/models/search</InlineCode> queries both families at once. The{" "}
        <InlineCode>registry_type</InlineCode> parameter is <InlineCode>code</InlineCode>, <InlineCode>weights</InlineCode>,
        or <InlineCode>all</InlineCode> (the default). The service fans the query out to every matching adapter, tags each
        result with its <InlineCode>source_type</InlineCode> and <InlineCode>registry_type</InlineCode>, and the API layer
        deduplicates by model name — preferring Hub entries — then annotates each result with whether it is already
        installed locally and, if so, its <InlineCode>installed_model_id</InlineCode>.
      </P>
      <CodeBlock
        language="bash"
        title="GET /api/v1/models/search"
        code={`# search everything for "anomaly"
curl "http://localhost:8000/api/v1/models/search?query=anomaly&registry_type=all"

# only code registries, only GitHub
curl "http://localhost:8000/api/v1/models/search?query=ssh&registry_type=code&source_type=github"`}
      />

      <H2 id="verification">Install-time integrity verification</H2>
      <P>
        Verification is the security gate that stands between fetching code and running it. During install, the{" "}
        <InlineCode>ModelInstaller</InlineCode> downloads code to a temporary directory and calls{" "}
        <InlineCode>_verify_model_files()</InlineCode>, which walks the manifest&apos;s <InlineCode>components</InlineCode>{" "}
        and recomputes each file&apos;s SHA-256 (streamed in 4 KB blocks) to compare against the manifest{" "}
        <InlineCode>file_hash</InlineCode>. In the default <strong>strict</strong> mode, any missing file or hash
        mismatch aborts the install with <InlineCode>model code hash verification failed</InlineCode>.
      </P>
      <OL>
        <LI>Fetch the code manifest from the code registry.</LI>
        <LI>Download the code files into a temporary directory.</LI>
        <LI>
          Recompute SHA-256 per component and compare to the manifest — <strong>abort on mismatch in strict mode</strong>.
        </LI>
        <LI>Optionally download and verify weights, then move them under <InlineCode>weights/</InlineCode>.</LI>
        <LI>Move the verified code into the model storage path.</LI>
        <LI>
          Persist the model, a <InlineCode>ModelVersion</InlineCode>, and one{" "}
          <InlineCode>ModelComponent</InlineCode> per file with its recorded hash; set status to{" "}
          <InlineCode>installed</InlineCode>.
        </LI>
      </OL>
      <Callout type="warning" title="Strict vs loose (dev) mode">
        Verification mode is controlled by <InlineCode>VERIFY_MODE</InlineCode>. The default is{" "}
        <InlineCode>strict</InlineCode>; setting it to <InlineCode>loose</InlineCode> (dev mode) downgrades mismatches to
        warnings and continues. Never run untrusted models in loose mode.
      </Callout>
      <P>
        Hashing is SHA-256 throughout — the installer, the runner&apos;s <InlineCode>hash_file()</InlineCode>, and the
        core <InlineCode>Hash</InlineCode> helper all use the same 4 KB-block streaming digest, so a hash computed at
        install time matches one recomputed anywhere else. Component hashes are stored in{" "}
        <InlineCode>model_components.file_hash</InlineCode> and trained artifacts carry their own{" "}
        <InlineCode>file_hash</InlineCode>, giving the platform a verifiable chain from registry to run.
      </P>

      <H2 id="manifest">The component manifest</H2>
      <P>
        Verification is only as good as the manifest that declares the expected hashes. A code manifest lists{" "}
        <InlineCode>components</InlineCode>, each naming a <InlineCode>filename</InlineCode>, a{" "}
        <InlineCode>type</InlineCode>, and an expected <InlineCode>file_hash</InlineCode> (and optionally a{" "}
        <InlineCode>data_hash</InlineCode>). If a manifest declares no components, the installer logs a warning and skips
        hash checks — so a well-formed manifest is what turns verification on.
      </P>
      <CodeBlock
        language="yaml"
        title="A manifest with verifiable components"
        code={`name: ssh-login-anomaly-detector
version: 1.0.0
runtime: sklearn
description: SSH login anomaly detector
source_url: https://github.com/example/ssh-anomaly
components:
  - filename: MODEL.py
    type: code
    file_hash: "9f2c...sha256"
  - filename: model.yaml
    type: config
    file_hash: "1a7b...sha256"`}
      />

      <H2 id="config">Configuration reference</H2>
      <Table
        head={["Env var", "Applies to", "Default"]}
        rows={[
          [<InlineCode key="1">DEFAULT_CODE_REGISTRY</InlineCode>, "Which code adapter is used when none is specified", "local_fs (dev) / github (prod)"],
          [<InlineCode key="2">DEFAULT_WEIGHTS_REGISTRY</InlineCode>, "Which weights adapter is the default", "local_fs"],
          [<InlineCode key="3">LOCAL_MODEL_PATH</InlineCode>, "Local FS code adapter scan path", "core/model_library"],
          [<InlineCode key="4">OPENUBA_HUB_URL</InlineCode>, "OpenUBA Hub base URL", "https://openuba.org"],
          [<InlineCode key="5">GITHUB_TOKEN</InlineCode>, "GitHub adapter auth (optional)", "—"],
          [<InlineCode key="6">HUGGINGFACE_TOKEN</InlineCode>, "Hugging Face weights adapter auth (optional)", "—"],
          [<InlineCode key="7">KUBEFLOW_REGISTRY_URL</InlineCode>, "Kubeflow weights registry endpoint", "http://localhost:8080"],
          [<InlineCode key="8">VERIFY_MODE</InlineCode>, "Install-time hash verification strictness", "strict"],
          [<InlineCode key="9">MODEL_STORAGE_PATH</InlineCode>, "Where installed models are stored", "core/model_library"],
        ]}
      />

      <H2 id="next">Where to go next</H2>
      <OL>
        <LI>
          <A href="/docs/models">Models &amp; Lifecycle</A> — how install fits into registering, versioning, and running.
        </LI>
        <LI>
          <A href="/docs/execution-sandbox">Execution Sandbox</A> — what runs after a model is verified and installed.
        </LI>
        <LI>
          <A href="/docs/workspaces">Workspaces</A> — author and package a model before publishing it to a registry.
        </LI>
        <LI>
          <A href="/docs/kubernetes">Kubernetes</A> — deploying the registry-backed platform in a cluster.
        </LI>
      </OL>

      <DocFooter slug="registry-adapters" />
    </>
  );
}
