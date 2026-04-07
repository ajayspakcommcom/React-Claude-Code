// TOPIC: Security (Senior)
// LEVEL: Senior — Security
//
// ─── THREE TOPICS ─────────────────────────────────────────────────────────────
//
//   1. XSS Prevention  — Cross-Site Scripting
//   2. CSRF Basics     — Cross-Site Request Forgery
//   3. Secure Auth     — token storage, expiry, refresh, route guards
//
// ─── XSS (Cross-Site Scripting) ───────────────────────────────────────────────
//
//   An attacker injects JavaScript into your page that runs in users' browsers.
//   It can steal cookies, session tokens, or take actions on the user's behalf.
//
//   React protects you automatically by escaping all values in JSX:
//     <div>{userInput}</div>   ← safe — React escapes HTML entities
//
//   You OPT OUT of protection when you use:
//     dangerouslySetInnerHTML={{ __html: userInput }}  ← dangerous!
//
//   Stored XSS: attacker saves `<script>alert(1)</script>` to the DB.
//               Every user who loads the page runs it.
//
//   Reflected XSS: attacker crafts a URL with a payload in query params.
//                  Server reflects it back in HTML without escaping.
//
//   DOM XSS: attacker's input reaches document.write() or innerHTML directly.
//
//   React defence checklist:
//   ✓ Never use dangerouslySetInnerHTML with user-controlled content
//   ✓ If you MUST render HTML (markdown, rich text): sanitize with DOMPurify first
//   ✓ Use href="https://..." not href={userUrl} without validation
//   ✓ Never eval() or new Function() with user input
//   ✓ Set Content-Security-Policy header on the server
//
// ─── CSRF (Cross-Site Request Forgery) ───────────────────────────────────────
//
//   An attacker tricks a logged-in user's browser into making an unwanted
//   request to your server (e.g. transfer money, change email).
//
//   How it works:
//   1. User is logged into bank.com — session cookie is set
//   2. User visits evil.com which has: <img src="bank.com/transfer?to=attacker&amount=1000">
//   3. Browser automatically sends the session cookie with the image request
//   4. Bank server sees a valid session and processes the transfer
//
//   Defences:
//   ✓ CSRF Token: server generates a random token per session, client sends it
//     in a custom header or request body. Cookies are sent automatically,
//     custom headers are NOT (same-origin policy protects them).
//   ✓ SameSite=Strict/Lax cookie attribute: browser won't send cookie on
//     cross-site requests.
//   ✓ Check Origin/Referer headers on the server.
//   ✓ Use custom request headers (e.g. X-Requested-With: XMLHttpRequest).
//
//   React/SPA note: SPAs using JWT in Authorization header (not cookies)
//   are NOT vulnerable to CSRF — because the browser doesn't auto-send headers.
//   CSRF is only a risk when you use cookie-based sessions.
//
// ─── SECURE AUTH ──────────────────────────────────────────────────────────────
//
//   Token storage:
//   ✓ HttpOnly cookie (set by server)  — JS can't read it, CSRF token still needed
//   ✗ localStorage                     — readable by any JS, vulnerable to XSS
//   ✗ sessionStorage                   — slightly better but still JS-readable
//
//   JWT best practices:
//   ✓ Short expiry on access token (15min–1hr)
//   ✓ Long-lived refresh token in HttpOnly cookie
//   ✓ Rotate refresh token on each use
//   ✓ Revoke refresh tokens on logout
//   ✗ Never store sensitive data in JWT payload — it's base64, not encrypted
//
//   Route guards in React:
//   - Check auth state before rendering protected routes
//   - Redirect to /login if unauthenticated
//   - Redirect to / if already logged in and visiting /login

import React, { useState, useEffect, createContext, useContext } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { setupServer } from "msw/node";

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS UNDER TEST
// ═══════════════════════════════════════════════════════════════════════════════

// ── Sanitized HTML renderer (safe dangerouslySetInnerHTML) ────────────────────
// In real apps use DOMPurify. Here we simulate a simple sanitizer for testing.

const DANGEROUS_TAGS = /<script[\s\S]*?>[\s\S]*?<\/script>|javascript:/gi;

const sanitize = (html: string): string =>
  html.replace(DANGEROUS_TAGS, "").replace(/on\w+\s*=/gi, "data-blocked=");

const SafeHtmlRenderer: React.FC<{ html: string }> = ({ html }) => {
  const sanitized = sanitize(html);
  return (
    <div
      data-testid="html-output"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};

// ── URL validator — blocks javascript: hrefs ──────────────────────────────────

const isSafeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url, window.location.origin);
    return ["https:", "http:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const SafeLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => {
  if (!isSafeUrl(href)) {
    return <span data-testid="blocked-link" aria-label="Blocked unsafe link">{children}</span>;
  }
  return <a href={href} rel="noopener noreferrer" target="_blank">{children}</a>;
};

// ── CSRF-aware fetch wrapper ───────────────────────────────────────────────────

const csrfFetch = (url: string, options: RequestInit = {}): Promise<Response> => {
  const csrfToken = document.cookie
    .split("; ")
    .find(row => row.startsWith("csrf-token="))
    ?.split("=")[1] ?? "";

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,     // custom header — not sent automatically by browser
    },
    credentials: "include",          // send cookies for session
  });
};

// ── Auth context + route guard ────────────────────────────────────────────────

interface AuthState {
  user: { id: string; name: string; role: string } | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string;
}

const AuthContext = createContext<AuthState | null>(null);

const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "Login failed");
      }
      const data = await res.json();
      // Store token in memory (not localStorage) — cleared on tab close
      setToken(data.token);
      setUser(data.user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    // In real app: also call POST /api/auth/logout to revoke refresh token
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

// Route guard component
const RequireAuth: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = <div data-testid="login-redirect">Please log in</div>,
}) => {
  const { user } = useAuth();
  if (!user) return <>{fallback}</>;
  return <>{children}</>;
};

// Login form
const LoginForm: React.FC = () => {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Login form">
      <label htmlFor="email">Email</label>
      <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <label htmlFor="password">Password</label>
      <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
};

// Protected dashboard
const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  return (
    <div data-testid="dashboard">
      <h1>Welcome, {user?.name}</h1>
      <p data-testid="user-role">Role: {user?.role}</p>
      <button onClick={logout}>Sign out</button>
    </div>
  );
};

// Full app combining auth + route guard
const SecureApp: React.FC = () => (
  <AuthProvider>
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
    <LoginForm />
  </AuthProvider>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MSW SERVER
// ═══════════════════════════════════════════════════════════════════════════════

const server = setupServer(
  rest.post("/api/auth/login", async (req, res, ctx) => {
    const { email, password } = await req.json();

    if (email === "admin@test.com" && password === "password123") {
      return res(ctx.status(200), ctx.json({
        token: "eyJhbGciOiJIUzI1NiJ9.mock-access-token",
        user: { id: "u1", name: "Admin User", role: "admin" },
      }));
    }
    if (email === "user@test.com" && password === "password123") {
      return res(ctx.status(200), ctx.json({
        token: "eyJhbGciOiJIUzI1NiJ9.mock-user-token",
        user: { id: "u2", name: "Regular User", role: "member" },
      }));
    }
    return res(ctx.status(401), ctx.json({ message: "Invalid credentials" }));
  }),

  rest.post("/api/action", async (req, res, ctx) => {
    const csrfHeader = req.headers.get("X-CSRF-Token");
    if (!csrfHeader) {
      return res(ctx.status(403), ctx.json({ message: "CSRF token missing" }));
    }
    return res(ctx.status(200), ctx.json({ success: true }));
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ═══════════════════════════════════════════════════════════════════════════════
// 1. XSS PREVENTION
// ═══════════════════════════════════════════════════════════════════════════════

describe("1 — XSS Prevention", () => {
  it("React escapes JSX interpolation — script tags rendered as text", () => {
    const payload = '<script>alert("xss")</script>';
    render(<div data-testid="output">{payload}</div>);
    const el = screen.getByTestId("output");
    // Text content is the raw string, not executed script
    expect(el.textContent).toBe(payload);
    // No <script> element was injected into the DOM
    expect(document.querySelectorAll("script").length).toBe(0);
  });

  it("sanitizer strips <script> tags before dangerouslySetInnerHTML", () => {
    const payload = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
    render(<SafeHtmlRenderer html={payload} />);
    const el = screen.getByTestId("html-output");
    expect(el.innerHTML).not.toContain("<script>");
    expect(el.innerHTML).toContain("<p>Hello</p>");
    expect(el.innerHTML).toContain("<p>World</p>");
  });

  it("sanitizer blocks inline event handlers (onclick, onload)", () => {
    const payload = '<p onclick="alert(1)">Click me</p>';
    render(<SafeHtmlRenderer html={payload} />);
    const el = screen.getByTestId("html-output");
    expect(el.innerHTML).not.toContain("onclick=");
    expect(el.innerHTML).toContain("data-blocked=");
  });

  it("sanitizer blocks javascript: protocol in attributes", () => {
    const payload = '<a href="javascript:alert(1)">Click</a>';
    render(<SafeHtmlRenderer html={payload} />);
    const el = screen.getByTestId("html-output");
    expect(el.innerHTML).not.toContain("javascript:");
  });

  it("SafeLink blocks javascript: hrefs", () => {
    render(<SafeLink href="javascript:alert(1)">Click me</SafeLink>);
    expect(screen.getByTestId("blocked-link")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("SafeLink allows https:// hrefs", () => {
    render(<SafeLink href="https://example.com">Visit</SafeLink>);
    const link = screen.getByRole("link", { name: "Visit" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("SafeLink blocks data: URIs", () => {
    render(<SafeLink href="data:text/html,<script>alert(1)</script>">Click</SafeLink>);
    expect(screen.getByTestId("blocked-link")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CSRF DEFENCE
// ═══════════════════════════════════════════════════════════════════════════════

describe("2 — CSRF Defence", () => {
  it("csrfFetch includes X-CSRF-Token header in requests", async () => {
    let capturedCsrfToken: string | null = null;
    let capturedContentType: string | null = null;

    server.use(
      rest.post("/api/action", (req, res, ctx) => {
        capturedCsrfToken = req.headers.get("X-CSRF-Token");
        capturedContentType = req.headers.get("Content-Type");
        return res(ctx.status(200), ctx.json({ success: true }));
      })
    );

    // Set a fake CSRF token in document.cookie
    document.cookie = "csrf-token=test-token-abc123; path=/";

    await csrfFetch("/api/action", {
      method: "POST",
      body: JSON.stringify({ amount: 100 }),
    });

    expect(capturedCsrfToken).toBe("test-token-abc123");
    expect(capturedContentType).toBe("application/json");
  });

  it("server rejects request without CSRF token (403)", async () => {
    const res = await fetch("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // No X-CSRF-Token header
    });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.message).toBe("CSRF token missing");
  });

  it("csrfFetch sends credentials:include for session cookies", async () => {
    let capturedCredentials: string | undefined;

    server.use(
      rest.post("/api/action", (req, res, ctx) => {
        // credentials: 'include' shows up in request handling
        capturedCredentials = req.credentials;
        return res(ctx.status(200), ctx.json({ ok: true }));
      })
    );

    document.cookie = "csrf-token=token123; path=/";
    await csrfFetch("/api/action", { method: "POST", body: "{}" });

    // MSW in Node doesn't fully simulate credentials, but the key is
    // that our wrapper always sets credentials:'include'
    // Verify via the fetch spy instead
    const spy = jest.spyOn(global, "fetch");
    await csrfFetch("/api/action", { method: "POST", body: "{}" });
    const [, options] = spy.mock.calls[spy.mock.calls.length - 1];
    expect((options as RequestInit).credentials).toBe("include");
    spy.mockRestore();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. SECURE AUTH — login flow, route guard, logout
// ═══════════════════════════════════════════════════════════════════════════════

describe("3 — Secure Auth — login flow", () => {
  it("shows login redirect when user is not authenticated", () => {
    render(<SecureApp />);
    expect(screen.getByTestId("login-redirect")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
  });

  it("dashboard is hidden until user logs in", async () => {
    render(<SecureApp />);
    expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
  });

  it("shows dashboard after successful login", async () => {
    const user = userEvent.setup();
    render(<SecureApp />);

    await user.type(screen.getByLabelText("Email"), "admin@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByTestId("dashboard")).toBeInTheDocument();
    expect(screen.getByText("Welcome, Admin User")).toBeInTheDocument();
    expect(screen.getByTestId("user-role")).toHaveTextContent("Role: admin");
  });

  it("shows error message on invalid credentials", async () => {
    const user = userEvent.setup();
    render(<SecureApp />);

    await user.type(screen.getByLabelText("Email"), "wrong@test.com");
    await user.type(screen.getByLabelText("Password"), "badpassword");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials");
    expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
  });

  it("disables sign in button while request is in flight", async () => {
    server.use(
      rest.post("/api/auth/login", (_req, res, ctx) =>
        res(ctx.delay(200), ctx.status(200), ctx.json({
          token: "tok",
          user: { id: "u1", name: "Slow User", role: "member" },
        }))
      )
    );

    const user = userEvent.setup();
    render(<SecureApp />);

    await user.type(screen.getByLabelText("Email"), "user@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled();
    await screen.findByTestId("dashboard");
  });

  it("clears dashboard on logout and shows login redirect again", async () => {
    const user = userEvent.setup();
    render(<SecureApp />);

    await user.type(screen.getByLabelText("Email"), "admin@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByTestId("dashboard");

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
      expect(screen.getByTestId("login-redirect")).toBeInTheDocument();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SECURE AUTH — token storage rules
// ═══════════════════════════════════════════════════════════════════════════════

describe("4 — Token storage rules", () => {
  it("token is stored in memory (state), NOT in localStorage", async () => {
    const user = userEvent.setup();
    render(<SecureApp />);

    await user.type(screen.getByLabelText("Email"), "admin@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByTestId("dashboard");

    // Token must NOT be in localStorage (vulnerable to XSS)
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("access_token")).toBeNull();
  });

  it("logout clears token from memory — auth state resets, localStorage stays empty", async () => {
    const user = userEvent.setup();

    render(<SecureApp />);

    // Login
    await user.type(screen.getByLabelText("Email"), "admin@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByTestId("dashboard");

    // Token is in memory — not persisted anywhere
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("auth_token")).toBeNull();

    // Logout
    await user.click(screen.getByRole("button", { name: "Sign out" }));

    // Auth state cleared — UI reverts to unauthenticated (proves token is gone from memory)
    await waitFor(() => {
      expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
      expect(screen.getByTestId("login-redirect")).toBeInTheDocument();
    });

    // Still not in localStorage after logout either
    expect(localStorage.getItem("token")).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. ROUTE GUARD
// ═══════════════════════════════════════════════════════════════════════════════

describe("5 — Route guard (RequireAuth)", () => {
  it("renders fallback when unauthenticated", () => {
    render(
      <AuthProvider>
        <RequireAuth fallback={<div data-testid="fallback">Access denied</div>}>
          <div data-testid="protected">Secret content</div>
        </RequireAuth>
      </AuthProvider>
    );

    expect(screen.getByTestId("fallback")).toBeInTheDocument();
    expect(screen.queryByTestId("protected")).not.toBeInTheDocument();
  });

  it("renders children once authenticated", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <RequireAuth>
          <div data-testid="protected">Secret content</div>
        </RequireAuth>
        <LoginForm />
      </AuthProvider>
    );

    expect(screen.queryByTestId("protected")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Email"), "user@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByTestId("protected")).toBeInTheDocument();
    expect(screen.getByText("Secret content")).toBeInTheDocument();
  });
});
