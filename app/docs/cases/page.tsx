import type { Metadata } from "next";
import { DocHeader, H2, H3, P, UL, LI, InlineCode, A, Callout, Table, NextCard } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Cases — OpenUBA Docs",
  description:
    "Case management for investigation in OpenUBA: the Case model, statuses and severity, linking anomalies to cases, the cases REST API, and the query_cases SDK helper.",
};

export default function Page() {
  return (
    <>
      <DocHeader
        eyebrow="Detection & Investigation"
        title="Cases"
        intro="A case is the investigation container in OpenUBA. When anomalies and alerts warrant a human look, analysts group the relevant anomalies into a case, assign an owner, track it through a status workflow, and record their notes and disposition. This page documents the Case model, its lifecycle, how it relates to anomalies, and every API for working with cases."
      />

      <H2 id="model">The Case model</H2>
      <P>
        Cases live in the <InlineCode>cases</InlineCode> table. A case is a
        first-class record with its own title, status, severity, assignment, and
        analyst notes — deliberately lightweight so it can be created quickly
        during triage and enriched as an investigation unfolds.
      </P>
      <Table
        head={["Field", "Type", "Description"]}
        rows={[
          [<InlineCode key="1">id</InlineCode>, "UUID", "Primary key."],
          [<InlineCode key="2">title</InlineCode>, "string", "Required, up to 255 chars. The case headline."],
          [<InlineCode key="3">description</InlineCode>, "text", "Longer narrative of what is being investigated."],
          [<InlineCode key="4">status</InlineCode>, "string", <>Workflow state. Defaults to <InlineCode>open</InlineCode>.</>],
          [<InlineCode key="5">severity</InlineCode>, "string", <>Impact level. Defaults to <InlineCode>medium</InlineCode>.</>],
          [<InlineCode key="6">analyst_notes</InlineCode>, "text", "Free-form working notes for the investigator."],
          [<InlineCode key="7">assigned_to</InlineCode>, "string", "The analyst who owns the case."],
          [<InlineCode key="8">created_at</InlineCode>, "timestamptz", "When the case was opened."],
          [<InlineCode key="9">updated_at</InlineCode>, "timestamptz", "Auto-updated on every change."],
          [<InlineCode key="10">resolved_at</InlineCode>, "timestamptz", "Set automatically when status moves to resolved or closed."],
        ]}
      />

      <H2 id="status-severity">Statuses and severity</H2>
      <P>
        Both status and severity are constrained by the API. Passing a value
        outside these sets is rejected with a validation error.
      </P>
      <H3 id="statuses">Status workflow</H3>
      <Table
        head={["Status", "Meaning"]}
        rows={[
          [<InlineCode key="1">open</InlineCode>, "Newly created, not yet worked. The default."],
          [<InlineCode key="2">investigating</InlineCode>, "An analyst is actively working the case."],
          [<InlineCode key="3">resolved</InlineCode>, "Concluded with a disposition; resolved_at is stamped."],
          [<InlineCode key="4">closed</InlineCode>, "Filed away; resolved_at is stamped."],
        ]}
      />
      <Callout type="note" title="Auto-stamped resolution">
        When a case is updated to <InlineCode>resolved</InlineCode> or{" "}
        <InlineCode>closed</InlineCode>, the repository sets{" "}
        <InlineCode>resolved_at</InlineCode> to the current time automatically —
        you do not set it by hand.
      </Callout>
      <H3 id="severity">Severity</H3>
      <Table
        head={["Severity", "Meaning"]}
        rows={[
          [<InlineCode key="1">low</InlineCode>, "Minimal impact / informational."],
          [<InlineCode key="2">medium</InlineCode>, "Default. Warrants attention."],
          [<InlineCode key="3">high</InlineCode>, "Significant, time-sensitive."],
          [<InlineCode key="4">critical</InlineCode>, "Severe; likely active compromise."],
        ]}
      />

      <H2 id="anomaly-links">How cases relate to anomalies</H2>
      <P>
        Cases and anomalies have a many-to-many relationship via the{" "}
        <InlineCode>case_anomalies</InlineCode> join table. An anomaly can belong to
        several cases, and a case can gather many anomalies — the exact set of
        evidence an analyst decided is related.
      </P>
      <P>
        Linking is done through dedicated endpoints rather than by editing the case
        body. Linking and unlinking each require the{" "}
        <InlineCode>cases:write</InlineCode> permission.
      </P>
      <Callout type="tip" title="Rules read case state back">
        The <A href="/docs/rule-canvas">Rule Canvas</A> has a{" "}
        <strong>case condition</strong> node that checks whether an entity already
        has an open case (or a case of a given severity). Because linking anomalies
        to a case ties that case to the anomaly&apos;s{" "}
        <InlineCode>entity_id</InlineCode>, well-maintained case links directly
        influence future rule evaluation.
      </Callout>

      <H2 id="rest-api">The Cases REST API</H2>
      <P>
        All endpoints live under <InlineCode>/api/v1</InlineCode>. Reads are open to
        authenticated users; every mutation requires the{" "}
        <InlineCode>cases:write</InlineCode> permission.
      </P>
      <Table
        head={["Method & path", "Purpose"]}
        rows={[
          [<InlineCode key="1">POST /api/v1/cases</InlineCode>, "Create a case (write)."],
          [<InlineCode key="2">GET /api/v1/cases</InlineCode>, "List / search cases with filters."],
          [<InlineCode key="3">GET /api/v1/cases/{"{"}case_id{"}"}</InlineCode>, "Fetch one case."],
          [<InlineCode key="4">PATCH /api/v1/cases/{"{"}case_id{"}"}</InlineCode>, "Update case fields (write)."],
          [<InlineCode key="5">POST /api/v1/cases/{"{"}case_id{"}"}/anomalies/{"{"}anomaly_id{"}"}</InlineCode>, "Link an anomaly to the case (write)."],
          [<InlineCode key="6">DELETE /api/v1/cases/{"{"}case_id{"}"}/anomalies/{"{"}anomaly_id{"}"}</InlineCode>, "Unlink an anomaly (write)."],
          [<InlineCode key="7">DELETE /api/v1/cases/{"{"}case_id{"}"}</InlineCode>, "Delete a case (write)."],
        ]}
      />
      <P>
        The list endpoint accepts <InlineCode>status</InlineCode>,{" "}
        <InlineCode>severity</InlineCode>, and <InlineCode>assigned_to</InlineCode>{" "}
        filters, plus <InlineCode>limit</InlineCode> (1–1000, default 100) and{" "}
        <InlineCode>offset</InlineCode>. Results are ordered by{" "}
        <InlineCode>created_at</InlineCode> descending.
      </P>

      <H3 id="create">Creating a case</H3>
      <P>
        On create you supply <InlineCode>title</InlineCode> (required),{" "}
        <InlineCode>description</InlineCode>, <InlineCode>severity</InlineCode>,{" "}
        <InlineCode>analyst_notes</InlineCode>, and <InlineCode>assigned_to</InlineCode>.
        A new case always starts in <InlineCode>open</InlineCode> status.
      </P>
      <CodeBlock
        language="bash"
        title="Open a case, then attach evidence"
        code={`# 1) create the case
CASE=$(curl -s -X POST http://localhost:8000/api/v1/cases \\
  -H "Authorization: Bearer $OPENUBA_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
        "title": "Possible account takeover — alice@corp.example",
        "description": "Impossible-travel anomaly + failed MFA burst",
        "severity": "high",
        "assigned_to": "analyst@corp.example"
      }')
CASE_ID=$(echo "$CASE" | jq -r .id)

# 2) link an anomaly as evidence
curl -s -X POST \\
  "http://localhost:8000/api/v1/cases/$CASE_ID/anomalies/$ANOMALY_ID" \\
  -H "Authorization: Bearer $OPENUBA_TOKEN"`}
      />

      <H3 id="update">Updating and closing a case</H3>
      <P>
        <InlineCode>PATCH</InlineCode> accepts any subset of{" "}
        <InlineCode>title</InlineCode>, <InlineCode>description</InlineCode>,{" "}
        <InlineCode>status</InlineCode>, <InlineCode>severity</InlineCode>,{" "}
        <InlineCode>analyst_notes</InlineCode>, and{" "}
        <InlineCode>assigned_to</InlineCode>. Only the fields you send are changed.
      </P>
      <CodeBlock
        language="bash"
        title="Move to investigating, then resolve"
        code={`curl -s -X PATCH "http://localhost:8000/api/v1/cases/$CASE_ID" \\
  -H "Authorization: Bearer $OPENUBA_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"status": "investigating", "analyst_notes": "Confirmed with user — travel was legit; MFA reset."}'

# closing (or resolving) auto-stamps resolved_at
curl -s -X PATCH "http://localhost:8000/api/v1/cases/$CASE_ID" \\
  -H "Authorization: Bearer $OPENUBA_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"status": "resolved"}'`}
      />
      <CodeBlock
        language="json"
        title="Case response shape"
        code={`{
  "id": "b91f...",
  "title": "Possible account takeover — alice@corp.example",
  "description": "Impossible-travel anomaly + failed MFA burst",
  "status": "resolved",
  "severity": "high",
  "analyst_notes": "Confirmed with user — travel was legit; MFA reset.",
  "assigned_to": "analyst@corp.example",
  "created_at": "2026-08-13T09:20:00Z",
  "updated_at": "2026-08-13T10:05:00Z",
  "resolved_at": "2026-08-13T10:05:00Z"
}`}
      />

      <H2 id="sdk">Querying cases from the SDK</H2>
      <P>
        The Python SDK exposes <InlineCode>query_cases()</InlineCode> for read
        access, mirroring the list endpoint&apos;s filters.
      </P>
      <CodeBlock
        language="python"
        title="query_cases"
        code={`import openuba

# all open, high-severity cases
open_high = openuba.query_cases(status="open", severity="high", limit=100)
for c in open_high:
    print(c["id"], c["title"], c["assigned_to"])

# everything a given severity, regardless of status
criticals = openuba.query_cases(severity="critical")`}
      />
      <P>
        <InlineCode>query_cases()</InlineCode> accepts{" "}
        <InlineCode>status</InlineCode>, <InlineCode>severity</InlineCode>, and{" "}
        <InlineCode>limit</InlineCode> (default 100) and returns the list of case
        objects in the shape shown above.
      </P>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <NextCard
          href="/docs/anomalies"
          title="Anomalies & Entity Risk"
          description="The evidence you link into cases — how anomalies are produced and queried."
        />
        <NextCard
          href="/docs/alerts"
          title="Alerts & Notifications"
          description="How rules fire alerts, and how the alert node can open cases automatically."
        />
      </div>

      <DocFooter slug="cases" />
    </>
  );
}
