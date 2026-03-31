// TOPIC: Zod + zodResolver — Schema-based Validation
//
// Instead of writing validation rules inline in register(), you define a ZOD SCHEMA
// that describes the exact shape and rules for your form data.
//
// WHY ZOD over inline register() rules?
//   ✅ Single source of truth — schema is used for both validation AND TypeScript types
//   ✅ Reusable — the same schema validates on the client AND server (Node.js)
//   ✅ Composable — schemas can extend, merge, and pick from each other
//   ✅ Better error messages — centralised, consistent
//   ✅ Complex rules (cross-field, conditional, transforms) are much easier
//
// CONCEPTS COVERED:
//   z.object()         → define the shape of the form
//   z.string()         → string with .min, .max, .email, .url, .regex, .optional
//   z.number()         → number with .min, .max, .int, .positive
//   z.boolean()        → boolean (checkboxes)
//   z.enum()           → fixed set of allowed values
//   z.literal()        → exact value match
//   z.union()          → one of multiple schemas
//   z.array()          → array of items
//   z.object() nested  → nested object (address, etc.)
//   .optional()        → field may be undefined
//   .nullable()        → field may be null
//   .default()         → default value
//   .transform()       → convert value (trim whitespace, toUpperCase)
//   .refine()          → custom single-field rule
//   .superRefine()     → cross-field rules (confirm password, date range)
//   z.infer<T>         → derive TypeScript type FROM the schema — no duplication
//   zodResolver()      → connects the schema to React Hook Form

import React, { useState } from "react";
import { useForm, SubmitHandler, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// 1. SCHEMA DEFINITION
// ─────────────────────────────────────────────────────────────────────────────

const profileSchema = z.object({

  // ── Basic string rules ────────────────────────────────────────────────────
  fullName: z.string()
    .min(2,  "Full name must be at least 2 characters")
    .max(50, "Full name must be under 50 characters")
    .transform((v) => v.trim()),           // trim whitespace on submit

  email: z.string()
    .email("Enter a valid email address"), // built-in email format check

  // ── Number with coercion ──────────────────────────────────────────────────
  // z.coerce.number() converts string input (HTML inputs are always strings) to number
  age: z.coerce.number()
    .int("Age must be a whole number")
    .min(13, "Must be at least 13")
    .max(120, "Enter a valid age"),

  // ── Optional field ────────────────────────────────────────────────────────
  phone: z.string()
    .regex(/^\+?[\d\s\-()]{7,15}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),                    // allow empty string (HTML default)

  // ── URL — optional ────────────────────────────────────────────────────────
  website: z.string()
    .url("Enter a valid URL (include https://)")
    .optional()
    .or(z.literal("")),

  // ── Enum — fixed set of values ────────────────────────────────────────────
  // Zod v4: use `error` instead of `errorMap`
  country: z.enum(["us", "uk", "ca", "au", "in", "other"], {
    error: "Select a country",
  }),

  // ── Nested object — address ───────────────────────────────────────────────
  address: z.object({
    street: z.string().min(1, "Street is required"),
    city:   z.string().min(1, "City is required"),
    zip:    z.string().regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code"),
  }),

  // ── Password with custom rules ────────────────────────────────────────────
  password: z.string()
    .min(8, "Min 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character"),

  // ── Confirm password — defined as plain string, validated in superRefine ──
  confirmPassword: z.string().min(1, "Please confirm your password"),

  // ── Boolean (checkbox) ────────────────────────────────────────────────────
  newsletter: z.boolean().default(false),

  // Zod v4: use `error` instead of `errorMap`
  terms: z.literal(true, {
    error: "You must accept the terms",
  }),

})
// ── Cross-field validation with .superRefine() ─────────────────────────────
// superRefine has access to the full object — use it for rules that span fields
.superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code:    z.ZodIssueCode.custom,
      message: "Passwords do not match",
      path:    ["confirmPassword"],   // attaches error to the confirmPassword field
    });
  }
});

// ── Derive TypeScript type FROM the schema — no separate interface needed ────
type ProfileForm = z.infer<typeof profileSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// 2. COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ZodValidationDemo() {
  const [submitted, setSubmitted] = useState<ProfileForm | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
    reset,
  } = useForm<ProfileForm>({
    // Cast needed: z.coerce.number() has input type `unknown` in Zod v4 — doesn't affect runtime
    resolver: zodResolver(profileSchema) as Resolver<ProfileForm>,
    mode: "onTouched",
    defaultValues: {
      fullName:        "",
      email:           "",
      age:             undefined,
      phone:           "",
      website:         "",
      country:         "us",
      address:         { street: "", city: "", zip: "" },
      password:        "",
      confirmPassword: "",
      newsletter:      false,
    },
  });

  const onSubmit: SubmitHandler<ProfileForm> = async (data) => {
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(data);
  };

  return (
    <div>
      <h2>Zod + zodResolver</h2>
      <p style={descStyle}>
        Schema-first validation. Define once — get TypeScript types + RHF validation for free.
        <code>z.infer&lt;typeof schema&gt;</code> derives the form type from the schema.
      </p>

      <div style={statusBar}>
        <Badge label="isDirty" active={isDirty} color="#e67e22" />
        <Badge label="isValid" active={isValid} color="#27ae60" />
        <Badge label="isSubmitting" active={isSubmitting} color="#9b59b6" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={formStyle}>

        <Row>
          <Field label="Full Name" error={errors.fullName?.message}>
            <input {...register("fullName")} placeholder="Jane Doe" style={inp(!!errors.fullName)} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <input type="email" {...register("email")} placeholder="jane@example.com" style={inp(!!errors.email)} />
          </Field>
        </Row>

        <Row>
          <Field label="Age" error={errors.age?.message}>
            <input type="number" {...register("age")} placeholder="e.g. 25" style={{ ...inp(!!errors.age), width:"100px" }} />
          </Field>
          <Field label="Phone (optional)" error={errors.phone?.message}>
            <input {...register("phone")} placeholder="+1 555 000 0000" style={inp(!!errors.phone)} />
          </Field>
        </Row>

        <Row>
          <Field label="Website (optional)" error={errors.website?.message}>
            <input {...register("website")} placeholder="https://yoursite.com" style={inp(!!errors.website)} />
          </Field>
          <Field label="Country" error={errors.country?.message}>
            <select {...register("country")} style={inp(!!errors.country)}>
              <option value="us">United States</option>
              <option value="uk">United Kingdom</option>
              <option value="ca">Canada</option>
              <option value="au">Australia</option>
              <option value="in">India</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </Row>

        {/* Nested address object */}
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>Address (nested object)</legend>
          <Row>
            <Field label="Street" error={errors.address?.street?.message}>
              <input {...register("address.street")} placeholder="123 Main St" style={inp(!!errors.address?.street)} />
            </Field>
            <Field label="City" error={errors.address?.city?.message}>
              <input {...register("address.city")} placeholder="New York" style={inp(!!errors.address?.city)} />
            </Field>
          </Row>
          <Field label="ZIP Code" error={errors.address?.zip?.message}>
            <input {...register("address.zip")} placeholder="10001" style={{ ...inp(!!errors.address?.zip), width:"120px" }} />
          </Field>
        </fieldset>

        <Row>
          <Field label="Password" error={errors.password?.message}>
            <input type="password" {...register("password")} placeholder="8+ chars, uppercase, number, symbol" style={inp(!!errors.password)} />
          </Field>
          <Field label="Confirm Password" error={errors.confirmPassword?.message}>
            <input type="password" {...register("confirmPassword")} placeholder="Re-enter password" style={inp(!!errors.confirmPassword)} />
          </Field>
        </Row>

        <Field label="" error={errors.newsletter?.message}>
          <label style={checkLabel}>
            <input type="checkbox" {...register("newsletter")} />
            Subscribe to newsletter
          </label>
        </Field>

        <Field label="" error={errors.terms?.message}>
          <label style={checkLabel}>
            <input type="checkbox" {...register("terms")} />
            I accept the terms and conditions
          </label>
        </Field>

        <div style={{ display:"flex", gap:"10px", marginTop:"8px" }}>
          <button type="submit" disabled={isSubmitting} style={submitBtn}>
            {isSubmitting ? "Saving…" : "Save Profile"}
          </button>
          <button type="button" onClick={() => { reset(); setSubmitted(null); }} style={resetBtn}>
            Reset
          </button>
        </div>
      </form>

      {submitted && (
        <div style={successBox}>
          <strong>✓ Saved successfully</strong>
          <pre style={{ margin:"8px 0 0", fontSize:"11px", overflowX:"auto" }}>
            {JSON.stringify(submitted, null, 2)}
          </pre>
        </div>
      )}

      <div style={summaryBox}>
        <strong>Zod schema reference:</strong>
        <ul style={ul}>
          <li><code>z.string().min().max().email().url().regex().transform()</code></li>
          <li><code>z.coerce.number().int().min().max().positive()</code> — coerces string input</li>
          <li><code>z.boolean()</code>, <code>z.literal(true)</code> — checkbox must be checked</li>
          <li><code>z.enum([...])</code> — fixed allowed values</li>
          <li><code>z.object({"{ nested: z.object({...}) }"})</code> — nested objects</li>
          <li><code>.optional().or(z.literal(""))</code> — optional fields from HTML inputs</li>
          <li><code>.refine(fn, msg)</code> — single-field custom rule</li>
          <li><code>.superRefine((data, ctx) =&gt; ctx.addIssue(...))</code> — cross-field rules</li>
          <li><code>z.infer&lt;typeof schema&gt;</code> — TypeScript type derived from schema</li>
          <li><code>zodResolver(schema)</code> — connects to RHF resolver</li>
        </ul>
      </div>
    </div>
  );
}

// ─── shared helpers ───────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom:"12px", flex:1 }}>
      {label && <label style={{ display:"block", fontSize:"12px", fontWeight:"bold", marginBottom:"3px" }}>{label}</label>}
      {children}
      {error && <p style={{ margin:"3px 0 0", fontSize:"11px", color:"#e74c3c" }}>{error}</p>}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>{children}</div>;
}

function Badge({ label, active, color }: { label: string; active: boolean; color: string }) {
  return <span style={{ padding:"2px 8px", borderRadius:"12px", fontSize:"11px", background: active ? color : "#eee", color: active ? "#fff" : "#aaa" }}>{label}</span>;
}

function inp(hasError: boolean): React.CSSProperties {
  return { display:"block", width:"100%", padding:"6px 10px", boxSizing:"border-box", border:`1px solid ${hasError ? "#e74c3c" : "#ddd"}`, borderRadius:"4px", fontSize:"13px" };
}

const formStyle:    React.CSSProperties = { maxWidth:"600px", padding:"20px", background:"#fafafa", borderRadius:"8px", marginBottom:"16px" };
const statusBar:    React.CSSProperties = { display:"flex", gap:"8px", marginBottom:"12px" };
const fieldsetStyle:React.CSSProperties = { border:"1px solid #ddd", borderRadius:"6px", padding:"12px 16px", marginBottom:"12px" };
const legendStyle:  React.CSSProperties = { fontSize:"12px", fontWeight:"bold", color:"#666", padding:"0 6px" };
const checkLabel:   React.CSSProperties = { display:"flex", alignItems:"center", gap:"8px", fontSize:"13px", cursor:"pointer" };
const submitBtn:    React.CSSProperties = { padding:"8px 20px", background:"#4a90e2", color:"#fff", border:"none", borderRadius:"4px", cursor:"pointer", fontSize:"13px" };
const resetBtn:     React.CSSProperties = { padding:"8px 16px", background:"#888", color:"#fff", border:"none", borderRadius:"4px", cursor:"pointer", fontSize:"13px" };
const successBox:   React.CSSProperties = { padding:"12px", background:"#f0fff0", borderRadius:"6px", fontSize:"13px", marginBottom:"16px" };
const summaryBox:   React.CSSProperties = { padding:"12px", background:"#f5f5f5", borderRadius:"6px", fontSize:"13px" };
const descStyle:    React.CSSProperties = { fontSize:"13px", color:"#666", marginBottom:"14px" };
const ul:           React.CSSProperties = { margin:"6px 0 0", paddingLeft:"18px", lineHeight:"1.9" };
