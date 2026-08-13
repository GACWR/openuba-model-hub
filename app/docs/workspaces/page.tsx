import type { Metadata } from "next";
import { DocHeader, H2, H3, P, UL, OL, LI, InlineCode, A, Callout, Table } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Workspaces — OpenUBA Docs",
  description:
    "On-demand JupyterLab workspaces in OpenUBA — hardware tiers, NodePort allocation, the UBAWorkspace CRD and Kopf operator handler, and the preinstalled SDK.",
};

export default function Page() {
  return (
    <>
      <DocHeader
        eyebrow="Models & Execution"
        title="Workspaces"
        intro="Workspaces are on-demand JupyterLab environments for authoring, training, and exploring models interactively — each backed by its own pod, persistent volume, and NodePort. This page covers the hardware tiers, how ports are allocated, the UBAWorkspace custom resource and its Kopf operator handler, and the OpenUBA SDK that comes preinstalled."
      />

      <H2 id="overview">What a workspace is</H2>
      <P>
        A workspace is a JupyterLab server running in its own Kubernetes pod, reachable in the browser and mounted onto
        a persistent volume so your notebooks and data survive restarts. It is the interactive counterpart to the batch{" "}
        <A href="/docs/execution-sandbox">Execution Sandbox</A>: you develop and iterate on a model in a workspace, then
        register and run it through the model lifecycle. The workspace image ships the OpenUBA SDK and a full data-science
        stack so you can go from raw logs to a working detector without leaving the notebook.
      </P>
      <P>
        Each workspace is tracked in the <InlineCode>workspaces</InlineCode> table with a{" "}
        <InlineCode>name</InlineCode>, <InlineCode>environment</InlineCode>, <InlineCode>hardware_tier</InlineCode>,{" "}
        <InlineCode>ide</InlineCode> (currently <InlineCode>jupyterlab</InlineCode>), a <InlineCode>status</InlineCode>,
        the allocated <InlineCode>node_port</InlineCode> and <InlineCode>access_url</InlineCode>, the backing pod/service/PVC
        names, the owning <InlineCode>cr_name</InlineCode>, and a <InlineCode>timeout_hours</InlineCode> (default 24).
      </P>

      <H2 id="lifecycle">Lifecycle &amp; status</H2>
      <P>
        The <InlineCode>WorkspaceService</InlineCode> manages the database side of the lifecycle. Launching a workspace
        allocates a NodePort, creates the record, computes an <InlineCode>access_url</InlineCode> immediately (so the
        frontend can start probing before the pod is even ready), and sets a <InlineCode>cr_name</InlineCode> of the form{" "}
        <InlineCode>uba-ws-&lt;first-8-of-uuid&gt;</InlineCode>.
      </P>
      <Table
        head={["Status", "Meaning"]}
        rows={[
          [<InlineCode key="p">pending</InlineCode>, "Record created; resources being provisioned by the operator."],
          [<InlineCode key="r">running</InlineCode>, "Pod is up and the JupyterLab server is reachable."],
          [<InlineCode key="s">stopped</InlineCode>, "Stopped by the user; NodePort is reserved for restart."],
          [<InlineCode key="f">failed</InlineCode>, "Pod is not healthy (see the operator health check)."],
        ]}
      />
      <UL>
        <LI>
          <strong>Stop</strong> transitions a <InlineCode>running</InlineCode> or <InlineCode>pending</InlineCode>{" "}
          workspace to <InlineCode>stopped</InlineCode> and stamps <InlineCode>stopped_at</InlineCode>.
        </LI>
        <LI>
          <strong>Restart</strong> moves a <InlineCode>stopped</InlineCode> or <InlineCode>failed</InlineCode> workspace
          back to <InlineCode>pending</InlineCode>, preserving its <InlineCode>access_url</InlineCode> so the frontend
          can resume probing once the pod returns.
        </LI>
        <LI>
          <strong>Delete</strong> removes the record; Kubernetes garbage-collects the owned pod, service, and PVC.
        </LI>
      </UL>

      <H2 id="tiers">Hardware tiers</H2>
      <P>
        Each workspace picks a hardware tier that maps to Kubernetes resource requests and limits. Requests are kept
        deliberately low so many workspaces fit on a local Kind cluster, while limits allow bursting. GPU tiers request{" "}
        <InlineCode>nvidia.com/gpu</InlineCode> resources.
      </P>
      <Table
        head={["Tier", "CPU (req / limit)", "Memory (req / limit)", "GPU limit"]}
        rows={[
          [<InlineCode key="cs">cpu-small</InlineCode>, "100m / 500m", "128Mi / 1Gi", "—"],
          [<InlineCode key="cl">cpu-large</InlineCode>, "250m / 2", "512Mi / 4Gi", "—"],
          [<InlineCode key="gs">gpu-small</InlineCode>, "500m / 2", "1Gi / 4Gi", "1"],
          [<InlineCode key="gl">gpu-large</InlineCode>, "1 / 4", "2Gi / 8Gi", "4"],
        ]}
      />
      <Callout type="note" title="Same tiers as jobs">
        These four tiers are shared with model training and inference jobs — the{" "}
        <InlineCode>UBAInference</InlineCode> and <InlineCode>UBATraining</InlineCode> resources accept the same{" "}
        <InlineCode>hardwareTier</InlineCode> enum. An unknown tier name falls back to <InlineCode>cpu-small</InlineCode>.
      </Callout>

      <H2 id="nodeports">NodePort allocation</H2>
      <P>
        Workspaces are exposed via Kubernetes <strong>NodePort</strong> services. The service allocates ports from a
        fixed range — by default <InlineCode>31200</InlineCode> to <InlineCode>31209</InlineCode>, configurable through{" "}
        <InlineCode>WORKSPACE_NODE_PORT_START</InlineCode> and <InlineCode>WORKSPACE_NODE_PORT_END</InlineCode>. The
        service scans every non-deleted workspace, reserves each port already in use (including{" "}
        <InlineCode>stopped</InlineCode> ones, so a restart can reclaim its original port), and returns the first free
        port. If none are free it raises an error.
      </P>
      <P>
        The <InlineCode>access_url</InlineCode> is built from <InlineCode>WORKSPACE_ACCESS_BASE_URL</InlineCode> (default{" "}
        <InlineCode>http://localhost</InlineCode>) plus the allocated port, e.g.{" "}
        <InlineCode>http://localhost:31200</InlineCode>.
      </P>

      <H2 id="crd">The UBAWorkspace CRD</H2>
      <P>
        A launched workspace is materialized as a <InlineCode>UBAWorkspace</InlineCode> custom resource in the{" "}
        <InlineCode>openuba.io/v1</InlineCode> API group (short name <InlineCode>ubaws</InlineCode>). Its spec requires a{" "}
        <InlineCode>name</InlineCode> and <InlineCode>created_by</InlineCode>, and carries the tier, environment, IDE,
        timeout, requested node port, and a per-workspace token. Its status tracks the provisioning phase and the
        resulting pod/service/PVC and access URL.
      </P>
      <CodeBlock
        language="yaml"
        title="A UBAWorkspace custom resource"
        code={`apiVersion: openuba.io/v1
kind: UBAWorkspace
metadata:
  name: uba-ws-1a2b3c4d
  namespace: openuba
spec:
  name: uba-ws-1a2b3c4d
  hardware_tier: cpu-small       # cpu-small | cpu-large | gpu-small | gpu-large
  ide: jupyterlab
  environment: default
  created_by: "<user-uuid>"
  timeout_hours: 24
  node_port: 31200
  workspace_token: "<token>"
status:
  phase: Running                 # Pending|Creating|Running|Stopping|Stopped|Failed|Deleting
  pod_name: uba-ws-1a2b3c4d-pod
  service_name: uba-ws-1a2b3c4d-svc
  pvc_name: uba-ws-1a2b3c4d-data
  access_url: http://localhost:31200
  node_port: 31200`}
      />

      <H2 id="operator">The Kopf operator handler</H2>
      <P>
        A <A href="https://kopf.readthedocs.io">Kopf</A>-based operator reconciles <InlineCode>UBAWorkspace</InlineCode>{" "}
        resources. On create it provisions three Kubernetes objects, all adopted by the custom resource so they are
        garbage-collected together when the workspace is deleted.
      </P>
      <OL>
        <LI>
          A <strong>PersistentVolumeClaim</strong> (<InlineCode>&lt;name&gt;-data</InlineCode>,{" "}
          <InlineCode>ReadWriteOnce</InlineCode>, default 5Gi via <InlineCode>WORKSPACE_DEFAULT_PVC_SIZE</InlineCode>)
          mounted at <InlineCode>/workspace</InlineCode>.
        </LI>
        <LI>
          A <strong>Pod</strong> (<InlineCode>&lt;name&gt;-pod</InlineCode>) running the workspace image on container
          port <InlineCode>8888</InlineCode>, with the tier&apos;s requests/limits, an <InlineCode>Always</InlineCode>{" "}
          restart policy, and JupyterLab env vars including <InlineCode>OPENUBA_API_URL</InlineCode>,{" "}
          <InlineCode>OPENUBA_WORKSPACE_ID</InlineCode>, and <InlineCode>OPENUBA_TOKEN</InlineCode>.
        </LI>
        <LI>
          A <strong>NodePort Service</strong> (<InlineCode>&lt;name&gt;-svc</InlineCode>) selecting the pod, publishing
          the requested node port.
        </LI>
      </OL>
      <P>
        The handler is defensive about conflicts: a 409 on the pod or service is treated as already-exists, and a{" "}
        <InlineCode>422 &quot;already allocated&quot;</InlineCode> on the NodePort triggers cleanup of the stale service
        holding that port before retrying. Once everything is up, it patches the status to{" "}
        <InlineCode>Running</InlineCode> with the resolved access URL. A timer runs a health check every 60 seconds and
        flips the status to <InlineCode>Failed</InlineCode> if the pod is missing or not <InlineCode>Running</InlineCode>.
      </P>
      <Callout type="warning" title="NodePort must match the reserved port">
        The service asks for the exact <InlineCode>node_port</InlineCode> the <InlineCode>WorkspaceService</InlineCode>{" "}
        reserved. Keeping the DB reservation and the CRD spec in sync is what lets a restarted workspace come back on
        the same URL.
      </Callout>

      <H2 id="image">The workspace image &amp; preinstalled SDK</H2>
      <P>
        The workspace image is built on <InlineCode>jupyter/scipy-notebook:python-3.11</InlineCode> and installs the
        OpenUBA SDK from source, a visualization stack (matplotlib, seaborn, plotly, bokeh, altair, plotnine, datashader,
        networkx, geopandas), ML frameworks, and data connectors. Crucially, scikit-learn is pinned to{" "}
        <InlineCode>1.5.2</InlineCode> to match the sklearn runtime image so pickles trained in a notebook load
        cleanly in the <A href="/docs/execution-sandbox">sandbox</A>.
      </P>
      <UL>
        <LI><strong>ML:</strong> scikit-learn 1.5.2, PyTorch (CPU wheels).</LI>
        <LI><strong>Connectors:</strong> pyspark, elasticsearch, psycopg2-binary, requests, pandas, numpy.</LI>
        <LI><strong>UX:</strong> JupyterLab defaults to the dark theme; welcome and SDK tutorial notebooks are seeded into the working directory.</LI>
      </UL>
      <P>
        Because the SDK is preinstalled, you can install and run reference models straight from a cell:
      </P>
      <CodeBlock
        language="python"
        title="Inside a workspace notebook"
        code={`import openuba

# the SDK talks to the platform via OPENUBA_API_URL, using OPENUBA_TOKEN
openuba.install("model_sklearn")

result = openuba.run("model_sklearn", data="events.csv")
result["results"][:5]`}
      />
      <Callout type="warning" title="Embedding & auth defaults are for local dev">
        The image configures JupyterLab for token-less, XSRF-disabled, iframe-embeddable access so the OpenUBA frontend
        can embed it. That is intended for local development. In production, use per-workspace tokens (via{" "}
        <InlineCode>OPENUBA_TOKEN</InlineCode> / a Kubernetes Secret), restrict <InlineCode>allow_origin</InlineCode> to
        the frontend origin, and keep XSRF enabled.
      </Callout>

      <H2 id="next">Where to go next</H2>
      <OL>
        <LI>
          <A href="/docs/models">Models &amp; Lifecycle</A> — register and run the models you build in a workspace.
        </LI>
        <LI>
          <A href="/docs/execution-sandbox">Execution Sandbox</A> — how those models run headless, and why sklearn is
          pinned in both images.
        </LI>
        <LI>
          <A href="/docs/kubernetes">Kubernetes</A> — the cluster, namespace, and operator that back workspaces and jobs.
        </LI>
        <LI>
          <A href="/docs/data-pipelines">Data Pipelines</A> — the sources you explore inside a workspace.
        </LI>
      </OL>

      <DocFooter slug="workspaces" />
    </>
  );
}
