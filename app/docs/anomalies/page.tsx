import type { Metadata } from "next";
import { DocHeader, H2, H3, P, UL, OL, LI, InlineCode, A, Callout, Table, NextCard } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Anomalies & Entity Risk — OpenUBA Docs",
  description:
    "How OpenUBA models produce anomalies, the anomaly data shape, how they are persisted and aggregated into entity risk, and how to query them via REST and the Python SDK.",
};

export default function Page() {
  return (
    <>
      <DocHeader
        eyebrow="Detection & Investigation"
        title="Anomalies & Entity Risk"
        intro="Anomalies are the atomic unit of detection in OpenUBA. Every model run that performs inference emits anomalies — scored, entity-tagged records that flow into the rule engine, cases, dashboards, and entity risk. This page covers how anomalies are produced, their exact shape, how they are stored, and every way to read them back."
      />

      <H2 id="what-is-an-anomaly">What is an anomaly?</H2>
      <P>
        An anomaly is a single, scored observation that a model considered unusual
        for a given entity — a user, device, or IP. It is not itself an alert:
        anomalies are the raw signal that detection rules evaluate. A run over a
        few hundred thousand events can produce anomalies for a handful of
        entities or for tens of thousands, and OpenUBA is built to persist and
        evaluate them at that scale.
      </P>
      <P>
        Each anomaly always carries the entity it concerns, a numeric{" "}
        <InlineCode>risk_score</InlineCode>, an optional{" "}
        <InlineCode>anomaly_type</InlineCode> label, and a free-form{" "}
        <InlineCode>details</InlineCode> object where a model can attach the
        features, timestamps, and evidence that justified the score.
      </P>

      <H2 id="how-produced">How anomalies are produced</H2>
      <P>
        Anomalies originate from a model&apos;s inference output. When a model runs
        with <InlineCode>run_type = &quot;infer&quot;</InlineCode>, its{" "}
        <InlineCode>MODEL.py</InlineCode> returns a result dictionary containing an{" "}
        <InlineCode>anomalies</InlineCode> list. Each element is a plain dict with
        the fields below. The <InlineCode>ModelOrchestrator</InlineCode> then takes
        over persistence and downstream evaluation.
      </P>
      <CodeBlock
        language="python"
        title="MODEL.py — inference output"
        code={`# what a model returns from its infer() step
return {
    "anomalies": [
        {
            "entity_id": "alice@corp.example",
            "entity_type": "user",
            "risk_score": 87.5,
            "anomaly_type": "impossible_travel",
            "details": {
                "from_geo": "US-CA",
                "to_geo": "RU-MOW",
                "minutes_between_logins": 18,
                "baseline_countries": ["US"],
            },
        },
        # ... more anomalies
    ]
}`}
      />

      <H3 id="persistence">Persistence in the orchestrator</H3>
      <P>
        The orchestrator persists anomalies through the{" "}
        <InlineCode>AnomalyRepository</InlineCode>, which writes one row per anomaly
        to the <InlineCode>anomalies</InlineCode> table. Behavior differs by
        execution mode:
      </P>
      <UL>
        <LI>
          <strong>Docker mode</strong> — the orchestrator reads the{" "}
          <InlineCode>anomalies</InlineCode> list from the result dict and calls{" "}
          <InlineCode>AnomalyRepository.create(...)</InlineCode> for each entry,
          tagging every row with the model and the current{" "}
          <InlineCode>run_id</InlineCode>.
        </LI>
        <LI>
          <strong>Kubernetes mode</strong> — the containerized runner persists
          anomalies directly to the database (also tagged with{" "}
          <InlineCode>run_id</InlineCode>), so the orchestrator does not re-create
          them; it fetches them back in batches for rule evaluation.
        </LI>
      </UL>
      <P>
        After persistence, and only for inference runs, the orchestrator invokes
        the <A href="/docs/rule-canvas">Rule Engine</A> over the anomalies in
        batches of 5,000, up to an alert budget, to fire{" "}
        <A href="/docs/alerts">alerts</A>. Anomaly persistence and rule evaluation
        are independent: a failure in rule evaluation is logged and treated as
        non-fatal, so anomalies are never lost because a rule misbehaved.
      </P>

      <H2 id="data-shape">The anomaly data shape</H2>
      <P>
        The <InlineCode>Anomaly</InlineCode> model (table{" "}
        <InlineCode>anomalies</InlineCode>) defines the canonical fields. These are
        the columns you get back from the REST API and the SDK.
      </P>
      <Table
        head={["Field", "Type", "Description"]}
        rows={[
          [<InlineCode key="1">id</InlineCode>, "UUID", "Primary key, generated on insert."],
          [<InlineCode key="2">model_id</InlineCode>, "UUID", "The model that produced the anomaly (FK to models)."],
          [<InlineCode key="3">run_id</InlineCode>, "UUID", "The model run that produced it (FK to model_runs, nullable)."],
          [<InlineCode key="4">entity_id</InlineCode>, "string", "The entity this anomaly concerns, e.g. a username or IP."],
          [<InlineCode key="5">entity_type</InlineCode>, "string", <>One of <InlineCode>user</InlineCode>, <InlineCode>device</InlineCode>, <InlineCode>ip</InlineCode>, <InlineCode>other</InlineCode>. Defaults to <InlineCode>user</InlineCode>.</>],
          [<InlineCode key="6">risk_score</InlineCode>, "decimal(10,2)", "Model-assigned risk, validated to the 0.0–100.0 range at the API."],
          [<InlineCode key="7">anomaly_type</InlineCode>, "string", "Optional label categorizing the anomaly, e.g. impossible_travel."],
          [<InlineCode key="8">details</InlineCode>, "JSONB", "Free-form evidence: features, baselines, timestamps, anything the model attached."],
          [<InlineCode key="9">timestamp</InlineCode>, "timestamptz", "The event time the anomaly refers to (defaults to now)."],
          [<InlineCode key="10">acknowledged</InlineCode>, "bool", "Whether an analyst has acknowledged it. Defaults to false."],
          [<InlineCode key="11">acknowledged_at</InlineCode>, "timestamptz", "When it was acknowledged."],
          [<InlineCode key="12">acknowledged_by</InlineCode>, "string", "Who acknowledged it."],
          [<InlineCode key="13">created_at</InlineCode>, "timestamptz", "Row insertion time."],
        ]}
      />
      <Callout type="note" title="risk_score is 0–100">
        The API validates <InlineCode>risk_score</InlineCode> to the range{" "}
        <InlineCode>0.0</InlineCode>–<InlineCode>100.0</InlineCode> on both create
        and filter. It is stored as a fixed-precision decimal and returned to
        clients as a float.
      </Callout>

      <H2 id="entity-risk">Entity risk aggregation</H2>
      <P>
        Anomalies are per-observation; entities are the rolled-up view. The{" "}
        <InlineCode>entities</InlineCode> table maintains a durable risk profile per
        <InlineCode> entity_id</InlineCode> + <InlineCode>entity_type</InlineCode>,
        so an analyst can rank the riskiest users at a glance without scanning raw
        anomalies.
      </P>
      <Table
        head={["Field", "Type", "Description"]}
        rows={[
          [<InlineCode key="1">entity_id</InlineCode>, "string", "The entity identifier."],
          [<InlineCode key="2">entity_type</InlineCode>, "string", "user / device / ip / other."],
          [<InlineCode key="3">display_name</InlineCode>, "string", "Human-friendly label."],
          [<InlineCode key="4">risk_score</InlineCode>, "decimal(10,2)", "Aggregated risk for the entity."],
          [<InlineCode key="5">anomaly_count</InlineCode>, "integer", "How many anomalies have accrued for this entity."],
          [<InlineCode key="6">first_seen</InlineCode>, "timestamptz", "When the entity first produced an anomaly."],
          [<InlineCode key="7">last_seen</InlineCode>, "timestamptz", "Most recent anomaly time."],
          [<InlineCode key="8">metadata</InlineCode>, "JSONB", "Arbitrary attributes attached to the entity."],
        ]}
      />
      <P>
        The Entities view is what powers risk leaderboards and entity drill-downs
        in the interface, and it is the target of the SDK{" "}
        <InlineCode>get_entity_risk()</InlineCode> helper described below.
      </P>

      <H2 id="rest-api">Querying anomalies over REST</H2>
      <P>
        All anomaly endpoints live under <InlineCode>/api/v1</InlineCode>. Listing
        supports rich filtering and pagination; writes (create, acknowledge,
        delete) require the <InlineCode>anomalies:write</InlineCode> permission.
      </P>
      <Table
        head={["Method & path", "Purpose"]}
        rows={[
          [<InlineCode key="1">GET /api/v1/anomalies</InlineCode>, "List anomalies with filters + pagination."],
          [<InlineCode key="2">GET /api/v1/anomalies/{"{"}anomaly_id{"}"}</InlineCode>, "Fetch a single anomaly by id."],
          [<InlineCode key="3">POST /api/v1/anomalies</InlineCode>, "Create an anomaly record (write)."],
          [<InlineCode key="4">POST /api/v1/anomalies/{"{"}anomaly_id{"}"}/acknowledge</InlineCode>, "Acknowledge an anomaly (write)."],
          [<InlineCode key="5">DELETE /api/v1/anomalies/{"{"}anomaly_id{"}"}</InlineCode>, "Delete an anomaly (write)."],
        ]}
      />
      <P>The list endpoint accepts the following query parameters:</P>
      <Table
        head={["Parameter", "Notes"]}
        rows={[
          [<InlineCode key="1">model_id</InlineCode>, "Restrict to one model (UUID)."],
          [<InlineCode key="2">entity_id</InlineCode>, "Restrict to one entity."],
          [<InlineCode key="3">acknowledged</InlineCode>, "true / false."],
          [<InlineCode key="4">min_risk_score</InlineCode>, "0.0–100.0 lower bound."],
          [<InlineCode key="5">max_risk_score</InlineCode>, "0.0–100.0 upper bound."],
          [<InlineCode key="6">start_time / end_time</InlineCode>, "ISO-8601 window on the anomaly timestamp."],
          [<InlineCode key="7">limit / offset</InlineCode>, "Pagination. limit is 1–1000 (default 100), offset ≥ 0."],
        ]}
      />
      <P>Results are ordered by <InlineCode>timestamp</InlineCode> descending.</P>
      <CodeBlock
        language="bash"
        title="List high-risk, unacknowledged anomalies"
        code={`curl -s "http://localhost:8000/api/v1/anomalies?min_risk_score=80&acknowledged=false&limit=50" \\
  -H "Authorization: Bearer $OPENUBA_TOKEN"`}
      />
      <CodeBlock
        language="json"
        title="Response (AnomalyListResponse)"
        code={`{
  "items": [
    {
      "id": "1f0c...",
      "model_id": "8a3e...",
      "entity_id": "alice@corp.example",
      "entity_type": "user",
      "timestamp": "2026-08-13T09:14:00Z",
      "risk_score": 87.5,
      "anomaly_type": "impossible_travel",
      "details": { "from_geo": "US-CA", "to_geo": "RU-MOW" },
      "acknowledged": false,
      "acknowledged_at": null,
      "acknowledged_by": null,
      "created_at": "2026-08-13T09:14:01Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}`}
      />
      <CodeBlock
        language="bash"
        title="Acknowledge an anomaly"
        code={`curl -s -X POST \\
  "http://localhost:8000/api/v1/anomalies/1f0c.../acknowledge?acknowledged_by=analyst@corp.example" \\
  -H "Authorization: Bearer $OPENUBA_TOKEN"`}
      />

      <H2 id="sdk">Querying anomalies from the SDK</H2>
      <P>
        The Python SDK wraps the REST surface with typed helpers. Use{" "}
        <InlineCode>query_anomalies()</InlineCode> to pull anomalies and{" "}
        <InlineCode>get_entity_risk()</InlineCode> to fetch an entity&apos;s risk
        profile.
      </P>
      <CodeBlock
        language="python"
        title="query_anomalies + get_entity_risk"
        code={`import openuba

# pull the riskiest anomalies for a single entity
result = openuba.query_anomalies(
    entity_id="alice@corp.example",
    min_risk=80,
    limit=100,
)
for a in result["items"]:
    print(a["risk_score"], a["anomaly_type"], a["details"])

# scope by model and a risk band
band = openuba.query_anomalies(
    model_id="8a3e...",
    min_risk=50,
    max_risk=90,
)

# fetch the aggregated risk profile for an entity
profile = openuba.get_entity_risk("alice@corp.example")
print(profile["risk_score"], profile["anomaly_count"])`}
      />
      <P>
        <InlineCode>query_anomalies()</InlineCode> accepts{" "}
        <InlineCode>entity_id</InlineCode>, <InlineCode>model_id</InlineCode>,{" "}
        <InlineCode>min_risk</InlineCode>, <InlineCode>max_risk</InlineCode>, and{" "}
        <InlineCode>limit</InlineCode> (default 1000), mapping directly to the REST
        filters. <InlineCode>get_entity_risk(entity_id)</InlineCode> resolves the
        entity&apos;s aggregated profile.
      </P>

      <H2 id="lifecycle">From anomaly to investigation</H2>
      <P>Anomalies are the start of a chain that the rest of these docs cover:</P>
      <OL>
        <LI>A model run persists anomalies (this page).</LI>
        <LI>
          The <A href="/docs/rule-canvas">Rule Canvas</A> engine evaluates flow
          rules against each anomaly.
        </LI>
        <LI>
          Matching rules fire <A href="/docs/alerts">alerts</A> (with optional
          email + in-app notifications).
        </LI>
        <LI>
          Analysts link anomalies into <A href="/docs/cases">cases</A> for
          investigation and disposition.
        </LI>
      </OL>
      <Callout type="tip" title="Feedback loops">
        Analyst feedback on an anomaly is stored in the{" "}
        <InlineCode>user_feedback</InlineCode> table, keyed to the anomaly. This is
        the raw material for tuning models and rules over time.
      </Callout>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <NextCard
          href="/docs/rule-canvas"
          title="Rule Canvas"
          description="Turn anomalies into alerts with a visual flow-graph rule builder."
        />
        <NextCard
          href="/docs/cases"
          title="Cases"
          description="Group anomalies into investigations and track them to resolution."
        />
      </div>

      <DocFooter slug="anomalies" />
    </>
  );
}
