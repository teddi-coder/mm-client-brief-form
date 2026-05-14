import { useState, useEffect } from "react";

// Worker URL — set VITE_WORKER_URL in Cloudflare Pages env vars at deploy time.
// Falls back to localhost for local development.
const WORKER_URL =
  import.meta.env.VITE_WORKER_URL || "http://localhost:8787";

// Derive MM Plan from ?plan= query param.
// "accelerate" → orderindex 0, anything else → orderindex 1 (default)
function getMmPlan() {
  const params = new URLSearchParams(window.location.search);
  return params.get("plan") === "accelerate" ? 0 : 1;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#F0F0EC",
    display: "flex",
    flexDirection: "column",
  },
  // Header bar
  header: {
    backgroundColor: "#FF3D02",
    padding: "0",
    borderBottom: "4px solid #000",
  },
  headerInner: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  // Tyre-print decorative bar (simplified SVG pattern strip)
  tyreBar: {
    width: "100%",
    height: 10,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  logo: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontWeight: 900,
    fontSize: 28,
    color: "#000",
    letterSpacing: "-0.03em",
    textTransform: "uppercase",
    lineHeight: 1,
  },
  logoSub: {
    fontSize: 11,
    fontWeight: 700,
    color: "#000",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginTop: 2,
  },
  // Main content
  main: {
    flex: 1,
    maxWidth: 720,
    width: "100%",
    margin: "0 auto",
    padding: "40px 24px 80px",
  },
  // Intro
  intro: {
    marginBottom: 40,
  },
  introHeading: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontWeight: 900,
    fontSize: 42,
    lineHeight: 1,
    letterSpacing: "-0.02em",
    textTransform: "uppercase",
    color: "#000",
    marginBottom: 12,
  },
  introBody: {
    fontSize: 16,
    lineHeight: 1.6,
    color: "#000",
    maxWidth: 560,
  },
  // Section
  section: {
    marginBottom: 36,
    borderTop: "3px solid #000",
    paddingTop: 24,
  },
  sectionLabel: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#FF3D02",
    marginBottom: 20,
  },
  // Field group
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    display: "block",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    color: "#000",
    marginBottom: 6,
  },
  required: {
    color: "#FF3D02",
    marginLeft: 2,
  },
  input: {
    display: "block",
    width: "100%",
    padding: "11px 14px",
    fontSize: 16,
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    color: "#000",
    backgroundColor: "#fff",
    border: "2px solid #000",
    borderRadius: 0,
    outline: "none",
    transition: "border-color 0.15s",
    appearance: "none",
    WebkitAppearance: "none",
  },
  inputFocus: {
    borderColor: "#FF3D02",
    boxShadow: "0 0 0 3px rgba(255,61,2,0.2)",
  },
  inputError: {
    borderColor: "#FF3D02",
    backgroundColor: "#FFF5F3",
  },
  textarea: {
    resize: "vertical",
    minHeight: 100,
  },
  errorMsg: {
    fontSize: 13,
    color: "#FF3D02",
    fontWeight: 700,
    marginTop: 5,
  },
  hint: {
    fontSize: 13,
    color: "#555",
    marginTop: 5,
  },
  // Radio group
  radioGroup: {
    display: "flex",
    gap: 24,
    flexWrap: "wrap",
    marginTop: 4,
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 15,
    cursor: "pointer",
    fontWeight: 500,
  },
  radio: {
    width: 18,
    height: 18,
    accentColor: "#FF3D02",
    cursor: "pointer",
  },
  // Submit button
  submitBtn: {
    display: "block",
    width: "100%",
    padding: "16px 24px",
    backgroundColor: "#FF3D02",
    color: "#000",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontWeight: 900,
    fontSize: 16,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    border: "3px solid #000",
    borderRadius: 0,
    cursor: "pointer",
    transition: "background-color 0.15s, transform 0.1s",
    marginTop: 8,
  },
  submitBtnDisabled: {
    backgroundColor: "#FFD1C6",
    cursor: "not-allowed",
  },
  // Success state
  success: {
    textAlign: "center",
    padding: "64px 24px",
    maxWidth: 560,
    margin: "0 auto",
  },
  successHeading: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontWeight: 900,
    fontSize: 36,
    textTransform: "uppercase",
    letterSpacing: "-0.02em",
    color: "#000",
    marginBottom: 16,
  },
  successOrange: {
    color: "#FF3D02",
  },
  successBody: {
    fontSize: 18,
    lineHeight: 1.6,
    color: "#000",
  },
  successBar: {
    width: 64,
    height: 5,
    backgroundColor: "#FF3D02",
    margin: "24px auto",
  },
  // Error banner
  errorBanner: {
    backgroundColor: "#000",
    color: "#FF3D02",
    fontWeight: 700,
    fontSize: 14,
    padding: "14px 18px",
    borderLeft: "5px solid #FF3D02",
    marginBottom: 28,
    lineHeight: 1.5,
  },
  // Footer
  footer: {
    backgroundColor: "#000",
    color: "#F0F0EC",
    fontSize: 13,
    textAlign: "center",
    padding: "18px 24px",
    letterSpacing: "0.04em",
  },
};

// ── Controlled input with focus/error state ───────────────────────────────────

function Field({ label, required, hint, error, children }) {
  return (
    <div style={s.fieldGroup}>
      <label style={s.label}>
        {label}
        {required && <span style={s.required} aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && <p style={s.hint}>{hint}</p>}
      {error && <p style={s.errorMsg} role="alert">{error}</p>}
    </div>
  );
}

function TextInput({ id, value, onChange, error, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      id={id}
      value={value}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...s.input,
        ...(focused ? s.inputFocus : {}),
        ...(error ? s.inputError : {}),
      }}
      {...rest}
    />
  );
}

function TextArea({ id, value, onChange, error, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...s.input,
        ...s.textarea,
        ...(focused ? s.inputFocus : {}),
        ...(error ? s.inputError : {}),
      }}
      {...rest}
    />
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [form, setForm] = useState({
    brandName: "",
    websiteUrl: "",
    bookingUrl: "",
    yourName: "",
    email: "",
    englishPref: 0, // 0 = AU/UK (default), 1 = US
    goal: "",
    niche: "",
    targetLocation: "",
    googleBudget: "",
    facebookBudget: "",
    competitors: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Derive mmPlan once on mount from URL
  const [mmPlan] = useState(() => getMmPlan());

  function set(field) {
    return (e) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: null }));
      }
    };
  }

  function validate() {
    const errs = {};
    if (!form.brandName.trim()) errs.brandName = "Business / Brand Name is required.";
    if (!form.yourName.trim()) errs.yourName = "Your Name is required.";
    if (!form.email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Please enter a valid email address.";
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Scroll to first error
      const firstErrId = Object.keys(errs)[0];
      document.getElementById(firstErrId)?.focus();
      return;
    }

    setSubmitting(true);

    // Build payload — omit empty optional fields
    const payload = {
      brandName: form.brandName.trim(),
      yourName: form.yourName.trim(),
      email: form.email.trim(),
      englishPref: form.englishPref, // always included (has default)
      mmPlan,                        // always included (derived from URL)
    };

    const optionalStr = ["websiteUrl", "bookingUrl", "goal", "niche", "targetLocation", "competitors", "notes"];
    optionalStr.forEach((k) => {
      const v = form[k]?.trim();
      if (v) payload[k] = v;
    });

    const optionalNum = ["googleBudget", "facebookBudget"];
    optionalNum.forEach((k) => {
      const v = form[k]?.trim();
      if (v && !isNaN(Number(v))) payload[k] = v;
    });

    try {
      const res = await fetch(`${WORKER_URL}/submit-brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Unexpected error");
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={s.page}>
        <header style={s.header}>
          <div style={s.tyreBar} />
          <div style={s.headerInner}>
            <div>
              <div style={s.logo}>MM</div>
              <div style={s.logoSub}>Mechanic Marketing</div>
            </div>
          </div>
        </header>
        <main style={{ ...s.main, display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
          <div style={s.success}>
            <div style={s.successBar} />
            <h1 style={s.successHeading}>
              Thanks{" "}
              <span style={s.successOrange}>{form.yourName.split(" ")[0]}</span>,<br />
              we've got your brief.
            </h1>
            <p style={s.successBody}>
              Our team will be in touch shortly to get your marketing running.
            </p>
            <div style={s.successBar} />
          </div>
        </main>
        <footer style={s.footer}>
          &copy; {new Date().getFullYear()} Mechanic Marketing. All rights reserved.
        </footer>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.tyreBar} />
        <div style={s.headerInner}>
          <div>
            <div style={s.logo}>MM</div>
            <div style={s.logoSub}>Mechanic Marketing</div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={s.main}>
        {/* Intro */}
        <div style={s.intro}>
          <h1 style={s.introHeading}>Client Brief</h1>
          <p style={s.introBody}>
            Fill in the form below so our team can get under the hood of your
            business and build a marketing strategy that delivers. Fields marked
            with <span style={{ color: "#FF3D02", fontWeight: 700 }}>*</span> are required.
          </p>
        </div>

        {/* Error banner */}
        {submitError && (
          <div style={s.errorBanner} role="alert">
            Something went wrong. Please email us at{" "}
            <a href="mailto:hello@mechanicmarketing.co" style={{ color: "#FF3D02" }}>
              hello@mechanicmarketing.co
            </a>
            {submitError !== "Unknown error" && (
              <span style={{ opacity: 0.75 }}> ({submitError})</span>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* ── Section 1: Your business ─────────────────────────────────── */}
          <section style={s.section} aria-labelledby="sec-business">
            <p id="sec-business" style={s.sectionLabel}>01 — Your Business</p>

            <Field
              label="Business / Brand Name"
              required
              error={errors.brandName}
            >
              <TextInput
                id="brandName"
                type="text"
                value={form.brandName}
                onChange={set("brandName")}
                error={errors.brandName}
                placeholder="e.g. Smith's Auto Repairs"
                autoComplete="organization"
              />
            </Field>

            <Field
              label="Website URL"
              hint="Your main website address."
              error={errors.websiteUrl}
            >
              <TextInput
                id="websiteUrl"
                type="url"
                value={form.websiteUrl}
                onChange={set("websiteUrl")}
                error={errors.websiteUrl}
                placeholder="https://smithsauto.com.au"
                autoComplete="url"
              />
            </Field>

            <Field
              label="Secondary / Booking URL"
              hint="Booking system, second location site, or other key URL."
              error={errors.bookingUrl}
            >
              <TextInput
                id="bookingUrl"
                type="url"
                value={form.bookingUrl}
                onChange={set("bookingUrl")}
                error={errors.bookingUrl}
                placeholder="https://book.smithsauto.com.au"
              />
            </Field>
          </section>

          {/* ── Section 2: Your details ──────────────────────────────────── */}
          <section style={s.section} aria-labelledby="sec-details">
            <p id="sec-details" style={s.sectionLabel}>02 — Your Details</p>

            <Field label="Your Name" required error={errors.yourName}>
              <TextInput
                id="yourName"
                type="text"
                value={form.yourName}
                onChange={set("yourName")}
                error={errors.yourName}
                placeholder="e.g. John Smith"
                autoComplete="name"
              />
            </Field>

            <Field label="Your Email" required error={errors.email}>
              <TextInput
                id="email"
                type="email"
                value={form.email}
                onChange={set("email")}
                error={errors.email}
                placeholder="john@smithsauto.com.au"
                autoComplete="email"
              />
            </Field>

            <Field label="English Preference">
              <div style={s.radioGroup} role="radiogroup" aria-label="English preference">
                <label style={s.radioLabel}>
                  <input
                    type="radio"
                    name="englishPref"
                    value="0"
                    checked={form.englishPref === 0}
                    onChange={() => setForm((p) => ({ ...p, englishPref: 0 }))}
                    style={s.radio}
                  />
                  Australian / UK English
                </label>
                <label style={s.radioLabel}>
                  <input
                    type="radio"
                    name="englishPref"
                    value="1"
                    checked={form.englishPref === 1}
                    onChange={() => setForm((p) => ({ ...p, englishPref: 1 }))}
                    style={s.radio}
                  />
                  US English
                </label>
              </div>
            </Field>
          </section>

          {/* ── Section 3: About your marketing ─────────────────────────── */}
          <section style={s.section} aria-labelledby="sec-marketing">
            <p id="sec-marketing" style={s.sectionLabel}>03 — About Your Marketing</p>

            <Field
              label="Goal"
              hint="What's the primary goal of your digital marketing? e.g. more bookings, brand awareness, grow to a second location."
              error={errors.goal}
            >
              <TextArea
                id="goal"
                value={form.goal}
                onChange={set("goal")}
                error={errors.goal}
                placeholder="We want to increase bookings by 30% and become the go-to workshop in our suburb."
              />
            </Field>

            <Field
              label="Niche / Speciality"
              hint="What types of vehicles or services do you specialise in?"
              error={errors.niche}
            >
              <TextArea
                id="niche"
                value={form.niche}
                onChange={set("niche")}
                error={errors.niche}
                placeholder="European vehicles — BMW, Mercedes, Audi. Logbook servicing and pre-purchase inspections."
              />
            </Field>

            <Field
              label="Target Location"
              hint="Suburb, city, or region you want to attract customers from."
              error={errors.targetLocation}
            >
              <TextInput
                id="targetLocation"
                type="text"
                value={form.targetLocation}
                onChange={set("targetLocation")}
                error={errors.targetLocation}
                placeholder="e.g. Brunswick, Melbourne VIC"
              />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field
                label="Google Ads Budget (AUD)"
                hint="Monthly budget in dollars."
                error={errors.googleBudget}
              >
                <TextInput
                  id="googleBudget"
                  type="number"
                  min="0"
                  step="50"
                  value={form.googleBudget}
                  onChange={set("googleBudget")}
                  error={errors.googleBudget}
                  placeholder="1500"
                />
              </Field>

              <Field
                label="Facebook Ads Budget (AUD)"
                hint="Monthly budget in dollars."
                error={errors.facebookBudget}
              >
                <TextInput
                  id="facebookBudget"
                  type="number"
                  min="0"
                  step="50"
                  value={form.facebookBudget}
                  onChange={set("facebookBudget")}
                  error={errors.facebookBudget}
                  placeholder="500"
                />
              </Field>
            </div>
          </section>

          {/* ── Section 4: Competitors & notes ───────────────────────────── */}
          <section style={s.section} aria-labelledby="sec-competitors">
            <p id="sec-competitors" style={s.sectionLabel}>04 — Competitors &amp; Notes</p>

            <Field
              label="Top Competitors"
              hint="List any local competitors or workshops you're up against."
              error={errors.competitors}
            >
              <TextArea
                id="competitors"
                value={form.competitors}
                onChange={set("competitors")}
                error={errors.competitors}
                placeholder="Joe's Garage (joesgaragemechanics.com.au), AutoFix Brunswick..."
              />
            </Field>

            <Field
              label="Additional Notes"
              hint="Anything else we should know before we get started."
              error={errors.notes}
            >
              <TextArea
                id="notes"
                value={form.notes}
                onChange={set("notes")}
                error={errors.notes}
                placeholder="We've tried Google Ads before with another agency but didn't see results..."
              />
            </Field>
          </section>

          {/* ── Submit ────────────────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              ...s.submitBtn,
              ...(submitting ? s.submitBtnDisabled : {}),
            }}
          >
            {submitting ? "Submitting…" : "Submit Brief"}
          </button>
        </form>
      </main>

      {/* Footer */}
      <footer style={s.footer}>
        &copy; {new Date().getFullYear()} Mechanic Marketing. All rights reserved.
      </footer>
    </div>
  );
}
