// TOPIC: React Hook Form — Advanced / Missing Features
//
// This file covers the remaining industry-standard RHF APIs not shown in 01_ReactHookForm.tsx:
//
//   resetField()          → reset a single field without touching the rest of the form
//   setFocus()            → programmatically focus a field (e.g. on error, on mount)
//   criteriaMode: "all"   → show ALL validation errors at once (vs only the first)
//   reValidateMode        → control when re-validation fires after first submission attempt
//   shouldUnregister      → unregister a field from the form when its component unmounts
//   errors.root           → form-level error not tied to any specific field

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

// ─────────────────────────────────────────────────────────────────────────────
// 1. criteriaMode: "all" — show ALL errors at once
// ─────────────────────────────────────────────────────────────────────────────
//
// Default behavior: only the FIRST failing rule shows its error.
// criteriaMode: "all" → ALL failing rules show simultaneously.
// Best use case: password strength fields where users need to see all requirements.
//
// With criteriaMode "all", errors become:
//   errors.password?.types → { required: true, minLength: "Min 8 chars", ... }
// instead of:
//   errors.password?.message → only first error

interface PasswordForm { password: string; }

function CriteriaModeDemo() {
  const { register, handleSubmit, formState: { errors } } = useForm<PasswordForm>({
    criteriaMode: "all",        // ← show ALL errors, not just the first
    mode: "onChange",           // validate live so user sees errors as they type
  });

  // With criteriaMode "all", errors.field.types has ALL failing rules
  const pwdTypes = errors.password?.types;

  return (
    <Section title="1. criteriaMode: 'all' — show all errors simultaneously" bg="#f8f9ff">
      <form onSubmit={handleSubmit(() => {})} noValidate style={{ maxWidth:"380px" }}>
        <label style={labelStyle}>Password</label>
        <input
          type="password"
          {...register("password", {
            required:  "Password is required",
            minLength: { value: 8,  message: "At least 8 characters" },
            validate: {
              hasUppercase: (v) => /[A-Z]/.test(v)       || "Must contain an uppercase letter",
              hasNumber:    (v) => /[0-9]/.test(v)        || "Must contain a number",
              hasSymbol:    (v) => /[^A-Za-z0-9]/.test(v) || "Must contain a special character",
            },
          })}
          placeholder="Try typing a weak password"
          style={inp(!!errors.password)}
        />

        {/* Render ALL failing rules as a checklist */}
        <ul style={{ listStyle:"none", margin:"8px 0 0", padding:0 }}>
          {[
            { key: "required",     label: "Required" },
            { key: "minLength",    label: "At least 8 characters" },
            { key: "hasUppercase", label: "Uppercase letter" },
            { key: "hasNumber",    label: "Number" },
            { key: "hasSymbol",    label: "Special character" },
          ].map(({ key, label }) => {
            const failing = pwdTypes?.[key];
            return (
              <li key={key} style={{ fontSize:"12px", marginBottom:"3px", color: failing ? "#e74c3c" : "#27ae60" }}>
                {failing ? "✗" : "✓"} {label}
              </li>
            );
          })}
        </ul>

        <button type="submit" style={{ ...solidBtn, marginTop:"10px" }}>Check</button>
      </form>
      <Note>
        <code>criteriaMode: "all"</code> → <code>errors.password.types</code> is an object with ALL failing rule keys.
        Default (<code>"firstError"</code>) only populates <code>errors.password.message</code> with the first failure.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. reValidateMode — control re-validation timing after first submit
// ─────────────────────────────────────────────────────────────────────────────
//
// mode         → when to validate BEFORE the first submit attempt
// reValidateMode → when to validate AFTER the first submit attempt (default: "onChange")
//
// Common patterns:
//   mode: "onSubmit",  reValidateMode: "onChange"  → validate on submit, re-validate live after (default)
//   mode: "onSubmit",  reValidateMode: "onBlur"    → both submit and re-validate only on blur
//   mode: "onSubmit",  reValidateMode: "onSubmit"  → only validate on each submit (no live feedback)

interface RevalidateForm { username: string; email: string; }

function RevalidateModeDemo() {
  const [mode, setMode] = useState<"onChange" | "onBlur" | "onSubmit">("onChange");
  const [submitCount, setSubmitCount] = useState(0);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<RevalidateForm>({
    mode:           "onSubmit",    // validate first time only on submit
    reValidateMode: mode,          // re-validate according to selected mode
  });

  function changeMode(m: typeof mode) {
    setMode(m);
    reset();
    setSubmitCount(0);
  }

  return (
    <Section title="2. reValidateMode — when to re-validate after first submit" bg="#fff8f0">
      <div style={{ display:"flex", gap:"8px", marginBottom:"14px" }}>
        {(["onChange","onBlur","onSubmit"] as const).map((m) => (
          <button
            key={m}
            onClick={() => changeMode(m)}
            style={{ padding:"4px 12px", border:"1px solid #ddd", borderRadius:"4px", fontSize:"12px", cursor:"pointer", background: mode === m ? "#4a90e2" : "#fff", color: mode === m ? "#fff" : "#333" }}
          >
            {m}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit(() => setSubmitCount(c => c + 1))}
        noValidate
        style={{ maxWidth:"380px" }}
      >
        <div style={{ marginBottom:"10px" }}>
          <label style={labelStyle}>Username</label>
          <input
            {...register("username", { required: "Username required", minLength: { value: 3, message: "Min 3 chars" } })}
            placeholder="Type something short"
            style={inp(!!errors.username)}
          />
          {errors.username && <p style={errMsg}>{errors.username.message}</p>}
        </div>

        <div style={{ marginBottom:"10px" }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            {...register("email", { required: "Email required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" } })}
            placeholder="not-an-email"
            style={inp(!!errors.email)}
          />
          {errors.email && <p style={errMsg}>{errors.email.message}</p>}
        </div>

        <button type="submit" style={solidBtn}>Submit</button>
        {submitCount > 0 && <span style={{ marginLeft:"10px", fontSize:"12px", color:"#27ae60" }}>✓ Submitted {submitCount}x</span>}
      </form>
      <Note>
        <strong>Current reValidateMode: <code>{mode}</code></strong><br />
        Submit once to trigger errors, then edit the fields to see when errors clear.<br />
        <code>"onChange"</code> → errors clear as you type. <code>"onBlur"</code> → errors clear on blur. <code>"onSubmit"</code> → errors only clear on next submit.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. resetField() — reset a single field
// ─────────────────────────────────────────────────────────────────────────────
//
// reset()       → resets the ENTIRE form (all fields + all errors)
// resetField()  → resets ONE field: clears its value, error, dirty/touched state
//
// Options:
//   resetField("name", { defaultValue: "new default" })  → reset to a specific value
//   resetField("name", { keepError: true })              → keep the error but reset value/dirty
//   resetField("name", { keepDirty: true })              → keep dirty state
//   resetField("name", { keepTouched: true })            → keep touched state

interface ProfileForm { firstName: string; lastName: string; bio: string; }

function ResetFieldDemo() {
  const {
    register,
    handleSubmit,
    resetField,
    reset,
    formState: { errors, dirtyFields, touchedFields },
  } = useForm<ProfileForm>({
    defaultValues: { firstName: "Jane", lastName: "Doe", bio: "" },
    mode: "onTouched",
  });

  return (
    <Section title="3. resetField() — reset a single field independently" bg="#f0fff8">
      <form onSubmit={handleSubmit(() => {})} noValidate style={{ maxWidth:"420px" }}>
        {(["firstName","lastName","bio"] as const).map((name) => (
          <div key={name} style={{ marginBottom:"10px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"3px" }}>
              <label style={labelStyle}>{name}</label>
              <div style={{ display:"flex", gap:"6px" }}>
                <span style={{ fontSize:"10px", color: dirtyFields[name]   ? "#e67e22" : "#ccc" }}>dirty</span>
                <span style={{ fontSize:"10px", color: touchedFields[name] ? "#9b59b6" : "#ccc" }}>touched</span>
                <button
                  type="button"
                  onClick={() => resetField(name)}
                  style={{ padding:"1px 8px", border:"1px solid #ddd", borderRadius:"3px", fontSize:"11px", cursor:"pointer", background:"#fff" }}
                >
                  resetField
                </button>
              </div>
            </div>
            {name === "bio" ? (
              <textarea
                {...register(name, { maxLength: { value: 100, message: "Max 100 chars" } })}
                rows={2}
                style={{ ...inp(!!errors[name]), resize:"vertical", fontFamily:"sans-serif" }}
              />
            ) : (
              <input
                {...register(name, { required: `${name} is required` })}
                style={inp(!!errors[name])}
              />
            )}
            {errors[name] && <p style={errMsg}>{errors[name]?.message}</p>}
          </div>
        ))}

        <div style={{ display:"flex", gap:"8px" }}>
          <button type="submit" style={solidBtn}>Save</button>
          <button type="button" onClick={() => reset()} style={outlineBtn}>Reset All</button>
          <button
            type="button"
            onClick={() => resetField("bio", { defaultValue: "Prefilled bio text" })}
            style={outlineBtn}
          >
            resetField bio (new default)
          </button>
        </div>
      </form>
      <Note>
        Each field has its own <code>resetField(name)</code> button — resets value + dirty + touched + error for that field only.
        <code>resetField("bio", {"{ defaultValue: '...' }"})</code> resets to a new value instead of the original default.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. setFocus() — programmatically focus a field
// ─────────────────────────────────────────────────────────────────────────────
//
// Use cases:
//   - Focus the first error field after submission
//   - Auto-focus first field on mount
//   - Focus next field after a successful action

interface FocusForm { cardNumber: string; expiry: string; cvv: string; name: string; }

function SetFocusDemo() {
  const { register, handleSubmit, setFocus, formState: { errors } } = useForm<FocusForm>({
    mode: "onSubmit",
  });

  // Auto-focus card number on mount
  useEffect(() => {
    setFocus("cardNumber");
  }, [setFocus]);

  const onSubmit = (data: FocusForm) => {
    alert("Card saved: " + data.cardNumber);
  };

  // On error, focus the first field that has an error
  const onError = (errs: typeof errors) => {
    const firstError = (["cardNumber","expiry","cvv","name"] as const).find((f) => errs[f]);
    if (firstError) setFocus(firstError);
  };

  return (
    <Section title="4. setFocus() — programmatic focus" bg="#fff0f8">
      <p style={{ fontSize:"12px", color:"#666", marginTop:0, marginBottom:"12px" }}>
        Card number is auto-focused on mount (<code>useEffect + setFocus</code>).
        On submit error, focus jumps to the first invalid field.
      </p>
      <form onSubmit={handleSubmit(onSubmit, onError)} noValidate style={{ maxWidth:"380px" }}>
        <div style={{ marginBottom:"10px" }}>
          <label style={labelStyle}>Card Number</label>
          <input {...register("cardNumber", { required: "Required", pattern: { value:/^\d{16}$/, message:"16 digits" } })} placeholder="1234567890123456" maxLength={16} style={inp(!!errors.cardNumber)} />
          {errors.cardNumber && <p style={errMsg}>{errors.cardNumber.message}</p>}
        </div>
        <div style={{ display:"flex", gap:"12px", marginBottom:"10px" }}>
          <div style={{ flex:1 }}>
            <label style={labelStyle}>Expiry (MM/YY)</label>
            <input {...register("expiry", { required: "Required", pattern: { value:/^(0[1-9]|1[0-2])\/\d{2}$/, message:"MM/YY" } })} placeholder="12/26" style={inp(!!errors.expiry)} />
            {errors.expiry && <p style={errMsg}>{errors.expiry.message}</p>}
          </div>
          <div>
            <label style={labelStyle}>CVV</label>
            <input {...register("cvv", { required: "Required", pattern: { value:/^\d{3,4}$/, message:"3-4 digits" } })} placeholder="123" maxLength={4} style={{ ...inp(!!errors.cvv), width:"80px" }} />
            {errors.cvv && <p style={errMsg}>{errors.cvv.message}</p>}
          </div>
        </div>
        <div style={{ marginBottom:"10px" }}>
          <label style={labelStyle}>Cardholder Name</label>
          <input {...register("name", { required: "Required" })} placeholder="Jane Doe" style={inp(!!errors.name)} />
          {errors.name && <p style={errMsg}>{errors.name.message}</p>}
        </div>

        <div style={{ display:"flex", gap:"8px" }}>
          <button type="submit" style={solidBtn}>Pay</button>
          {(["cardNumber","expiry","cvv","name"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFocus(f)} style={outlineBtn}>
              focus {f === "cardNumber" ? "card" : f}
            </button>
          ))}
        </div>
      </form>
      <Note>
        <code>setFocus("fieldName")</code> — works anywhere: <code>useEffect</code>, event handlers, error callbacks.
        <code>handleSubmit(onValid, onError)</code> — second argument receives errors object when validation fails.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. shouldUnregister — remove field value when component unmounts
// ─────────────────────────────────────────────────────────────────────────────
//
// Default (shouldUnregister: false):
//   When a field's component unmounts (e.g. conditional render), its value is KEPT in the form.
//   Good for multi-step forms where you want to preserve data between steps.
//
// shouldUnregister: true:
//   When the component unmounts, the field is removed from the form entirely.
//   Good for conditional fields — if user hides the field, its value shouldn't be submitted.

interface ShippingForm {
  shippingMethod: "standard" | "express" | "pickup";
  address?: string;
  pickupLocation?: string;
  expressNote?: string;
}

function ShouldUnregisterDemo() {
  // shouldUnregister: true — conditional fields are removed when hidden
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ShippingForm>({
    defaultValues: { shippingMethod: "standard" },
    shouldUnregister: true,    // ← field values removed from form when component unmounts
  });

  const method = watch("shippingMethod");
  const [result, setResult] = useState<ShippingForm | null>(null);

  return (
    <Section title="5. shouldUnregister — field value removed when component unmounts" bg="#f5f0ff">
      <form onSubmit={handleSubmit((d) => setResult(d))} noValidate style={{ maxWidth:"420px" }}>
        <div style={{ marginBottom:"12px" }}>
          <label style={labelStyle}>Shipping Method</label>
          <div style={{ display:"flex", gap:"10px" }}>
            {(["standard","express","pickup"] as const).map((m) => (
              <label key={m} style={radioLabel}>
                <input type="radio" value={m} {...register("shippingMethod")} />
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </label>
            ))}
          </div>
        </div>

        {/* These fields only mount when their shipping method is selected */}
        {(method === "standard" || method === "express") && (
          <div style={{ marginBottom:"10px" }}>
            <label style={labelStyle}>Delivery Address</label>
            <input
              {...register("address", { required: "Address required for delivery" })}
              placeholder="123 Main St, City, ZIP"
              style={inp(!!errors.address)}
            />
            {errors.address && <p style={errMsg}>{errors.address.message}</p>}
          </div>
        )}

        {method === "express" && (
          <div style={{ marginBottom:"10px" }}>
            <label style={labelStyle}>Express Delivery Note (optional)</label>
            <input {...register("expressNote")} placeholder="Leave at door, ring bell, etc." style={inp(false)} />
          </div>
        )}

        {method === "pickup" && (
          <div style={{ marginBottom:"10px" }}>
            <label style={labelStyle}>Pickup Location</label>
            <select {...register("pickupLocation", { required: "Select a location" })} style={inp(!!errors.pickupLocation)}>
              <option value="">Select…</option>
              <option value="downtown">Downtown Store</option>
              <option value="mall">Mall Location</option>
              <option value="warehouse">Warehouse</option>
            </select>
            {errors.pickupLocation && <p style={errMsg}>{errors.pickupLocation.message}</p>}
          </div>
        )}

        <button type="submit" style={solidBtn}>Place Order</button>
      </form>

      {result && (
        <div style={successBox}>
          <strong>Submitted (notice: only active fields are in the data):</strong>
          <pre style={{ margin:"6px 0 0", fontSize:"11px" }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      <Note>
        <code>shouldUnregister: true</code> — switch from Express to Pickup and submit.
        <code>address</code> and <code>expressNote</code> are NOT in the submitted data because their components unmounted.
        Without this option, hidden field values would still be submitted.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. errors.root — form-level errors (not tied to any field)
// ─────────────────────────────────────────────────────────────────────────────
//
// errors.root is for errors that apply to the whole form, not a specific field.
// Use cases:
//   - "Invalid credentials" from a login API (don't want to mark just email or password)
//   - "Too many attempts. Please wait." server error
//   - Custom cross-form validation that doesn't belong to a specific field

interface LoginForm { email: string; password: string; }

function RootErrorDemo() {
  const [attempt, setAttempt] = useState(0);

  const { register, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    mode: "onTouched",
  });

  const onSubmit = async (data: LoginForm) => {
    await new Promise((r) => setTimeout(r, 800));
    setAttempt(a => a + 1);

    // Simulate wrong credentials from server
    if (data.email !== "admin@test.com" || data.password !== "Password1!") {
      setError("root.serverError", {   // "root.serverError" is a namespaced root error
        message: attempt >= 2
          ? "Too many failed attempts. Please wait 30 seconds."
          : "Invalid email or password.",
      });
      return;
    }

    clearErrors("root");
    alert("Login successful!");
  };

  return (
    <Section title="6. errors.root — form-level errors" bg="#fff8f8">
      <p style={{ fontSize:"12px", color:"#666", marginTop:0, marginBottom:"10px" }}>
        Login with wrong credentials to see a form-level error. Use <code>admin@test.com</code> / <code>Password1!</code> to succeed.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth:"360px" }}>

        {/* Form-level error displayed at the top */}
        {errors.root?.serverError && (
          <div style={{ padding:"10px 12px", background:"#fef0f0", border:"1px solid #fcc", borderRadius:"6px", marginBottom:"12px", fontSize:"13px", color:"#e74c3c" }}>
            {errors.root.serverError.message}
          </div>
        )}

        <div style={{ marginBottom:"10px" }}>
          <label style={labelStyle}>Email</label>
          <input type="email" {...register("email", { required: "Email required" })} placeholder="admin@test.com" style={inp(!!errors.email)} />
          {errors.email && <p style={errMsg}>{errors.email.message}</p>}
        </div>

        <div style={{ marginBottom:"10px" }}>
          <label style={labelStyle}>Password</label>
          <input type="password" {...register("password", { required: "Password required" })} placeholder="Password1!" style={inp(!!errors.password)} />
          {errors.password && <p style={errMsg}>{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} style={solidBtn}>
          {isSubmitting ? "Signing in…" : "Sign In"}
        </button>
        {attempt > 0 && <span style={{ marginLeft:"10px", fontSize:"11px", color:"#aaa" }}>Attempt: {attempt}</span>}
      </form>
      <Note>
        <code>setError("root.serverError", {"{ message }"})</code> — sets a root-level error.
        Access via <code>errors.root?.serverError?.message</code>.
        <code>clearErrors("root")</code> clears all root errors.
        This keeps field errors clean — email/password fields don't get marked red for a credentials error.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function RHFAdvancedDemo() {
  return (
    <div>
      <h2>React Hook Form — Advanced Features</h2>
      <p style={{ fontSize:"13px", color:"#666", marginBottom:"16px" }}>
        Completing the RHF API: criteriaMode, reValidateMode, resetField, setFocus, shouldUnregister, errors.root.
      </p>

      <CriteriaModeDemo />
      <RevalidateModeDemo />
      <ResetFieldDemo />
      <SetFocusDemo />
      <ShouldUnregisterDemo />
      <RootErrorDemo />

      <div style={{ padding:"12px", background:"#f5f5f5", borderRadius:"6px", fontSize:"13px" }}>
        <strong>Advanced RHF API reference:</strong>
        <ul style={{ margin:"6px 0 0", paddingLeft:"18px", lineHeight:"1.9" }}>
          <li><code>criteriaMode: "all"</code> → <code>errors.field.types</code> has ALL failing rules (not just first)</li>
          <li><code>reValidateMode</code> → when to re-validate after first submit: <code>"onChange"</code> | <code>"onBlur"</code> | <code>"onSubmit"</code></li>
          <li><code>resetField(name, options?)</code> → reset one field's value + dirty + touched + error</li>
          <li><code>setFocus(name)</code> → focus a field programmatically (on mount, on error, on action)</li>
          <li><code>handleSubmit(onValid, onError)</code> → second arg receives errors when validation fails</li>
          <li><code>shouldUnregister: true</code> → field removed from form data when its component unmounts</li>
          <li><code>setError("root.serverError", {"{ message }"})</code> → form-level error for API responses</li>
          <li><code>errors.root?.serverError?.message</code> → read root error</li>
        </ul>
      </div>
    </div>
  );
}

// ─── shared helpers ───────────────────────────────────────────────────────────

function Section({ title, bg, children }: { title: string; bg: string; children: React.ReactNode }) {
  return (
    <div style={{ padding:"16px", background: bg, borderRadius:"8px", marginBottom:"16px" }}>
      <h4 style={{ margin:"0 0 12px", fontSize:"14px" }}>{title}</h4>
      {children}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize:"11px", color:"#888", margin:"10px 0 0", lineHeight:"1.6" }}>{children}</p>;
}

function inp(hasError: boolean): React.CSSProperties {
  return { display:"block", width:"100%", padding:"6px 10px", boxSizing:"border-box", border:`1px solid ${hasError ? "#e74c3c" : "#ddd"}`, borderRadius:"4px", fontSize:"13px" };
}

const labelStyle: React.CSSProperties = { display:"block", fontSize:"12px", fontWeight:"bold", marginBottom:"3px" };
const errMsg:     React.CSSProperties = { margin:"3px 0 0", fontSize:"11px", color:"#e74c3c" };
const radioLabel: React.CSSProperties = { display:"flex", alignItems:"center", gap:"6px", fontSize:"13px", cursor:"pointer" };
const solidBtn:   React.CSSProperties = { padding:"7px 18px", background:"#4a90e2", color:"#fff", border:"none", borderRadius:"4px", cursor:"pointer", fontSize:"13px" };
const outlineBtn: React.CSSProperties = { padding:"7px 14px", background:"#fff", color:"#4a90e2", border:"1px solid #4a90e2", borderRadius:"4px", cursor:"pointer", fontSize:"12px" };
const successBox: React.CSSProperties = { padding:"10px", background:"#f0fff0", borderRadius:"6px", fontSize:"13px", marginTop:"10px" };
