"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./admin.module.css";
import { fetchContentFile, saveContentFile } from "../../src/lib/githubContent";
import { checkCredentials, isUnlockedThisSession, markUnlockedThisSession, lockSession } from "../../src/lib/adminAuth";
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
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {textarea ? (
        <textarea className={styles.textarea} value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
      ) : (
        <input className={styles.input} value={value} onChange={(e) => onChange(e.target.value)} />
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
    <div className={styles.saveBar}>
      <button className={styles.btnPrimary} onClick={onSave} disabled={status === "saving" || status === "loading"}>
        {status === "saving" ? "Saving…" : "Save to GitHub"}
      </button>
      <button className={styles.btnGhost} onClick={onReload} disabled={status === "loading"}>
        Reload from GitHub
      </button>
      {status === "loading" && <span className={styles.statusLoading}>Loading…</span>}
      {status === "saved" && <span className={styles.statusSaved}>Saved — site redeploys in ~1 min</span>}
      {status === "error" && <span className={styles.statusError}>{error}</span>}
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
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Testimonials</h2>
      <SaveBar status={status} error={error} onSave={() => save("Update testimonials via /staff-burhan-only")} onReload={reload} />
      {(["rowA", "rowB"] as const).map((row) => (
        <div key={row}>
          <h3 className={styles.rowLabel}>{row === "rowA" ? "Row A" : "Row B"}</h3>
          {value[row].map((t, i) => (
            <div key={i} className={styles.itemCard}>
              <Field label="Quote" value={t.quote} onChange={(v) => updateRow(row, i, { quote: v })} textarea />
              <Field label="Name" value={t.name} onChange={(v) => updateRow(row, i, { name: v })} />
              <Field label="Role" value={t.role} onChange={(v) => updateRow(row, i, { role: v })} />
              <button className={styles.btnGhost} onClick={() => removeRow(row, i)}>
                Remove
              </button>
            </div>
          ))}
          <button className={styles.btnGhost} onClick={() => addRow(row)}>
            + Add testimonial to {row === "rowA" ? "Row A" : "Row B"}
          </button>
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
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Pricing</h2>
      <SaveBar status={status} error={error} onSave={() => save("Update pricing via /staff-burhan-only")} onReload={reload} />
      {value.map((p, i) => (
        <div key={i} className={styles.itemCard}>
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
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={p.featured} onChange={(e) => update(i, { featured: e.target.checked })} />
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
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Services</h2>
      <p className={styles.helpText} style={{ marginBottom: "0.9rem" }}>
        Note: the scroll-in animation on this section was tuned for exactly 9 cards. Adding or
        removing cards still works, it just won&apos;t get the same hand-placed entrance positions.
      </p>
      <SaveBar status={status} error={error} onSave={() => save("Update services via /staff-burhan-only")} onReload={reload} />
      {value.map((s, i) => (
        <div key={i} className={styles.itemCard}>
          <Field label="Label" value={s.label} onChange={(v) => update(i, { label: v })} />
          <Field label="Subtitle" value={s.sub} onChange={(v) => update(i, { sub: v })} />
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Theme</span>
            <select className={styles.select} value={s.theme} onChange={(e) => update(i, { theme: e.target.value })}>
              {THEMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={!!s.featured}
              onChange={(e) => update(i, { featured: e.target.checked })}
            />
            Featured (larger card)
          </label>
        </div>
      ))}
    </section>
  );
}

function LoginGate({ onUnlock }: { onUnlock: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setFailed(false);
    const ok = await checkCredentials(username, password);
    setChecking(false);
    if (ok) {
      markUnlockedThisSession();
      onUnlock();
    } else {
      setFailed(true);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.loginWrap}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>BURHANDEV</p>
          <h1 className={styles.heading}>Staff Login</h1>
          <form onSubmit={submit}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Username</span>
              <input
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </label>
            <label className={styles.field} style={{ marginBottom: "1.1rem" }}>
              <span className={styles.fieldLabel}>Password</span>
              <input
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <button type="submit" className={styles.btnFull} disabled={checking}>
              {checking ? "Checking…" : "Log In"}
            </button>
            {failed && <p className={styles.statusError} style={{ marginTop: "0.6rem" }}>Wrong username or password.</p>}
          </form>
          <p className={styles.helpText} style={{ marginTop: "1.25rem" }}>
            Client-side gate, not a real server login — see the note on the editor page for what
            that means.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [checkedSession, setCheckedSession] = useState(false);
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");

  useEffect(() => {
    setUnlocked(isUnlockedThisSession());
    setCheckedSession(true);
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    try {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (stored) {
        setToken(stored);
        setTokenInput(stored);
      }
    } catch {
      // localStorage unavailable (private mode etc.) — token stays empty
    }
  }, [unlocked]);

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

  const logout = () => {
    lockSession();
    setUnlocked(false);
  };

  if (!checkedSession) return null;
  if (!unlocked) return <LoginGate onUnlock={() => setUnlocked(true)} />;

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.topBar}>
          <div>
            <p className={styles.eyebrow}>BURHANDEV</p>
            <h1 className={styles.heading} style={{ marginBottom: 0 }}>
              Content Admin
            </h1>
          </div>
          <button className={styles.btnGhost} onClick={logout}>
            Log Out
          </button>
        </div>

        <div className={styles.infoBox}>
          <strong>How this works:</strong> this site has no backend, so there is nothing behind
          this page enforcing access — the GitHub Personal Access Token below is the real
          security boundary (the login above just keeps the editor UI from casual visitors).
          Create a <em>fine-grained</em> token scoped only to the
          BURHANDEV-ENTERPRISE/BURHAN-WEB-DEV repo, with <strong>Contents: Read and write</strong>{" "}
          permission and nothing else. It&apos;s stored only in this browser&apos;s local storage
          and sent only to api.github.com. Saving here commits straight to <code>main</code> and
          redeploys automatically — there&apos;s no review step like the rest of this
          project&apos;s workflow.
        </div>

        <div className={styles.tokenRow}>
          <input
            type="password"
            className={styles.input}
            placeholder="GitHub personal access token"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />
          <button className={styles.btnPrimary} onClick={saveToken}>
            Use Token
          </button>
          <button className={styles.btnGhost} onClick={clearToken}>
            Clear
          </button>
        </div>

        {!token && <p className={styles.helpText}>Paste a token above to load and edit content.</p>}
        {token && (
          <>
            <ServicesEditor token={token} />
            <PricingEditor token={token} />
            <TestimonialsEditor token={token} />
          </>
        )}
      </div>
    </div>
  );
}
