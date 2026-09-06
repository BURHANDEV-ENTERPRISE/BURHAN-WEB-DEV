"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchContentFile, saveContentFile } from "../../src/lib/githubContent";
import testimonialsDefault from "../../src/content/testimonials.json";
import pricingDefault from "../../src/content/pricing.json";
import servicesDefault from "../../src/content/services.json";

type Testimonial = { quote: string; name: string; role: string };
type Testimonials = { rowA: Testimonial[]; rowB: Testimonial[] };
type Plan = {
  num: string;
  label: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  featured: boolean;
};
type Service = { label: string; sub: string; theme: string; featured?: boolean };

const TOKEN_KEY = "burhandev_admin_pat";
const THEMES = ["maroon", "navy", "teal", "amber", "slate"];

function useContentEditor<T>(path: string, defaultValue: T, token: string) {
  const [value, setValue] = useState<T>(defaultValue);
  const [sha, setSha] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "error" | "saved">("idle");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setStatus("loading");
    setError("");
    try {
      const file = await fetchContentFile<T>(path, token);
      setValue(file.data);
      setSha(file.sha);
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [path, token]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (message: string) => {
      if (!token || !sha) return;
      setStatus("saving");
      setError("");
      try {
        const newSha = await saveContentFile(path, value, sha, token, message);
        setSha(newSha);
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2500);
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [path, value, sha, token]
  );

  return { value, setValue, status, error, save, reload: load };
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <label style={{ display: "block", marginBottom: 8, fontSize: 13 }}>
      <span style={{ display: "block", opacity: 0.7, marginBottom: 2 }}>{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          style={{ width: "100%", fontFamily: "inherit", padding: 6 }}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: "100%", padding: 6, fontFamily: "inherit" }}
        />
      )}
    </label>
  );
}

function SaveBar({
  status,
  error,
  onSave,
  onReload,
}: {
  status: "idle" | "loading" | "saving" | "error" | "saved";
  error: string;
  onSave: () => void;
  onReload: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0 28px" }}>
      <button onClick={onSave} disabled={status === "saving" || status === "loading"}>
        {status === "saving" ? "Saving…" : "Save to GitHub"}
      </button>
      <button onClick={onReload} disabled={status === "loading"}>
        Reload from GitHub
      </button>
      {status === "loading" && <span>Loading…</span>}
      {status === "saved" && <span style={{ color: "green" }}>Saved — site redeploys in ~1 min</span>}
      {status === "error" && <span style={{ color: "crimson" }}>{error}</span>}
    </div>
  );
}

function TestimonialsEditor({ token }: { token: string }) {
  const { value, setValue, status, error, save, reload } = useContentEditor<Testimonials>(
    "src/content/testimonials.json",
    testimonialsDefault as Testimonials,
    token
  );

  const updateRow = (row: "rowA" | "rowB", i: number, patch: Partial<Testimonial>) => {
    setValue((v) => ({
      ...v,
      [row]: v[row].map((t, idx) => (idx === i ? { ...t, ...patch } : t)),
    }));
  };
  const removeRow = (row: "rowA" | "rowB", i: number) => {
    setValue((v) => ({ ...v, [row]: v[row].filter((_, idx) => idx !== i) }));
  };
  const addRow = (row: "rowA" | "rowB") => {
    setValue((v) => ({
      ...v,
      [row]: [...v[row], { quote: "", name: "", role: "" }],
    }));
  };

  return (
    <section style={{ marginBottom: 40 }}>
      <h2>Testimonials</h2>
      <SaveBar status={status} error={error} onSave={() => save("Update testimonials via /admin")} onReload={reload} />
      {(["rowA", "rowB"] as const).map((row) => (
        <div key={row} style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15 }}>{row === "rowA" ? "Row A" : "Row B"}</h3>
          {value[row].map((t, i) => (
            <div key={i} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 8, borderRadius: 6 }}>
              <Field label="Quote" value={t.quote} onChange={(v) => updateRow(row, i, { quote: v })} textarea />
              <Field label="Name" value={t.name} onChange={(v) => updateRow(row, i, { name: v })} />
              <Field label="Role" value={t.role} onChange={(v) => updateRow(row, i, { role: v })} />
              <button onClick={() => removeRow(row, i)}>Remove</button>
            </div>
          ))}
          <button onClick={() => addRow(row)}>+ Add testimonial to {row === "rowA" ? "Row A" : "Row B"}</button>
        </div>
      ))}
    </section>
  );
}

function PricingEditor({ token }: { token: string }) {
  const { value, setValue, status, error, save, reload } = useContentEditor<Plan[]>(
    "src/content/pricing.json",
    pricingDefault as Plan[],
    token
  );

  const update = (i: number, patch: Partial<Plan>) => {
    setValue((v) => v.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  };

  return (
    <section style={{ marginBottom: 40 }}>
      <h2>Pricing</h2>
      <SaveBar status={status} error={error} onSave={() => save("Update pricing via /admin")} onReload={reload} />
      {value.map((p, i) => (
        <div key={i} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 8, borderRadius: 6 }}>
          <Field label="Plan name" value={p.label} onChange={(v) => update(i, { label: v })} />
          <Field label="Price" value={p.price} onChange={(v) => update(i, { price: v })} />
          <Field label="Period (e.g. one-time, blank if none)" value={p.period} onChange={(v) => update(i, { period: v })} />
          <Field label="Description" value={p.desc} onChange={(v) => update(i, { desc: v })} textarea />
          <Field
            label="Features (one per line)"
            value={p.features.join("\n")}
            onChange={(v) => update(i, { features: v.split("\n").filter((line) => line.trim()) })}
            textarea
          />
          <Field label="Button text" value={p.cta} onChange={(v) => update(i, { cta: v })} />
          <label style={{ fontSize: 13 }}>
            <input type="checkbox" checked={p.featured} onChange={(e) => update(i, { featured: e.target.checked })} />{" "}
            Featured (&ldquo;Most Popular&rdquo;)
          </label>
        </div>
      ))}
    </section>
  );
}

function ServicesEditor({ token }: { token: string }) {
  const { value, setValue, status, error, save, reload } = useContentEditor<Service[]>(
    "src/content/services.json",
    servicesDefault as Service[],
    token
  );

  const update = (i: number, patch: Partial<Service>) => {
    setValue((v) => v.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  return (
    <section style={{ marginBottom: 40 }}>
      <h2>Services</h2>
      <p style={{ fontSize: 13, opacity: 0.7 }}>
        Note: the scroll-in animation on this section was tuned for exactly 9 cards. Adding or
        removing cards still works, it just won&apos;t get the same hand-placed entrance positions.
      </p>
      <SaveBar status={status} error={error} onSave={() => save("Update services via /admin")} onReload={reload} />
      {value.map((s, i) => (
        <div key={i} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 8, borderRadius: 6 }}>
          <Field label="Label" value={s.label} onChange={(v) => update(i, { label: v })} />
          <Field label="Subtitle" value={s.sub} onChange={(v) => update(i, { sub: v })} />
          <label style={{ display: "block", marginBottom: 8, fontSize: 13 }}>
            <span style={{ display: "block", opacity: 0.7, marginBottom: 2 }}>Theme</span>
            <select value={s.theme} onChange={(e) => update(i, { theme: e.target.value })}>
              {THEMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 13 }}>
            <input
              type="checkbox"
              checked={!!s.featured}
              onChange={(e) => update(i, { featured: e.target.checked })}
            />{" "}
            Featured (larger card)
          </label>
        </div>
      ))}
    </section>
  );
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (stored) {
        setToken(stored);
        setTokenInput(stored);
      }
    } catch {
      // localStorage unavailable (private mode etc.) — token stays empty
    }
  }, []);

  const saveToken = () => {
    setToken(tokenInput);
    try {
      localStorage.setItem(TOKEN_KEY, tokenInput);
    } catch {
      // ignore — token still works for this page load
    }
  };

  const clearToken = () => {
    setToken("");
    setTokenInput("");
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", fontFamily: "sans-serif" }}>
      <h1>BURHANDEV Content Admin</h1>
      <div style={{ background: "#fff6dc", border: "1px solid #7f1d1d33", padding: 12, borderRadius: 6, marginBottom: 24, fontSize: 13 }}>
        <strong>How this works:</strong> this site has no backend, so there is nothing behind this
        page enforcing access — the GitHub Personal Access Token below is the real security
        boundary. Create a <em>fine-grained</em> token scoped only to the
        BURHANDEV-ENTERPRISE/BURHAN-WEB-DEV repo, with <strong>Contents: Read and write</strong> permission and
        nothing else. It&apos;s stored only in this browser&apos;s local storage and sent only to
        api.github.com. Saving here commits straight to <code>main</code> and redeploys
        automatically — there&apos;s no review step like the rest of this project&apos;s workflow.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        <input
          type="password"
          placeholder="GitHub personal access token"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={saveToken}>Use token</button>
        <button onClick={clearToken}>Clear</button>
      </div>

      {!token && <p>Paste a token above to load and edit content.</p>}
      {token && (
        <>
          <ServicesEditor token={token} />
          <PricingEditor token={token} />
          <TestimonialsEditor token={token} />
        </>
      )}
    </main>
  );
}
