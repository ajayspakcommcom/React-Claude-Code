// TOPIC: Zod — Advanced Features
//
// This file covers the remaining Zod APIs not shown in 02_ZodValidation.tsx:
//
//   z.array()              → validate arrays: min/max items, item schema
//   z.union()              → field can be one of multiple schemas
//   z.discriminatedUnion() → smarter union with a discriminant key
//   z.date()               → date validation with .min() / .max()
//   z.record()             → object with dynamic/unknown keys
//   .extend()              → add fields to an existing schema
//   .pick() / .omit()      → derive a subset schema (like TypeScript Pick/Omit)
//   .partial()             → make all fields optional (useful for PATCH/update forms)
//   .merge()               → combine two schemas into one

import React, { useState } from "react";
import { useForm, useFieldArray, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// 1. z.array() — array validation
// ─────────────────────────────────────────────────────────────────────────────
//
// z.array(itemSchema)
//   .min(n, msg)     → at least n items
//   .max(n, msg)     → at most n items
//   .nonempty(msg)   → shorthand for .min(1)
//   .length(n, msg)  → exactly n items

const skillsSchema = z.object({
  name:   z.string().min(1, "Name required"),
  skills: z.array(
    z.object({
      label: z.string().min(1, "Skill label required"),
      level: z.coerce.number().min(1).max(5),
    })
  )
  .min(1, "Add at least one skill")
  .max(6, "Maximum 6 skills"),

  // useFieldArray requires objects — wrap string in an object
  tags: z.array(z.object({ value: z.string().min(1, "Tag cannot be empty") })).nonempty("Add at least one tag"),
});

type SkillsForm = z.infer<typeof skillsSchema>;

function ArrayDemo() {
  const [result, setResult] = useState<SkillsForm | null>(null);
  const { register, control, handleSubmit, formState: { errors } } = useForm<SkillsForm>({
    resolver: zodResolver(skillsSchema) as Resolver<SkillsForm>,
    defaultValues: { name: "", skills: [{ label: "", level: 3 }], tags: [{ value: "" }] },
  });

  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({ control, name: "skills" });
  const { fields: tagFields,   append: appendTag,   remove: removeTag   } = useFieldArray({ control, name: "tags" });

  return (
    <Section title="1. z.array() — array validation" bg="#f8f9ff">
      <form onSubmit={handleSubmit((d) => setResult(d))} noValidate style={{ maxWidth:"480px" }}>

        <Field label="Name" error={errors.name?.message}>
          <input {...register("name")} placeholder="John Doe" style={inp(!!errors.name)} />
        </Field>

        <div style={{ marginBottom:"10px" }}>
          <label style={labelStyle}>Skills (1–6) — <code>z.array(...).min(1).max(6)</code></label>
          {errors.skills?.root && <p style={errMsg}>{errors.skills.root.message}</p>}
          {skillFields.map((f, i) => (
            <div key={f.id} style={{ display:"flex", gap:"8px", marginBottom:"6px", alignItems:"center" }}>
              <input {...register(`skills.${i}.label`)} placeholder="e.g. React" style={{ ...inp(!!errors.skills?.[i]?.label), flex:2 }} />
              <input type="number" min={1} max={5} {...register(`skills.${i}.level`)} style={{ ...inp(false), width:"60px" }} />
              <button type="button" onClick={() => removeSkill(i)} disabled={skillFields.length === 1} style={iconBtn("#e74c3c")}>✕</button>
            </div>
          ))}
          {skillFields.length < 6 && (
            <button type="button" onClick={() => appendSkill({ label:"", level:3 })} style={outlineBtn}>+ Add Skill</button>
          )}
        </div>

        <div style={{ marginBottom:"10px" }}>
          <label style={labelStyle}>Tags — <code>z.array(z.string()).nonempty()</code></label>
          {errors.tags?.root && <p style={errMsg}>{errors.tags.root.message}</p>}
          <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
            {tagFields.map((f, i) => (
              <div key={f.id} style={{ display:"flex", gap:"4px" }}>
                <input {...register(`tags.${i}.value`)} placeholder="tag" style={{ ...inp(false), width:"90px" }} />
                <button type="button" onClick={() => removeTag(i)} disabled={tagFields.length === 1} style={iconBtn("#888")}>✕</button>
              </div>
            ))}
            <button type="button" onClick={() => appendTag({ value: "" })} style={outlineBtn}>+ Tag</button>
          </div>
        </div>

        <button type="submit" style={solidBtn}>Submit</button>
      </form>
      {result && <pre style={preStyle}>{JSON.stringify(result, null, 2)}</pre>}
      <Note><code>z.array(itemSchema).min(1).max(6)</code> — validates count + each item's schema.</Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. z.union() and z.discriminatedUnion()
// ─────────────────────────────────────────────────────────────────────────────
//
// z.union([schemaA, schemaB])
//   → tries each schema in order, passes if ANY matches
//   → slower for large unions (tries all schemas)
//
// z.discriminatedUnion("key", [schemaA, schemaB])
//   → uses a discriminant key to pick which schema to validate against
//   → faster and gives better error messages
//   → each schema MUST have the same key with a z.literal() value

const paymentSchema = z.discriminatedUnion("method", [
  z.object({
    method:     z.literal("card"),
    cardNumber: z.string().regex(/^\d{16}$/, "16-digit card number"),
    expiry:     z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "MM/YY format"),
    cvv:        z.string().regex(/^\d{3,4}$/, "3 or 4 digits"),
  }),
  z.object({
    method: z.literal("paypal"),
    email:  z.string().email("Enter PayPal email"),
  }),
  z.object({
    method:    z.literal("crypto"),
    wallet:    z.string().min(26, "Enter a valid wallet address"),
    currency:  z.enum(["BTC","ETH","USDC"]),
  }),
]);

type PaymentForm = z.infer<typeof paymentSchema>;

function DiscriminatedUnionDemo() {
  const [result, setResult] = useState<PaymentForm | null>(null);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema) as Resolver<PaymentForm>,
    defaultValues: { method: "card" } as PaymentForm,
  });

  const method = watch("method");

  return (
    <Section title="2. z.discriminatedUnion() — different fields per payment method" bg="#fff8f0">
      <form onSubmit={handleSubmit((d) => setResult(d))} noValidate style={{ maxWidth:"420px" }}>
        <Field label="Payment Method">
          <div style={{ display:"flex", gap:"10px", marginBottom:"12px" }}>
            {(["card","paypal","crypto"] as const).map((m) => (
              <label key={m} style={radioLabel}>
                <input type="radio" value={m} {...register("method")} />
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </label>
            ))}
          </div>
        </Field>

        {method === "card" && (
          <>
            <Field label="Card Number" error={(errors as any).cardNumber?.message}>
              <input {...register("cardNumber" as any)} placeholder="1234567890123456" maxLength={16} style={inp(!!(errors as any).cardNumber)} />
            </Field>
            <div style={{ display:"flex", gap:"10px" }}>
              <Field label="Expiry" error={(errors as any).expiry?.message}>
                <input {...register("expiry" as any)} placeholder="12/26" style={inp(!!(errors as any).expiry)} />
              </Field>
              <Field label="CVV" error={(errors as any).cvv?.message}>
                <input {...register("cvv" as any)} placeholder="123" maxLength={4} style={{ ...inp(!!(errors as any).cvv), width:"80px" }} />
              </Field>
            </div>
          </>
        )}

        {method === "paypal" && (
          <Field label="PayPal Email" error={(errors as any).email?.message}>
            <input type="email" {...register("email" as any)} placeholder="you@paypal.com" style={inp(!!(errors as any).email)} />
          </Field>
        )}

        {method === "crypto" && (
          <>
            <Field label="Wallet Address" error={(errors as any).wallet?.message}>
              <input {...register("wallet" as any)} placeholder="bc1q... or 0x..." style={inp(!!(errors as any).wallet)} />
            </Field>
            <Field label="Currency" error={(errors as any).currency?.message}>
              <select {...register("currency" as any)} style={inp(!!(errors as any).currency)}>
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="USDC">USD Coin (USDC)</option>
              </select>
            </Field>
          </>
        )}

        <button type="submit" style={solidBtn}>Pay</button>
      </form>
      {result && <pre style={preStyle}>{JSON.stringify(result, null, 2)}</pre>}
      <Note>
        <code>z.discriminatedUnion("method", [...])</code> — each variant has <code>method: z.literal("card")</code> etc.
        Zod picks the right schema instantly using the discriminant key — no need to try all variants.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. z.date() — date validation
// ─────────────────────────────────────────────────────────────────────────────

const eventSchema = z.object({
  title:     z.string().min(1, "Title required"),
  // z.coerce.date() converts string from <input type="date"> to a Date object
  startDate: z.coerce.date()
    .min(new Date(), "Start date must be in the future"),
  endDate:   z.coerce.date(),
}).superRefine((data, ctx) => {
  if (data.endDate <= data.startDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End date must be after start date", path: ["endDate"] });
  }
});

type EventForm = z.infer<typeof eventSchema>;

function DateDemo() {
  const [result, setResult] = useState<EventForm | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<EventForm>({
    resolver: zodResolver(eventSchema) as Resolver<EventForm>,
  });

  return (
    <Section title="3. z.date() — date validation with min/max + cross-field" bg="#f0fff8">
      <form onSubmit={handleSubmit((d) => setResult(d))} noValidate style={{ maxWidth:"400px" }}>
        <Field label="Event Title" error={errors.title?.message}>
          <input {...register("title")} placeholder="Team Meetup" style={inp(!!errors.title)} />
        </Field>
        <div style={{ display:"flex", gap:"12px" }}>
          <Field label="Start Date" error={errors.startDate?.message}>
            <input type="date" {...register("startDate")} style={inp(!!errors.startDate)} />
          </Field>
          <Field label="End Date" error={errors.endDate?.message}>
            <input type="date" {...register("endDate")} style={inp(!!errors.endDate)} />
          </Field>
        </div>
        <button type="submit" style={solidBtn}>Create Event</button>
      </form>
      {result && <pre style={preStyle}>{JSON.stringify({ ...result, startDate: result.startDate.toISOString(), endDate: result.endDate.toISOString() }, null, 2)}</pre>}
      <Note>
        <code>z.coerce.date()</code> — converts the string from <code>&lt;input type="date"&gt;</code> to a <code>Date</code> object automatically.
        <code>.min(new Date())</code> — rejects past dates.
        Cross-field: <code>superRefine</code> checks end &gt; start.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. z.record() — object with dynamic keys
// ─────────────────────────────────────────────────────────────────────────────
//
// z.record(keySchema, valueSchema)
//   → validates an object where keys are unknown at compile time
//   → useful for: settings maps, metadata, translation strings, config objects

const settingsSchema = z.object({
  appName:  z.string().min(1, "App name required"),
  // All env variables — keys are strings, values must be non-empty strings
  envVars:  z.record(z.string(), z.string().min(1, "Value cannot be empty")),
  // Feature flags — keys are strings, values must be booleans
  features: z.record(z.string(), z.boolean()),
});

type SettingsForm = z.infer<typeof settingsSchema>;

function RecordDemo() {
  const [result, setResult] = useState<SettingsForm | null>(null);
  const [pairs, setPairs] = useState([{ key: "API_URL", value: "https://api.example.com" }]);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema) as Resolver<SettingsForm>,
    defaultValues: {
      appName:  "",
      envVars:  { API_URL: "https://api.example.com" },
      features: { darkMode: true, betaFeatures: false },
    },
  });

  function addPair() {
    const newPairs = [...pairs, { key: "", value: "" }];
    setPairs(newPairs);
    const obj: Record<string,string> = {};
    newPairs.forEach(p => { if (p.key) obj[p.key] = p.value; });
    setValue("envVars", obj);
  }

  return (
    <Section title="4. z.record() — object with dynamic keys" bg="#fffff0">
      <form onSubmit={handleSubmit((d) => setResult(d))} noValidate style={{ maxWidth:"480px" }}>
        <Field label="App Name" error={errors.appName?.message}>
          <input {...register("appName")} placeholder="My App" style={inp(!!errors.appName)} />
        </Field>

        <div style={{ marginBottom:"12px" }}>
          <label style={labelStyle}>Environment Variables — <code>z.record(z.string(), z.string())</code></label>
          {pairs.map((_, i) => (
            <div key={i} style={{ display:"flex", gap:"8px", marginBottom:"6px" }}>
              <input placeholder="KEY" style={{ ...inp(false), flex:1, fontFamily:"monospace" }}
                value={pairs[i].key} onChange={e => setPairs(p => { const n=[...p]; n[i]={...n[i],key:e.target.value}; return n; })} />
              <input placeholder="value" style={{ ...inp(false), flex:2 }}
                value={pairs[i].value} onChange={e => setPairs(p => { const n=[...p]; n[i]={...n[i],value:e.target.value}; return n; })} />
            </div>
          ))}
          <button type="button" onClick={addPair} style={outlineBtn}>+ Add Variable</button>
        </div>

        <div style={{ marginBottom:"12px" }}>
          <label style={labelStyle}>Feature Flags — <code>z.record(z.string(), z.boolean())</code></label>
          {["darkMode","betaFeatures","analytics","maintenance"].map((flag) => (
            <label key={flag} style={{ ...radioLabel, marginBottom:"6px" }}>
              <input type="checkbox" {...register(`features.${flag}` as any)} />
              {flag}
            </label>
          ))}
        </div>

        <button type="submit" style={solidBtn}>Save Settings</button>
      </form>
      {result && <pre style={preStyle}>{JSON.stringify(result, null, 2)}</pre>}
      <Note>
        <code>z.record(z.string(), z.string())</code> — validates any <code>{"{ [key: string]: string }"}</code> object.
        <code>z.record(z.string(), z.boolean())</code> — all values must be booleans.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. .extend() / .pick() / .omit() / .partial() / .merge()
// ─────────────────────────────────────────────────────────────────────────────
//
// These methods let you REUSE schemas instead of rewriting them.
// Core idea: define a base schema once, derive variants from it.
//
// .extend(shape)    → base + new fields
// .omit({field:true})  → base without specific fields
// .pick({field:true})  → only specific fields from base
// .partial()           → all fields become optional (for PATCH/update endpoints)
// .partial({field:true}) → only specific fields become optional
// .merge(otherSchema)  → combine two separate schemas

// ── Base schema — used as the single source of truth
const userBaseSchema = z.object({
  email:    z.string().email("Invalid email"),
  username: z.string().min(3, "Min 3 chars").max(20, "Max 20 chars"),
  role:     z.enum(["admin","editor","viewer"]),
  bio:      z.string().max(200).optional(),
});

// ── EXTEND — add password fields for the registration form
const registerSchema = userBaseSchema.extend({
  password:        z.string().min(8, "Min 8 chars").regex(/[A-Z]/, "Need uppercase").regex(/\d/, "Need number"),
  confirmPassword: z.string().min(1, "Required"),
}).superRefine((d, ctx) => {
  if (d.password !== d.confirmPassword) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Passwords don't match", path: ["confirmPassword"] });
});

// ── OMIT — admin panel doesn't need password fields
const adminEditSchema = userBaseSchema.omit({ bio: true }).extend({
  lastLogin: z.coerce.date().optional(),
});

// ── PICK — public profile only needs username and bio
const publicProfileSchema = userBaseSchema.pick({ username: true, bio: true });

// ── PARTIAL — PATCH endpoint: all fields optional
const updateUserSchema = userBaseSchema.partial();

// ── PARTIAL (selective) — only some fields optional
const partialUpdateSchema = userBaseSchema.partial({ bio: true, role: true });

// ── MERGE — combine base with address schema
const addressSchema = z.object({
  city:    z.string().min(1, "City required"),
  country: z.string().min(1, "Country required"),
});
const fullUserSchema = userBaseSchema.merge(addressSchema);

type RegisterForm   = z.infer<typeof registerSchema>;
type PublicProfile  = z.infer<typeof publicProfileSchema>;
type UpdateUser     = z.infer<typeof updateUserSchema>;

function SchemaCompositionDemo() {
  const [activeForm, setActiveForm] = useState<"register"|"profile"|"update">("register");
  const [result, setResult] = useState<object | null>(null);

  const regForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) as Resolver<RegisterForm>, mode:"onTouched" });
  const profileForm = useForm<PublicProfile>({ resolver: zodResolver(publicProfileSchema) as Resolver<PublicProfile>, mode:"onTouched" });
  const updateForm = useForm<UpdateUser>({ resolver: zodResolver(updateUserSchema) as Resolver<UpdateUser>, mode:"onTouched", defaultValues: { email:"current@email.com", username:"current_user", role:"editor" } });

  return (
    <Section title="5. .extend() .omit() .pick() .partial() .merge() — schema reuse" bg="#f0f8ff">
      <div style={{ display:"flex", gap:"8px", marginBottom:"14px" }}>
        {(["register","profile","update"] as const).map((f) => (
          <button key={f} onClick={() => { setActiveForm(f); setResult(null); }}
            style={{ padding:"4px 12px", border:"1px solid #ddd", borderRadius:"4px", fontSize:"12px", cursor:"pointer", background: activeForm===f ? "#4a90e2":"#fff", color: activeForm===f ? "#fff":"#333" }}>
            {f === "register" ? ".extend() Register" : f === "profile" ? ".pick() Public Profile" : ".partial() PATCH Update"}
          </button>
        ))}
      </div>

      {activeForm === "register" && (
        <form onSubmit={regForm.handleSubmit((d) => setResult(d))} noValidate style={{ maxWidth:"420px" }}>
          <p style={{ fontSize:"11px", color:"#888", margin:"0 0 10px" }}>
            <code>userBaseSchema.extend({"{ password, confirmPassword }"})</code>
          </p>
          {["email","username","password","confirmPassword"].map((name) => (
            <Field key={name} label={name} error={regForm.formState.errors[name as keyof RegisterForm]?.message}>
              <input type={name.includes("password") || name === "confirmPassword" ? "password" : "text"}
                {...regForm.register(name as keyof RegisterForm)}
                placeholder={name} style={inp(!!regForm.formState.errors[name as keyof RegisterForm])} />
            </Field>
          ))}
          <Field label="Role" error={regForm.formState.errors.role?.message}>
            <select {...regForm.register("role")} style={inp(!!regForm.formState.errors.role)}>
              <option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Admin</option>
            </select>
          </Field>
          <button type="submit" style={solidBtn}>Register</button>
        </form>
      )}

      {activeForm === "profile" && (
        <form onSubmit={profileForm.handleSubmit((d) => setResult(d))} noValidate style={{ maxWidth:"420px" }}>
          <p style={{ fontSize:"11px", color:"#888", margin:"0 0 10px" }}>
            <code>userBaseSchema.pick({"{ username: true, bio: true }"})</code> — only 2 fields
          </p>
          <Field label="username" error={profileForm.formState.errors.username?.message}>
            <input {...profileForm.register("username")} placeholder="your_username" style={inp(!!profileForm.formState.errors.username)} />
          </Field>
          <Field label="bio (optional)" error={profileForm.formState.errors.bio?.message}>
            <textarea {...profileForm.register("bio")} rows={3} placeholder="About you…" style={{ ...inp(false), resize:"vertical", fontFamily:"sans-serif" }} />
          </Field>
          <button type="submit" style={solidBtn}>Save Profile</button>
        </form>
      )}

      {activeForm === "update" && (
        <form onSubmit={updateForm.handleSubmit((d) => setResult(d))} noValidate style={{ maxWidth:"420px" }}>
          <p style={{ fontSize:"11px", color:"#888", margin:"0 0 10px" }}>
            <code>userBaseSchema.partial()</code> — all fields optional for PATCH endpoint
          </p>
          {(["email","username"] as const).map((name) => (
            <Field key={name} label={`${name} (optional)`} error={updateForm.formState.errors[name]?.message}>
              <input {...updateForm.register(name)} style={inp(!!updateForm.formState.errors[name])} />
            </Field>
          ))}
          <Field label="role (optional)" error={updateForm.formState.errors.role?.message}>
            <select {...updateForm.register("role")} style={inp(false)}>
              <option value="">— no change —</option>
              <option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Admin</option>
            </select>
          </Field>
          <button type="submit" style={solidBtn}>PATCH User</button>
        </form>
      )}

      {result && <pre style={preStyle}>{JSON.stringify(result, null, 2)}</pre>}

      <div style={{ marginTop:"12px", padding:"10px", background:"#fff", borderRadius:"6px", fontSize:"12px" }}>
        <strong>Schema variants derived from <code>userBaseSchema</code>:</strong>
        <ul style={{ margin:"6px 0 0", paddingLeft:"16px", lineHeight:"1.8" }}>
          <li><code>registerSchema = userBaseSchema.extend({"{ password, confirmPassword }"})</code></li>
          <li><code>adminEditSchema = userBaseSchema.omit({"{ bio: true }"})</code></li>
          <li><code>publicProfileSchema = userBaseSchema.pick({"{ username: true, bio: true }"})</code></li>
          <li><code>updateUserSchema = userBaseSchema.partial()</code> — all fields optional (PATCH)</li>
          <li><code>partialUpdateSchema = userBaseSchema.partial({"{ bio: true, role: true }"})</code> — selective partial</li>
          <li><code>fullUserSchema = userBaseSchema.merge(addressSchema)</code> — combine two schemas</li>
        </ul>
      </div>
      <Note>One base schema → many derived variants. No duplication. TypeScript types are all derived via <code>z.infer</code>.</Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function ZodAdvancedDemo() {
  return (
    <div>
      <h2>Zod — Advanced Features</h2>
      <p style={{ fontSize:"13px", color:"#666", marginBottom:"16px" }}>
        Completing the Zod API: arrays, unions, discriminated unions, dates, records, and schema composition.
      </p>

      <ArrayDemo />
      <DiscriminatedUnionDemo />
      <DateDemo />
      <RecordDemo />
      <SchemaCompositionDemo />

      <div style={{ padding:"12px", background:"#f5f5f5", borderRadius:"6px", fontSize:"13px" }}>
        <strong>Advanced Zod reference:</strong>
        <ul style={{ margin:"6px 0 0", paddingLeft:"18px", lineHeight:"1.9" }}>
          <li><code>z.array(itemSchema).min(1).max(n).nonempty()</code></li>
          <li><code>z.union([schemaA, schemaB])</code> — tries each schema in order</li>
          <li><code>z.discriminatedUnion("key", [...])</code> — picks schema by discriminant key, faster + better errors</li>
          <li><code>z.coerce.date().min(new Date())</code> — converts string to Date, rejects past</li>
          <li><code>z.record(z.string(), z.string())</code> — dynamic key-value objects</li>
          <li><code>schema.extend({"{ newField }"})</code> — add fields to existing schema</li>
          <li><code>schema.omit({"{ field: true }"})</code> — remove fields</li>
          <li><code>schema.pick({"{ field: true }"})</code> — keep only specific fields</li>
          <li><code>schema.partial()</code> — all fields optional (PATCH forms)</li>
          <li><code>schema.partial({"{ field: true }"})</code> — selective partial</li>
          <li><code>schemaA.merge(schemaB)</code> — combine two schemas</li>
          <li><code>z.infer&lt;typeof schema&gt;</code> — TypeScript type derived from any schema variant</li>
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

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom:"10px", flex:1 }}>
      {label && <label style={labelStyle}>{label}</label>}
      {children}
      {error && <p style={errMsg}>{error}</p>}
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
const outlineBtn: React.CSSProperties = { padding:"6px 12px", background:"#fff", color:"#4a90e2", border:"1px solid #4a90e2", borderRadius:"4px", cursor:"pointer", fontSize:"12px" };
const iconBtn = (color: string): React.CSSProperties => ({ padding:"3px 8px", background: color, color:"#fff", border:"none", borderRadius:"3px", cursor:"pointer", fontSize:"11px" });
const preStyle:   React.CSSProperties = { background:"#f5f5f5", padding:"10px", borderRadius:"6px", fontSize:"11px", overflowX:"auto", marginTop:"10px" };
