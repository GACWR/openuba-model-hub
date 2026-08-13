import type { Metadata } from "next";
import { DocHeader, H2, H3, P, UL, OL, LI, InlineCode, A, Callout, Table, NextCard } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Data Pipelines — OpenUBA",
  description:
    "OpenUBA's dual Elasticsearch + Spark data pipelines: the connectors, the DataIngestionService, source groups, and how a model selects a data source at run time.",
};

export default function DataPipelines() {
  return (
    <>
      <DocHeader
        eyebrow="Platform"
        title="Data Pipelines"
        intro="OpenUBA reads security data through two complementary backends: Elasticsearch for query-driven search, and Apache Spark for table-based, distributed batch reads. Ingestion loads raw log files into both, and 'source groups' let you name and reuse multi-source data definitions across models."
      />

      <H2 id="two-backends">Two backends, two jobs</H2>
      <P>
        The data layer is intentionally dual. Elasticsearch is the{" "}
        <strong>query path</strong> — you hand it a query and it returns matching
        events. Apache Spark is the <strong>batch path</strong> — you name a table
        and it reads the whole thing, in local mode for development or against a
        cluster for scale. Both connectors live in{" "}
        <InlineCode>core/integrations/</InlineCode> and are lazily connected, so
        importing them is cheap and a missing backend never blocks startup.
      </P>
      <Table
        head={["Connector", "Backend", "Read primitive", "Connection default"]}
        rows={[
          [
            <InlineCode key="1">ElasticsearchConnector</InlineCode>,
            "Elasticsearch 8.11",
            <span key="1r">
              <InlineCode>search_events(query, index, size)</InlineCode>
            </span>,
            <InlineCode key="1c">ELASTICSEARCH_HOST</InlineCode>,
          ],
          [
            <InlineCode key="2">SparkConnector</InlineCode>,
            "Apache Spark 3.5",
            <span key="2r">
              <InlineCode>read_data(path, format)</InlineCode>
            </span>,
            <InlineCode key="2c">SPARK_MASTER_URL</InlineCode>,
          ],
        ]}
      />

      <H2 id="es-connector">The Elasticsearch connector</H2>
      <P>
        <InlineCode>ElasticsearchConnector</InlineCode> wraps the official{" "}
        <InlineCode>elasticsearch</InlineCode> Python client. Its constructor takes
        an optional list of hosts, defaulting to the{" "}
        <InlineCode>ELASTICSEARCH_HOST</InlineCode> environment variable (or{" "}
        <InlineCode>http://localhost:9200</InlineCode>). The client is created
        lazily on first use.
      </P>
      <CodeBlock
        language="python"
        title="core/integrations/elasticsearch.py"
        code={`class ElasticsearchConnector:
    def __init__(self, hosts: Optional[List[str]] = None):
        self.hosts = hosts or [os.getenv("ELASTICSEARCH_HOST", "http://localhost:9200")]
        self.client = None

    def connect(self):
        from elasticsearch import Elasticsearch
        self.client = Elasticsearch(
            hosts=self.hosts, timeout=60, max_retries=3, retry_on_timeout=True)
        if not self.client.ping():
            raise Exception("elasticsearch ping failed")

    def search_events(self, query, index="openuba-events", size=100):
        if self.client is None:
            self.connect()
        response = self.client.search(index=index, body={"query": query}, size=size)
        return [hit["_source"] for hit in response["hits"]["hits"]]`}
      />
      <P>
        Alongside the query path, the connector offers index management and write
        helpers: <InlineCode>index_anomaly</InlineCode>,{" "}
        <InlineCode>create_index</InlineCode>, <InlineCode>delete_index</InlineCode>,{" "}
        <InlineCode>bulk_index</InlineCode> (built on{" "}
        <InlineCode>elasticsearch.helpers.bulk</InlineCode>),{" "}
        <InlineCode>get_index_stats</InlineCode>, and{" "}
        <InlineCode>list_indices</InlineCode>.
      </P>

      <H2 id="spark-connector">The Spark connector</H2>
      <P>
        <InlineCode>SparkConnector</InlineCode> builds a{" "}
        <InlineCode>SparkSession</InlineCode> with Hive support enabled. Its
        constructor takes an optional master URL, defaulting to{" "}
        <InlineCode>SPARK_MASTER_URL</InlineCode> or{" "}
        <InlineCode>local[*]</InlineCode> — so it supports both local development
        and a real cluster with no code change. Crucially, it degrades gracefully:
        if PySpark is missing or the session cannot be built, it logs and sets{" "}
        <InlineCode>self.spark = None</InlineCode> rather than raising.
      </P>
      <CodeBlock
        language="python"
        title="core/integrations/spark.py"
        code={`class SparkConnector:
    def __init__(self, master_url=None, app_name="openuba"):
        self.master_url = master_url or os.getenv("SPARK_MASTER_URL", "local[*]")
        self.app_name = app_name
        self.spark = None

    def connect(self):
        from pyspark.sql import SparkSession
        self.spark = (SparkSession.builder
            .appName(self.app_name)
            .master(self.master_url)
            .config("spark.driver.memory", "512m")
            .config("spark.executor.memory", "512m")
            .enableHiveSupport()
            .getOrCreate())

    def read_data(self, path, format="parquet", **options):
        if self.spark is None: self.connect()
        if format == "parquet": return self.spark.read.parquet(path)
        elif format == "csv":   return self.spark.read.csv(path, header=..., inferSchema=...)
        elif format == "json":  return self.spark.read.json(path)`}
      />
      <Callout type="note" title="Cluster vs local">
        In the Kubernetes deployment the backend sets{" "}
        <InlineCode>SPARK_MASTER_URL=spark://spark-master:7077</InlineCode> so
        reads run against the Spark cluster. On a laptop the default{" "}
        <InlineCode>local[*]</InlineCode> runs Spark in-process. Either way, the
        model code is identical.
      </Callout>

      <H2 id="ingestion">Data ingestion</H2>
      <P>
        <InlineCode>DataIngestionService</InlineCode> (in{" "}
        <InlineCode>core/services/data_ingestion.py</InlineCode>) is the write side
        of the pipeline. It owns one of each connector and loads raw log files —
        from a <InlineCode>test_datasets/</InlineCode> tree keyed by the{" "}
        <InlineCode>TEST_DATASETS_PATH</InlineCode> variable — into both Spark
        tables and Elasticsearch indices.
      </P>
      <CodeBlock
        language="python"
        title="core/services/data_ingestion.py"
        code={`class DataIngestionService:
    def __init__(self, spark_master_url=None, elasticsearch_hosts=None):
        self.spark_connector = SparkConnector(
            master_url=spark_master_url or os.getenv("SPARK_MASTER_URL", "spark://spark-master:7077"))
        self.es_connector = ElasticsearchConnector(
            hosts=elasticsearch_hosts or [os.getenv("ELASTICSEARCH_HOST", "http://elasticsearch:9200")])

    def ingest_to_spark(self, dataset_path, table_name, format="csv", **options):
        # DROP TABLE IF EXISTS, then CREATE TABLE ... USING <format>
        # LOCATION '<dataset_path>' — an external table (no data copy)
        ...

    def ingest_to_elasticsearch(self, dataset_path, index_name, format="csv", **options):
        # read with pandas, add @timestamp, recreate index, then bulk_index(...)
        ...`}
      />
      <P>
        The higher-level <InlineCode>ingest_from_test_datasets</InlineCode> walks a
        dataset&apos;s log types (ssh, dns, dhcp, proxy, and so on), picks the
        right separators and encodings per log type, and names each Spark table{" "}
        <InlineCode>{"{dataset}_{log_type}"}</InlineCode> and each ES index{" "}
        <InlineCode>{"openuba-{log_type}-{dataset}"}</InlineCode>. Each run is
        tracked as a row in a <InlineCode>data_ingestion_runs</InlineCode> table.
      </P>
      <Callout type="note" title="Ingestion is pandas, reads are backend-native">
        The clean &quot;Elasticsearch = query / Spark = batch&quot; split holds on
        the model <em>read</em> side. On the ingestion side the roles blur:
        Spark ingestion registers external tables, while ES ingestion reads files
        with pandas before bulk-indexing them.
      </Callout>

      <H2 id="source-groups">Source groups</H2>
      <P>
        A <strong>source group</strong> is a named, reusable multi-source data
        definition. Instead of hard-coding a table name or an ES query inside a
        model, you define a group once — a slug plus a list of source
        definitions — and models reference it by slug. The definition is stored in
        the <InlineCode>source_groups</InlineCode> table.
      </P>
      <CodeBlock
        language="python"
        title="core/db/models.py — SourceGroup"
        code={`class SourceGroup(Base):
    __tablename__ = "source_groups"
    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug        = Column(Text, unique=True, nullable=False)
    description = Column(Text)
    config      = Column(JSONB)   # list of source definitions
    created_at  = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at  = Column(TIMESTAMP(timezone=True), server_default=func.now(),
                         onupdate=func.now())`}
      />

      <H3 id="source-group-routes">CRUD routes</H3>
      <P>
        The <InlineCode>source_groups</InlineCode> router mounts under{" "}
        <InlineCode>/source_groups</InlineCode>. It exposes list, get, create, and
        update — there is intentionally no delete endpoint.
      </P>
      <Table
        head={["Method", "Path", "Behavior"]}
        rows={[
          ["GET", <InlineCode key="1">/source_groups/</InlineCode>, "List all source groups"],
          ["GET", <InlineCode key="2">/source_groups/{"{group_id}"}</InlineCode>, "Fetch one (404 if missing)"],
          ["POST", <InlineCode key="3">/source_groups/</InlineCode>, "Create (400 if the slug already exists)"],
          ["PUT", <InlineCode key="4">/source_groups/{"{group_id}"}</InlineCode>, "Update (404 if missing)"],
        ]}
      />
      <P>
        The request body carries a <InlineCode>slug</InlineCode>, an optional{" "}
        <InlineCode>description</InlineCode>, and a{" "}
        <InlineCode>config</InlineCode> list of source dictionaries. Each source
        dictionary describes one physical source — its{" "}
        <InlineCode>type</InlineCode> (for example <InlineCode>csv</InlineCode> or{" "}
        <InlineCode>es</InlineCode>), its <InlineCode>location_type</InlineCode>,
        and a <InlineCode>log_name</InlineCode> that keys it within the group.
      </P>

      <H3 id="source-group-loader">SourceGroupLoader</H3>
      <P>
        <InlineCode>SourceGroupLoader</InlineCode> (in{" "}
        <InlineCode>core/model_modules/source_group/loader.py</InlineCode>) is the
        meta-loader that turns a slug into actual data. Given a context with a{" "}
        <InlineCode>source_group_slug</InlineCode>, it fetches the group&apos;s
        config from the database and delegates to a physical loader. If a{" "}
        <InlineCode>log_name</InlineCode> is provided it loads that single source;
        otherwise it loads all sources into a dict keyed by each source&apos;s{" "}
        <InlineCode>log_name</InlineCode> (multi-table support).
      </P>
      <CodeBlock
        language="python"
        title="core/model_modules/source_group/loader.py"
        code={`def _fetch_config(self, slug):
    with get_db_context() as db:
        sg = db.query(SourceGroup).filter(SourceGroup.slug == slug).first()
        return sg.config if sg else None

def _load_single_source(self, source_config):
    if source_config["type"] == "csv" and source_config["location_type"] == "disk":
        return LocalPandasLoader().load(source_config)
    if source_config["type"] == "es":
        raise NotImplementedError("ElasticSearch delegation not yet implemented "
                                  "in SourceGroupLoader")
    raise ValueError("unsupported source type")`}
      />
      <Callout type="warning" title="Current coverage">
        Within <InlineCode>SourceGroupLoader</InlineCode>, only the CSV-on-disk
        path is wired up today; the Elasticsearch delegation raises{" "}
        <InlineCode>NotImplementedError</InlineCode>. Direct model loaders (below)
        do support Elasticsearch and Spark — the source-group meta-loader is
        catching up to them.
      </Callout>

      <H2 id="model-data">How a model selects a data source</H2>
      <P>
        Regardless of backend, a model always receives its data as a{" "}
        <InlineCode>CoreDataFrame</InlineCode> — a pandas DataFrame wrapper from{" "}
        <InlineCode>core.dataset</InlineCode>. The loaders in{" "}
        <InlineCode>core/model_modules/</InlineCode> each expose a{" "}
        <InlineCode>.data</InlineCode> property that returns one:
      </P>
      <Table
        head={["Loader", "Backend", "Returns"]}
        rows={[
          [<InlineCode key="1">LocalPandasCSV</InlineCode>, "Local disk", ".data — CSV read via DatasetSession"],
          [<InlineCode key="2">ESGeneric</InlineCode>, "Elasticsearch", ".data — query results as a CoreDataFrame"],
          [<InlineCode key="3">SparkDataLoader</InlineCode>, "Spark table", ".data — table read, then toPandas()"],
        ]}
      />
      <P>
        In the current container-based runner, the model chooses its source at run
        time from the request payload. The <InlineCode>basic_model</InlineCode>{" "}
        reference implementation reads a <InlineCode>data_source</InlineCode> key
        (defaulting to <InlineCode>spark</InlineCode>) and branches:
      </P>
      <CodeBlock
        language="python"
        title="core/model_library/basic_model/MODEL.py"
        code={`def run(self, input_data):
    data_source = input_data.get("data_source") or input_data.get("type", "spark")

    if data_source == "spark":
        df = SparkDataLoader(table_name=input_data["table_name"]).data
    elif data_source == "elasticsearch":
        df = ESGeneric(host=es_host, query=input_data["query"]).data
    elif data_source == "local_csv":
        df = LocalPandasCSV(file_path, file_name).data
    ...`}
      />
      <P>
        The orchestrator forwards <InlineCode>SPARK_MASTER_URL</InlineCode> and{" "}
        <InlineCode>ELASTICSEARCH_HOST</InlineCode> into each runner container&apos;s
        environment, so the loader connects to the right backend without the model
        knowing the topology. This is the run-time end of the{" "}
        <A href="/docs/kubernetes">operator flow</A>: the CR launches a Job, the
        Job runs the model, and the model pulls its data through one of these
        loaders.
      </P>

      <H2 id="config">Configuration</H2>
      <P>
        The data pipeline is entirely environment-variable driven — there is no
        dedicated settings file for Elasticsearch or Spark.
      </P>
      <Table
        head={["Variable", "Used by", "Cluster default"]}
        rows={[
          [<InlineCode key="1">ELASTICSEARCH_HOST</InlineCode>, "ES connector, ingestion, runner", <InlineCode key="1v">http://elasticsearch:9200</InlineCode>],
          [<InlineCode key="2">SPARK_MASTER_URL</InlineCode>, "Spark connector, ingestion, runner", <InlineCode key="2v">spark://spark-master:7077</InlineCode>],
          [<InlineCode key="3">TEST_DATASETS_PATH</InlineCode>, "Ingestion service", <InlineCode key="3v">/app/test_datasets</InlineCode>],
        ]}
      />

      <H2 id="next">Where to go next</H2>
      <div className="grid gap-3 sm:grid-cols-2 mt-4">
        <NextCard
          href="/docs/architecture"
          title="Architecture"
          description="Where the data layer sits in the platform."
        />
        <NextCard
          href="/docs/kubernetes"
          title="Kubernetes-Native"
          description="How a run becomes a Job that reads this data."
        />
        <NextCard
          href="/docs/execution-sandbox"
          title="Execution Sandbox"
          description="The runner that instantiates these loaders."
        />
        <NextCard
          href="/docs/models"
          title="Models & Lifecycle"
          description="How models declare and consume their data."
        />
      </div>

      <DocFooter slug="data-pipelines" />
    </>
  );
}
