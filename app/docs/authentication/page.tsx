import type { Metadata } from "next";
import { DocHeader, H2, H3, P, UL, OL, LI, InlineCode, A, Callout, Table, NextCard } from "@/components/docs/doc-ui";
import { CodeBlock } from "@/components/docs/code-block";
import { DocFooter } from "@/components/docs/page-footer";

export const metadata: Metadata = {
  title: "Authentication & RBAC — OpenUBA",
  description:
    "JWT bearer authentication, the login flow, the get_current_user dependency, and role-based access control via require_permission and the role_permissions table.",
};

export default function Authentication() {
  return (
    <>
      <DocHeader
        eyebrow="Platform"
        title="Authentication & RBAC"
        intro="OpenUBA authenticates users with signed JWT bearer tokens and authorizes them with a page-level, role-based permission model. Every protected endpoint runs through a small pair of FastAPI dependencies — one that identifies the caller, and one that checks whether their role may read or write a given page."
      />

      <H2 id="jwt">JWT bearer tokens</H2>
      <P>
        Authentication is built on <A href="https://python-jose.readthedocs.io/">python-jose</A>{" "}
        in <InlineCode>core/auth.py</InlineCode>. Tokens are signed with{" "}
        <InlineCode>HS256</InlineCode> using a secret from the{" "}
        <InlineCode>JWT_SECRET_KEY</InlineCode> environment variable, and they
        expire after 480 minutes (8 hours). Passwords are hashed with bcrypt via{" "}
        <InlineCode>passlib</InlineCode>.
      </P>
      <CodeBlock
        language="python"
        title="core/auth.py (settings and token creation)"
        code={`from jose import JWTError, jwt
from passlib.context import CryptContext

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480          # 8 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain, hashed):  return pwd_context.verify(plain, hashed)
def get_password_hash(password):     return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta=None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)`}
      />
      <Callout type="warning" title="Change these in production">
        <InlineCode>JWT_SECRET_KEY</InlineCode> defaults to a placeholder string.
        A production deployment must set a strong secret — otherwise anyone can
        forge a valid token.
      </Callout>

      <H2 id="login">The login flow</H2>
      <P>
        The login endpoint is <InlineCode>POST /api/v1/auth/login</InlineCode>. It
        accepts an OAuth2 password form (URL-encoded{" "}
        <InlineCode>username</InlineCode> and <InlineCode>password</InlineCode>),
        verifies the credentials against the <InlineCode>users</InlineCode> table,
        and returns a signed token together with the user&apos;s id, username, and
        role. The token&apos;s claims carry <InlineCode>sub</InlineCode> (username),{" "}
        <InlineCode>user_id</InlineCode>, and <InlineCode>role</InlineCode>.
      </P>
      <CodeBlock
        language="python"
        title="core/api_routers/auth.py (login)"
        code={`@router.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(),
                db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(401, "incorrect username or password")
    if not user.is_active:
        raise HTTPException(403, "account is disabled")

    access_token = create_access_token(
        data={"sub": user.username, "user_id": str(user.id), "role": user.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    # updates user.last_login_at, then:
    return {"access_token": access_token, "token_type": "bearer",
            "user_id": str(user.id), "username": user.username, "role": user.role}`}
      />
      <P>
        A failed password or unknown user yields a 401; a disabled account yields
        a 403. On success the endpoint also stamps{" "}
        <InlineCode>last_login_at</InlineCode>.
      </P>

      <H2 id="get-current-user">Identifying the caller</H2>
      <P>
        Every protected route depends on <InlineCode>get_current_user</InlineCode>.
        It reads the bearer token from the <InlineCode>Authorization</InlineCode>{" "}
        header — but if there is no header, it falls back to a{" "}
        <InlineCode>?token=</InlineCode> query parameter. That fallback exists
        specifically for Server-Sent Events: an <InlineCode>EventSource</InlineCode>{" "}
        in the browser cannot set custom headers, so SSE endpoints (like the LLM
        assistant stream) pass the token in the URL. After decoding, it also
        re-checks that the user still exists in the database, so a token minted
        before a database reset is rejected.
      </P>
      <CodeBlock
        language="python"
        title="core/auth.py (get_current_user)"
        code={`security = HTTPBearer(auto_error=False)

async def get_current_user(request: Request,
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    # header first, then ?token= query param (for SSE / EventSource)
    token = credentials.credentials if credentials else request.query_params.get("token")
    if not token:
        raise credentials_exception

    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    username = payload.get("sub")
    user_id = payload.get("user_id")
    # verify the user row still exists (catches stale tokens after a DB reset)
    ...
    return {"username": username, "user_id": user_id,
            "role": payload.get("role", "analyst"), "payload": payload}`}
      />

      <H2 id="rbac">Role-based access control</H2>
      <P>
        Authorization is a matrix of <strong>roles</strong> against{" "}
        <strong>pages</strong>. A page is a named application area — for example{" "}
        <InlineCode>models</InlineCode>, <InlineCode>anomalies</InlineCode>,{" "}
        <InlineCode>cases</InlineCode>, or <InlineCode>users</InlineCode>. For each
        (role, page) pair the <InlineCode>role_permissions</InlineCode> table holds
        two booleans: <InlineCode>can_read</InlineCode> and{" "}
        <InlineCode>can_write</InlineCode>. There is no explicit &quot;none&quot;
        row — the absence of a row means no access.
      </P>
      <CodeBlock
        language="python"
        title="core/db/models.py (User and RolePermission)"
        code={`class User(Base):
    __tablename__ = "users"
    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username      = Column(String(255), unique=True, nullable=False)
    email         = Column(String(255))
    password_hash = Column(String(255), nullable=False)
    role          = Column(String(50), default="analyst")
    display_name  = Column(String(255))
    is_active     = Column(Boolean, default=True)
    last_login_at = Column(TIMESTAMP(timezone=True))
    created_at    = Column(TIMESTAMP(timezone=True))
    updated_at    = Column(TIMESTAMP(timezone=True))

class RolePermission(Base):
    __tablename__ = "role_permissions"
    id        = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role      = Column(String(50), nullable=False)
    page      = Column(String(50), nullable=False)
    can_read  = Column(Boolean, default=False)
    can_write = Column(Boolean, default=False)`}
      />

      <H3 id="roles">The roles</H3>
      <P>
        Four roles are valid, defined as{" "}
        <InlineCode>VALID_ROLES = [&quot;admin&quot;, &quot;manager&quot;, &quot;triage&quot;, &quot;analyst&quot;]</InlineCode>.
        Their seeded permissions live in <InlineCode>core/db/seed.py</InlineCode>.
      </P>
      <Table
        head={["Role", "Scope"]}
        rows={[
          [<InlineCode key="1">admin</InlineCode>, "Full read + write on every page. Admin always passes permission checks in code, regardless of table rows."],
          [<InlineCode key="2">analyst</InlineCode>, "Read on models, entities, rules; read + write on anomalies, cases, alerts, workspaces, data, jobs, visualizations, dashboards, features, experiments, pipelines, schedules."],
          [<InlineCode key="3">triage</InlineCode>, "Read-only on anomalies and entities; read + write on cases and alerts."],
          [<InlineCode key="4">manager</InlineCode>, "Elevated read access to user/role administration endpoints; no seeded page-permission rows of its own."],
        ]}
      />
      <P>
        The set of pages permissions can target is fixed as{" "}
        <InlineCode>ALL_PAGES</InlineCode>: <InlineCode>home</InlineCode>,{" "}
        <InlineCode>data</InlineCode>, <InlineCode>models</InlineCode>,{" "}
        <InlineCode>rules</InlineCode>, <InlineCode>alerts</InlineCode>,{" "}
        <InlineCode>entities</InlineCode>, <InlineCode>anomalies</InlineCode>,{" "}
        <InlineCode>cases</InlineCode>, <InlineCode>schedules</InlineCode>,{" "}
        <InlineCode>settings</InlineCode>, and <InlineCode>users</InlineCode>.
      </P>

      <H2 id="require-permission">Enforcing permissions</H2>
      <P>
        <InlineCode>require_permission(page, access=&quot;read&quot;)</InlineCode> is a
        dependency factory. It returns a checker that runs after{" "}
        <InlineCode>get_current_user</InlineCode>: admins pass unconditionally,
        and everyone else is checked against the{" "}
        <InlineCode>role_permissions</InlineCode> row for their (role, page). A
        missing row is a 403; a write request without{" "}
        <InlineCode>can_write</InlineCode> is a 403; a read without{" "}
        <InlineCode>can_read</InlineCode> is a 403.
      </P>
      <CodeBlock
        language="python"
        title="core/auth.py (require_permission)"
        code={`def require_permission(page: str, access: str = "read"):
    async def permission_checker(current_user: dict = Depends(get_current_user)):
        role = current_user.get("role", "analyst")
        if role == "admin":
            return current_user
        with get_db_context() as db:
            row = db.execute(text(
                "SELECT can_read, can_write FROM role_permissions "
                "WHERE role = :role AND page = :page"),
                {"role": role, "page": page}).fetchone()
            if not row:
                raise HTTPException(403, f"no permissions configured for role '{role}'")
            can_read, can_write = row
            if access == "write" and not can_write:
                raise HTTPException(403, f"write access denied for role '{role}'")
            if access == "read" and not can_read:
                raise HTTPException(403, f"read access denied for role '{role}'")
        return current_user
    return permission_checker`}
      />
      <Callout type="warning" title="Fail-open on infrastructure errors">
        If the permission query itself fails with a non-HTTP error — for example
        the <InlineCode>role_permissions</InlineCode> table is missing during a
        migration — the checker logs a warning and <strong>allows</strong> the
        request. This keeps the platform usable mid-migration, but it means the
        table must exist and be seeded for RBAC to actually constrain anyone.
      </Callout>

      <H3 id="usage">How routers use it</H3>
      <P>
        Endpoints declare their requirement inline as a dependency. The pattern is{" "}
        <InlineCode>Depends(require_permission(&quot;&lt;page&gt;&quot;, &quot;&lt;read|write&gt;&quot;))</InlineCode>.
      </P>
      <Table
        head={["Router", "Example requirement"]}
        rows={[
          [<InlineCode key="1">models</InlineCode>, <span key="1v"><InlineCode>require_permission(&quot;models&quot;, &quot;write&quot;)</InlineCode> on mutations, <InlineCode>&quot;read&quot;</InlineCode> on gets</span>],
          [<InlineCode key="2">anomalies</InlineCode>, <InlineCode key="2v">require_permission(&quot;anomalies&quot;, &quot;write&quot;)</InlineCode>],
          [<InlineCode key="3">cases</InlineCode>, <InlineCode key="3v">require_permission(&quot;cases&quot;, &quot;write&quot;)</InlineCode>],
          [<InlineCode key="4">rules</InlineCode>, <InlineCode key="4v">require_permission(&quot;rules&quot;, &quot;write&quot;)</InlineCode>],
          [<InlineCode key="5">datasets</InlineCode>, <span key="5v"><InlineCode>require_permission(&quot;data&quot;, ...)</InlineCode> — datasets map to the <InlineCode>data</InlineCode> page</span>],
        ]}
      />

      <H2 id="admin-ui">The users &amp; permissions admin UI</H2>
      <P>
        Administration lives inside Settings in the frontend, in{" "}
        <InlineCode>interface/src/components/settings/settings-tabs.tsx</InlineCode>:
      </P>
      <UL>
        <LI>
          The <strong>Users</strong> tab (visible to managers and admins) lists
          users from <InlineCode>GET /api/v1/auth/users</InlineCode>. An admin can
          add users (<InlineCode>POST /auth/register</InlineCode>), edit them (
          <InlineCode>PUT /auth/users/&#123;id&#125;</InlineCode>), and delete them
          (a soft delete that sets <InlineCode>is_active = false</InlineCode>).
        </LI>
        <LI>
          The <strong>Access</strong> tab (admin only) renders a permissions
          matrix from <InlineCode>GET /api/v1/auth/permissions</InlineCode> — a
          per-role grid over the pages, with Read/Write toggles — and saves each
          role via <InlineCode>PUT /api/v1/auth/permissions</InlineCode>. The{" "}
          <InlineCode>admin</InlineCode> role is excluded from editing, since it
          always has full access.
        </LI>
      </UL>
      <P>
        There is also a standalone <InlineCode>/users</InlineCode> page (
        <InlineCode>interface/app/users/page.tsx</InlineCode>) guarded to
        manager/admin, which manages users only.
      </P>

      <H2 id="defaults">Default credentials &amp; seeding</H2>
      <P>
        On first startup the backend&apos;s lifespan handler seeds a default admin
        and the role-permission rows if they are absent. The runtime seed
        (<InlineCode>seed_defaults</InlineCode> in{" "}
        <InlineCode>core/fastapi_app.py</InlineCode>) creates a user{" "}
        <InlineCode>openuba</InlineCode> with password{" "}
        <InlineCode>password</InlineCode>. The standalone seed script (
        <InlineCode>python -m core.db.seed</InlineCode>) creates{" "}
        <InlineCode>admin</InlineCode> / <InlineCode>admin</InlineCode> and seeds the
        default permission matrix.
      </P>
      <Callout type="warning" title="First thing to do in production">
        Both seeded admins use trivial, well-known passwords. Rotate the default
        admin credentials — and set <InlineCode>JWT_SECRET_KEY</InlineCode> — before
        exposing an OpenUBA instance to anyone.
      </Callout>

      <H2 id="sdk-auth">Authenticating from the SDK</H2>
      <P>
        The same login endpoint and bearer scheme back the Python SDK&apos;s
        connection to a running OpenUBA instance. See the{" "}
        <A href="/docs/sdk">Python SDK</A> reference for how the client obtains and
        carries a token when submitting jobs or registering models against the{" "}
        <InlineCode>sdk</InlineCode> router.
      </P>

      <H2 id="next">Where to go next</H2>
      <div className="grid gap-3 sm:grid-cols-2 mt-4">
        <NextCard
          href="/docs/architecture"
          title="Architecture"
          description="Where auth sits in the backend request flow."
        />
        <NextCard
          href="/docs/sdk"
          title="Python SDK"
          description="Authenticating programmatic access to the platform."
        />
        <NextCard
          href="/docs/kubernetes"
          title="Kubernetes-Native"
          description="What an authenticated write request triggers."
        />
        <NextCard
          href="/docs/graphql"
          title="GraphQL API"
          description="The read side served by PostGraphile."
        />
      </div>

      <DocFooter slug="authentication" />
    </>
  );
}
