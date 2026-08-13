import type { Metadata } from "next";
import { DocHeader, H2, H3, P, UL, OL, LI, InlineCode, A, Callout, Table } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "GraphQL API — OpenUBA",
  description:
    "OpenUBA exposes a GraphQL API auto-generated from the Postgres schema by PostGraphile — no hand-written resolvers. How it is deployed, the endpoint, auto-CRUD, and how the rule canvas uses it.",
};

export default function GraphQLPage() {
  return (
    <>
      <DocHeader
        eyebrow="Platform"
        title="GraphQL API"
        intro="OpenUBA does not ship a hand-written GraphQL layer. It points PostGraphile at the Postgres schema and lets it generate the entire API — queries, mutations, and subscriptions — directly from your tables, columns, and foreign keys."
      />

      <H2 id="overview">Zero-resolver GraphQL</H2>
      <P>
        The OpenUBA API surface has two halves. The primary REST API (
        <InlineCode>/api/v1/*</InlineCode>, served by FastAPI) handles
        authenticated business logic — model execution, orchestration, auth, and
        the internal reporting endpoints. Alongside it,{" "}
        <A href="https://www.graphile.org/postgraphile/">PostGraphile</A>{" "}
        reflects the Postgres <InlineCode>public</InlineCode> schema and serves a
        complete GraphQL API with <strong>no resolvers written by hand</strong>.
        Every table becomes a queryable collection; every table with a primary
        key gets <InlineCode>create</InlineCode>, <InlineCode>update</InlineCode>,
        and <InlineCode>delete</InlineCode> mutations for free.
      </P>
      <P>
        This is why the frontend&apos;s data-heavy views — most notably the{" "}
        <A href="/docs/rule-canvas">Rule Canvas</A> — talk GraphQL: the schema is
        always in sync with the database because it <em>is</em> the database.
      </P>

      <Callout type="note" title="Two APIs, one database">
        REST (<InlineCode>/api/v1</InlineCode>) is where imperative actions live.
        GraphQL (<InlineCode>/graphql</InlineCode>) is a reflective read/write
        layer over the same Postgres tables. They are complementary, not
        competing.
      </Callout>

      <H2 id="deploy">How it is deployed</H2>
      <P>
        In Kubernetes, PostGraphile runs as its own deployment from the official{" "}
        <InlineCode>graphile/postgraphile</InlineCode> image, listening on port{" "}
        <InlineCode>5000</InlineCode> and reading{" "}
        <InlineCode>DATABASE_URL</InlineCode> from the backend secret.
      </P>
      <CodeBlock
        language="yaml"
        title="k8s/postgraphile-deployment.yaml (args)"
        code={`# graphile/postgraphile:latest, containerPort 5000, Service "postgraphile"
args:
  - "npx"
  - "postgraphile"
  - "-c"
  - "$(DATABASE_URL)"      # from secret backend-secret / database-url
  - "-s"
  - "public"               # reflect the public schema
  - "--host"
  - "0.0.0.0"
  - "--port"
  - "5000"
  - "--cors"
  - "--enhance-graphiql"
  - "--watch"              # live-reload the schema when tables change
  - "--subscriptions"
# probes: GET /graphiql on :5000`}
      />
      <P>
        The frontend does not call this service directly. A Next.js rewrite maps
        the browser-facing path <InlineCode>/graphql</InlineCode> to the
        in-cluster <InlineCode>http://postgraphile:5000/graphql</InlineCode>, so
        the app only ever needs a relative endpoint.
      </P>
      <Table
        head={["Concern", "Value"]}
        rows={[
          [<InlineCode key="1">/graphql</InlineCode>, "GraphQL HTTP endpoint (queries + mutations)"],
          [<InlineCode key="2">/graphiql</InlineCode>, "GraphiQL explorer UI (--enhance-graphiql)"],
          ["Schema", <span key="s">Reflects the Postgres <InlineCode>public</InlineCode> schema</span>],
          ["Live reload", <span key="w"><InlineCode>--watch</InlineCode> — schema changes appear without a restart</span>],
          ["Subscriptions", <span key="sub"><InlineCode>--subscriptions</InlineCode> over WebSocket</span>],
        ]}
      />

      <H3 id="dev">Running it in development</H3>
      <P>
        Outside Kubernetes there is no separate pod, so OpenUBA launches
        PostGraphile itself. The helper in{" "}
        <InlineCode>core/graphql/postgraphile.py</InlineCode> shells out to the
        same <InlineCode>npx postgraphile</InlineCode> binary as a subprocess,
        with the same schema and flags plus simple subscriptions:
      </P>
      <CodeBlock
        language="python"
        title="core/graphql/postgraphile.py (subprocess command)"
        code={`cmd = [
    "npx", "postgraphile",
    "-c", self.database_url,
    "-s", self.schema,              # "public"
    "--host", self.host,            # 0.0.0.0 (POSTGRAPHILE_HOST)
    "--port", str(self.port),       # 5000    (POSTGRAPHILE_PORT)
    "--cors",
    "--enhance-graphiql",
    "--watch",
    "--subscriptions",
    "--simple-subscriptions",
]`}
      />
      <P>
        The FastAPI app starts this subprocess only when it is not running in
        Kubernetes and GraphQL is enabled (
        <InlineCode>EXECUTION_MODE != &quot;kubernetes&quot;</InlineCode> and{" "}
        <InlineCode>ENABLE_GRAPHQL == &quot;true&quot;</InlineCode>). In a cluster,
        the standalone deployment above takes over instead.
      </P>

      <H2 id="crud">Tables become CRUD, automatically</H2>
      <P>
        Because the API is reflected, naming follows a predictable convention.
        Take the <InlineCode>rules</InlineCode> table, which the Rule Canvas reads
        and writes:
      </P>
      <CodeBlock
        language="python"
        title="core/db/models.py — the Rule model (abridged)"
        code={`class Rule(Base):
    __tablename__ = "rules"

    id                = Column(UUID(as_uuid=True), primary_key=True)
    name              = Column(String(255), nullable=False)
    description       = Column(Text)
    rule_type         = Column(String(50), nullable=False)
    condition         = Column(Text, nullable=False)
    features          = Column(Text)
    score             = Column(Integer, default=0)
    enabled           = Column(Boolean, default=True)
    severity          = Column(String(20), default="medium")
    flow_graph        = Column(JSONB)          # <- the canvas graph lives here
    last_triggered_at = Column(TIMESTAMP(timezone=True))
    created_at        = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at        = Column(TIMESTAMP(timezone=True), server_default=func.now())`}
      />
      <P>
        PostGraphile turns that single table into a full set of operations.
        Column names are camel-cased in GraphQL (
        <InlineCode>flow_graph</InlineCode> becomes{" "}
        <InlineCode>flowGraph</InlineCode>):
      </P>
      <Table
        head={["Postgres", "GraphQL operation"]}
        rows={[
          [<InlineCode key="1">SELECT * FROM rules</InlineCode>, <InlineCode key="2">allRules</InlineCode>],
          [<InlineCode key="3">INSERT INTO rules</InlineCode>, <InlineCode key="4">createRule(input: CreateRuleInput!)</InlineCode>],
          [<InlineCode key="5">UPDATE rules WHERE id=…</InlineCode>, <InlineCode key="6">updateRuleById(input: {"{ id, rulePatch }"})</InlineCode>],
          [<InlineCode key="7">DELETE FROM rules WHERE id=…</InlineCode>, <InlineCode key="8">deleteRuleById(input: {"{ id }"})</InlineCode>],
        ]}
      />

      <H2 id="query">Example query</H2>
      <P>
        Reading rules is a single <InlineCode>allRules</InlineCode> selection.
        Connections expose <InlineCode>nodes</InlineCode> and{" "}
        <InlineCode>totalCount</InlineCode>, and accept pagination arguments like{" "}
        <InlineCode>first</InlineCode>:
      </P>
      <CodeBlock
        language="graphql"
        title="Query — list rules"
        code={`query GetRules {
  allRules(first: 200) {
    totalCount
    nodes {
      id
      name
      description
      ruleType
      condition
      score
      enabled
      severity
      flowGraph
      lastTriggeredAt
      createdAt
      updatedAt
    }
  }
}`}
      />

      <H2 id="mutation">Example mutations</H2>
      <P>
        Creating a rule writes the serialized canvas graph straight into the{" "}
        <InlineCode>flow_graph</InlineCode> JSONB column via{" "}
        <InlineCode>createRule</InlineCode>:
      </P>
      <CodeBlock
        language="graphql"
        title="Mutation — create a rule (writes flowGraph)"
        code={`mutation CreateRule($input: CreateRuleInput!) {
  createRule(input: $input) {
    rule {
      id
      name
      ruleType
      severity
      flowGraph
      enabled
      createdAt
    }
  }
}

# variables
{
  "input": {
    "rule": {
      "name": "Impossible travel",
      "severity": "high",
      "ruleType": "flow",
      "condition": "...",
      "flowGraph": "{\\"nodes\\":[...],\\"edges\\":[...]}",
      "score": 0,
      "enabled": true
    }
  }
}`}
      />
      <P>
        Editing an existing rule uses the auto-generated{" "}
        <InlineCode>updateRuleById</InlineCode> mutation with a{" "}
        <InlineCode>RulePatch</InlineCode> — only the fields you supply are
        changed:
      </P>
      <CodeBlock
        language="graphql"
        title="Mutation — update a rule by id"
        code={`mutation UpdateRule($id: UUID!, $patch: RulePatch!) {
  updateRuleById(input: { id: $id, rulePatch: $patch }) {
    rule {
      id
      name
      severity
      flowGraph
      updatedAt
    }
  }
}`}
      />

      <H2 id="canvas">How the Rule Canvas uses it</H2>
      <P>
        The canvas is a React Flow graph. Its shell component queries{" "}
        <InlineCode>allRules</InlineCode> (polling every ten seconds) and holds
        Apollo mutation hooks for create and update. When an analyst saves a rule,
        the visual graph — nodes, edges, and viewport — is serialized to JSON and
        sent as <InlineCode>flowGraph</InlineCode>:
      </P>
      <OL>
        <LI>
          The canvas serializes its React Flow state to a JSON string.
        </LI>
        <LI>
          If editing, it calls <InlineCode>updateRuleById</InlineCode> with the
          rule id and a patch; if new, it calls <InlineCode>createRule</InlineCode>{" "}
          with a full rule input (<InlineCode>ruleType: &quot;flow&quot;</InlineCode>).
        </LI>
        <LI>
          On reload, the stored <InlineCode>flowGraph</InlineCode> JSONB is parsed
          back into nodes and edges and rehydrated onto the canvas.
        </LI>
      </OL>
      <CodeBlock
        language="typescript"
        title="interface — the save handler (abridged)"
        code={`const serializedGraph =
  typeof flowGraph === "string" ? flowGraph : JSON.stringify(flowGraph)

if (editId) {
  await updateRule({
    variables: { id: editId, patch: { name, severity, flowGraph: serializedGraph, condition, ruleType: "flow" } },
  })
} else {
  await createRule({
    variables: { input: { rule: { name, severity, flowGraph: serializedGraph, condition, ruleType: "flow", score: 0, enabled: true } } },
  })
}`}
      />
      <P>
        Node types on the canvas include model outputs, anomaly and case
        conditions, comparison and boolean gates (
        <InlineCode>and</InlineCode>/<InlineCode>or</InlineCode>/
        <InlineCode>not</InlineCode>), and alert outputs — all encoded inside the
        single <InlineCode>flowGraph</InlineCode> document.
      </P>

      <H2 id="client">Frontend GraphQL client</H2>
      <P>
        The interface uses Apollo Client. Queries and mutations go over HTTP to{" "}
        <InlineCode>NEXT_PUBLIC_GRAPHQL_URL</InlineCode> (default{" "}
        <InlineCode>/graphql</InlineCode>); subscriptions use a WebSocket link
        derived from the origin (or{" "}
        <InlineCode>NEXT_PUBLIC_GRAPHQL_WS_URL</InlineCode>). A split link routes
        each operation to the right transport.
      </P>
      <CodeBlock
        language="typescript"
        title="interface/src/lib/apollo-client.ts (abridged)"
        code={`const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "/graphql",
});

// subscriptions ride a WebSocket derived from the page origin,
// or NEXT_PUBLIC_GRAPHQL_WS_URL when set.`}
      />
      <Callout type="tip" title="Explore the schema live">
        With the platform running, open <InlineCode>/graphiql</InlineCode> against
        the PostGraphile service to browse every auto-generated type, argument,
        and mutation for your exact database schema.
      </Callout>

      <H2 id="next">Related</H2>
      <UL>
        <LI>
          <A href="/docs/rule-canvas">Rule Canvas</A> — the visual editor that
          reads and writes <InlineCode>flowGraph</InlineCode> through these
          mutations.
        </LI>
        <LI>
          <A href="/docs/architecture">Architecture</A> — where PostGraphile
          sits relative to FastAPI and Postgres.
        </LI>
        <LI>
          <A href="/docs/authentication">Authentication &amp; RBAC</A> — how the
          REST side guards imperative actions.
        </LI>
      </UL>

      <DocFooter slug="graphql" />
    </>
  );
}
