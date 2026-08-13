import type { Metadata } from "next";
import { DocHeader, H2, H3, P, UL, OL, LI, InlineCode, A, Callout, Table, NextCard } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Architecture — OpenUBA",
  description:
    "The full OpenUBA platform architecture: Next.js frontend, FastAPI backend, PostGraphile GraphQL, the Kopf operator, the data layer, and the ephemeral Kubernetes execution plane.",
};

export default function Architecture() {
  return (
    <>
      <DocHeader
        eyebrow="Platform"
        title="Architecture"
        intro="OpenUBA is a Kubernetes-native User & Entity Behavior Analytics platform. Every component is containerized, and the design deliberately stays lightweight — there are no always-on per-model services, no heavy pipeline orchestrators, just the minimum infrastructure needed to run security analytics at scale."
      />

      <H2 id="overview">The shape of the system</H2>
      <P>
        OpenUBA is organized into a handful of long-lived services and a fleet
        of short-lived jobs. The long-lived pieces are the frontend, the backend
        API, the GraphQL layer, the operator, and the databases. Everything that
        actually <em>runs a model</em> — training and inference — is an ephemeral
        Kubernetes Job that spins up, executes, writes its results, and exits.
      </P>
      <P>
        Concretely, the platform is made of five layers: a{" "}
        <strong>Next.js 14 frontend</strong>, a <strong>FastAPI backend</strong>{" "}
        exposing a REST API across 24 routers, a <strong>PostGraphile</strong>{" "}
        GraphQL server generated from the PostgreSQL schema, a{" "}
        <strong>Kopf operator</strong> that reconciles custom resources into
        Kubernetes Jobs, and a <strong>data layer</strong> built on PostgreSQL
        (the system of record), Elasticsearch, and Apache Spark.
      </P>

      <Callout type="note" title="Version">
        This documentation tracks OpenUBA <InlineCode>v0.0.2</InlineCode>. The
        FastAPI application reports itself as{" "}
        <InlineCode>OpenUBA v0.0.2 API</InlineCode>, and the platform is Apache
        2.0 licensed.
      </Callout>

      <H2 id="diagram">The layers at a glance</H2>
      <P>
        The diagram below traces a request from the browser all the way down to
        an ephemeral runner container and back. Solid arrows are request/response
        paths; the operator watches custom resources and materializes Jobs out of
        band.
      </P>
      <CodeBlock
        language="text"
        title="OpenUBA platform topology"
        code={`┌───────────────────────────────────────────────────────────────────────┐
│  BROWSER                                                                │
│  Next.js 14 frontend  (TypeScript · TailwindCSS · shadcn/ui · Apollo)   │
└───────────────┬───────────────────────────────────┬────────────────────┘
      REST /api │                          GraphQL   │ /graphql (+ ws subs)
                ▼                                     ▼
┌───────────────────────────────┐       ┌────────────────────────────────┐
│  FastAPI backend  :8000        │       │  PostGraphile  :5000           │
│  24 routers under /api/v1      │       │  GraphQL auto-generated from    │
│  JWT auth · SSE streams        │       │  the PostgreSQL schema          │
│  CORS · lifespan startup       │       │  live queries + subscriptions   │
└───────┬───────────────┬────────┘       └───────────────┬────────────────┘
        │               │                                │
        │ ModelOrchestrator                              │
        │ (EXECUTION_MODE=kubernetes)                    │
        ▼               ▼                                ▼
┌────────────────┐  ┌─────────────────────────────────────────────────────┐
│ Data layer     │  │  PostgreSQL 15   (system of record · 31 ORM models)  │
│ Elasticsearch  │  └─────────────────────────────────────────────────────┘
│ Apache Spark   │              ▲ create UBATraining / UBAInference CR
└────────────────┘              │
                                ▼
                 ┌──────────────────────────────────┐
                 │  Kopf operator  (group openuba.io)│
                 │  watches CRs → builds K8s Jobs     │
                 └───────────────┬──────────────────┘
                                 ▼   ephemeral (backoffLimit 0, ttl 300s)
              ┌───────────────────────────────────────────────┐
              │  Kubernetes Job → openuba-model-runner:<tag>   │
              │  sklearn · pytorch · tensorflow · networkx     │
              │  reads/writes shared PersistentVolumes         │
              └───────────────────────────────────────────────┘`}
      />

      <H2 id="frontend">Frontend — Next.js 14</H2>
      <P>
        The user interface lives in the <InlineCode>interface/</InlineCode>{" "}
        directory and is a Next.js 14 application (React 18, TailwindCSS,
        shadcn/ui). It talks to the rest of the platform through two proxied
        paths configured as Next.js rewrites: everything under{" "}
        <InlineCode>/api/*</InlineCode> is forwarded to the FastAPI backend, and{" "}
        <InlineCode>/graphql</InlineCode> is forwarded to PostGraphile.
      </P>
      <CodeBlock
        language="javascript"
        title="interface/next.config.js (rewrites)"
        code={`async rewrites() {
  return [
    { source: "/api/:path*",  destination: \`\${BACKEND_URL || "http://localhost:8000"}/api/:path*\` },
    { source: "/graphql",      destination: \`\${POSTGRAPHILE_URL || "http://postgraphile:5000"}/graphql\` },
  ];
}`}
      />
      <P>
        REST requests carry a JWT bearer token and hit FastAPI directly. Read
        models — dashboards, entity views, live counters — are served over
        GraphQL, with real-time updates delivered through{" "}
        <InlineCode>graphql-ws</InlineCode> subscriptions against PostGraphile.
        That split keeps write-heavy, permission-checked operations on the
        typed REST surface while letting the read side ride on
        auto-generated GraphQL.
      </P>

      <H2 id="backend">Backend — FastAPI</H2>
      <P>
        The backend is a single FastAPI application constructed in{" "}
        <InlineCode>core/fastapi_app.py</InlineCode>. It listens on port{" "}
        <InlineCode>8000</InlineCode>, applies CORS from the{" "}
        <InlineCode>CORS_ORIGINS</InlineCode> environment variable, and mounts 24
        routers — the great majority under a shared <InlineCode>/api/v1</InlineCode>{" "}
        prefix.
      </P>
      <CodeBlock
        language="python"
        title="core/fastapi_app.py (app construction)"
        code={`app = FastAPI(
    title="OpenUBA API",
    description="OpenUBA v0.0.2 API - User and Entity Behavior Analytics",
    version="0.0.2",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,      # from CORS_ORIGINS env
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 24 routers — most under /api/v1
app.include_router(auth.router,   prefix="/api/v1", tags=["auth"])
app.include_router(models.router, prefix="/api/v1", tags=["models"])
# ... anomalies, cases, rules, feedback, display, chat, notifications,
#     settings, schedules, source_groups ...
app.include_router(data.router)     # self-prefixed /api/v1/data
app.include_router(system.router)   # self-prefixed /api/v1/system
# ... workspaces, jobs, visualizations, dashboards, features, experiments,
#     hyperparameters, pipelines, datasets, sdk ...`}
      />
      <P>
        On startup the <InlineCode>lifespan</InlineCode> handler initializes the
        database with a retry loop (10 attempts, 5 seconds apart), seeds default
        users and role permissions, discovers locally installed models, launches
        the model scheduler (APScheduler), and — in local/dev mode — starts the
        PostGraphile subprocess. A <InlineCode>GET /health</InlineCode> endpoint
        runs <InlineCode>SELECT 1</InlineCode> against PostgreSQL and returns 503
        when the database is unreachable.
      </P>

      <H3 id="routers">The 24 routers</H3>
      <P>
        Each router owns a slice of the domain. Together they cover the full
        lifecycle: authentication, model management and execution, detection
        artifacts (anomalies, cases, rules, alerts), the ML platform surface
        (features, experiments, hyperparameters, pipelines, datasets), and the
        SDK backend.
      </P>
      <Table
        head={["Router", "Responsibility"]}
        rows={[
          [<InlineCode key="a">auth</InlineCode>, "Login, user management, roles and permissions (JWT)"],
          [<InlineCode key="m">models</InlineCode>, "Model CRUD, install, train, execute — the largest router"],
          [<InlineCode key="an">anomalies</InlineCode>, "Anomaly CRUD and acknowledgement"],
          [<InlineCode key="c">cases</InlineCode>, "Case management, linking anomalies to cases"],
          [<InlineCode key="r">rules</InlineCode>, "Rule CRUD and flow-graph serialization"],
          [<InlineCode key="f">feedback</InlineCode>, "Analyst feedback on anomalies"],
          [<InlineCode key="d">display</InlineCode>, "Dashboard and entity display data"],
          [<InlineCode key="ch">chat</InlineCode>, "LLM investigation assistant — streams over SSE"],
          [<InlineCode key="n">notifications</InlineCode>, "User notification management"],
          [<InlineCode key="s">settings</InlineCode>, "Integration settings: LLM providers, ES, Spark"],
          [<InlineCode key="sc">schedules</InlineCode>, "Model execution schedule management"],
          [<InlineCode key="sg">source_groups</InlineCode>, "Reusable multi-source data definitions"],
          [<InlineCode key="da">data</InlineCode>, "Data ingestion and metrics (self-prefixed)"],
          [<InlineCode key="sy">system</InlineCode>, "System health and status (self-prefixed)"],
          [<InlineCode key="w">workspaces</InlineCode>, "JupyterLab workspace management"],
          [<InlineCode key="j">jobs</InlineCode>, "Training and inference job management"],
          [<InlineCode key="v">visualizations</InlineCode>, "Visualization storage and rendering"],
          [<InlineCode key="db">dashboards</InlineCode>, "Dashboard management"],
          [<InlineCode key="fe">features</InlineCode>, "Feature groups and features"],
          [<InlineCode key="e">experiments</InlineCode>, "Experiment tracking"],
          [<InlineCode key="h">hyperparameters</InlineCode>, "Hyperparameter sets"],
          [<InlineCode key="p">pipelines</InlineCode>, "Multi-step pipeline management"],
          [<InlineCode key="ds">datasets</InlineCode>, "Dataset management"],
          [<InlineCode key="sd">sdk</InlineCode>, "Python SDK backend: model registration, job submission, SSE"],
        ]}
      />

      <H2 id="graphql">GraphQL — PostGraphile</H2>
      <P>
        Rather than hand-writing a GraphQL schema, OpenUBA runs{" "}
        <A href="https://www.graphile.org/postgraphile/">PostGraphile</A>, which
        introspects the PostgreSQL database and generates a GraphQL API from it.
        In a cluster this runs as its own deployment (<InlineCode>graphile/postgraphile</InlineCode>){" "}
        on port <InlineCode>5000</InlineCode>; in local development the backend
        launches it as a subprocess during startup. Because the schema is derived
        from the tables, the read side of the UI stays in lock-step with the data
        model, and live queries flow to the browser as GraphQL subscriptions.
      </P>
      <Callout type="tip" title="Two APIs, on purpose">
        REST (FastAPI) is the write path — typed, permission-checked, and where
        model execution is triggered. GraphQL (PostGraphile) is the read path —
        flexible queries and subscriptions over the same PostgreSQL system of
        record. See the <A href="/docs/graphql">GraphQL API</A> reference.
      </Callout>

      <H2 id="operator">The operator and the execution plane</H2>
      <P>
        The heart of the &quot;no always-on per-model services&quot; design is
        the operator. When the backend needs to train or run a model with{" "}
        <InlineCode>EXECUTION_MODE=kubernetes</InlineCode>, the{" "}
        <InlineCode>ModelOrchestrator</InlineCode> does not spin up a service —
        it writes a Custom Resource. A Kopf-based operator watches for those
        resources and reconciles each one into a Kubernetes Job running the
        appropriate framework image.
      </P>
      <OL>
        <LI>
          A request hits the backend (for example via the{" "}
          <InlineCode>models</InlineCode> or <InlineCode>sdk</InlineCode> router).
        </LI>
        <LI>
          <InlineCode>ModelOrchestrator._execute_kubernetes</InlineCode> writes
          the input to a shared PersistentVolume and creates a{" "}
          <InlineCode>UBATraining</InlineCode> or{" "}
          <InlineCode>UBAInference</InlineCode> custom resource in the{" "}
          <InlineCode>openuba.io/v1alpha1</InlineCode> API group.
        </LI>
        <LI>
          The operator&apos;s create handler fires, resolves the framework image
          from the model&apos;s <InlineCode>runtime</InlineCode>, and creates a
          Kubernetes Job with <InlineCode>backoffLimit: 0</InlineCode> and{" "}
          <InlineCode>ttlSecondsAfterFinished: 300</InlineCode>.
        </LI>
        <LI>
          The Job runs, writes results to a PersistentVolume, and exits. A
          job-event handler patches the CR status to{" "}
          <InlineCode>Succeeded</InlineCode> or <InlineCode>Failed</InlineCode>,
          which unblocks the orchestrator&apos;s poller.
        </LI>
      </OL>
      <P>
        The only long-lived pieces in this loop are the operator, the backend,
        and the database. Everything else is created on demand and garbage
        collected. The full CRD set, the operator&apos;s RBAC, and the Job
        manifest are covered in{" "}
        <A href="/docs/kubernetes">Kubernetes-Native</A>, and the runner
        container contract is in{" "}
        <A href="/docs/execution-sandbox">Execution Sandbox</A>.
      </P>

      <H2 id="data-layer">The data layer</H2>
      <P>
        Three stores back the platform, each with a distinct role:
      </P>
      <Table
        head={["Store", "Role", "Details"]}
        rows={[
          [
            <InlineCode key="pg">PostgreSQL 15</InlineCode>,
            "System of record",
            "31 SQLAlchemy ORM models (models, anomalies, entities, cases, rules, users, jobs, and more). Connection is pooled with pool_pre_ping.",
          ],
          [
            <InlineCode key="es">Elasticsearch 8.11</InlineCode>,
            "Event query / search",
            "Queried through ElasticsearchConnector for security events and indexed anomalies.",
          ],
          [
            <InlineCode key="sp">Apache Spark 3.5</InlineCode>,
            "Batch / distributed reads",
            "SparkConnector reads named tables in local or spark://spark-master:7077 cluster mode.",
          ],
        ]}
      />
      <P>
        PostgreSQL is the durable heart of the system — it holds the state that
        PostGraphile exposes and that the backend writes to. Elasticsearch and
        Apache Spark are the analytical data sources a model reads from at run
        time. The full picture of connectors, ingestion, and the source-group
        concept is in <A href="/docs/data-pipelines">Data Pipelines</A>.
      </P>

      <H2 id="lightweight">Why lightweight matters</H2>
      <P>
        The architecture is a direct response to a common failure mode in
        analytics platforms: dozens of always-on model services and a sprawling
        orchestrator that must be operated, scaled, and paid for around the
        clock. OpenUBA inverts that. Models are code and artifacts at rest;
        compute exists only for the duration of a run.
      </P>
      <Callout type="note" title="From the README">
        The system is designed to remain lightweight — no always-on per-model
        services, no heavy pipeline orchestrators, just the minimum
        infrastructure needed to run security analytics at scale. Every training
        and inference run is an ephemeral Job that spins up, executes, writes
        results, and exits.
      </Callout>
      <P>
        This has practical consequences. Scaling is a matter of Kubernetes
        scheduling more Jobs, not more services. A crashed run cleans itself up
        (<InlineCode>ttlSecondsAfterFinished</InlineCode>) and does not retry
        blindly (<InlineCode>backoffLimit: 0</InlineCode>). And the framework
        image for each run is chosen per model, so a scikit-learn model and a
        PyTorch model never share — or fight over — a runtime.
      </P>

      <H2 id="next">Where to go next</H2>
      <div className="grid gap-3 sm:grid-cols-2 mt-4">
        <NextCard
          href="/docs/kubernetes"
          title="Kubernetes-Native"
          description="CRDs, the Kopf operator, RBAC, and the full manifest set."
        />
        <NextCard
          href="/docs/data-pipelines"
          title="Data Pipelines"
          description="Elasticsearch + Spark connectors, ingestion, and source groups."
        />
        <NextCard
          href="/docs/authentication"
          title="Authentication & RBAC"
          description="JWT auth, the login flow, and role-based access control."
        />
        <NextCard
          href="/docs/execution-sandbox"
          title="Execution Sandbox"
          description="The ephemeral runner containers that execute models."
        />
      </div>

      <DocFooter slug="architecture" />
    </>
  );
}
