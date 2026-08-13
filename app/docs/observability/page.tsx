import type { Metadata } from "next";
import { DocHeader, H2, H3, P, UL, LI, InlineCode, A, Callout, Table } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Observability — OpenUBA",
  description:
    "How OpenUBA surfaces operational signal today: a JSON /metrics endpoint of Spark/Elasticsearch counters, streamed model run logs, execution logs, and job progress reported by the model runner.",
};

export default function ObservabilityPage() {
  return (
    <>
      <DocHeader
        eyebrow="Platform"
        title="Observability"
        intro="OpenUBA exposes operational signal in four places: a JSON metrics endpoint over the data engines, per-run model logs streamed from the runner into Postgres, execution logs for the model lifecycle, and live job progress reported back over an internal channel."
      />

      <Callout type="note" title="Honest about the current state">
        Metrics today are returned as <strong>domain JSON</strong>, not Prometheus
        exposition format. There is no <InlineCode>/metrics</InlineCode> endpoint
        emitting <InlineCode>text/plain</InlineCode> Prometheus samples yet — the
        endpoints below return structured JSON you can scrape into your own
        pipeline or render in the UI.
      </Callout>

      <H2 id="metrics">The metrics endpoint</H2>
      <P>
        The data router (mounted at <InlineCode>/api/v1/data</InlineCode>) serves a
        combined metrics view over the two data engines. It reflects table and
        index counters straight from Spark and Elasticsearch:
      </P>
      <Table
        head={["Route", "Returns"]}
        rows={[
          [<InlineCode key="1">GET /api/v1/data/metrics</InlineCode>, "Combined { spark, elasticsearch } JSON"],
          [<InlineCode key="2">GET /api/v1/data/metrics/spark</InlineCode>, "Spark table counters only"],
          [<InlineCode key="3">GET /api/v1/data/metrics/elasticsearch</InlineCode>, "Elasticsearch index counters only"],
        ]}
      />
      <CodeBlock
        language="python"
        title="core/api_routers/data.py — /metrics"
        code={`@router.get("/metrics")               # -> GET /api/v1/data/metrics
async def get_all_metrics(
    current_user: dict = Depends(require_permission("data"))
) -> Dict[str, Any]:
    '''get metrics from both spark and elasticsearch'''
    service = DataIngestionService()
    return {
        "spark": service.get_spark_metrics(),
        "elasticsearch": service.get_elasticsearch_metrics(),
    }`}
      />
      <P>
        The shape is domain-oriented — per-table and per-index counters, not
        counter/gauge time series:
      </P>
      <CodeBlock
        language="json"
        title="Example response"
        code={`{
  "spark": {
    "status": "success",
    "total_tables": 3,
    "tables": {
      "auth_events": { "row_count": 128455, "partition_count": 8, "schema": [ ... ] }
    }
  },
  "elasticsearch": {
    "status": "success",
    "total_indices": 5,
    "indices": {
      "openuba-events": { "document_count": 902113, "size_bytes": 734003200 }
    }
  }
}`}
      />

      <H2 id="model-logs">Model run logs</H2>
      <P>
        Each model run streams its own logs into the{" "}
        <InlineCode>model_logs</InlineCode> table. Inside the runner container, a
        custom logging handler captures log records and flushes them to Postgres
        in batches:
      </P>
      <CodeBlock
        language="python"
        title="docker/model-runner/runner.py — ModelLogHandler (abridged)"
        code={`class ModelLogHandler(logging.Handler):
    '''captures log records and flushes them to the model_logs table in batches'''
    def __init__(self, run_id, db_url):
        super().__init__()
        self.run_id = str(run_id)
        self.db_url = db_url
        self.buffer = []
        self.buffer_size = 10

    def emit(self, record):
        self.buffer.append({
            "model_run_id": self.run_id,
            "level": record.levelname.lower(),
            "message": self.format(record),
            "logger_name": record.name,
            "created_at": datetime.utcfromtimestamp(record.created),
        })
        if len(self.buffer) >= self.buffer_size:
            self.flush()

    def flush(self):
        # INSERT INTO model_logs (model_run_id, level, message, logger_name, created_at) ...`}
      />
      <P>
        The corresponding table is straightforward — a row per log line, foreign
        keyed to the run:
      </P>
      <CodeBlock
        language="python"
        title="core/db/models.py — ModelLog"
        code={`class ModelLog(Base):
    __tablename__ = "model_logs"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_run_id = Column(UUID(as_uuid=True), ForeignKey("model_runs.id", ondelete="CASCADE"), nullable=False)
    level        = Column(String(20), nullable=False)
    message      = Column(Text, nullable=False)
    logger_name  = Column(String(255))
    created_at   = Column(TIMESTAMP(timezone=True), server_default=func.now())`}
      />
      <P>
        Logs are retrieved through the jobs API. A job&apos;s logs endpoint falls
        back to the linked run&apos;s <InlineCode>model_logs</InlineCode> when no
        job-scoped logs exist:
      </P>
      <CodeBlock
        language="bash"
        title="Fetching logs"
        code={`# job logs (falls back to model_logs of the linked ModelRun)
GET /api/v1/jobs/{job_id}/logs?limit=1000`}
      />

      <H2 id="execution-logs">Execution logs</H2>
      <P>
        Separately, the <InlineCode>execution_logs</InlineCode> table records the
        model execution lifecycle — status, timing, errors, and a resource-usage /
        output summary — at a coarser grain than the line-by-line model logs:
      </P>
      <CodeBlock
        language="python"
        title="core/db/models.py — ExecutionLog"
        code={`class ExecutionLog(Base):
    __tablename__ = "execution_logs"

    id                     = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_id               = Column(UUID(as_uuid=True), ForeignKey("models.id", ondelete="CASCADE"), nullable=False)
    status                 = Column(String(50), nullable=False)
    started_at             = Column(TIMESTAMP(timezone=True), server_default=func.now())
    completed_at           = Column(TIMESTAMP(timezone=True))
    error_message          = Column(Text)
    error_traceback        = Column(Text)
    execution_time_seconds = Column(DECIMAL(10, 3))
    container_id           = Column(String(255))
    resource_usage         = Column(JSONB)
    output_summary         = Column(JSONB)`}
      />

      <H2 id="job-progress">Job progress and training metrics</H2>
      <P>
        While a job runs, the model runner reports progress and per-epoch metrics
        back to the platform through a <InlineCode>MetricReporter</InlineCode>.
        Metrics go to an internal, unauthenticated endpoint; progress is a{" "}
        <InlineCode>PATCH</InlineCode> on the job:
      </P>
      <CodeBlock
        language="python"
        title="docker/model-runner/runner.py — MetricReporter (abridged)"
        code={`def report(self, metric_name, metric_value, epoch=None, step=None):
    payload = {"metric_name": metric_name, "metric_value": float(metric_value)}
    if epoch is not None: payload["epoch"] = int(epoch)
    if step  is not None: payload["step"]  = int(step)
    url = f"{self.api_url}/api/v1/internal/metrics/{self.job_id}"
    session.post(url, json=payload, timeout=5)          # expects 201

def report_progress(self, progress, epoch_current=None, epoch_total=None, loss=None):
    payload = {"progress": int(progress)}
    # + epoch_current / epoch_total / loss when provided
    session.patch(f"{self.api_url}/api/v1/jobs/{self.job_id}", json=payload, timeout=5)`}
      />
      <Table
        head={["Route", "Direction", "Purpose"]}
        rows={[
          [<InlineCode key="1">POST /api/v1/internal/metrics/{"{job_id}"}</InlineCode>, "runner → API", "Record one training metric (internal, no auth)"],
          [<InlineCode key="2">POST /api/v1/internal/logs/{"{job_id}"}</InlineCode>, "runner → API", "Push a job log line (internal, no auth)"],
          [<InlineCode key="3">PATCH /api/v1/jobs/{"{job_id}"}</InlineCode>, "runner → API", "Report progress / epoch / loss"],
          [<InlineCode key="4">GET /api/v1/jobs/{"{job_id}"}</InlineCode>, "UI → API", "Read status, progress, epoch, loss"],
          [<InlineCode key="5">GET /api/v1/jobs/{"{job_id}"}/metrics</InlineCode>, "UI → API", "Read captured training metrics"],
          [<InlineCode key="6">GET /api/v1/jobs/{"{job_id}"}/metrics/stream</InlineCode>, "UI → API", "SSE stream of metrics + status"],
        ]}
      />

      <H3 id="live-stream">Live streaming to the UI</H3>
      <P>
        For live dashboards, the jobs API exposes a Server-Sent Events stream. It
        polls the job every couple of seconds and emits{" "}
        <InlineCode>metric</InlineCode>, <InlineCode>status</InlineCode>, and{" "}
        <InlineCode>done</InlineCode> events until the job finishes or fails —
        which is how training charts update in real time without a client polling
        loop.
      </P>
      <CodeBlock
        language="bash"
        title="Watching a job train"
        code={`curl -N "$API/api/v1/jobs/$JOB_ID/metrics/stream" -H "Authorization: Bearer $TOKEN"
# event: metric  { "metric_name": "loss", "metric_value": 0.42, "epoch": 3 }
# event: status  { "progress": 60, "epoch_current": 3, "epoch_total": 5, "loss": 0.42 }
# event: done    { ... }`}
      />

      <H2 id="summary">What ships today</H2>
      <UL>
        <LI>
          <strong>Metrics</strong> — JSON domain counters for Spark tables and
          Elasticsearch indices at <InlineCode>/api/v1/data/metrics</InlineCode>.
        </LI>
        <LI>
          <strong>Model logs</strong> — batched into <InlineCode>model_logs</InlineCode>{" "}
          by the runner, read back through the jobs API.
        </LI>
        <LI>
          <strong>Execution logs</strong> — lifecycle rows in{" "}
          <InlineCode>execution_logs</InlineCode> with timing, errors, and usage.
        </LI>
        <LI>
          <strong>Job progress</strong> — reported by{" "}
          <InlineCode>MetricReporter</InlineCode> to internal endpoints and
          streamed to the UI over SSE.
        </LI>
      </UL>
      <Callout type="warning" title="Not yet">
        A Prometheus-format exporter is not part of the current build. If you need
        Prometheus scraping, wrap the JSON <InlineCode>/api/v1/data/metrics</InlineCode>{" "}
        response in your own exporter for now.
      </Callout>

      <H2 id="related">Related</H2>
      <UL>
        <LI>
          <A href="/docs/models">Models &amp; Lifecycle</A> — where runs and jobs
          originate.
        </LI>
        <LI>
          <A href="/docs/data-pipelines">Data Pipelines</A> — the Spark and
          Elasticsearch engines the metrics endpoint reads from.
        </LI>
      </UL>

      <DocFooter slug="observability" />
    </>
  );
}
