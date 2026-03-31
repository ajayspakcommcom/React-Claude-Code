// TOPIC: Advanced React Hook Form Patterns
//
// This file covers patterns used in real production forms:
//
//   useFieldArray()     → dynamic list of fields (add/remove rows — team members, line items)
//   useWatch()          → watch specific fields efficiently (no full form re-render)
//   Controller          → wrap controlled/3rd-party components (custom inputs, Select, DatePicker)
//   FormProvider        → share form instance across components (avoids prop drilling)
//   useFormContext()    → consume the form anywhere in the tree without prop drilling
//   mode: "onChange"    → live validation (used in multi-step forms)
//   trigger()           → manually trigger validation (used in stepper: validate before next step)
//   Multi-step form     → full wizard pattern with validation per step

import React, { useState } from "react";
import {
  useForm,
  useFieldArray,
  useWatch,
  Controller,
  FormProvider,
  useFormContext,
  SubmitHandler,
  Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — useFieldArray: Dynamic list (team members)
// ─────────────────────────────────────────────────────────────────────────────

const teamSchema = z.object({
  teamName: z.string().min(1, "Team name is required"),
  members: z.array(
    z.object({
      name:  z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email"),
      role:  z.enum(["lead", "dev", "designer", "qa"]),
    })
  ).min(1, "Add at least one member"),
});

type TeamForm = z.infer<typeof teamSchema>;

function FieldArrayDemo() {
  const [submitted, setSubmitted] = useState<TeamForm | null>(null);

  const { register, control, handleSubmit, formState: { errors } } = useForm<TeamForm>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      teamName: "",
      members: [{ name: "", email: "", role: "dev" }],
    },
  });

  // useFieldArray — manages a dynamic list of fields
  // fields   → current array of items (each has a unique `id` — use this as key, NOT index)
  // append   → add a new item at the end
  // remove   → remove by index
  // prepend  → add at start
  // insert   → add at specific index
  // move     → reorder
  // swap     → swap two items
  const { fields, append, remove } = useFieldArray({ control, name: "members" });

  return (
    <Section title="1. useFieldArray — dynamic list of rows" bg="#f8f9ff">
      <form onSubmit={handleSubmit((d) => setSubmitted(d))} noValidate>

        <Field label="Team Name" error={errors.teamName?.message}>
          <input {...register("teamName")} placeholder="e.g. Frontend Squad" style={inp(!!errors.teamName)} />
        </Field>

        <div style={{ marginBottom:"8px" }}>
          <label style={labelStyle}>Members</label>
          {errors.members?.root && <p style={errStyle}>{errors.members.root.message}</p>}
        </div>

        {/* Render each field — use field.id as key, NOT index */}
        {fields.map((field, index) => (
          <div key={field.id} style={rowBox}>
            <div style={{ flex:1 }}>
              <input
                {...register(`members.${index}.name`)}
                placeholder="Name"
                style={inp(!!errors.members?.[index]?.name)}
              />
              {errors.members?.[index]?.name && <p style={errStyle}>{errors.members[index]?.name?.message}</p>}
            </div>
            <div style={{ flex:2 }}>
              <input
                {...register(`members.${index}.email`)}
                placeholder="Email"
                style={inp(!!errors.members?.[index]?.email)}
              />
              {errors.members?.[index]?.email && <p style={errStyle}>{errors.members[index]?.email?.message}</p>}
            </div>
            <div>
              <select {...register(`members.${index}.role`)} style={inp(false)}>
                <option value="dev">Dev</option>
                <option value="lead">Lead</option>
                <option value="designer">Designer</option>
                <option value="qa">QA</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => remove(index)}
              disabled={fields.length === 1}
              style={iconBtn("#e74c3c")}
            >✕</button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => append({ name: "", email: "", role: "dev" })}
          style={outlineBtn}
        >
          + Add Member
        </button>

        <button type="submit" style={{ ...solidBtn, marginLeft:"10px" }}>Save Team</button>
      </form>

      {submitted && (
        <pre style={preStyle}>{JSON.stringify(submitted, null, 2)}</pre>
      )}

      <Note>
        <code>fields.map(field =&gt; &lt;div key=&#123;field.id&#125;&gt;)</code> — use <code>field.id</code> as key, never index.
        <code>append(&#123;...&#125;)</code> adds a row. <code>remove(index)</code> removes it.
        Register each field as <code>members.&#123;index&#125;.name</code>.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — useWatch + Controller: Conditional fields + custom components
// ─────────────────────────────────────────────────────────────────────────────
//
// useWatch() — like watch() but scoped to specific fields.
//   watch()     → subscribes the whole component on every form change
//   useWatch()  → subscribes only when the watched field changes — more efficient
//
// Controller — wrap any controlled component that doesn't work with register():
//   Custom components, UI library components (MUI Select, Ant Design, etc.)
//   Anything that needs value/onChange instead of a ref

const orderSchema = z.object({
  deliveryType: z.enum(["pickup", "delivery", "express"]),
  address: z.string().optional(),
  giftWrap: z.boolean(),
  giftMessage: z.string().max(100, "Max 100 characters").optional(),
  paymentMethod: z.enum(["card", "paypal", "crypto"]),
  saveCard: z.boolean(),
  // Rating 1-5 — simulates a custom star component using Controller
  rating: z.number().min(1, "Please rate your experience").max(5),
}).superRefine((data, ctx) => {
  if (data.deliveryType === "delivery" && !data.address?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Address is required for delivery", path: ["address"] });
  }
});

type OrderForm = z.infer<typeof orderSchema>;

function WatchControllerDemo() {
  const [submitted, setSubmitted] = useState<OrderForm | null>(null);

  const { register, control, handleSubmit, formState: { errors } } = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      deliveryType:  "pickup",
      address:       "",
      giftWrap:      false,
      giftMessage:   "",
      paymentMethod: "card",
      saveCard:      false,
      rating:        0,
    },
  });

  // useWatch — only re-renders when these specific fields change
  const deliveryType   = useWatch({ control, name: "deliveryType" });
  const giftWrap       = useWatch({ control, name: "giftWrap" });
  const paymentMethod  = useWatch({ control, name: "paymentMethod" });

  return (
    <Section title="2. useWatch + Controller — conditional fields + custom components" bg="#fff8f0">
      <form onSubmit={handleSubmit((d) => setSubmitted(d))} noValidate>

        {/* Delivery type — controls conditional address field */}
        <Field label="Delivery Type" error={errors.deliveryType?.message}>
          <div style={{ display:"flex", gap:"8px" }}>
            {(["pickup","delivery","express"] as const).map((type) => (
              <label key={type} style={radioLabel}>
                <input type="radio" value={type} {...register("deliveryType")} />
                {type.charAt(0).toUpperCase() + type.slice(1)}
                {type === "express" && " (+$15)"}
              </label>
            ))}
          </div>
        </Field>

        {/* Conditional — only shows when delivery or express selected */}
        {deliveryType !== "pickup" && (
          <Field label="Delivery Address" error={errors.address?.message}>
            <input {...register("address")} placeholder="123 Main St, City, ZIP" style={inp(!!errors.address)} />
          </Field>
        )}

        {/* Gift wrap + conditional message */}
        <Field label="" error={errors.giftWrap?.message}>
          <label style={checkLabel}>
            <input type="checkbox" {...register("giftWrap")} />
            Gift wrap (+$5)
          </label>
        </Field>

        {giftWrap && (
          <Field label="Gift Message (optional)" error={errors.giftMessage?.message}>
            <textarea {...register("giftMessage")} rows={2} placeholder="Happy Birthday!" style={{ ...inp(!!errors.giftMessage), resize:"vertical", fontFamily:"sans-serif" }} />
          </Field>
        )}

        {/* Payment method — controls save card option */}
        <Field label="Payment Method" error={errors.paymentMethod?.message}>
          <select {...register("paymentMethod")} style={inp(!!errors.paymentMethod)}>
            <option value="card">Credit / Debit Card</option>
            <option value="paypal">PayPal</option>
            <option value="crypto">Crypto</option>
          </select>
        </Field>

        {paymentMethod === "card" && (
          <Field label="" error={undefined}>
            <label style={checkLabel}>
              <input type="checkbox" {...register("saveCard")} />
              Save card for future purchases
            </label>
          </Field>
        )}

        {/* Controller — wraps a custom StarRating component
            Controller handles value/onChange for components that don't use native inputs */}
        <Field label="Rate your experience" error={errors.rating?.message}>
          <Controller
            name="rating"
            control={control}
            render={({ field }) => (
              // field.value  → current value from RHF
              // field.onChange → call this to update RHF value
              <StarRating value={field.value} onChange={field.onChange} />
            )}
          />
        </Field>

        <button type="submit" style={solidBtn}>Place Order</button>
      </form>

      {submitted && <pre style={preStyle}>{JSON.stringify(submitted, null, 2)}</pre>}

      <Note>
        <code>useWatch(&#123; control, name &#125;)</code> — efficient conditional rendering, only re-renders on that field's change.<br />
        <code>Controller</code> — <code>render=&#123;(&#123; field &#125;) =&gt; &#125;</code> gives you <code>field.value</code> + <code>field.onChange</code> for custom components.
      </Note>
    </Section>
  );
}

// Custom star rating — controlled via Controller
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display:"flex", gap:"4px" }}>
      {[1,2,3,4,5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          style={{ border:"none", background:"none", fontSize:"24px", cursor:"pointer", color: star <= value ? "#f1c40f" : "#ddd", padding:"0 2px" }}
        >
          ★
        </button>
      ))}
      {value > 0 && <span style={{ fontSize:"12px", color:"#888", alignSelf:"center" }}>{value}/5</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — FormProvider + useFormContext: share form across components
// ─────────────────────────────────────────────────────────────────────────────
//
// FormProvider  → wraps the form tree with the form instance
// useFormContext → any child component can access register/errors/watch without props
// This is how large forms are split into multiple sub-components cleanly.

const checkoutSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName:  z.string().min(1, "Last name required"),
  email:     z.string().email("Invalid email"),
  cardNumber:z.string().regex(/^\d{16}$/, "16-digit card number"),
  expiry:    z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Format: MM/YY"),
  cvv:       z.string().regex(/^\d{3,4}$/, "3 or 4 digit CVV"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

// Sub-component — uses useFormContext() to access the form without prop drilling
function PersonalInfoSection() {
  const { register, formState: { errors } } = useFormContext<CheckoutForm>();
  return (
    <fieldset style={fieldsetStyle}>
      <legend style={legendStyle}>Personal Info</legend>
      <Row>
        <Field label="First Name" error={errors.firstName?.message}>
          <input {...register("firstName")} placeholder="Jane" style={inp(!!errors.firstName)} />
        </Field>
        <Field label="Last Name" error={errors.lastName?.message}>
          <input {...register("lastName")} placeholder="Doe" style={inp(!!errors.lastName)} />
        </Field>
      </Row>
      <Field label="Email" error={errors.email?.message}>
        <input type="email" {...register("email")} placeholder="jane@example.com" style={inp(!!errors.email)} />
      </Field>
    </fieldset>
  );
}

// Another sub-component for payment — also uses useFormContext
function PaymentSection() {
  const { register, formState: { errors } } = useFormContext<CheckoutForm>();
  return (
    <fieldset style={fieldsetStyle}>
      <legend style={legendStyle}>Payment Details</legend>
      <Field label="Card Number" error={errors.cardNumber?.message}>
        <input {...register("cardNumber")} placeholder="1234567890123456" maxLength={16} style={inp(!!errors.cardNumber)} />
      </Field>
      <Row>
        <Field label="Expiry (MM/YY)" error={errors.expiry?.message}>
          <input {...register("expiry")} placeholder="12/26" style={inp(!!errors.expiry)} />
        </Field>
        <Field label="CVV" error={errors.cvv?.message}>
          <input {...register("cvv")} placeholder="123" maxLength={4} style={{ ...inp(!!errors.cvv), width:"80px" }} />
        </Field>
      </Row>
    </fieldset>
  );
}

function FormProviderDemo() {
  const [submitted, setSubmitted] = useState<CheckoutForm | null>(null);

  const methods = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    mode: "onTouched",
  });

  return (
    <Section title="3. FormProvider + useFormContext — share form across sub-components" bg="#f0fff8">
      {/* FormProvider passes the form instance to the entire tree */}
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit((d) => setSubmitted(d))} noValidate>
          {/* Sub-components use useFormContext() — no prop drilling */}
          <PersonalInfoSection />
          <PaymentSection />
          <button type="submit" disabled={methods.formState.isSubmitting} style={solidBtn}>
            {methods.formState.isSubmitting ? "Processing…" : "Pay Now"}
          </button>
        </form>
      </FormProvider>

      {submitted && <pre style={preStyle}>{JSON.stringify(submitted, null, 2)}</pre>}

      <Note>
        <code>const methods = useForm()</code> + <code>&lt;FormProvider &#123;...methods&#125;&gt;</code> — share the form instance.<br />
        Sub-components call <code>useFormContext()</code> to access <code>register</code>, <code>errors</code>, <code>watch</code> — no props needed.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Multi-step form with trigger() per-step validation
// ─────────────────────────────────────────────────────────────────────────────
//
// trigger(fields) — manually validate specific fields without submitting.
// Used in wizard/stepper forms: validate step 1 fields before showing step 2.

const wizardSchema = z.object({
  // Step 1
  company:  z.string().min(1, "Company name required"),
  industry: z.enum(["tech","finance","health","retail","other"]),
  size:     z.coerce.number().min(1, "Must be at least 1").max(100000),
  // Step 2
  contactName:  z.string().min(1, "Contact name required"),
  contactEmail: z.string().email("Invalid email"),
  contactPhone: z.string().min(7, "Phone required"),
  // Step 3
  plan:    z.enum(["starter","pro","enterprise"]),
  billing: z.enum(["monthly","annual"]),
  promo:   z.string().optional(),
});

type WizardForm = z.infer<typeof wizardSchema>;

const STEPS = [
  { title: "Company",  fields: ["company","industry","size"] as const },
  { title: "Contact",  fields: ["contactName","contactEmail","contactPhone"] as const },
  { title: "Plan",     fields: ["plan","billing","promo"] as const },
];

function MultiStepDemo() {
  const [step, setStep]           = useState(0);
  const [submitted, setSubmitted] = useState<WizardForm | null>(null);

  const { register, handleSubmit, trigger, formState: { errors, isSubmitting } } = useForm<WizardForm>({
    resolver: zodResolver(wizardSchema) as Resolver<WizardForm>,
    mode: "onTouched",
    defaultValues: {
      company: "", industry: "tech", size: undefined,
      contactName: "", contactEmail: "", contactPhone: "",
      plan: "starter", billing: "monthly", promo: "",
    },
  });

  async function next() {
    // trigger(fields) — validate only this step's fields before advancing
    const valid = await trigger(STEPS[step].fields as any);
    if (valid) setStep((s) => s + 1);
  }

  const onSubmit: SubmitHandler<WizardForm> = async (data) => {
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(data);
  };

  return (
    <Section title="4. Multi-step form — trigger() validates per step" bg="#fffff0">
      {/* Step indicators */}
      <div style={{ display:"flex", gap:"0", marginBottom:"20px" }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ flex:1, textAlign:"center" }}>
            <div style={{
              width:"28px", height:"28px", borderRadius:"50%", margin:"0 auto 4px",
              background: i <= step ? "#4a90e2" : "#eee",
              color: i <= step ? "#fff" : "#aaa",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", fontWeight:"bold",
            }}>
              {i + 1}
            </div>
            <div style={{ fontSize:"11px", color: i === step ? "#333" : "#aaa" }}>{s.title}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* Step 1 — Company */}
        {step === 0 && (
          <>
            <Field label="Company Name" error={errors.company?.message}>
              <input {...register("company")} placeholder="Acme Inc." style={inp(!!errors.company)} />
            </Field>
            <Row>
              <Field label="Industry" error={errors.industry?.message}>
                <select {...register("industry")} style={inp(!!errors.industry)}>
                  {["tech","finance","health","retail","other"].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </Field>
              <Field label="Company Size" error={errors.size?.message}>
                <input type="number" {...register("size")} placeholder="e.g. 50" style={inp(!!errors.size)} />
              </Field>
            </Row>
          </>
        )}

        {/* Step 2 — Contact */}
        {step === 1 && (
          <>
            <Field label="Contact Name" error={errors.contactName?.message}>
              <input {...register("contactName")} placeholder="Jane Doe" style={inp(!!errors.contactName)} />
            </Field>
            <Field label="Contact Email" error={errors.contactEmail?.message}>
              <input type="email" {...register("contactEmail")} placeholder="jane@acme.com" style={inp(!!errors.contactEmail)} />
            </Field>
            <Field label="Phone" error={errors.contactPhone?.message}>
              <input {...register("contactPhone")} placeholder="+1 555 000 0000" style={inp(!!errors.contactPhone)} />
            </Field>
          </>
        )}

        {/* Step 3 — Plan */}
        {step === 2 && (
          <>
            <Field label="Plan" error={errors.plan?.message}>
              <div style={{ display:"flex", gap:"10px" }}>
                {([["starter","$29/mo"],["pro","$79/mo"],["enterprise","Custom"]] as const).map(([val, price]) => (
                  <label key={val} style={radioLabel}>
                    <input type="radio" value={val} {...register("plan")} />
                    {val.charAt(0).toUpperCase() + val.slice(1)} — {price}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Billing" error={errors.billing?.message}>
              <div style={{ display:"flex", gap:"10px" }}>
                <label style={radioLabel}><input type="radio" value="monthly" {...register("billing")} /> Monthly</label>
                <label style={radioLabel}><input type="radio" value="annual"  {...register("billing")} /> Annual (save 20%)</label>
              </div>
            </Field>
            <Field label="Promo Code (optional)" error={errors.promo?.message}>
              <input {...register("promo")} placeholder="SAVE20" style={{ ...inp(false), width:"160px" }} />
            </Field>
          </>
        )}

        <div style={{ display:"flex", justifyContent:"space-between", marginTop:"16px" }}>
          {step > 0 && (
            <button type="button" onClick={() => setStep(s => s - 1)} style={outlineBtn}>← Back</button>
          )}
          <div style={{ marginLeft:"auto" }}>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} style={solidBtn}>Next →</button>
            ) : (
              <button type="submit" disabled={isSubmitting} style={solidBtn}>
                {isSubmitting ? "Submitting…" : "Start Free Trial"}
              </button>
            )}
          </div>
        </div>
      </form>

      {submitted && (
        <div style={successStyle}>
          <strong>✓ Submitted!</strong>
          <pre style={{ margin:"8px 0 0", fontSize:"11px" }}>{JSON.stringify(submitted, null, 2)}</pre>
        </div>
      )}

      <Note>
        <code>trigger(["company","industry","size"])</code> — validates only step 1 fields.<br />
        Returns <code>true</code> if valid → advance to next step. Returns <code>false</code> → show errors, stay on current step.<br />
        The entire form is still ONE <code>useForm</code> — data persists across steps automatically.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function AdvancedPatternsDemo() {
  return (
    <div>
      <h2>Advanced React Hook Form Patterns</h2>
      <p style={{ fontSize:"13px", color:"#666", marginBottom:"16px" }}>
        Production patterns: dynamic arrays, conditional fields, custom components, shared form context, multi-step wizards.
      </p>

      <FieldArrayDemo />
      <WatchControllerDemo />
      <FormProviderDemo />
      <MultiStepDemo />

      <div style={{ padding:"12px", background:"#f5f5f5", borderRadius:"6px", fontSize:"13px" }}>
        <strong>Advanced pattern reference:</strong>
        <ul style={{ margin:"6px 0 0", paddingLeft:"18px", lineHeight:"1.9" }}>
          <li><code>useFieldArray(&#123; control, name &#125;)</code> → <code>fields, append, remove, prepend, insert, move, swap</code></li>
          <li>Always use <code>field.id</code> as key — never index (breaks re-ordering)</li>
          <li><code>useWatch(&#123; control, name &#125;)</code> — efficient conditional rendering (vs <code>watch()</code> which re-renders whole component)</li>
          <li><code>Controller</code> → <code>render=(&#123; field &#125;) =&gt;</code> — wraps any custom or UI-library component</li>
          <li><code>FormProvider &#123;...methods&#125;</code> + <code>useFormContext()</code> — share form without prop drilling</li>
          <li><code>trigger(fields)</code> — validate specific fields manually (multi-step, on-demand)</li>
          <li>Multi-step: one <code>useForm</code> for all steps — data persists across steps automatically</li>
        </ul>
      </div>
    </div>
  );
}

// ─── shared UI helpers ────────────────────────────────────────────────────────

function Section({ title, bg, children }: { title: string; bg: string; children: React.ReactNode }) {
  return (
    <div style={{ padding:"16px", background: bg, borderRadius:"8px", marginBottom:"16px" }}>
      <h4 style={{ margin:"0 0 14px", fontSize:"14px" }}>{title}</h4>
      {children}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom:"10px", flex:1 }}>
      {label && <label style={labelStyle}>{label}</label>}
      {children}
      {error && <p style={errStyle}>{error}</p>}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>{children}</div>;
}

function Note({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize:"11px", color:"#888", margin:"10px 0 0", lineHeight:"1.6" }}>{children}</p>;
}

function inp(hasError: boolean): React.CSSProperties {
  return { display:"block", width:"100%", padding:"6px 10px", boxSizing:"border-box", border:`1px solid ${hasError ? "#e74c3c" : "#ddd"}`, borderRadius:"4px", fontSize:"13px" };
}

const labelStyle:   React.CSSProperties = { display:"block", fontSize:"12px", fontWeight:"bold", marginBottom:"3px" };
const errStyle:     React.CSSProperties = { margin:"3px 0 0", fontSize:"11px", color:"#e74c3c" };
const rowBox:       React.CSSProperties = { display:"flex", gap:"8px", alignItems:"flex-start", marginBottom:"8px", padding:"8px", background:"#fff", borderRadius:"6px" };
const solidBtn:     React.CSSProperties = { padding:"8px 20px", background:"#4a90e2", color:"#fff", border:"none", borderRadius:"4px", cursor:"pointer", fontSize:"13px" };
const outlineBtn:   React.CSSProperties = { padding:"8px 16px", background:"#fff", color:"#4a90e2", border:"1px solid #4a90e2", borderRadius:"4px", cursor:"pointer", fontSize:"13px" };
const iconBtn = (color: string): React.CSSProperties => ({ padding:"4px 8px", background: color, color:"#fff", border:"none", borderRadius:"4px", cursor:"pointer", fontSize:"12px", alignSelf:"flex-start", marginTop:"2px" });
const radioLabel:   React.CSSProperties = { display:"flex", alignItems:"center", gap:"6px", fontSize:"13px", cursor:"pointer" };
const checkLabel:   React.CSSProperties = { display:"flex", alignItems:"center", gap:"8px", fontSize:"13px", cursor:"pointer" };
const fieldsetStyle:React.CSSProperties = { border:"1px solid #ddd", borderRadius:"6px", padding:"12px 16px", marginBottom:"12px" };
const legendStyle:  React.CSSProperties = { fontSize:"12px", fontWeight:"bold", color:"#666", padding:"0 6px" };
const preStyle:     React.CSSProperties = { background:"#f5f5f5", padding:"10px", borderRadius:"6px", fontSize:"11px", overflowX:"auto", marginTop:"10px" };
const successStyle: React.CSSProperties = { padding:"12px", background:"#f0fff0", borderRadius:"6px", fontSize:"13px", marginTop:"10px" };
