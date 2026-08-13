import type { Metadata } from "next";
import { DocHeader, H2, H3, P, UL, OL, LI, InlineCode, A, Callout, Table } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "LLM Investigation Assistant — OpenUBA",
  description:
    "An omnipresent chat window, available on every page, backed by a multi-provider chat service (Ollama, OpenAI, Claude, Gemini) with SSE streaming, thinking-block parsing, and page/entity context injection.",
};

export default function AssistantPage() {
  return (
    <>
      <DocHeader
        eyebrow="Detection & Investigation"
        title="LLM Investigation Assistant"
        intro="A chat window that follows the analyst across the entire product. It streams responses from a provider you choose — Ollama, OpenAI, Claude, or Gemini — and is fed live context about the page you are on and the state of the system."
      />

      <H2 id="omnipresent">An assistant on every page</H2>
      <P>
        The assistant is not a standalone page. It is a floating chat window
        mounted once, as a sibling of the authenticated app shell, so it is
        available everywhere an authenticated user goes. It is deliberately
        excluded from the login screen and from unauthenticated views.
      </P>
      <CodeBlock
        language="tsx"
        title="interface/src/components/layout/authenticated-shell.tsx"
        code={`export function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()

  // login page or unauthenticated — render children directly (no shell, no chat)
  if (!user || pathname === "/login") {
    return <>{children}</>
  }

  return (
    <>
      <AppShell>{children}</AppShell>
      <LLMChatWindow />        {/* omnipresent, sibling to the shell */}
    </>
  )
}`}
      />
      <P>
        The window is draggable, remembers its position and size, and persists
        the conversation and provider selection to{" "}
        <InlineCode>localStorage</InlineCode> (via a Zustand store) so it survives
        page reloads.
      </P>

      <H2 id="providers">Multi-provider chat service</H2>
      <P>
        On the backend, <InlineCode>ChatService</InlineCode> abstracts four
        providers behind one streaming interface. The active provider dispatches
        to a dedicated streaming method:
      </P>
      <Table
        head={["Provider", "Config keys", "Endpoint / call"]}
        rows={[
          [<InlineCode key="1">ollama</InlineCode>, <span key="2"><InlineCode>host</InlineCode>, <InlineCode>model</InlineCode></span>, <InlineCode key="3">POST {"{host}"}/api/generate</InlineCode>],
          [<InlineCode key="4">openai</InlineCode>, <span key="5"><InlineCode>api_key</InlineCode>, <InlineCode>model</InlineCode>, <InlineCode>base_url</InlineCode></span>, <InlineCode key="6">POST {"{base_url}"}/chat/completions</InlineCode>],
          [<InlineCode key="7">claude</InlineCode>, <span key="8"><InlineCode>api_key</InlineCode>, <InlineCode>model</InlineCode></span>, <InlineCode key="9">POST api.anthropic.com/v1/messages</InlineCode>],
          [<InlineCode key="10">gemini</InlineCode>, <span key="11"><InlineCode>api_key</InlineCode>, <InlineCode>model</InlineCode></span>, <InlineCode key="12">…:streamGenerateContent (SSE)</InlineCode>],
        ]}
      />
      <CodeBlock
        language="python"
        title="core/services/chat_service.py — provider dispatch"
        code={`if actual_provider == "ollama":
    async for token in self._stream_ollama(system_prompt, messages, config):
        yield token
elif actual_provider == "openai":
    async for token in self._stream_openai(system_prompt, messages, config):
        yield token
elif actual_provider == "claude":
    async for token in self._stream_claude(system_prompt, messages, config):
        yield token
elif actual_provider == "gemini":
    async for token in self._stream_gemini(system_prompt, messages, config):
        yield token`}
      />
      <Callout type="note" title="Ollama is the local default">
        When no provider is selected the service defaults to{" "}
        <InlineCode>ollama</InlineCode>, and Ollama is the only provider that
        falls back to environment variables (
        <InlineCode>OLLAMA_HOST</InlineCode>, <InlineCode>OLLAMA_MODEL</InlineCode>)
        if it has no row in the settings table. This makes fully local,
        no-API-key investigation possible out of the box.
      </Callout>

      <H2 id="configure">Configuring providers</H2>
      <P>
        Providers are configured centrally under{" "}
        <strong>Settings → Integrations</strong>, which reads and writes the{" "}
        <InlineCode>integration_settings</InlineCode> table (see{" "}
        <A href="/docs/integrations">Integrations Overview</A>). Each provider is a
        row keyed by <InlineCode>integration_type</InlineCode> with a JSONB{" "}
        <InlineCode>config</InlineCode>. The chat service loads that row at request
        time:
      </P>
      <CodeBlock
        language="python"
        title="core/services/chat_service.py — loading provider config"
        code={`def _load_provider_config(self, provider=None):
    provider = provider or "ollama"
    with get_db_context() as db:
        row = db.execute(text(
            "SELECT config, enabled FROM integration_settings "
            "WHERE integration_type = :t"
        ), {"t": provider}).fetchone()
        if row and row[1]:              # only when enabled
            config = dict(row[0]) if row[0] else {}
            config["_provider"] = provider
            return config
    # ollama-only env fallback
    if provider == "ollama":
        return {"_provider": "ollama", "host": OLLAMA_HOST, "model": OLLAMA_MODEL}
    return {"_provider": provider}`}
      />
      <P>
        Secrets in that config are masked on read by the settings API — an{" "}
        <InlineCode>api_key</InlineCode> longer than eight characters is shown as
        its first four and last four characters with an ellipsis between, and
        shorter values as <InlineCode>****</InlineCode>. You never fetch a
        cleartext key back from the API.
      </P>

      <H2 id="chat-api">The chat API</H2>
      <P>
        The endpoint is <InlineCode>POST /api/v1/chat</InlineCode>. The request
        carries the message history, the optional current-page context, and an
        optional provider/model override:
      </P>
      <CodeBlock
        language="python"
        title="core/api_routers/chat.py — request models"
        code={`class Message(BaseModel):
    role: str
    content: str

class PageContext(BaseModel):
    route: str = ""
    params: Optional[Dict[str, str]] = None

class ChatRequest(BaseModel):
    messages: List[Message]
    context: Optional[PageContext] = None
    provider: Optional[str] = None
    model: Optional[str] = None`}
      />
      <P>
        The response is Server-Sent Events (
        <InlineCode>text/event-stream</InlineCode>). Each token arrives as a JSON
        object on a <InlineCode>data:</InlineCode> line, and the stream ends with a
        sentinel:
      </P>
      <CodeBlock
        language="python"
        title="core/api_routers/chat.py — SSE framing"
        code={`# per token
yield f"data: {json.dumps({'token': token})}\\n\\n"
# end of stream
yield "data: [DONE]\\n\\n"`}
      />
      <CodeBlock
        language="bash"
        title="Calling it with curl"
        code={`curl -N -X POST "$API/api/v1/chat" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
        "messages": [{"role": "user", "content": "Summarize today\\u0027s anomalies"}],
        "context": {"route": "/anomalies"},
        "provider": "ollama"
      }'
# -> data: {"token": "There "}
#    data: {"token": "were "} ...
#    data: [DONE]`}
      />

      <H2 id="thinking">Thinking-block parsing</H2>
      <P>
        Reasoning models emit their scratch work inside{" "}
        <InlineCode>&lt;think&gt;…&lt;/think&gt;</InlineCode> tags. The chat window
        parses these out of the token stream and renders them separately from the
        answer, so the analyst sees a collapsible &quot;thought process&quot;
        instead of raw reasoning mixed into the reply. A closed block becomes
        completed thinking; an open, still-streaming{" "}
        <InlineCode>&lt;think&gt;</InlineCode> marks the assistant as{" "}
        <em>still thinking</em>.
      </P>
      <CodeBlock
        language="typescript"
        title="chat-window.tsx — parseThinkingContent (abridged)"
        code={`// extract completed <think>...</think> blocks
const thinkRegex = /<think>([\\s\\S]*?)<\\/think>/g
while ((match = thinkRegex.exec(content)) !== null) {
  thinking.push(...match[1].split(/\\n\\n+/).map(p => p.trim()).filter(Boolean))
}
// strip them from the visible response
response = response.replace(/<think>[\\s\\S]*?<\\/think>/g, "").trim()

// an unclosed <think> means the model is mid-thought
const unclosed = response.match(/<think>([\\s\\S]*)$/)
if (unclosed) { isStillThinking = true; /* ...collect partial... */ }`}
      />
      <Callout type="tip" title="Reasoning stays out of history">
        Before the next turn is sent, completed thinking blocks are stripped from
        the stored assistant messages, so the model is not re-fed its own private
        reasoning.
      </Callout>

      <H2 id="context">Page and entity context injection</H2>
      <P>
        What makes the assistant an <em>investigation</em> assistant is that it
        knows where you are. The frontend attaches the current route and route
        params to every request, and the backend uses them to build a
        context-aware system prompt.
      </P>
      <CodeBlock
        language="python"
        title="core/services/chat_service.py — _build_system_prompt (abridged)"
        code={`parts = [
    "You are the OpenUBA assistant. OpenUBA is an open-source User & Entity "
    "Behavior Analytics (UEBA) platform.",
    "You help security analysts understand anomalies, models, alerts, rules, "
    "cases, and entities in the system.",
    "Answer concisely and reference specific data when available. Use markdown.",
]
# always injected: live system state (counts + recent anomalies)
parts.append(self._get_system_state())
# route-specific context, e.g. /models/{id}, /anomalies, /cases, /entities
if context:
    parts.append(self._get_route_context(context.get("route", ""), context.get("params") or {}))
    parts.append(f"\\nThe user is currently viewing: {route}")`}
      />
      <P>Two layers of context are stitched into every prompt:</P>
      <UL>
        <LI>
          <strong>System state</strong> — a rolling snapshot: anomalies in the
          last 24h, active models, unacknowledged alerts, open cases, enabled
          rules, tracked entities, and the five most recent anomalies with their
          entity, risk score, and type.
        </LI>
        <LI>
          <strong>Route context</strong> — details tied to the current view. On{" "}
          <InlineCode>/models/{"{modelId}"}</InlineCode> it pulls that model&apos;s
          metadata and last run; on <InlineCode>/anomalies</InlineCode>,
          the recent anomaly-type distribution; on <InlineCode>/cases</InlineCode>,
          open cases; on <InlineCode>/alerts</InlineCode>, unacknowledged alerts;
          on <InlineCode>/rules</InlineCode>, enabled rules; on{" "}
          <InlineCode>/entities</InlineCode>, the top entities by risk.
        </LI>
      </UL>

      <H2 id="frontend-flow">How the window consumes the stream</H2>
      <P>
        The window sends the conversation plus the derived context, then reads the
        SSE body incrementally, appending each token to the in-progress message:
      </P>
      <CodeBlock
        language="typescript"
        title="chat-window.tsx — request + stream consumption (abridged)"
        code={`const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages: allMessages, context, provider: selectedProvider, model: selectedModel }),
})

const reader = response.body!.getReader()
for (;;) {
  const { done, value } = await reader.read()
  if (done) break
  for (const line of decode(value).split("\\n")) {
    if (!line.startsWith("data: ")) continue
    const data = line.slice(6)
    if (data === "[DONE]") continue
    const parsed = JSON.parse(data)
    if (parsed.token) { accumulated += parsed.token; updateLastMessage(accumulated) }
  }
}`}
      />
      <P>
        The browser calls the relative path <InlineCode>/api/chat</InlineCode>,
        which is proxied to <InlineCode>/api/v1/chat</InlineCode>. Provider and
        model come from the header dropdown, whose options are populated from the
        enabled integrations returned by the settings API.
      </P>

      <H2 id="setup">Setting it up</H2>
      <OL>
        <LI>
          Open <strong>Settings → Integrations</strong> and enable a provider.
        </LI>
        <LI>
          For a local model, point <InlineCode>ollama</InlineCode> at your host
          and pick a model. For a hosted provider, paste an API key and choose a
          model.
        </LI>
        <LI>
          Use <strong>Test</strong> to confirm connectivity (see{" "}
          <A href="/docs/integrations">Integrations</A>).
        </LI>
        <LI>
          Open the chat window from any page, select the provider in the header,
          and start asking about what you are looking at.
        </LI>
      </OL>

      <H2 id="related">Related</H2>
      <UL>
        <LI>
          <A href="/docs/integrations">Integrations Overview</A> — where LLM
          providers are configured and tested.
        </LI>
        <LI>
          <A href="/docs/anomalies">Anomalies &amp; Entity Risk</A> — the data the
          assistant reasons over.
        </LI>
      </UL>

      <DocFooter slug="assistant" />
    </>
  );
}
