"use client";

import { useState } from "react";
import styles from "./ContactForm.module.css";

// Web3Forms access key — this is safe to expose client-side (it only tells
// Web3Forms which inbox to relay submissions to; spam/abuse protection lives
// on their side). Get your own at https://web3forms.com with the inbox
// address that should receive project inquiries, then replace this value.
const WEB3FORMS_ACCESS_KEY = "YOUR_WEB3FORMS_ACCESS_KEY";

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `New project inquiry from ${data.name}`,
          from_name: "BURHANDEV website",
          ...data,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStatus("sent");
        form.reset();
      } else {
        setStatus("error");
        setError(json.message || "Something went wrong. Please try again or email us directly.");
      }
    } catch {
      setStatus("error");
      setError("Couldn't reach the server. Please try again or email us directly.");
    }
  };

  if (status === "sent") {
    return (
      <div className={styles.card}>
        <p className={styles.sentMessage}>
          Thanks — your brief is in. We&apos;ll get back to you shortly at the email you gave us.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.card} onSubmit={onSubmit}>
      {/* Honeypot — hidden from real visitors, bots tend to fill every field */}
      <input type="checkbox" name="botcheck" className={styles.honeypot} tabIndex={-1} autoComplete="off" />

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Name</span>
          <input className={styles.input} name="name" required />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Email</span>
          <input className={styles.input} type="email" name="email" required />
        </label>
      </div>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Deadline (optional)</span>
          <input className={styles.input} name="deadline" placeholder="e.g. 3 weeks" />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Budget range (optional)</span>
          <input className={styles.input} name="budget" placeholder="e.g. RM 2,000–3,000" />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Project scope</span>
        <textarea
          className={styles.textarea}
          name="message"
          rows={4}
          required
          placeholder="What are you building, and any style references?"
        />
      </label>

      <button type="submit" className={styles.submit} disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send Brief"}
      </button>

      {status === "error" && <p className={styles.errorText}>{error}</p>}
    </form>
  );
}
