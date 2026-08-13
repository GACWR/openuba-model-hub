import type { Metadata } from "next";
import {
  DocHeader,
  H2,
  H3,
  P,
  UL,
  OL,
  LI,
  InlineCode,
  A,
  Callout,
  Table,
} from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Installation — OpenUBA Docs",
  description:
    "Install and run the full OpenUBA platform: prerequisites, the one-command Kind setup, Kubernetes and local development modes, Docker Compose, and Ubuntu Server.",
};

export default function Installation() {
  return (
    <>
      <DocHeader
        eyebrow="Getting Started"
        title="Installation"
        intro="Stand up the full OpenUBA platform — backend, frontend, PostgreSQL, GraphQL, the operator, and the model execution sandbox — on your machine or a server."
      />

      <P>
        OpenUBA is Kubernetes-native. In development it runs entirely inside a{" "}
        <A href="https://kind.sigs.k8s.io/">Kind</A> (Kubernetes-in-Docker)
        cluster on your machine, so what you run locally mirrors a production
        deployment. There are four supported paths, from fully automated to fully
        manual:
      </P>
      <UL>
        <LI>
          <A href="#full-reset">One-command Kind setup</A> — the recommended way
          to get everything at once.
        </LI>
        <LI>
          <A href="#kubernetes">Step-by-step Kubernetes</A> — the same, broken
          into individual stages.
        </LI>
        <LI>
          <A href="#local">Local development</A> — Postgres in Docker, backend and
          frontend on the host with hot-reload.
        </LI>
        <LI>
          <A href="#docker-compose">Docker Compose</A> — no Kubernetes at all.
        </LI>
      </UL>

      <Callout type="tip" title="Just want to use models?">
        If you only want to install and run models — not operate the platform —
        you don&apos;t need any of this. Install the SDK with{" "}
        <InlineCode>pip install openuba</InlineCode> and head to the{" "}
        <A href="/docs/quickstart">Quickstart</A>.
      </Callout>

      <H2 id="prerequisites">Prerequisites</H2>
      <Table
        head={["Tool", "Version", "Purpose"]}
        rows={[
          [<InlineCode key="1">Docker</InlineCode>, "20.10+", "Container builds and the Kind cluster"],
          [<InlineCode key="2">Kind</InlineCode>, "0.20+", "Local Kubernetes cluster"],
          [<InlineCode key="3">kubectl</InlineCode>, "1.27+", "Kubernetes CLI"],
          [<InlineCode key="4">Node.js</InlineCode>, "18+", "Frontend build"],
          [<InlineCode key="5">Python</InlineCode>, "3.9+", "Backend and tests"],
          [<InlineCode key="6">Make</InlineCode>, "any", "The single entry point for every workflow"],
        ]}
      />
      <P>
        Recommended host resources: <strong>4+ CPU cores</strong>,{" "}
        <strong>8&nbsp;GB RAM</strong> (16&nbsp;GB if you enable Spark and
        Elasticsearch), and <strong>40&nbsp;GB free disk</strong> — the ML runtime
        images are large.
      </P>

      <H2 id="clone">Clone the repository</H2>
      <CodeBlock
        language="bash"
        code={`git clone https://github.com/GACWR/OpenUBA.git
cd OpenUBA`}
      />

      <H2 id="full-reset">Option A — One-command Kind setup (recommended)</H2>
      <P>
        A single target tears down any existing cluster and builds everything from
        scratch — it creates the Kind cluster, builds all container images,
        deploys every Kubernetes manifest, initializes and seeds the database, and
        starts port-forwarding:
      </P>
      <CodeBlock language="bash" code={`make reset-dev`}/>
      <P>
        The first run takes <strong>10–20 minutes</strong> while images build. On
        macOS it opens the port-forwards in a new Terminal window; on Linux it runs
        them in the background (logged to <InlineCode>port-forward.log</InlineCode>).
        When it finishes, sign in at <A href="http://localhost:3000">localhost:3000</A>{" "}
        with <InlineCode>openuba</InlineCode> / <InlineCode>password</InlineCode>.
      </P>
      <Callout type="warning" title="Change the default credentials">
        <InlineCode>openuba / password</InlineCode> is seeded by the backend on
        first startup. Change it immediately under{" "}
        <strong>Settings → Users</strong>.
      </Callout>

      <H3 id="what-reset-does">What <InlineCode>make reset-dev</InlineCode> does</H3>
      <OL>
        <LI>Deletes any existing Kind cluster and prunes old images.</LI>
        <LI>
          Creates a fresh Kind cluster from <InlineCode>configs/local.yaml</InlineCode>.
        </LI>
        <LI>
          Builds all images — backend, frontend, operator, and the five model
          runner images (base, sklearn, pytorch, tensorflow, networkx).
        </LI>
        <LI>Loads the images into the cluster and applies every manifest.</LI>
        <LI>Initializes the database, seeds defaults, and ingests sample data.</LI>
        <LI>Starts port-forwards for all services.</LI>
      </OL>

      <H2 id="kubernetes">Option B — Step-by-step Kubernetes</H2>
      <P>
        Prefer to run the stages yourself (useful for debugging a single step):
      </P>
      <CodeBlock
        language="bash"
        code={`make create-local-cluster   # create the Kind cluster
make k8s-deploy             # build images, load them, apply manifests
make k8s-forward            # port-forward all services to localhost`}
      />
      <P>
        <InlineCode>make k8s-deploy</InlineCode> is itself a composite of{" "}
        <InlineCode>build-containers</InlineCode>,{" "}
        <InlineCode>load-images</InlineCode>, and{" "}
        <InlineCode>deploy-k8s</InlineCode>. See{" "}
        <A href="/docs/kubernetes">Kubernetes-Native</A> for what gets deployed —
        the CRDs, the operator, and the full manifest set.
      </P>

      <H2 id="local">Option C — Local development (host backend + frontend)</H2>
      <P>
        Run only Postgres in a container and the app on your host with hot-reload —
        the fastest inner loop for backend or frontend work:
      </P>
      <CodeBlock
        language="bash"
        code={`make dev-postgres            # start Postgres in Docker
make setup-backend           # create the venv and install requirements
make dev-install-frontend    # install frontend dependencies

# then, in separate terminals:
make dev-backend             # FastAPI with reload on :8000
make dev-frontend            # Next.js dev server on :3000`}
      />
      <Callout type="note" title="GraphQL in local mode">
        In local/dev mode the backend bootstraps PostGraphile itself (set{" "}
        <InlineCode>ENABLE_GRAPHQL=false</InlineCode> to skip it). In Kubernetes it
        runs as its own deployment. See <A href="/docs/graphql">GraphQL API</A>.
      </Callout>

      <H2 id="docker-compose">Option D — Docker Compose</H2>
      <P>
        For a Kubernetes-free stack, Compose brings up Postgres, the backend, and
        the frontend. Spark, Elasticsearch, Kibana, and a workspace are behind
        opt-in profiles:
      </P>
      <CodeBlock
        language="bash"
        code={`# core stack (postgres + backend + frontend)
docker-compose up

# add the analytics engines
docker-compose --profile spark --profile elastic up`}
      />

      <H2 id="ports">Service ports</H2>
      <Table
        head={["Service", "Port", "URL"]}
        rows={[
          ["Frontend", <InlineCode key="1">3000</InlineCode>, <A key="a" href="http://localhost:3000">localhost:3000</A>],
          ["Backend (REST + OpenAPI)", <InlineCode key="2">8000</InlineCode>, <A key="b" href="http://localhost:8000/docs">localhost:8000/docs</A>],
          ["PostGraphile (GraphQL)", <InlineCode key="3">5000 / 5001</InlineCode>, "…/graphql"],
          ["PostgreSQL", <InlineCode key="4">5432</InlineCode>, "—"],
          ["Spark master UI", <InlineCode key="5">8080</InlineCode>, "localhost:8080"],
          ["Elasticsearch", <InlineCode key="6">9200</InlineCode>, "localhost:9200"],
        ]}
      />

      <H2 id="verify">Verify the install</H2>
      <CodeBlock
        language="bash"
        code={`kubectl get pods -n openuba          # every pod should be Running
curl -I http://localhost:3000        # frontend → HTTP 200
curl -I http://localhost:8000/docs   # backend  → HTTP 200`}
      />
      <P>
        You should see pods for the backend, frontend, postgres, postgraphile, the
        operator, and (optionally) elasticsearch and spark.
      </P>

      <H2 id="ubuntu">Running on a Linux server</H2>
      <P>
        For a headless <strong>Ubuntu Server</strong> there is a dedicated,
        one-command installer that handles Docker, kubectl, Kind, Node, the cluster
        build, reboot-safe systemd port-forwards, and an optional nginx proxy:
      </P>
      <CodeBlock
        language="bash"
        code={`git clone https://github.com/GACWR/OpenUBA.git /opt/openuba
cd /opt/openuba
sudo bash scripts/install-ubuntu.sh`}
      />
      <P>
        Because the frontend is built with its API URL baked in, remote access uses
        an SSH tunnel. The full walkthrough — remote access, the ports Kind binds,
        and every known issue — is in the repo&apos;s{" "}
        <A href="https://github.com/GACWR/OpenUBA/blob/master/docs/INSTALL_UBUNTU.md">
          Ubuntu Server guide
        </A>
        .
      </P>

      <H2 id="reset-cleanup">Reset &amp; cleanup</H2>
      <CodeBlock
        language="bash"
        code={`make reset-dev            # rebuild everything from a clean slate
make k8s-delete           # remove all deployed resources
make delete-local-cluster # tear the Kind cluster down entirely`}
      />

      <H2 id="next">Next steps</H2>
      <UL>
        <LI>
          <A href="/docs/architecture">Architecture</A> — how the pieces fit
          together.
        </LI>
        <LI>
          <A href="/docs/kubernetes">Kubernetes-Native</A> — CRDs, the operator,
          and manifests.
        </LI>
        <LI>
          <A href="/docs/troubleshooting">Troubleshooting</A> — fixes for common
          install issues.
        </LI>
      </UL>

      <DocFooter slug="installation" />
    </>
  );
}
