/* Search index for the docs command palette. Assembled from the nav manifest
   (title, group, path) enriched with a per-page description + keyword blurb.
   Any page missing from DOC_META still appears (title + group only). */

import { DOCS_NAV, docHref } from "@/lib/docs";

export interface SearchDoc {
  slug: string;
  title: string;
  group: string;
  href: string;
  description: string;
  keywords: string;
}

/* description + extra searchable keywords per slug */
const DOC_META: Record<string, { description: string; keywords: string }> = {
  "": {
    description: "What the OpenUBA Model Hub is and how the pieces fit together.",
    keywords: "introduction overview getting started ueba uba behavior analytics security",
  },
  quickstart: {
    description: "Install the SDK, pull a model, and run it in minutes.",
    keywords: "quickstart get started pip install openuba run model cli sdk",
  },
  concepts: {
    description:
      "The vocabulary of OpenUBA — entities, models, anomalies, rules, alerts, cases, source groups — and how a detection flows end to end.",
    keywords:
      "core concepts entity model anomaly rule alert case source group detection flow vocabulary platform hub sdk",
  },
  installation: {
    description:
      "Install the full OpenUBA platform: Kind setup, Kubernetes, local dev, Docker Compose, Ubuntu Server.",
    keywords:
      "install installation setup make reset-dev kind kubernetes docker compose ubuntu server prerequisites ports",
  },
  "installing-models": {
    description: "Browse the catalog and install models with the CLI or SDK.",
    keywords: "install models catalog cli openuba install list uninstall model dir",
  },
  sdk: {
    description: "The openuba Python SDK: install, run, and manage UBA models.",
    keywords: "python sdk openuba client configure run install send_alert query_anomalies token",
  },
  "model-format": {
    description: "The MODEL.py + model.yaml contract every model follows.",
    keywords: "model format MODEL.py model.yaml class train infer execute parameters framework",
  },
  publishing: {
    description: "Add your model to the Hub via a pull request.",
    keywords: "publish contribute model registry pull request path tags",
  },
  registry: {
    description: "The registry/models.json format that powers the catalog and SDK.",
    keywords: "registry models.json format fields slug version framework path OPENUBA_HUB_URL",
  },
  troubleshooting: {
    description: "Fixes for the most common install and runtime issues.",
    keywords:
      "troubleshooting errors port 80 urllib3 failed to fetch ssh tunnel osascript elasticsearch crashloopbackoff pending kubectl logs",
  },
  faq: {
    description: "Frequently asked questions about the Model Hub.",
    keywords: "faq questions free server safe frameworks contribute help",
  },

  // Platform
  architecture: {
    description:
      "The full OpenUBA platform architecture: Next.js frontend, FastAPI backend, PostGraphile, the Kopf operator, the data layer, and the ephemeral execution plane.",
    keywords:
      "architecture fastapi next.js postgraphile graphql kopf operator postgresql elasticsearch spark kubernetes jobs ephemeral model orchestrator api routers system of record ueba",
  },
  kubernetes: {
    description:
      "OpenUBA's CRDs (UBATraining, UBAInference, UBAPipeline, UBAWorkspace), the Kopf operator and handlers, RBAC, and how a run becomes a Custom Resource then a Job.",
    keywords:
      "kubernetes crd custom resource kopf operator ubatraining ubainference ubapipeline ubaworkspace openuba.io rbac clusterrole job framework image model-runner ttl backofflimit hardware tier",
  },
  "data-pipelines": {
    description:
      "The dual Elasticsearch + Spark data pipelines, ingestion, and reusable source groups.",
    keywords:
      "data pipeline elasticsearch spark connector ingestion source group sourcegrouploader coredataframe pandas model modules data source ELASTICSEARCH_HOST SPARK_MASTER_URL batch query jsonb",
  },
  authentication: {
    description:
      "JWT bearer auth (python-jose), the login flow, get_current_user, and role-based access control via require_permission and the role_permissions table.",
    keywords:
      "authentication authorization rbac jwt python-jose bearer token oauth2 login get_current_user require_permission role_permissions roles admin analyst manager triage permissions matrix passlib bcrypt sse users",
  },
  graphql: {
    description:
      "PostGraphile auto-generates the GraphQL API from the Postgres schema — deployment, endpoints, auto-CRUD, and how the Rule Canvas reads and writes flow_graph.",
    keywords:
      "graphql postgraphile rules flow_graph createRule updateRuleById allRules apollo subscriptions graphiql auto-crud jsonb",
  },
  assistant: {
    description:
      "An omnipresent chat window backed by a multi-provider LLM chat service (Ollama, OpenAI, Claude, Gemini) with SSE streaming and page/entity context injection.",
    keywords:
      "llm assistant chat ollama openai claude gemini sse streaming thinking blocks context injection integration_settings provider investigation",
  },
  observability: {
    description:
      "Operational signal today: JSON /metrics of Spark/Elasticsearch counters, streamed model logs, execution logs, and job progress reporting.",
    keywords:
      "observability metrics json spark elasticsearch model_logs execution_logs MetricReporter ModelLogHandler jobs sse prometheus internal metrics logs",
  },

  // Detection & Investigation
  anomalies: {
    description:
      "How models produce anomalies, the anomaly data shape, entity risk aggregation, and how to query them via REST and the SDK.",
    keywords:
      "anomaly anomalies entity_id entity_type risk_score anomaly_type details timestamp AnomalyRepository entities entity risk get_entity_risk query_anomalies acknowledge /api/v1/anomalies /api/v1/entities run_id min_risk_score",
  },
  cases: {
    description:
      "Case management for investigation: the Case model, statuses and severity, linking anomalies, the cases API, and query_cases.",
    keywords:
      "case cases investigation status open investigating resolved closed severity assigned_to analyst_notes case_anomalies link anomaly CaseRepository /api/v1/cases query_cases",
  },
  "rule-canvas": {
    description:
      "The visual, flow-based rule builder: node types, how the rule engine evaluates the flow_graph DAG after inference, rule types, and alert node actions.",
    keywords:
      "rule canvas ReactFlow flow_graph DAG rule engine evaluate_after_inference node model anomaly case comparison and or not gate alert single-fire deviation flow fire_alert open_case notify fire_alert_and_notify recipients",
  },
  alerts: {
    description:
      "How alerts are created and deduplicated, and delivered as realtime notifications over SMTP email and in-app — plus raising alerts from the SDK.",
    keywords:
      "alert alerts notifications smtp email in-app AlertNotifier EmailService notification_service _fire_alert dedup acknowledge send_alert notify recipients POST /api/v1/alerts Settings Notifications default_recipients use_tls use_ssl",
  },
  scheduling: {
    description:
      "Recurring model runs via the model scheduler — APScheduler and Kubernetes CronJob modes, cron expressions, and the schedules API.",
    keywords:
      "schedule scheduling ModelScheduler APScheduler kubernetes CronJob cron expression SCHEDULER_TYPE recurring model run /api/v1/schedules cron_expression enabled next_run",
  },

  // Models & Execution
  models: {
    description:
      "The model as a first-class entity: register, install, train, and run inference; statuses, versions, artifacts, runs, and the REST + SDK surface.",
    keywords:
      "model lifecycle register install train execute inference status pending installed active disabled ModelVersion ModelArtifact ModelRun model_library runtime manifest POST /api/v1/models data_source openuba.run",
  },
  "execution-sandbox": {
    description:
      "How models run — the containerized model runner, the v2 Model class vs v1 execute(), the five ML runtime images, data-source loading, and Docker vs Kubernetes modes.",
    keywords:
      "execution sandbox model runner container v2 Model class train infer v1 execute runtime image base sklearn pytorch tensorflow networkx data source Docker Kubernetes UBAInference UBATraining artifact checkpoint",
  },
  workspaces: {
    description:
      "On-demand JupyterLab workspaces — hardware tiers, NodePort allocation, the UBAWorkspace CRD and Kopf handler, and the preinstalled SDK.",
    keywords:
      "workspace jupyterlab notebook hardware tier cpu-small cpu-large gpu nodeport UBAWorkspace CRD kopf operator PVC pod service SDK preinstalled 8888 access_url",
  },
  "registry-adapters": {
    description:
      "The multi-backend model registry — code and weights adapters (local FS, GitHub, Hub, HuggingFace, Kubeflow), unified search, and install-time SHA-256 integrity verification.",
    keywords:
      "registry adapter code weights local_fs github openuba_hub huggingface kubeflow unified search SHA-256 hash verification VERIFY_MODE integrity ModelInstaller RegistryService source_type",
  },

  // Integrations
  integrations: {
    description:
      "Every external integration is configured centrally under Settings → Integrations, stored in integration_settings, with a connectivity test and secret masking.",
    keywords:
      "integrations settings integration_settings secret masking connectivity test elasticsearch spark splunk smtp llm providers ollama openai claude gemini",
  },
  splunk: {
    description:
      "Bidirectional Splunk integration: run an SPL search as a model data source, and forward anomalies to Splunk via the HTTP Event Collector.",
    keywords:
      "splunk spl hec http event collector data_source splunk_search splunk_index anomaly_index forward_anomalies SplunkConnector hec_token siem search export",
  },
};

export const SEARCH_DOCS: SearchDoc[] = DOCS_NAV.flatMap((group) =>
  group.items.map((item) => {
    const meta = DOC_META[item.slug] ?? { description: "", keywords: "" };
    return {
      slug: item.slug,
      title: item.title,
      group: group.title,
      href: docHref(item.slug),
      description: meta.description,
      keywords: meta.keywords,
    };
  })
);
