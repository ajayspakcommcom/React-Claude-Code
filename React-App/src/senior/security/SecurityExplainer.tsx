// Visual explainer for Senior — Security
// Covers XSS Prevention, CSRF Basics, Secure Auth flows

import React, { useState } from "react";

// ─── SHARED STYLES ─────────────────────────────────────────────────────────────

const card = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 20,
  ...extra,
});

const codeBlock = (color = "#86efac"): React.CSSProperties => ({
  background: "#0f172a",
  borderRadius: 8,
  padding: 14,
  fontFamily: "monospace",
  fontSize: 11,
  color,
  lineHeight: 1.75,
  whiteSpace: "pre",
  overflowX: "auto",
});

const badge = (bg: string, text: string): React.CSSProperties => ({
  background: bg,
  color: text,
  fontSize: 10,
  fontWeight: 700,
  padding: "2px 8px",
  borderRadius: 99,
  display: "inline-block",
  textTransform: "uppercase" as const,
  letterSpacing: 0.5,
});

const pill = (active: boolean) => ({
  padding: "6px 16px",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 12,
  cursor: "pointer",
  border: "2px solid",
  borderColor: active ? "#3b82f6" : "#e2e8f0",
  background: active ? "#eff6ff" : "#f8fafc",
  color: active ? "#1d4ed8" : "#64748b",
} as React.CSSProperties);

const label = (color = "#475569"): React.CSSProperties => ({
  fontSize: 11, fontWeight: 700, color,
  textTransform: "uppercase", letterSpacing: 1, marginBottom: 6,
});

// ─── DEMO 1 — XSS: Safe vs Unsafe rendering ───────────────────────────────────

const XssDemo: React.FC = () => {
  const [mode, setMode] = useState<"safe" | "unsafe">("safe");

  const payload = `<img src=x onerror="alert('XSS!')" />\n<script>document.cookie</script>\n<p onclick="stealData()">Click me</p>`;

  const safeCode = `// ✅ Safe — React escapes everything in JSX
const Comment = ({ text }) => (
  <div>{text}</div>   // → &lt;img src=x ...&gt; (text)
);

// ✅ If you must render HTML, sanitize first
import DOMPurify from "dompurify";

const SafeHtml = ({ html }) => (
  <div dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(html)
  }} />
);`;

  const unsafeCode = `// ❌ Dangerous — never pass user input directly
const Comment = ({ text }) => (
  <div dangerouslySetInnerHTML={{ __html: text }} />
  // ^ executes <script>, onerror handlers!
);

// ❌ Also dangerous
element.innerHTML = userInput;
document.write(userInput);
eval(userInput);
new Function(userInput)();`;

  return (
    <div style={card()}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        XSS: Safe vs Unsafe HTML rendering
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        React auto-escapes JSX — but <code>dangerouslySetInnerHTML</code> bypasses it.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button style={pill(mode === "safe")} onClick={() => setMode("safe")}>Safe pattern</button>
        <button style={pill(mode === "unsafe")} onClick={() => setMode("unsafe")}>Unsafe pattern</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <div style={label("#64748b")}>Attacker payload</div>
          <div style={codeBlock("#fca5a5")}>{payload}</div>
        </div>
        <div>
          <div style={label(mode === "safe" ? "#16a34a" : "#dc2626")}>
            {mode === "safe" ? "✅ Safe code" : "❌ Unsafe code"}
          </div>
          <div style={codeBlock(mode === "safe" ? "#86efac" : "#fca5a5")}>
            {mode === "safe" ? safeCode : unsafeCode}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── DEMO 2 — SafeLink: URL validation ────────────────────────────────────────

const UrlValidationDemo: React.FC = () => {
  const [url, setUrl] = useState("javascript:alert(1)");

  const isSafe = (() => {
    try {
      const parsed = new URL(url, window.location.origin);
      return ["https:", "http:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  })();

  const examples = [
    { url: "https://example.com", label: "HTTPS link", safe: true },
    { url: "http://example.com", label: "HTTP link", safe: true },
    { url: "javascript:alert(1)", label: "javascript: URI", safe: false },
    { url: "data:text/html,<script>alert(1)</script>", label: "data: URI", safe: false },
    { url: "vbscript:msgbox(1)", label: "vbscript: URI", safe: false },
  ];

  return (
    <div style={card()}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        SafeLink — URL protocol validation
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Always validate URLs before using them in <code>href</code> attributes.
        Allow only <code>https:</code> and <code>http:</code>.
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {examples.map(ex => (
          <button key={ex.url} onClick={() => setUrl(ex.url)} style={{
            ...pill(url === ex.url),
            borderColor: url === ex.url ? (ex.safe ? "#22c55e" : "#ef4444") : "#e2e8f0",
            background: url === ex.url ? (ex.safe ? "#f0fdf4" : "#fef2f2") : "#f8fafc",
            color: url === ex.url ? (ex.safe ? "#16a34a" : "#dc2626") : "#64748b",
          }}>{ex.label}</button>
        ))}
      </div>

      <div style={{ marginBottom: 12 }}>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          style={{
            width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13,
            border: `2px solid ${isSafe ? "#22c55e" : "#ef4444"}`,
            outline: "none", boxSizing: "border-box",
          }}
          placeholder="Enter a URL to test..."
        />
      </div>

      <div style={{
        padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
        background: isSafe ? "#f0fdf4" : "#fef2f2",
        color: isSafe ? "#16a34a" : "#dc2626",
        border: `1px solid ${isSafe ? "#86efac" : "#fca5a5"}`,
      }}>
        {isSafe ? "✅ Safe — renders as <a href=\"...\"> link" : "🚫 Blocked — renders as <span> (no navigation)"}
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={label()}>SafeLink implementation</div>
        <div style={codeBlock()}>
          {`const isSafeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url, window.location.origin);
    return ["https:", "http:"].includes(parsed.protocol);
  } catch { return false; }
};

const SafeLink = ({ href, children }) => {
  if (!isSafeUrl(href)) {
    return <span aria-label="Blocked unsafe link">{children}</span>;
  }
  return <a href={href} rel="noopener noreferrer" target="_blank">{children}</a>;
};`}
        </div>
      </div>
    </div>
  );
};

// ─── DEMO 3 — CSRF flow visualization ─────────────────────────────────────────

const CsrfDemo: React.FC = () => {
  const [step, setStep] = useState(0);

  const attackSteps = [
    { icon: "🏦", label: "User logs into bank.com", detail: "Session cookie set: session=abc123" },
    { icon: "😈", label: "User visits evil.com", detail: "Page contains: <img src=\"bank.com/transfer?to=attacker&amount=1000\">" },
    { icon: "🍪", label: "Browser auto-sends cookie", detail: "GET bank.com/transfer?... + Cookie: session=abc123" },
    { icon: "💸", label: "Bank processes the transfer!", detail: "Server only checked the session cookie — attack succeeded" },
  ];

  const defenceCode = `// ✅ CSRF Token approach
// Server sets a random token in a readable cookie
// Client reads it and sends it as a custom header

const csrfFetch = (url, options = {}) => {
  const csrfToken = document.cookie
    .split("; ")
    .find(row => row.startsWith("csrf-token="))
    ?.split("=")[1] ?? "";

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,  // custom header
    },
    credentials: "include",  // send session cookie
  });
};

// Why this works: evil.com can trigger the request, but
// it cannot READ the csrf-token cookie (same-origin policy).
// The server rejects requests without a valid X-CSRF-Token.`;

  return (
    <div style={card()}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        CSRF Attack Flow &amp; Defence
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        CSRF exploits cookie auto-sending. Custom headers (not cookies) require same-origin access.
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={label()}>Attack flow — click to step through</div>
        <div style={{ display: "flex", gap: 0, position: "relative" }}>
          {attackSteps.map((s, i) => (
            <div
              key={i}
              onClick={() => setStep(i)}
              style={{
                flex: 1, padding: "10px 8px", textAlign: "center", cursor: "pointer",
                background: step === i ? "#fef2f2" : step > i ? "#fff7ed" : "#f8fafc",
                border: "1px solid",
                borderColor: step === i ? "#ef4444" : step > i ? "#fb923c" : "#e2e8f0",
                borderRadius: i === 0 ? "8px 0 0 8px" : i === attackSteps.length - 1 ? "0 8px 8px 0" : 0,
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#475569" }}>{s.label}</div>
            </div>
          ))}
        </div>
        {step >= 0 && (
          <div style={{
            marginTop: 8, padding: "8px 12px", borderRadius: 8, fontSize: 12,
            background: step === 3 ? "#fef2f2" : "#fff7ed",
            color: step === 3 ? "#dc2626" : "#92400e",
            border: `1px solid ${step === 3 ? "#fca5a5" : "#fbbf24"}`,
          }}>
            {attackSteps[step].detail}
          </div>
        )}
      </div>

      <div>
        <div style={label()}>Defence: CSRF token via custom header</div>
        <div style={codeBlock()}>{defenceCode}</div>
      </div>
    </div>
  );
};

// ─── DEMO 4 — Token storage comparison ────────────────────────────────────────

const TokenStorageDemo: React.FC = () => {
  const options = [
    {
      name: "localStorage",
      rating: "Dangerous",
      color: "#dc2626",
      bg: "#fef2f2",
      border: "#fca5a5",
      points: [
        "❌ Readable by any JS on your domain",
        "❌ XSS attack steals token instantly",
        "❌ Persists across browser restarts",
        "❌ No HttpOnly protection possible",
      ],
      code: "localStorage.setItem('token', jwt);  // ❌ Never do this",
    },
    {
      name: "sessionStorage",
      rating: "Still risky",
      color: "#d97706",
      bg: "#fffbeb",
      border: "#fbbf24",
      points: [
        "⚠️ Readable by JS — XSS can still steal it",
        "⚠️ Cleared on tab close (slightly better)",
        "❌ Not shared across tabs",
        "❌ Still vulnerable to XSS",
      ],
      code: "sessionStorage.setItem('token', jwt);  // ⚠️ Slightly better, still risky",
    },
    {
      name: "Memory (React state)",
      rating: "Good for access tokens",
      color: "#16a34a",
      bg: "#f0fdf4",
      border: "#86efac",
      points: [
        "✅ Not accessible after page refresh",
        "✅ Cleared on tab close automatically",
        "✅ XSS can't persist the token",
        "⚠️ Lost on refresh — pair with HttpOnly cookie refresh token",
      ],
      code: "const [token, setToken] = useState(null);  // ✅ Memory only",
    },
    {
      name: "HttpOnly Cookie",
      rating: "Best for refresh tokens",
      color: "#1d4ed8",
      bg: "#eff6ff",
      border: "#93c5fd",
      points: [
        "✅ JavaScript CANNOT read HttpOnly cookies",
        "✅ Sent automatically by browser",
        "✅ Server sets it — SameSite=Strict/Lax",
        "⚠️ Requires CSRF token for state-changing requests",
      ],
      code: "Set-Cookie: refresh=...; HttpOnly; Secure; SameSite=Strict  // ✅ Server-side",
    },
  ];

  const [selected, setSelected] = useState(0);
  const opt = options[selected];

  return (
    <div style={card()}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        Token Storage — Where to keep JWTs
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Short-lived access token in memory + long-lived refresh token in HttpOnly cookie is the recommended pattern.
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {options.map((o, i) => (
          <button key={o.name} onClick={() => setSelected(i)} style={{
            ...pill(selected === i),
            borderColor: selected === i ? o.color : "#e2e8f0",
            background: selected === i ? o.bg : "#f8fafc",
            color: selected === i ? o.color : "#64748b",
          }}>{o.name}</button>
        ))}
      </div>

      <div style={{
        padding: 16, borderRadius: 10,
        background: opt.bg, border: `1px solid ${opt.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: opt.color }}>{opt.name}</span>
          <span style={badge(opt.bg, opt.color)}>{opt.rating}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
          {opt.points.map((p, i) => (
            <div key={i} style={{ fontSize: 12, color: "#374151" }}>{p}</div>
          ))}
        </div>
        <div style={codeBlock("#e2e8f0")}>{opt.code}</div>
      </div>
    </div>
  );
};

// ─── DEMO 5 — Secure Auth flow diagram ────────────────────────────────────────

const AuthFlowDemo: React.FC = () => {
  const [tab, setTab] = useState<"login" | "refresh" | "logout">("login");

  const flows = {
    login: {
      title: "Login flow",
      steps: [
        { actor: "Client", msg: "POST /auth/login { email, password }", dir: "→" },
        { actor: "Server", msg: "Verify credentials, generate access + refresh token", dir: "⚙️" },
        { actor: "Server", msg: "Set-Cookie: refresh=...; HttpOnly; SameSite=Strict", dir: "←" },
        { actor: "Server", msg: "Response: { accessToken: '...', user: {...} }", dir: "←" },
        { actor: "Client", msg: "Store accessToken in React state (memory)", dir: "💾" },
      ],
      code: `const login = async (email, password) => {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",  // receive HttpOnly cookie
  });
  const { accessToken, user } = await res.json();
  setToken(accessToken);  // memory only — not localStorage!
  setUser(user);
};`,
    },
    refresh: {
      title: "Token refresh flow",
      steps: [
        { actor: "Client", msg: "API call fails — 401 Unauthorized (access token expired)", dir: "⚠️" },
        { actor: "Client", msg: "POST /auth/refresh (HttpOnly cookie sent automatically)", dir: "→" },
        { actor: "Server", msg: "Verify refresh token, rotate it (old one invalidated)", dir: "⚙️" },
        { actor: "Server", msg: "Set-Cookie: refresh=NEW_TOKEN; HttpOnly", dir: "←" },
        { actor: "Server", msg: "Response: { accessToken: 'new-access-token' }", dir: "←" },
        { actor: "Client", msg: "Retry original request with new access token", dir: "🔄" },
      ],
      code: `// Axios interceptor for silent refresh
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      const { data } = await axios.post("/auth/refresh",
        {}, { withCredentials: true }
      );
      setToken(data.accessToken);
      err.config.headers.Authorization = \`Bearer \${data.accessToken}\`;
      return api(err.config);
    }
    return Promise.reject(err);
  }
);`,
    },
    logout: {
      title: "Logout flow",
      steps: [
        { actor: "Client", msg: "POST /auth/logout (with current refresh token cookie)", dir: "→" },
        { actor: "Server", msg: "Revoke refresh token from database/allowlist", dir: "⚙️" },
        { actor: "Server", msg: "Set-Cookie: refresh=; Max-Age=0 (clear the cookie)", dir: "←" },
        { actor: "Client", msg: "Clear accessToken from memory (setToken(null))", dir: "💾" },
        { actor: "Client", msg: "Redirect to /login", dir: "🔀" },
      ],
      code: `const logout = async () => {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",  // send HttpOnly cookie to revoke
  });
  setToken(null);   // clear from memory
  setUser(null);
  // In real app: also cancel any pending requests
  navigate("/login");
};`,
    },
  };

  const flow = flows[tab];

  return (
    <div style={card()}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        Secure Auth Flow
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Access token (15min, in memory) + Refresh token (7 days, HttpOnly cookie)
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["login", "refresh", "logout"] as const).map(t => (
          <button key={t} style={pill(tab === t)} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <div style={label()}>Sequence</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {flow.steps.map((s, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                padding: "8px 10px", borderRadius: 8,
                background: i % 2 === 0 ? "#f8fafc" : "#eff6ff",
                fontSize: 11,
              }}>
                <span style={{ fontWeight: 700, color: "#94a3b8", minWidth: 20 }}>{s.dir}</span>
                <div>
                  <span style={{ fontWeight: 700, color: "#1e293b" }}>{s.actor}: </span>
                  <span style={{ color: "#475569" }}>{s.msg}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={label()}>Code</div>
          <div style={codeBlock()}>{flow.code}</div>
        </div>
      </div>
    </div>
  );
};

// ─── REFERENCE TABLES ─────────────────────────────────────────────────────────

const ChecklistPanel: React.FC = () => {
  const sections = [
    {
      title: "XSS Prevention",
      color: "#dc2626",
      bg: "#fef2f2",
      items: [
        { ok: true, text: "Use JSX interpolation {value} — React auto-escapes" },
        { ok: true, text: "Sanitize with DOMPurify before dangerouslySetInnerHTML" },
        { ok: true, text: "Validate URLs before using as href — block javascript: data:" },
        { ok: true, text: "Set Content-Security-Policy HTTP header on the server" },
        { ok: false, text: "Never use dangerouslySetInnerHTML with raw user input" },
        { ok: false, text: "Never use eval() or new Function() with user data" },
        { ok: false, text: "Never use document.write() or innerHTML with user data" },
      ],
    },
    {
      title: "CSRF Defence",
      color: "#d97706",
      bg: "#fffbeb",
      items: [
        { ok: true, text: "Use CSRF token in X-CSRF-Token custom header" },
        { ok: true, text: "Set SameSite=Strict or Lax on session cookies" },
        { ok: true, text: "Validate Origin / Referer header on the server" },
        { ok: true, text: "SPAs using Bearer token (not cookies) are CSRF-immune" },
        { ok: false, text: "Don't rely on cookies alone for state-changing requests" },
      ],
    },
    {
      title: "Secure Auth",
      color: "#1d4ed8",
      bg: "#eff6ff",
      items: [
        { ok: true, text: "Store access token in memory (React state), not localStorage" },
        { ok: true, text: "Short-lived access token (15min–1hr)" },
        { ok: true, text: "Long-lived refresh token in HttpOnly cookie" },
        { ok: true, text: "Rotate refresh token on each use" },
        { ok: true, text: "Revoke refresh token on logout (server-side)" },
        { ok: false, text: "Never store sensitive data in JWT payload (it's base64, not encrypted)" },
        { ok: false, text: "Never store tokens in localStorage" },
      ],
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
      {sections.map(s => (
        <div key={s.title} style={{ ...card(), background: s.bg, borderColor: s.color + "33" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: s.color, marginBottom: 10 }}>
            {s.title}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {s.items.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", fontSize: 11 }}>
                <span style={{ color: item.ok ? "#16a34a" : "#dc2626", flexShrink: 0, marginTop: 1 }}>
                  {item.ok ? "✓" : "✗"}
                </span>
                <span style={{ color: "#374151" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── ROOT EXPLAINER ───────────────────────────────────────────────────────────

export const SecurityExplainer: React.FC = () => {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px", color: "#0f172a", fontSize: 22 }}>
          Senior — Security
        </h2>
        <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
          XSS Prevention · CSRF Basics · Secure Auth flows &amp; token storage
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <XssDemo />
        <UrlValidationDemo />
        <CsrfDemo />
        <TokenStorageDemo />
        <AuthFlowDemo />

        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 10 }}>
            Security Checklist
          </div>
          <ChecklistPanel />
        </div>
      </div>
    </div>
  );
};

export default SecurityExplainer;
