import type { Metadata } from "next";
import { DocHeader, H2, H3, P, UL, LI, InlineCode, A, Callout } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Troubleshooting — OpenUBA Docs",
  description: "Fixes for the most common OpenUBA install and runtime issues.",
};

export default function Troubleshooting() {
  return (
    <>
      <DocHeader
        eyebrow="Help"
        title="Troubleshooting"
        intro="The issues people hit most often, and how to resolve them."
      />

      <H2 id="diagnostics">First, gather diagnostics</H2>
      <CodeBlock
        language="bash"
        code={`kubectl get pods -n openuba                      # pod health
kubectl describe pod -n openuba <pod>            # why a pod won't start
kubectl logs -n openuba deploy/backend -f        # backend logs
kubectl logs -n openuba deploy/frontend -f       # frontend logs`}
      />

      <H2 id="port-80">Port 80 or 443 already in use</H2>
      <P>
        Kind&apos;s ingress binds host ports 80 and 443. If another service (often
        nginx) already holds them, cluster creation fails with{" "}
        <InlineCode>address already in use</InlineCode>. Stop that service before{" "}
        <InlineCode>make reset-dev</InlineCode> and start it again afterwards.
      </P>

      <H2 id="urllib3">
        <InlineCode>Cannot uninstall urllib3</InlineCode> on Ubuntu
      </H2>
      <P>
        Ubuntu ships <InlineCode>urllib3</InlineCode> as a Debian package with no
        pip <InlineCode>RECORD</InlineCode> file, so pip refuses to replace it.
        Install with <InlineCode>--ignore-installed</InlineCode>:
      </P>
      <CodeBlock
        language="bash"
        code={`pip3 install -r requirements.txt --break-system-packages --ignore-installed`}
      />

      <H2 id="failed-to-fetch">Login shows &quot;Failed to fetch&quot;</H2>
      <P>
        The frontend is built with its API URL baked in, so on a remote server the
        browser tries to reach <InlineCode>localhost:8000</InlineCode> on your own
        machine. SSH-tunnel <strong>both</strong> ports 3000 and 8000 from your
        workstation:
      </P>
      <CodeBlock
        language="bash"
        code={`ssh -N -L 3000:127.0.0.1:3000 -L 8000:127.0.0.1:8000 user@<server-ip>`}
      />

      <H2 id="osascript">
        <InlineCode>osascript</InlineCode> / Terminal error on Linux
      </H2>
      <P>
        Older releases launched port-forwards with a macOS-only command. Current{" "}
        <InlineCode>scripts/start-dev.sh</InlineCode> detects Linux and backgrounds
        them instead (logged to <InlineCode>port-forward.log</InlineCode>) — update
        to the latest <InlineCode>master</InlineCode> if you still see this.
      </P>

      <H2 id="elasticsearch">Elasticsearch connection errors in the logs</H2>
      <P>
        Elasticsearch is often slower to become ready than the backend expects, so{" "}
        <InlineCode>elastic_transport.ConnectionError</InlineCode> lines during
        startup are usually harmless. Login, rules, alerts, cases, and model runs
        against other data sources all work without it.
      </P>

      <H2 id="pods-pending">Pods stuck in Pending or CrashLoopBackOff</H2>
      <UL>
        <LI>
          <strong>Pending</strong> is usually not enough CPU/memory — give Docker
          more resources, or run with Spark/Elasticsearch disabled.
        </LI>
        <LI>
          <strong>CrashLoopBackOff</strong> — read the logs:{" "}
          <InlineCode>kubectl logs -n openuba &lt;pod&gt; --previous</InlineCode>.
        </LI>
        <LI>
          <strong>ImagePullBackOff / ErrImageNeverPull</strong> — the image
          wasn&apos;t loaded into Kind. Re-run{" "}
          <InlineCode>make load-images</InlineCode>.
        </LI>
      </UL>

      <H2 id="model-runs">A model run fails immediately</H2>
      <P>
        Check the run&apos;s logs (streamed to the <InlineCode>model_logs</InlineCode>{" "}
        table and surfaced in the UI) and the model&apos;s data source. A missing or
        misconfigured data source — an unreachable Elasticsearch/Splunk host, or a
        Spark table that doesn&apos;t exist — is the most common cause. See{" "}
        <A href="/docs/execution-sandbox">Execution Sandbox</A> and{" "}
        <A href="/docs/observability">Observability</A>.
      </P>

      <H2 id="clean-slate">Start over from a clean slate</H2>
      <P>When in doubt, rebuild everything:</P>
      <CodeBlock language="bash" code={`make reset-dev`} />

      <Callout type="note" title="Still stuck?">
        Open an issue on{" "}
        <A href="https://github.com/GACWR/OpenUBA/issues">GitHub</A> with the
        failing command and the relevant <InlineCode>kubectl logs</InlineCode>{" "}
        output, or ask in the{" "}
        <A href="https://discord.gg/Ps9p9Wy">Discord</A>.
      </Callout>

      <DocFooter slug="troubleshooting" />
    </>
  );
}
