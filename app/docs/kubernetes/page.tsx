import type { Metadata } from "next";
import { DocHeader, H2, H3, P, UL, OL, LI, InlineCode, A, Callout, Table, NextCard } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Kubernetes-Native — OpenUBA",
  description:
    "OpenUBA's custom resources (UBATraining, UBAInference, UBAPipeline, UBAWorkspace), the Kopf operator and its handlers, operator RBAC, and the full manifest set.",
};

export default function Kubernetes() {
  return (
    <>
      <DocHeader
        eyebrow="Platform"
        title="Kubernetes-Native"
        intro="OpenUBA is not merely deployed on Kubernetes — it extends it. Training runs, inference runs, multi-step pipelines, and interactive workspaces are all first-class Custom Resources reconciled by a Kopf operator into ephemeral Jobs and Pods."
      />

      <H2 id="model">The operator pattern</H2>
      <P>
        Instead of running a service per model, OpenUBA models the platform&apos;s
        work as declarative custom resources. The backend creates a resource that
        says <em>what</em> should run; the operator figures out <em>how</em> —
        building the Kubernetes objects, watching them, and writing status back.
        This is the standard operator pattern, applied to security analytics.
      </P>
      <P>
        Four Custom Resource Definitions live under the{" "}
        <InlineCode>openuba.io</InlineCode> API group. Two of them —{" "}
        <InlineCode>UBATraining</InlineCode> and{" "}
        <InlineCode>UBAInference</InlineCode> — are on version{" "}
        <InlineCode>v1alpha1</InlineCode>; the newer{" "}
        <InlineCode>UBAPipeline</InlineCode> and{" "}
        <InlineCode>UBAWorkspace</InlineCode> are on <InlineCode>v1</InlineCode>.
        All four are <InlineCode>Namespaced</InlineCode> and expose a{" "}
        <InlineCode>/status</InlineCode> subresource.
      </P>
      <Table
        head={["Kind", "Version", "Plural", "Short name", "Purpose"]}
        rows={[
          [<InlineCode key="1">UBATraining</InlineCode>, "v1alpha1", <InlineCode key="1p">ubatrainings</InlineCode>, <InlineCode key="1s">train</InlineCode>, "Train a model as a Job"],
          [<InlineCode key="2">UBAInference</InlineCode>, "v1alpha1", <InlineCode key="2p">ubainferences</InlineCode>, <InlineCode key="2s">inf</InlineCode>, "Run inference as a Job"],
          [<InlineCode key="3">UBAPipeline</InlineCode>, "v1", <InlineCode key="3p">ubapipelines</InlineCode>, <InlineCode key="3s">ubapipe</InlineCode>, "Ordered multi-step train/infer flow"],
          [<InlineCode key="4">UBAWorkspace</InlineCode>, "v1", <InlineCode key="4p">ubaworkspaces</InlineCode>, <InlineCode key="4s">ubaws</InlineCode>, "Interactive JupyterLab Pod"],
        ]}
      />

      <H2 id="crds">The Custom Resource Definitions</H2>
      <P>
        The CRD manifests live in <InlineCode>k8s/crds/</InlineCode>. Each defines
        a strict <InlineCode>openAPIV3Schema</InlineCode> for its spec so that
        the API server validates resources before the operator ever sees them.
      </P>

      <H3 id="ubatraining">UBATraining</H3>
      <P>
        A training resource references a model and a dataset, picks a hardware
        tier, and carries the paths the runner reads and writes. Hyperparameters
        are a free-form object (<InlineCode>x-kubernetes-preserve-unknown-fields</InlineCode>).
      </P>
      <CodeBlock
        language="yaml"
        title="k8s/crds/ubatraining.yaml (spec schema)"
        code={`spec:
  type: object
  properties:
    modelRef:      { type: string }
    runtime:       { type: string }        # selects the framework image
    configPath:    { type: string }
    outputPath:    { type: string }
    runId:         { type: string }
    executionId:   { type: string }
    modelSlug:     { type: string }
    modelVersion:  { type: string }
    modelId:       { type: string }        # UUID of the model DB record
    datasetId:     { type: string }        # UUID of the dataset
    hardwareTier:
      type: string
      enum: [cpu-small, cpu-large, gpu-small, gpu-large]
      default: cpu-small
    hyperparameters:
      type: object
      x-kubernetes-preserve-unknown-fields: true
    experimentId:  { type: string }
# status: phase, message, startedAt, completedAt, metricsPath`}
      />

      <H3 id="ubainference">UBAInference</H3>
      <P>
        Inference mirrors training, but reads an <InlineCode>inputPath</InlineCode>{" "}
        (rather than a config path), points at a trained{" "}
        <InlineCode>artifactPath</InlineCode>, and its status carries a{" "}
        <InlineCode>resultReady</InlineCode> flag and a{" "}
        <InlineCode>resultPath</InlineCode>.
      </P>
      <CodeBlock
        language="yaml"
        title="k8s/crds/ubainference.yaml (spec schema)"
        code={`spec:
  type: object
  properties:
    modelRef:      { type: string }
    runtime:       { type: string }
    inputPath:     { type: string }
    outputPath:    { type: string }
    runId:         { type: string }
    executionId:   { type: string }
    modelSlug:     { type: string }
    modelVersion:  { type: string }
    artifactPath:  { type: string }        # the trained model artifact
    modelId:       { type: string }
    datasetId:     { type: string }
    hardwareTier:
      type: string
      enum: [cpu-small, cpu-large, gpu-small, gpu-large]
      default: cpu-small
    experimentId:  { type: string }
# status: phase, resultReady (bool), resultPath, message, startedAt, completedAt`}
      />

      <H3 id="ubapipeline">UBAPipeline</H3>
      <P>
        A pipeline is an ordered list of steps, each of which is a training,
        inference, or data-processing operation. The operator drives the steps
        one at a time, creating a training or inference CR per step and advancing
        as each completes.
      </P>
      <CodeBlock
        language="yaml"
        title="k8s/crds/ubapipeline-crd.yaml (spec schema)"
        code={`spec:
  type: object
  required: [name, steps]
  properties:
    name: { type: string }
    steps:
      type: array
      items:
        type: object
        properties:
          type: { type: string, enum: [training, inference, data_processing] }
          model_id:   { type: string }
          dataset_id: { type: string }
          hyperparameters:
            type: object
            x-kubernetes-preserve-unknown-fields: true
          hardware_tier:
            type: string
            enum: [cpu-small, cpu-large, gpu-small, gpu-large]
            default: cpu-small
    created_by: { type: string }
# status: phase (Pending/Running/Completed/Failed), current_step,
#         step_statuses[] (step_index, status, job_id, message),
#         started_at, completed_at, message`}
      />

      <H3 id="ubaworkspace">UBAWorkspace</H3>
      <P>
        A workspace is the one long-lived exception: it provisions an interactive
        JupyterLab Pod (plus a PVC and a NodePort Service) rather than a
        run-to-completion Job. See <A href="/docs/workspaces">Workspaces</A> for
        the full lifecycle.
      </P>
      <CodeBlock
        language="yaml"
        title="k8s/crds/ubaworkspace-crd.yaml (spec schema)"
        code={`spec:
  type: object
  required: [name, created_by]
  properties:
    name:        { type: string }
    environment: { type: string, default: "default" }
    hardware_tier:
      type: string
      enum: [cpu-small, cpu-large, gpu-small, gpu-large]
      default: cpu-small
    ide:           { type: string, enum: [jupyterlab], default: jupyterlab }
    created_by:    { type: string }
    timeout_hours: { type: integer, default: 24 }
    node_port:     { type: integer }
    workspace_token: { type: string }
# status: phase (Pending/Creating/Running/Stopping/Stopped/Failed/Deleting),
#         pod_name, service_name, pvc_name, access_url, node_port, started_at, message`}
      />

      <H2 id="operator">The Kopf operator</H2>
      <P>
        The operator is a <A href="https://kopf.readthedocs.io/">Kopf</A>{" "}
        application backed by the official Kubernetes Python client. It lives in{" "}
        <InlineCode>core/operator/</InlineCode> and is split across three files:{" "}
        <InlineCode>main.py</InlineCode> (training + inference handlers),{" "}
        <InlineCode>workspace_handler.py</InlineCode>, and{" "}
        <InlineCode>pipeline_handler.py</InlineCode>. At import time it loads
        in-cluster config when <InlineCode>KUBERNETES_SERVICE_HOST</InlineCode> is
        set, and builds a <InlineCode>CoreV1Api</InlineCode> and a{" "}
        <InlineCode>BatchV1Api</InlineCode> client.
      </P>

      <H3 id="train-infer-handlers">Training &amp; inference handlers</H3>
      <P>
        The two Job-producing handlers are nearly identical. On create, each
        resolves a framework image, builds a Job manifest,{" "}
        <InlineCode>kopf.adopt</InlineCode>s it (so the Job is garbage-collected
        with its parent CR), and creates it in the namespace.
      </P>
      <CodeBlock
        language="python"
        title="core/operator/main.py (handlers)"
        code={`@kopf.on.create('openuba.io', 'v1alpha1', 'ubatrainings')
def create_training_job(spec, name, meta, status, **kwargs):
    runtime = spec.get('runtime', 'python-base')
    image_tag = "base"
    if runtime in ["sklearn", "pytorch", "tensorflow", "networkx"]:
        image_tag = runtime
    image = f"openuba-model-runner:{image_tag}"

    job_manifest = create_job_manifest(name, image, args=["train"], ...)
    kopf.adopt(job_manifest)                       # GC with the CR
    batch_api.create_namespaced_job(namespace, job_manifest)
    return {'phase': 'Running', ...}

@kopf.on.create('openuba.io', 'v1alpha1', 'ubainferences')
def create_inference_job(spec, name, meta, status, **kwargs):
    ...                                            # same shape, args=["infer"]

@kopf.on.event('batch', 'v1', 'jobs')
def job_event(event, body, **kwargs):
    # infer the parent CR from the Job name prefix (train-job- / inf-job-)
    # and patch the CR status to Succeeded / Failed
    ...`}
      />
      <Callout type="note" title="Framework image selection">
        The runner image is chosen from the CR&apos;s{" "}
        <InlineCode>spec.runtime</InlineCode>: one of{" "}
        <InlineCode>sklearn</InlineCode>, <InlineCode>pytorch</InlineCode>,{" "}
        <InlineCode>tensorflow</InlineCode>, or <InlineCode>networkx</InlineCode>{" "}
        maps to <InlineCode>openuba-model-runner:&lt;runtime&gt;</InlineCode>;
        anything else falls back to{" "}
        <InlineCode>openuba-model-runner:base</InlineCode>. The runtime value
        originates from the model&apos;s database record.
      </Callout>

      <H3 id="job-manifest">The Job manifest</H3>
      <P>
        The Job is deliberately ephemeral and non-retrying. It sets{" "}
        <InlineCode>restartPolicy: Never</InlineCode>,{" "}
        <InlineCode>backoffLimit: 0</InlineCode> (no blind retries), and{" "}
        <InlineCode>ttlSecondsAfterFinished: 300</InlineCode> (self-cleanup five
        minutes after finishing). It mounts four shared PersistentVolumeClaims so
        the runner can read inputs and write outputs.
      </P>
      <Table
        head={["PVC", "Mount path", "Role"]}
        rows={[
          [<InlineCode key="1">model-storage-pvc</InlineCode>, <InlineCode key="1m">/model</InlineCode>, "Model code and run inputs/outputs"],
          [<InlineCode key="2">system-storage-pvc</InlineCode>, <InlineCode key="2m">/system</InlineCode>, "System-level scratch"],
          [<InlineCode key="3">saved-models-pvc</InlineCode>, <InlineCode key="3m">/opt/openuba/saved_models</InlineCode>, "Trained artifacts"],
          [<InlineCode key="4">datasets-pvc</InlineCode>, <InlineCode key="4m">/app/test_datasets</InlineCode>, "Datasets (read-only)"],
        ]}
      />

      <H3 id="pipeline-workspace-handlers">Pipeline &amp; workspace handlers</H3>
      <UL>
        <LI>
          <strong>Pipeline</strong> (<InlineCode>pipeline_handler.py</InlineCode>):
          on create, it initializes per-step status and executes step 0. Its{" "}
          <InlineCode>_execute_step</InlineCode> creates a{" "}
          <InlineCode>UBATraining</InlineCode> or{" "}
          <InlineCode>UBAInference</InlineCode> CR labeled with{" "}
          <InlineCode>openuba.io/pipeline</InlineCode>. A label-filtered{" "}
          <InlineCode>job_event</InlineCode> handler advances to the next step,
          or marks the pipeline <InlineCode>Completed</InlineCode> /{" "}
          <InlineCode>Failed</InlineCode>.
        </LI>
        <LI>
          <strong>Workspace</strong> (<InlineCode>workspace_handler.py</InlineCode>):
          on create, it builds and adopts a PVC, a JupyterLab Pod (image{" "}
          <InlineCode>WORKSPACE_IMAGE</InlineCode>, default{" "}
          <InlineCode>openuba-workspace:latest</InlineCode>), and a NodePort
          Service. A <InlineCode>@kopf.timer</InlineCode> runs every 60 seconds to
          health-check the Pod; the delete handler relies on Kubernetes garbage
          collection of the owned resources.
        </LI>
      </UL>

      <H2 id="deployment-rbac">Operator deployment &amp; RBAC</H2>
      <P>
        The operator runs as a single-replica Deployment in the{" "}
        <InlineCode>openuba</InlineCode> namespace, using the image{" "}
        <InlineCode>openuba-operator:latest</InlineCode> and the{" "}
        <InlineCode>openuba-operator</InlineCode> service account. It has no
        explicit command — Kopf runs <InlineCode>main.py</InlineCode> via the
        image entrypoint.
      </P>
      <CodeBlock
        language="yaml"
        title="k8s/operator-deployment.yaml (excerpt)"
        code={`apiVersion: apps/v1
kind: Deployment
metadata:
  name: openuba-operator
  namespace: openuba
spec:
  replicas: 1
  template:
    spec:
      serviceAccountName: openuba-operator
      containers:
        - name: operator
          image: openuba-operator:latest
          imagePullPolicy: IfNotPresent
          env:
            - { name: KUBERNETES_NAMESPACE, value: openuba }`}
      />
      <P>
        Because the CRDs are cluster-scoped resources, the operator is granted a{" "}
        <InlineCode>ClusterRole</InlineCode> (the code still confines its actions
        to the <InlineCode>openuba</InlineCode> namespace). The rules cover the
        Kopf peering objects, the OpenUBA CRs and their status subresources, and
        the Kubernetes primitives the handlers create.
      </P>
      <CodeBlock
        language="yaml"
        title="k8s/operator-rbac.yaml (ClusterRole rules)"
        code={`rules:
  - apiGroups: ["kopf.dev"]
    resources: ["clusterkopfpeerings"]
    verbs: ["list", "watch", "patch", "get"]
  - apiGroups: ["apiextensions.k8s.io"]
    resources: ["customresourcedefinitions"]
    verbs: ["list", "watch"]
  - apiGroups: ["openuba.io"]
    resources: ["ubainferences", "ubatrainings", "ubaworkspaces", "ubapipelines"]
    verbs: ["list", "watch", "patch", "get", "update", "create", "delete"]
  - apiGroups: ["openuba.io"]
    resources: ["ubainferences/status", "ubatrainings/status",
                "ubaworkspaces/status", "ubapipelines/status"]
    verbs: ["patch", "update"]
  - apiGroups: ["batch", "extensions"]
    resources: ["jobs"]
    verbs: ["create", "delete", "list", "watch", "get"]
  - apiGroups: [""]
    resources: ["pods", "pods/log"]
    verbs: ["list", "watch", "get", "create", "delete"]
  - apiGroups: [""]
    resources: ["services"]
    verbs: ["create", "delete", "list", "watch", "get"]
  - apiGroups: [""]
    resources: ["persistentvolumeclaims"]
    verbs: ["create", "delete", "list", "watch", "get"]
  - apiGroups: [""]
    resources: ["events"]
    verbs: ["create"]`}
      />

      <H2 id="request-to-job">From request to Job, end to end</H2>
      <P>
        Putting it together, here is what happens when an analyst triggers a
        training or inference run and the platform is in{" "}
        <InlineCode>kubernetes</InlineCode> execution mode:
      </P>
      <OL>
        <LI>
          The backend&apos;s <InlineCode>ModelOrchestrator</InlineCode> sees{" "}
          <InlineCode>EXECUTION_MODE=kubernetes</InlineCode> and calls{" "}
          <InlineCode>_execute_kubernetes</InlineCode> in{" "}
          <InlineCode>core/services/model_orchestrator.py</InlineCode>.
        </LI>
        <LI>
          It writes the input JSON to a PVC-backed path and calls{" "}
          <InlineCode>CustomObjectsApi().create_namespaced_custom_object</InlineCode>{" "}
          with group <InlineCode>openuba.io</InlineCode>, version{" "}
          <InlineCode>v1alpha1</InlineCode>, and plural{" "}
          <InlineCode>ubainferences</InlineCode> or{" "}
          <InlineCode>ubatrainings</InlineCode>.
        </LI>
        <LI>
          The operator&apos;s matching create handler fires, resolves the runner
          image, and creates a Kubernetes Job.
        </LI>
        <LI>
          The orchestrator polls the CR status every five seconds (up to an
          hour). When <InlineCode>job_event</InlineCode> patches the status to{" "}
          <InlineCode>Succeeded</InlineCode>, the orchestrator reads the output
          file; on <InlineCode>Failed</InlineCode> it surfaces the error.
        </LI>
      </OL>
      <CodeBlock
        language="python"
        title="core/services/model_orchestrator.py (CR creation)"
        code={`# run_type == "infer" -> ubainferences / UBAInference, else ubatrainings / UBATraining
client.CustomObjectsApi().create_namespaced_custom_object(
    group="openuba.io",
    version="v1alpha1",
    namespace=namespace,
    plural=plural,
    body=crd_manifest,
)
# then poll get_namespaced_custom_object(...) every 5s until phase == "Succeeded"`}
      />
      <Callout type="tip" title="Try it with kubectl">
        Because these are real Kubernetes resources, you can inspect them with the
        standard tooling: <InlineCode>kubectl get train,inf -n openuba</InlineCode>{" "}
        lists training and inference runs, and{" "}
        <InlineCode>kubectl describe ubatraining &lt;name&gt;</InlineCode> shows
        the reconciled status.
      </Callout>

      <H2 id="manifests">The full manifest set</H2>
      <P>
        Beyond the CRDs and the operator, the <InlineCode>k8s/</InlineCode>{" "}
        directory contains everything needed to stand up the platform: the
        namespace, the core deployments, PersistentVolumes, secrets, and an
        ingress.
      </P>
      <Table
        head={["Manifest", "Provides"]}
        rows={[
          [<InlineCode key="1">namespace.yaml</InlineCode>, "The openuba namespace"],
          [<InlineCode key="2">backend-deployment.yaml</InlineCode>, "FastAPI backend Deployment (+ PVC)"],
          [<InlineCode key="3">backend-rbac.yaml</InlineCode>, "backend-sa service account + Role"],
          [<InlineCode key="4">frontend-deployment.yaml</InlineCode>, "Next.js frontend Deployment + Service"],
          [<InlineCode key="5">postgres.yaml</InlineCode>, "PostgreSQL 15 Deployment, PVC, Service"],
          [<InlineCode key="6">postgraphile-deployment.yaml</InlineCode>, "PostGraphile GraphQL Deployment + Service (:5000)"],
          [<InlineCode key="7">elasticsearch-deployment.yaml</InlineCode>, "Elasticsearch 8.11 Deployment, PVC, Service"],
          [<InlineCode key="8">spark-deployment.yaml</InlineCode>, "Spark 3.5 master Deployment + Service"],
          [<InlineCode key="9">operator-deployment.yaml</InlineCode>, "The Kopf operator Deployment"],
          [<InlineCode key="10">operator-rbac.yaml</InlineCode>, "Operator SA, ClusterRole, ClusterRoleBinding"],
          [<InlineCode key="11">ingress.yaml</InlineCode>, "openuba-ingress"],
          [<InlineCode key="12">secrets.yaml</InlineCode>, "postgres-secret and friends"],
          [<InlineCode key="13">*-pv.yaml</InlineCode>, "PVs/PVCs: datasets, dev, saved-models, source-code, frontend-source, metastore"],
          [<InlineCode key="14">dashboard-admin.yaml</InlineCode>, "Kubernetes dashboard admin SA + binding"],
        ]}
      />

      <H2 id="next">Where to go next</H2>
      <div className="grid gap-3 sm:grid-cols-2 mt-4">
        <NextCard
          href="/docs/architecture"
          title="Architecture"
          description="How the operator fits into the whole platform."
        />
        <NextCard
          href="/docs/execution-sandbox"
          title="Execution Sandbox"
          description="Inside the ephemeral runner container the Job launches."
        />
        <NextCard
          href="/docs/data-pipelines"
          title="Data Pipelines"
          description="The data the runner reads over shared volumes."
        />
        <NextCard
          href="/docs/workspaces"
          title="Workspaces"
          description="The interactive JupyterLab side of the operator."
        />
      </div>

      <DocFooter slug="kubernetes" />
    </>
  );
}
