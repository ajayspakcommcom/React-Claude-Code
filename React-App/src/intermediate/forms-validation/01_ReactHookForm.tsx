// TOPIC: React Hook Form — Core API
//
// React Hook Form (RHF) is the industry standard for forms in React.
// It uses UNCONTROLLED inputs under the hood (refs, not state) which means:
//   ✅ Zero re-renders while typing (unlike useState-controlled forms)
//   ✅ Less boilerplate — no onChange handlers
//   ✅ Built-in validation with helpful error messages
//   ✅ Works with any UI library (MUI, Chakra, Ant Design)
//
// CORE API covered here:
//   useForm()          → the main hook — returns register, handleSubmit, formState, etc.
//   register()         → connects an input to the form + sets validation rules
//   handleSubmit()     → wraps your onSubmit, only calls it when validation passes
//   formState.errors   → object with per-field error messages
//   formState flags    → isSubmitting, isDirty, isValid, touchedFields
//   watch()            → read live field values (triggers re-render on change)
//   reset()            → reset form to default / custom values
//   setValue()         → programmatically set a field value
//   getValues()        → read all values without watching
//   setError()         → manually set a server-side error on a field
//   clearErrors()      → clear specific or all errors
//   Built-in rules     → required, minLength, maxLength, min, max, pattern, validate

import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — define the shape of the form data
// ─────────────────────────────────────────────────────────────────────────────

interface RegisterForm {
  username:        string;
  email:           string;
  password:        string;
  confirmPassword: string;
  age:             number;
  website:         string;
  bio:             string;
  role:            "admin" | "editor" | "viewer";
  agree:           boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEMO COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ReactHookFormDemo() {
  const [submitted, setSubmitted] = useState<RegisterForm | null>(null);

  const {
    register,         // connects input to form
    handleSubmit,     // wraps onSubmit — only fires when validation passes
    formState: {
      errors,         // per-field errors: errors.email?.message
      isSubmitting,   // true while onSubmit promise is pending
      isDirty,        // true if any field differs from defaultValues
      isValid,        // true if no errors (only reliable with mode: "onChange"/"onBlur")
      touchedFields,  // tracks which fields the user has interacted with
    },
    watch,            // read live values — triggers re-render when watched field changes
    reset,            // reset to defaultValues or a custom value
    setValue,         // programmatically set a field
    getValues,        // read all values without watching
    setError,         // set a server-side / manual error
    clearErrors,      // clear specific errors
  } = useForm<RegisterForm>({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      age: undefined,
      website: "",
      bio: "",
      role: "viewer",
      agree: false,
    },
    mode: "onTouched",   // validate on blur first, then on change after first error
    // mode options:
    //   "onSubmit"  → validate only on submit (default)
    //   "onBlur"    → validate when field loses focus
    //   "onChange"  → validate on every keystroke
    //   "onTouched" → onBlur first, then onChange after touched (best UX)
    //   "all"       → onBlur + onChange
  });

  // watch() — re-renders this component when password changes (for confirm match)
  const passwordValue = watch("password");
  const roleValue     = watch("role");

  // Simulate async submit (e.g. API call)
  const onSubmit: SubmitHandler<RegisterForm> = async (data) => {
    await new Promise((r) => setTimeout(r, 1000)); // fake network delay

    // Simulate server saying username is taken
    if (data.username === "admin") {
      setError("username", { type: "server", message: "Username is already taken" });
      return;
    }

    setSubmitted(data);
  };

  return (
    <div>
      <h2>React Hook Form — Core API</h2>
      <p style={descStyle}>
        Uncontrolled inputs (refs) = zero re-renders while typing.
        All validation, error display, and submission handled by RHF.
      </p>

      {/* ── Status bar ───────────────────────────────────────────── */}
      <div style={statusBar}>
        <Badge label="isDirty"       active={isDirty}       color="#e67e22" />
        <Badge label="isValid"       active={isValid}       color="#27ae60" />
        <Badge label="isSubmitting"  active={isSubmitting}  color="#9b59b6" />
        <span style={{ fontSize:"11px", color:"#888" }}>
          touched: {Object.keys(touchedFields).join(", ") || "none"}
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={formStyle}>

        {/* ── Username ─────────────────────────────────────────────── */}
        <Field label="Username" error={errors.username?.message}>
          <input
            {...register("username", {
              required:  "Username is required",
              minLength: { value: 3, message: "Min 3 characters" },
              maxLength: { value: 20, message: "Max 20 characters" },
              pattern:   { value: /^[a-zA-Z0-9_]+$/, message: "Letters, numbers, underscores only" },
            })}
            placeholder="e.g. john_doe"
            style={inputStyle(!!errors.username)}
          />
          <Hint>Try typing "admin" to see a server-side error.</Hint>
        </Field>

        {/* ── Email ────────────────────────────────────────────────── */}
        <Field label="Email" error={errors.email?.message}>
          <input
            type="email"
            {...register("email", {
              required: "Email is required",
              pattern:  { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
            })}
            placeholder="you@example.com"
            style={inputStyle(!!errors.email)}
          />
        </Field>

        {/* ── Password ─────────────────────────────────────────────── */}
        <Field label="Password" error={errors.password?.message}>
          <input
            type="password"
            {...register("password", {
              required:  "Password is required",
              minLength: { value: 8, message: "Min 8 characters" },
              validate: {
                hasUppercase: (v) => /[A-Z]/.test(v) || "Must contain an uppercase letter",
                hasNumber:    (v) => /\d/.test(v)    || "Must contain a number",
              },
            })}
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            style={inputStyle(!!errors.password)}
          />
        </Field>

        {/* ── Confirm Password — cross-field validate ───────────────── */}
        <Field label="Confirm Password" error={errors.confirmPassword?.message}>
          <input
            type="password"
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (v) => v === passwordValue || "Passwords do not match",
              // validate uses the live watch() value — RHF re-validates when password changes
            })}
            placeholder="Re-enter password"
            style={inputStyle(!!errors.confirmPassword)}
          />
        </Field>

        {/* ── Age — number field ────────────────────────────────────── */}
        <Field label="Age" error={errors.age?.message}>
          <input
            type="number"
            {...register("age", {
              required:  "Age is required",
              min:       { value: 18, message: "Must be at least 18" },
              max:       { value: 120, message: "Enter a valid age" },
              valueAsNumber: true,   // converts string → number automatically
            })}
            placeholder="18 – 120"
            style={{ ...inputStyle(!!errors.age), width:"100px" }}
          />
        </Field>

        {/* ── Website — optional URL ────────────────────────────────── */}
        <Field label="Website (optional)" error={errors.website?.message}>
          <input
            {...register("website", {
              pattern: {
                value:   /^(https?:\/\/)?([\w-]+\.)+[\w]{2,}(\/\S*)?$/,
                message: "Enter a valid URL",
              },
            })}
            placeholder="https://yoursite.com"
            style={inputStyle(!!errors.website)}
          />
        </Field>

        {/* ── Bio — textarea ────────────────────────────────────────── */}
        <Field label="Bio" error={errors.bio?.message}>
          <textarea
            {...register("bio", {
              maxLength: { value: 200, message: "Max 200 characters" },
            })}
            rows={3}
            placeholder="Tell us about yourself…"
            style={{ ...inputStyle(!!errors.bio), resize:"vertical", fontFamily:"sans-serif" }}
          />
          <LiveCount value={watch("bio") ?? ""} max={200} />
        </Field>

        {/* ── Role — select ─────────────────────────────────────────── */}
        <Field label="Role" error={errors.role?.message}>
          <select
            {...register("role", { required: "Select a role" })}
            style={{ ...inputStyle(!!errors.role), width:"160px" }}
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          {roleValue === "admin" && (
            <span style={{ marginLeft:"10px", fontSize:"12px", color:"#e74c3c" }}>
              ⚠ Admin has full access
            </span>
          )}
        </Field>

        {/* ── Agree checkbox ───────────────────────────────────────── */}
        <Field label="" error={errors.agree?.message}>
          <label style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"13px", cursor:"pointer" }}>
            <input
              type="checkbox"
              {...register("agree", { required: "You must accept the terms" })}
            />
            I agree to the terms and conditions
          </label>
        </Field>

        {/* ── Actions ──────────────────────────────────────────────── */}
        <div style={{ display:"flex", gap:"10px", marginTop:"8px" }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={submitBtn}
          >
            {isSubmitting ? "Submitting…" : "Register"}
          </button>

          <button
            type="button"
            onClick={() => { reset(); setSubmitted(null); clearErrors(); }}
            style={resetBtn}
          >
            Reset
          </button>

          <button
            type="button"
            onClick={() => setValue("username", "prefilled_user", { shouldDirty: true, shouldValidate: true })}
            style={resetBtn}
          >
            setValue demo
          </button>
        </div>
      </form>

      {/* ── Success output ────────────────────────────────────────── */}
      {submitted && (
        <div style={successBox}>
          <strong>✓ Submitted successfully</strong>
          <pre style={{ margin:"8px 0 0", fontSize:"12px", overflowX:"auto" }}>
            {JSON.stringify(submitted, null, 2)}
          </pre>
        </div>
      )}

      {/* ── API reference ─────────────────────────────────────────── */}
      <div style={summaryBox}>
        <strong>Core API summary:</strong>
        <ul style={ul}>
          <li><code>register(name, rules)</code> — connects input + sets validation (required, min, max, pattern, validate)</li>
          <li><code>handleSubmit(fn)</code> — runs validation first, calls fn only if valid</li>
          <li><code>errors.field?.message</code> — per-field error string</li>
          <li><code>formState.isDirty / isValid / isSubmitting / touchedFields</code></li>
          <li><code>watch("field")</code> — live value, triggers re-render (use for dependent fields)</li>
          <li><code>reset(values?)</code> — reset to defaults or new values</li>
          <li><code>setValue(name, value, options)</code> — set programmatically</li>
          <li><code>getValues()</code> — snapshot of all values, no re-render</li>
          <li><code>setError(name, error)</code> — inject server-side errors</li>
          <li><code>mode: "onTouched"</code> — best UX: validate on blur first, then on change</li>
        </ul>
      </div>
    </div>
  );
}

// ─── shared UI helpers ────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom:"14px" }}>
      {label && <label style={{ display:"block", fontSize:"13px", fontWeight:"bold", marginBottom:"4px" }}>{label}</label>}
      {children}
      {error && <p style={{ margin:"3px 0 0", fontSize:"12px", color:"#e74c3c" }}>{error}</p>}
    </div>
  );
}

function Badge({ label, active, color }: { label: string; active: boolean; color: string }) {
  return (
    <span style={{ padding:"2px 8px", borderRadius:"12px", fontSize:"11px", background: active ? color : "#eee", color: active ? "#fff" : "#aaa" }}>
      {label}
    </span>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p style={{ margin:"2px 0 0", fontSize:"11px", color:"#aaa" }}>{children}</p>;
}

function LiveCount({ value, max }: { value: string; max: number }) {
  const len   = value.length;
  const over  = len > max;
  return <p style={{ margin:"2px 0 0", fontSize:"11px", color: over ? "#e74c3c" : "#aaa" }}>{len}/{max}</p>;
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    display:"block", width:"100%", padding:"7px 10px", boxSizing:"border-box",
    border: `1px solid ${hasError ? "#e74c3c" : "#ddd"}`, borderRadius:"4px",
    fontSize:"13px", outline:"none",
  };
}

const formStyle:   React.CSSProperties = { maxWidth:"480px", padding:"20px", background:"#fafafa", borderRadius:"8px", marginBottom:"16px" };
const statusBar:   React.CSSProperties = { display:"flex", gap:"8px", alignItems:"center", marginBottom:"12px", flexWrap:"wrap" };
const submitBtn:   React.CSSProperties = { padding:"8px 20px", background:"#4a90e2", color:"#fff", border:"none", borderRadius:"4px", cursor:"pointer", fontSize:"13px" };
const resetBtn:    React.CSSProperties = { padding:"8px 16px", background:"#888", color:"#fff", border:"none", borderRadius:"4px", cursor:"pointer", fontSize:"13px" };
const successBox:  React.CSSProperties = { padding:"12px", background:"#f0fff0", borderRadius:"6px", fontSize:"13px", marginBottom:"16px" };
const summaryBox:  React.CSSProperties = { padding:"12px", background:"#f5f5f5", borderRadius:"6px", fontSize:"13px" };
const descStyle:   React.CSSProperties = { fontSize:"13px", color:"#666", marginBottom:"14px" };
const ul:          React.CSSProperties = { margin:"6px 0 0", paddingLeft:"18px", lineHeight:"1.9" };
