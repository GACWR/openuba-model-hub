import type { Metadata } from "next";
import { DocHeader, H2, H3, P, UL, LI, InlineCode, A, Callout, Table, NextCard } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Scheduling — OpenUBA Docs",
  description:
    "Recurring model runs in OpenUBA via the model scheduler — APScheduler and Kubernetes CronJob modes, cron expressions, and the schedules REST API.",
};

export default function Page() {
  return (
    <>
      <DocHeader
        eyebrow="Detection & Investigation"
        title="Scheduling"
        intro="Detection is only as fresh as your last model run. OpenUBA's scheduler runs models on a recurring cron schedule so anomalies, rule evaluation, and alerts stay current without manual triggering. The same scheduling API backs two execution backends — an in-process APScheduler and native Kubernetes CronJobs — selected by environment."
      />

      <H2 id="overview">How scheduling works</H2>
      <P>
        The <InlineCode>ModelScheduler</InlineCode> service manages recurring model
        executions. Creating a schedule registers a recurring job that, when it
        fires, invokes the <A href="/docs/anomalies">orchestrator</A> to execute the
        model — which in turn produces anomalies, evaluates{" "}
        <A href="/docs/rule-canvas">flow rules</A>, and fires{" "}
        <A href="/docs/alerts">alerts</A>, exactly as a manual run would.
      </P>
      <P>
        A model must be <InlineCode>installed</InlineCode> or{" "}
        <InlineCode>active</InlineCode> before it can be scheduled; scheduling any
        other status is rejected. When a schedule is created, its details are also
        written into the model&apos;s <InlineCode>manifest</InlineCode> under a{" "}
        <InlineCode>schedule</InlineCode> key so the association survives and can be
        enriched when listing.
      </P>

      <H2 id="backends">Scheduler backends</H2>
      <P>
        The backend is chosen by the <InlineCode>SCHEDULER_TYPE</InlineCode>{" "}
        environment variable, defaulting to <InlineCode>apscheduler</InlineCode>.
      </P>
      <Table
        head={["SCHEDULER_TYPE", "Backend", "Best for"]}
        rows={[
          [<InlineCode key="1">apscheduler</InlineCode>, "An in-process APScheduler BackgroundScheduler with cron triggers.", "Single-node / Docker deployments."],
          [<InlineCode key="2">kubernetes</InlineCode>, "Native Kubernetes CronJob resources in the batch/v1 API.", "Clustered deployments running models as K8s jobs."],
        ]}
      />
      <Callout type="note" title="Graceful degradation">
        If <InlineCode>SCHEDULER_TYPE</InlineCode> is{" "}
        <InlineCode>apscheduler</InlineCode> but the APScheduler package is not
        installed, the scheduler logs a warning and scheduling is unavailable
        rather than crashing the service.
      </Callout>

      <H3 id="apscheduler">APScheduler mode</H3>
      <P>
        In this mode the scheduler starts a background scheduler in-process and
        registers a cron-triggered job per model, with job id{" "}
        <InlineCode>model_&lt;model_id&gt;</InlineCode>. When the trigger fires, the
        job calls <InlineCode>orchestrator.execute_model(model_id)</InlineCode>.
        Existing jobs for the same model are replaced on re-create. If a schedule is
        created with <InlineCode>enabled=false</InlineCode>, no job is registered.
      </P>

      <H3 id="kubernetes">Kubernetes CronJob mode</H3>
      <P>
        In this mode the scheduler creates a Kubernetes{" "}
        <InlineCode>CronJob</InlineCode> named{" "}
        <InlineCode>model-schedule-&lt;model_id&gt;</InlineCode> in the namespace
        from <InlineCode>KUBERNETES_NAMESPACE</InlineCode> (default{" "}
        <InlineCode>default</InlineCode>). The CronJob runs the{" "}
        <InlineCode>openuba-backend</InlineCode> image, invoking the orchestrator
        for the model, with <InlineCode>restartPolicy: OnFailure</InlineCode>. The{" "}
        <InlineCode>enabled</InlineCode> flag maps to the CronJob&apos;s{" "}
        <InlineCode>suspend</InlineCode> field, so a disabled schedule is a
        suspended CronJob. Cluster config is loaded via in-cluster config, falling
        back to local kubeconfig.
      </P>

      <H2 id="cron">Cron expressions</H2>
      <P>
        Schedules use a standard five-field cron expression:{" "}
        <InlineCode>minute hour day month day_of_week</InlineCode>. The expression
        must have exactly five space-separated parts or creation is rejected. The
        same five-field form is used in both backends.
      </P>
      <Table
        head={["Expression", "Runs"]}
        rows={[
          [<InlineCode key="1">0 2 * * *</InlineCode>, "Every day at 02:00."],
          [<InlineCode key="2">*/15 * * * *</InlineCode>, "Every 15 minutes."],
          [<InlineCode key="3">0 * * * *</InlineCode>, "At the top of every hour."],
          [<InlineCode key="4">0 9 * * 1-5</InlineCode>, "09:00 on weekdays."],
          [<InlineCode key="5">30 6 1 * *</InlineCode>, "06:30 on the first of each month."],
        ]}
      />

      <H2 id="api">The schedules API</H2>
      <P>
        Schedule endpoints live under <InlineCode>/api/v1</InlineCode> and require
        the <InlineCode>schedules:write</InlineCode> permission.
      </P>
      <Table
        head={["Method & path", "Purpose"]}
        rows={[
          [<InlineCode key="1">POST /api/v1/models/{"{"}model_id{"}"}/schedule</InlineCode>, "Create a schedule for a model."],
          [<InlineCode key="2">DELETE /api/v1/models/{"{"}model_id{"}"}/schedule</InlineCode>, "Remove a model's schedule."],
          [<InlineCode key="3">GET /api/v1/schedules</InlineCode>, "List all active schedules across models."],
        ]}
      />
      <P>
        The create body takes <InlineCode>cron_expression</InlineCode> and an{" "}
        <InlineCode>enabled</InlineCode> flag (default true). The response includes
        the generated schedule <InlineCode>id</InlineCode>, the{" "}
        <InlineCode>model_id</InlineCode>, the <InlineCode>cron_expression</InlineCode>,{" "}
        <InlineCode>enabled</InlineCode>, and (for APScheduler) the next run time.
      </P>
      <CodeBlock
        language="bash"
        title="Schedule a model to run nightly at 2 AM"
        code={`curl -s -X POST \\
  "http://localhost:8000/api/v1/models/$MODEL_ID/schedule" \\
  -H "Authorization: Bearer $OPENUBA_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"cron_expression": "0 2 * * *", "enabled": true}'`}
      />
      <CodeBlock
        language="json"
        title="Schedule response"
        code={`{
  "id": "model_8a3e...",
  "model_id": "8a3e...",
  "cron_expression": "0 2 * * *",
  "enabled": true,
  "next_run": "2026-08-14T02:00:00Z"
}`}
      />
      <CodeBlock
        language="bash"
        title="List and delete schedules"
        code={`# list every active schedule
curl -s http://localhost:8000/api/v1/schedules \\
  -H "Authorization: Bearer $OPENUBA_TOKEN"

# remove a model's schedule
curl -s -X DELETE \\
  "http://localhost:8000/api/v1/models/$MODEL_ID/schedule" \\
  -H "Authorization: Bearer $OPENUBA_TOKEN"`}
      />
      <Callout type="tip" title="Schedules feed the whole detection pipeline">
        Because a scheduled run is a normal inference run, everything downstream
        happens automatically on each tick: anomalies are persisted, the{" "}
        <A href="/docs/rule-canvas">rule engine</A> evaluates them, and{" "}
        <A href="/docs/alerts">alerts and notifications</A> go out. Scheduling a
        model is effectively scheduling your detections.
      </Callout>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <NextCard
          href="/docs/anomalies"
          title="Anomalies & Entity Risk"
          description="What each scheduled inference run produces and how to query it."
        />
        <NextCard
          href="/docs/alerts"
          title="Alerts & Notifications"
          description="How scheduled runs surface as alerts and realtime notifications."
        />
      </div>

      <DocFooter slug="scheduling" />
    </>
  );
}
