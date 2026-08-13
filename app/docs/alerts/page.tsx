import type { Metadata } from "next";
import { DocHeader, H2, H3, P, UL, OL, LI, InlineCode, A, Callout, Table, NextCard } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Alerts & Notifications — OpenUBA Docs",
  description:
    "How OpenUBA creates alerts from the rule engine, deduplicates them, and delivers realtime notifications over SMTP email and in-app — plus raising alerts directly from the SDK.",
};

export default function Page() {
  return (
    <>
      <DocHeader
        eyebrow="Detection & Investigation"
        title="Alerts & Notifications"
        intro="An alert is a fired detection: a record that a rule matched, or that a model raised a signal directly through the SDK. Alerts can also be delivered in realtime — as email over SMTP and as in-app notifications. This page covers how alerts are created and deduplicated, the Alert model, acknowledgement, the notification system, and raising alerts from the SDK."
      />

      <H2 id="how-created">How alerts are created</H2>
      <P>
        Alerts are produced in two ways:
      </P>
      <UL>
        <LI>
          <strong>By the rule engine</strong> — after an inference run, the{" "}
          <A href="/docs/rule-canvas">Rule Canvas</A> engine evaluates flow rules
          against each anomaly and calls <InlineCode>_fire_alert(...)</InlineCode>{" "}
          when an alert node resolves true.
        </LI>
        <LI>
          <strong>Directly via the API / SDK</strong> — a model or integration can{" "}
          <InlineCode>POST /api/v1/alerts</InlineCode> (or call{" "}
          <InlineCode>openuba.send_alert(...)</InlineCode>) to raise an alert on its
          own terms.
        </LI>
      </UL>

      <H3 id="dedup">Deduplication</H3>
      <P>
        Rule-fired alerts are deduplicated to avoid storms. Before inserting,{" "}
        <InlineCode>_fire_alert</InlineCode> checks for an existing alert with the
        same <InlineCode>rule_id</InlineCode>, <InlineCode>entity_id</InlineCode>,
        and <InlineCode>severity</InlineCode> created within the last hour. If one
        exists, the new alert is skipped and the fire returns false. Each fire also
        stamps the rule&apos;s <InlineCode>last_triggered_at</InlineCode>.
      </P>
      <Callout type="note" title="Context is captured on every alert">
        When an alert is fired, the engine records a{" "}
        <InlineCode>context</InlineCode> object holding the anomaly&apos;s{" "}
        <InlineCode>risk_score</InlineCode>, <InlineCode>anomaly_type</InlineCode>,{" "}
        <InlineCode>model_id</InlineCode>, the alert node&apos;s{" "}
        <InlineCode>action</InlineCode>, and — when present — the anomaly&apos;s{" "}
        <InlineCode>details</InlineCode>. This is what an analyst sees as the alert
        evidence.
      </Callout>

      <H2 id="alert-model">The Alert model</H2>
      <P>Alerts are stored in the <InlineCode>alerts</InlineCode> table.</P>
      <Table
        head={["Field", "Type", "Description"]}
        rows={[
          [<InlineCode key="1">id</InlineCode>, "UUID", "Primary key."],
          [<InlineCode key="2">rule_id</InlineCode>, "UUID", "The owning rule (required, FK to rules)."],
          [<InlineCode key="3">severity</InlineCode>, "string", <>One of <InlineCode>critical</InlineCode>, <InlineCode>high</InlineCode>, <InlineCode>medium</InlineCode>, <InlineCode>low</InlineCode>. Defaults to <InlineCode>medium</InlineCode>.</>],
          [<InlineCode key="4">message</InlineCode>, "text", "Required human-readable alert message."],
          [<InlineCode key="5">entity_id</InlineCode>, "string", "The entity the alert concerns."],
          [<InlineCode key="6">entity_type</InlineCode>, "string", <>Defaults to <InlineCode>user</InlineCode>.</>],
          [<InlineCode key="7">context</InlineCode>, "JSONB", "Evidence and metadata captured at fire time (exposed as alert_context)."],
          [<InlineCode key="8">acknowledged</InlineCode>, "bool", "Whether an analyst has acknowledged it. Defaults to false."],
          [<InlineCode key="9">acknowledged_at</InlineCode>, "timestamptz", "When it was acknowledged."],
          [<InlineCode key="10">acknowledged_by</InlineCode>, "string", "Who acknowledged it."],
          [<InlineCode key="11">created_at</InlineCode>, "timestamptz", "Fire time."],
        ]}
      />
      <P>
        Because every alert requires a <InlineCode>rule_id</InlineCode>, alerts
        raised directly through the SDK without a rule are attached to a system
        rule named <InlineCode>SDK Alerts</InlineCode> (a{" "}
        <InlineCode>single-fire</InlineCode> rule created on demand). Those alerts
        also get <InlineCode>context.source = &quot;sdk&quot;</InlineCode>.
      </P>

      <H2 id="listing-ack">Listing and acknowledging</H2>
      <P>
        Alerts are read over REST under <InlineCode>/api/v1</InlineCode>. Listing
        supports filtering by severity, acknowledgement, and rule.
      </P>
      <Table
        head={["Method & path", "Purpose"]}
        rows={[
          [<InlineCode key="1">GET /api/v1/alerts</InlineCode>, <>List alerts, newest first. Filters: <InlineCode>severity</InlineCode>, <InlineCode>acknowledged</InlineCode>, <InlineCode>rule_id</InlineCode>, plus <InlineCode>limit</InlineCode>/<InlineCode>offset</InlineCode>.</>],
          [<InlineCode key="2">POST /api/v1/alerts</InlineCode>, "Raise an alert directly (write). Supports realtime notification."],
        ]}
      />
      <CodeBlock
        language="bash"
        title="List unacknowledged critical alerts"
        code={`curl -s "http://localhost:8000/api/v1/alerts?severity=critical&acknowledged=false&limit=50" \\
  -H "Authorization: Bearer $OPENUBA_TOKEN"`}
      />

      <H2 id="notifications">Realtime notifications</H2>
      <P>
        Beyond persisting an alert row, OpenUBA can deliver the alert in realtime
        over two channels driven by the <InlineCode>AlertNotifier</InlineCode>{" "}
        service:
      </P>
      <UL>
        <LI>
          <strong>Email over SMTP</strong> — an email is sent to the rule&apos;s{" "}
          <InlineCode>recipients</InlineCode> if provided, otherwise to the
          configured default recipient list.
        </LI>
        <LI>
          <strong>In-app notifications</strong> — one{" "}
          <InlineCode>Notification</InlineCode> row (<InlineCode>type = &quot;alert&quot;</InlineCode>,
          link <InlineCode>/alerts</InlineCode>) is created for every active user,
          feeding the notification center already wired into the interface.
        </LI>
      </UL>
      <Callout type="warning" title="Delivery is best-effort">
        Notification delivery never blocks or fails alert creation. The notifier
        catches and logs errors internally, so an SMTP outage can never prevent an
        alert from being persisted.
      </Callout>

      <H3 id="notify-actions">Which actions notify</H3>
      <P>
        Notifications are only dispatched when the triggering action is a notify
        action. The <InlineCode>AlertNotifier.should_notify(action)</InlineCode>{" "}
        gate recognizes:
      </P>
      <Table
        head={["Action", "Notifies?"]}
        rows={[
          [<InlineCode key="1">notify</InlineCode>, "Yes"],
          [<InlineCode key="2">fire_alert_and_notify</InlineCode>, "Yes"],
          [<InlineCode key="3">notify_and_open_case</InlineCode>, "Yes"],
          [<InlineCode key="4">fire_alert</InlineCode>, "No"],
          [<InlineCode key="5">open_case</InlineCode>, "No"],
          [<InlineCode key="6">fire_alert_and_open_case</InlineCode>, "No"],
        ]}
      />
      <P>
        These action values are set on the <A href="/docs/rule-canvas">alert
        node</A> in the Rule Canvas, alongside the optional per-rule{" "}
        <InlineCode>recipients</InlineCode> field.
      </P>

      <H3 id="smtp-config">Configuring SMTP</H3>
      <P>
        SMTP is configured under <strong>Settings → Notifications</strong> as an
        integration of type <InlineCode>smtp</InlineCode>, stored in the{" "}
        <InlineCode>integration_settings</InlineCode> table (the same mechanism used
        for LLM and data integrations). The notifier reads this config; any field
        not set in the database falls back to a matching{" "}
        <InlineCode>SMTP_*</InlineCode> environment variable.
      </P>
      <Table
        head={["Config field", "Env fallback", "Meaning"]}
        rows={[
          [<InlineCode key="1">host</InlineCode>, <InlineCode key="1b">SMTP_HOST</InlineCode>, "SMTP server hostname. Required — no host means SMTP is treated as unconfigured."],
          [<InlineCode key="2">port</InlineCode>, <InlineCode key="2b">SMTP_PORT</InlineCode>, "Port (default 587)."],
          [<InlineCode key="3">username</InlineCode>, <InlineCode key="3b">SMTP_USERNAME</InlineCode>, "Login user (optional; login only happens if both user + password are set)."],
          [<InlineCode key="4">password</InlineCode>, <InlineCode key="4b">SMTP_PASSWORD</InlineCode>, "Login password. Masked in API responses."],
          [<InlineCode key="5">from_addr</InlineCode>, <InlineCode key="5b">SMTP_FROM</InlineCode>, "From address (falls back to username)."],
          [<InlineCode key="6">use_tls</InlineCode>, <InlineCode key="6b">SMTP_USE_TLS</InlineCode>, "Use STARTTLS. Defaults to true."],
          [<InlineCode key="7">use_ssl</InlineCode>, <InlineCode key="7b">SMTP_USE_SSL</InlineCode>, "Use SMTP over SSL. Defaults to false."],
          [<InlineCode key="8">default_recipients</InlineCode>, <InlineCode key="8b">SMTP_DEFAULT_RECIPIENTS</InlineCode>, "Comma/space-separated fallback recipient list."],
        ]}
      />
      <P>
        The integration must be <strong>enabled</strong> for the config to be
        used. Settings provides a connectivity test that opens an SMTP session,
        authenticates, and issues a <InlineCode>NOOP</InlineCode> — returning{" "}
        <InlineCode>connected</InlineCode> on success. Passwords are masked in all
        settings API responses.
      </P>
      <CodeBlock
        language="bash"
        title="Configure SMTP via the settings API"
        code={`curl -s -X PUT http://localhost:8000/api/v1/settings/integrations/smtp \\
  -H "Authorization: Bearer $OPENUBA_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
        "enabled": true,
        "config": {
          "host": "smtp.gmail.com",
          "port": "587",
          "username": "alerts@yourorg.com",
          "password": "app-password",
          "from_addr": "openuba@yourorg.com",
          "default_recipients": "soc@yourorg.com, oncall@yourorg.com",
          "use_tls": true,
          "use_ssl": false
        }
      }'

# verify connectivity
curl -s http://localhost:8000/api/v1/settings/integrations/smtp/test \\
  -H "Authorization: Bearer $OPENUBA_TOKEN"`}
      />

      <H3 id="in-app">The in-app notification API</H3>
      <P>
        In-app notifications are exposed to the signed-in user under{" "}
        <InlineCode>/api/v1/notifications</InlineCode>.
      </P>
      <Table
        head={["Method & path", "Purpose"]}
        rows={[
          [<InlineCode key="1">GET /api/v1/notifications</InlineCode>, "List the current user's notifications, newest first."],
          [<InlineCode key="2">GET /api/v1/notifications/unread-count</InlineCode>, "Unread count for the badge."],
          [<InlineCode key="3">PUT /api/v1/notifications/{"{"}id{"}"}/read</InlineCode>, "Mark one as read."],
          [<InlineCode key="4">PUT /api/v1/notifications/read-all</InlineCode>, "Mark all as read."],
        ]}
      />

      <H2 id="sdk">Raising alerts from the SDK</H2>
      <P>
        A model can raise an alert directly with{" "}
        <InlineCode>openuba.send_alert(...)</InlineCode>, which posts to{" "}
        <InlineCode>POST /api/v1/alerts</InlineCode>. Set{" "}
        <InlineCode>notify=True</InlineCode> to also dispatch realtime
        notifications through the same delivery path as rule-fired alerts. This
        requires the configured token to have the{" "}
        <InlineCode>rules:write</InlineCode> permission.
      </P>
      <CodeBlock
        language="python"
        title="send_alert with notification"
        code={`import openuba

# raise an alert and notify, overriding recipients for this alert
openuba.send_alert(
    message="Data exfiltration suspected for alice@corp.example",
    severity="critical",
    entity_id="alice@corp.example",
    entity_type="user",
    context={"bytes_out": 4_200_000_000, "dest": "203.0.113.9"},
    notify=True,
    recipients="soc@corp.example, ir-oncall@corp.example",
)`}
      />
      <P>
        <InlineCode>send_alert</InlineCode> parameters map onto the{" "}
        <InlineCode>AlertCreate</InlineCode> body:{" "}
        <InlineCode>message</InlineCode> (required),{" "}
        <InlineCode>severity</InlineCode>, <InlineCode>entity_id</InlineCode>,{" "}
        <InlineCode>entity_type</InlineCode>, an optional{" "}
        <InlineCode>rule_id</InlineCode> (omit it to attach to the{" "}
        <InlineCode>SDK Alerts</InlineCode> system rule),{" "}
        <InlineCode>context</InlineCode>, <InlineCode>notify</InlineCode> (default
        false), and <InlineCode>recipients</InlineCode> (a list or comma-separated
        string that overrides the SMTP default list).
      </P>
      <CodeBlock
        language="bash"
        title="Equivalent raw POST"
        code={`curl -s -X POST http://localhost:8000/api/v1/alerts \\
  -H "Authorization: Bearer $OPENUBA_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
        "message": "Data exfiltration suspected",
        "severity": "critical",
        "entity_id": "alice@corp.example",
        "notify": true,
        "recipients": ["soc@corp.example", "ir-oncall@corp.example"]
      }'`}
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <NextCard
          href="/docs/rule-canvas"
          title="Rule Canvas"
          description="Build the flow rules that fire alerts, and set notify actions + recipients."
        />
        <NextCard
          href="/docs/cases"
          title="Cases"
          description="Escalate alerts into investigations by grouping the underlying anomalies."
        />
      </div>

      <DocFooter slug="alerts" />
    </>
  );
}
