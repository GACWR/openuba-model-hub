import type { Metadata } from "next";
import { DocHeader, H2, H3, P, UL, OL, LI, InlineCode, A, Callout, Table, NextCard } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Rule Canvas — OpenUBA Docs",
  description:
    "OpenUBA's visual, flow-based rule builder: node types, how the rule engine evaluates the flow_graph DAG after inference, rule types, alert node actions, and recipients.",
};

export default function Page() {
  return (
    <>
      <DocHeader
        eyebrow="Detection & Investigation"
        title="Rule Canvas"
        intro="The Rule Canvas is OpenUBA's visual detection builder. Instead of writing rule expressions by hand, you drag nodes onto a canvas and wire them into a logic graph: model outputs and anomaly conditions flow through comparisons and boolean gates into an alert node. After every inference run, the rule engine walks that graph for each anomaly and fires alerts when the graph resolves true."
      />

      <H2 id="overview">How it fits together</H2>
      <P>
        The canvas is built on ReactFlow. Each rule you draw is stored as a{" "}
        <InlineCode>flow_graph</InlineCode> — a JSON DAG of{" "}
        <InlineCode>nodes</InlineCode> and <InlineCode>edges</InlineCode> — on the{" "}
        <InlineCode>rules</InlineCode> row. When a model finishes an inference run,
        the <A href="/docs/anomalies">orchestrator</A> hands the run&apos;s
        anomalies to the <InlineCode>RuleEngine</InlineCode>, which evaluates every
        enabled flow rule that references that model and fires{" "}
        <A href="/docs/alerts">alerts</A> for the anomalies that satisfy the graph.
      </P>
      <Callout type="note" title="Left to right, inputs to alert">
        Data-source nodes (model, anomaly, case) sit on the left with only an
        output handle. Logic nodes (comparison, AND, OR, NOT) sit in the middle
        with both handles. The alert node sits on the right with only an input
        handle. Edges carry a value from a source node&apos;s output into a target
        node&apos;s input.
      </Callout>

      <H2 id="node-types">Node types</H2>
      <P>
        The canvas registers eight node types, grouped into data sources, logic,
        and output. Each node is evaluated recursively: a node&apos;s value is
        computed from the values of the nodes feeding into it.
      </P>
      <H3 id="data-source-nodes">Data source nodes</H3>
      <Table
        head={["Node", "Type key", "What it outputs"]}
        rows={[
          [
            "Model output",
            <InlineCode key="1">model</InlineCode>,
            <>References a specific model by <InlineCode>modelId</InlineCode>. Outputs the anomaly&apos;s <InlineCode>risk_score</InlineCode> (a number) or <InlineCode>has_anomaly</InlineCode> (boolean, always true when an anomaly exists).</>,
          ],
          [
            "Anomaly condition",
            <InlineCode key="2">anomaly</InlineCode>,
            <>Boolean filter on the anomaly: an optional <InlineCode>minRiskScore</InlineCode>, an <InlineCode>entityType</InlineCode> (any/user/device/ip), and an <InlineCode>anomalyType</InlineCode> string. True only if all supplied filters match.</>,
          ],
          [
            "Case condition",
            <InlineCode key="3">case</InlineCode>,
            <>Checks the cases table for the anomaly&apos;s entity. <InlineCode>caseEvent = created</InlineCode> is true if the entity has any non-closed case; <InlineCode>severity_match</InlineCode> is true if a non-closed case matches <InlineCode>caseSeverity</InlineCode>.</>,
          ],
        ]}
      />
      <H3 id="logic-nodes">Logic nodes</H3>
      <Table
        head={["Node", "Type key", "Behavior"]}
        rows={[
          [
            "Comparison",
            <InlineCode key="1">comparison</InlineCode>,
            <>Compares its single input against a threshold <InlineCode>value</InlineCode> using an <InlineCode>operator</InlineCode> (<InlineCode>&gt;</InlineCode>, <InlineCode>&lt;</InlineCode>, <InlineCode>&gt;=</InlineCode>, <InlineCode>&lt;=</InlineCode>, <InlineCode>==</InlineCode>, <InlineCode>!=</InlineCode>). Booleans coerce to 1.0 / 0.0.</>,
          ],
          ["AND gate", <InlineCode key="2">and</InlineCode>, "True only if every input is truthy."],
          ["OR gate", <InlineCode key="3">or</InlineCode>, "True if any input is truthy."],
          ["NOT gate", <InlineCode key="4">not</InlineCode>, "Inverts its single boolean input."],
        ]}
      />
      <H3 id="output-node">Output node</H3>
      <Table
        head={["Node", "Type key", "Behavior"]}
        rows={[
          [
            "Alert output",
            <InlineCode key="1">alert</InlineCode>,
            <>The terminal node. It is truthy when any of its inputs is truthy; when it resolves true the engine fires an alert using the node&apos;s <InlineCode>severity</InlineCode>, <InlineCode>message</InlineCode>, <InlineCode>action</InlineCode>, and optional <InlineCode>recipients</InlineCode>.</>,
          ],
        ]}
      />

      <H2 id="evaluation">How the engine evaluates the DAG</H2>
      <P>
        Evaluation happens once per anomaly, per rule. The engine{" "}
        <InlineCode>evaluate_after_inference(model_id, anomalies, db)</InlineCode>{" "}
        does the following:
      </P>
      <OL>
        <LI>
          Load all enabled rules where <InlineCode>rule_type = &quot;flow&quot;</InlineCode>{" "}
          and <InlineCode>flow_graph</InlineCode> is not null.
        </LI>
        <LI>
          Keep only rules whose graph contains a <InlineCode>model</InlineCode> node
          whose <InlineCode>modelId</InlineCode> equals the model that just ran.
        </LI>
        <LI>
          For each relevant rule, index the nodes, build the incoming-edge map, and
          find the <InlineCode>alert</InlineCode> nodes.
        </LI>
        <LI>
          For each anomaly, evaluate each alert node by recursively resolving its
          upstream nodes (results are memoized per anomaly). If the alert node
          resolves truthy, fire an alert.
        </LI>
      </OL>
      <P>
        The <InlineCode>model</InlineCode> and <InlineCode>anomaly</InlineCode>{" "}
        nodes read fields directly off the anomaly being evaluated —{" "}
        <InlineCode>risk_score</InlineCode>, <InlineCode>entity_type</InlineCode>,{" "}
        <InlineCode>anomaly_type</InlineCode>, <InlineCode>entity_id</InlineCode> —
        while the <InlineCode>case</InlineCode> node issues a scoped SQL lookup
        against the cases tables for that entity.
      </P>
      <Callout type="warning" title="Alert budget">
        To protect the database on very large runs, the engine caps alerts at{" "}
        <InlineCode>MAX_ALERTS_PER_RUN = 500</InlineCode> per evaluation. The
        orchestrator batches anomalies (5,000 at a time) and passes the remaining
        budget across batches, committing alerts periodically. Once the budget is
        exhausted, evaluation stops early.
      </Callout>

      <H3 id="graph-shape">The flow_graph shape</H3>
      <P>
        A saved graph is a JSON object with <InlineCode>nodes</InlineCode> and{" "}
        <InlineCode>edges</InlineCode>. Node <InlineCode>data</InlineCode> carries
        the configuration entered in the canvas; edges connect a source node&apos;s
        output to a target node&apos;s input.
      </P>
      <CodeBlock
        language="json"
        title="flow_graph — risk_score > 80 AND entity is a user"
        code={`{
  "nodes": [
    { "id": "m1", "type": "model",
      "data": { "modelId": "8a3e...", "output": "risk_score" } },
    { "id": "c1", "type": "comparison",
      "data": { "operator": ">", "value": "80" } },
    { "id": "a1", "type": "anomaly",
      "data": { "minRiskScore": "", "entityType": "user", "anomalyType": "" } },
    { "id": "g1", "type": "and", "data": {} },
    { "id": "al1", "type": "alert",
      "data": {
        "severity": "high",
        "message": "High-risk user anomaly",
        "action": "fire_alert_and_notify",
        "recipients": "soc@corp.example"
      } }
  ],
  "edges": [
    { "source": "m1", "target": "c1" },
    { "source": "c1", "target": "g1" },
    { "source": "a1", "target": "g1" },
    { "source": "g1", "target": "al1" }
  ]
}`}
      />

      <H2 id="rule-types">Rule types</H2>
      <P>
        The <InlineCode>rules.rule_type</InlineCode> column is constrained to three
        values. The Rule Canvas produces the <InlineCode>flow</InlineCode> type;
        the other two are simpler rule shapes.
      </P>
      <Table
        head={["rule_type", "Description"]}
        rows={[
          [<InlineCode key="1">flow</InlineCode>, "A visual flow-graph rule built on the canvas. Evaluated by the rule engine after inference. This is the type that carries a flow_graph."],
          [<InlineCode key="2">single-fire</InlineCode>, "A simple rule that fires on a condition. Also the type used by the system SDK-alerts rule (see Alerts)."],
          [<InlineCode key="3">deviation</InlineCode>, "A rule expressing a deviation-from-baseline condition."],
        ]}
      />

      <H2 id="alert-actions">Alert node actions and recipients</H2>
      <P>
        The alert node&apos;s <InlineCode>action</InlineCode> field decides what
        happens when the graph resolves true. The canvas offers these actions:
      </P>
      <Table
        head={["Action", "Effect"]}
        rows={[
          [<InlineCode key="1">fire_alert</InlineCode>, "Create an alert record only."],
          [<InlineCode key="2">open_case</InlineCode>, "Open a case for the entity."],
          [<InlineCode key="3">fire_alert_and_open_case</InlineCode>, "Both fire an alert and open a case."],
          [<InlineCode key="4">notify</InlineCode>, "Send realtime notifications (SMTP email + in-app)."],
          [<InlineCode key="5">fire_alert_and_notify</InlineCode>, "Fire an alert and send notifications."],
        ]}
      />
      <P>
        When the action is a notify action, the engine dispatches notifications
        through the <A href="/docs/alerts">AlertNotifier</A>. The alert node also
        carries an optional <InlineCode>recipients</InlineCode> field (a
        comma-separated email list) that overrides the SMTP default recipient list
        for that rule; when the recipients box is empty, the configured default
        recipients are used. The recipients input appears in the canvas only for
        notify actions.
      </P>
      <Callout type="tip" title="Per-rule recipients">
        Use <InlineCode>recipients</InlineCode> to route a specific rule&apos;s
        alerts to the right team — for example, sending{" "}
        <InlineCode>critical</InlineCode> identity rules to your on-call address
        while everything else falls back to the platform-wide default list.
      </Callout>

      <H2 id="saving">How rules are saved</H2>
      <P>
        The Rule Canvas persists the graph as the{" "}
        <InlineCode>flow_graph</InlineCode> JSONB column via GraphQL. Creating a
        rule uses the <InlineCode>createRule</InlineCode> mutation and edits use{" "}
        <InlineCode>updateRuleById</InlineCode>, both exchanging the graph through a{" "}
        <InlineCode>flowGraph</InlineCode> field. The same records are also readable
        and writable over the REST rules API.
      </P>
      <Table
        head={["Method & path", "Purpose"]}
        rows={[
          [<InlineCode key="1">GET /api/v1/rules</InlineCode>, <>List rules. Filter by <InlineCode>enabled</InlineCode> and <InlineCode>rule_type</InlineCode>.</>],
          [<InlineCode key="2">POST /api/v1/rules</InlineCode>, "Create a rule (accepts flow_graph)."],
          [<InlineCode key="3">GET /api/v1/rules/{"{"}rule_id{"}"}</InlineCode>, "Fetch one rule."],
          [<InlineCode key="4">PATCH /api/v1/rules/{"{"}rule_id{"}"}</InlineCode>, "Update rule fields (write)."],
          [<InlineCode key="5">DELETE /api/v1/rules/{"{"}rule_id{"}"}</InlineCode>, "Delete a rule (write)."],
        ]}
      />
      <CodeBlock
        language="bash"
        title="Create a flow rule over REST"
        code={`curl -s -X POST http://localhost:8000/api/v1/rules \\
  -H "Authorization: Bearer $OPENUBA_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
        "name": "High-risk user anomaly",
        "rule_type": "flow",
        "condition": "flow-based rule",
        "severity": "high",
        "enabled": true,
        "flow_graph": { "nodes": [ /* ... */ ], "edges": [ /* ... */ ] }
      }'`}
      />
      <P>
        Rules created via the SDK helper <InlineCode>list_rules()</InlineCode> can be
        enumerated, and every rule tracks a{" "}
        <InlineCode>last_triggered_at</InlineCode> timestamp that the engine stamps
        each time the rule fires.
      </P>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <NextCard
          href="/docs/alerts"
          title="Alerts & Notifications"
          description="What happens when a rule fires: alert records, dedup, email + in-app delivery."
        />
        <NextCard
          href="/docs/anomalies"
          title="Anomalies & Entity Risk"
          description="The anomalies the rule engine evaluates, and how they are produced."
        />
      </div>

      <DocFooter slug="rule-canvas" />
    </>
  );
}
