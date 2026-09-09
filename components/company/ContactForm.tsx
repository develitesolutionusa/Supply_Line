"use client";

import { useState } from "react";
import { fieldClass } from "@/lib/ui";

const TOPICS = [
  "Wholesale account",
  "Catalog and pricing",
  "Delivery",
  "Existing order",
  "Other",
] as const;

export function ContactForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          company: data.get("company"),
          phone: data.get("phone"),
          topic: data.get("topic"),
          message: data.get("message"),
        }),
      });
      const payload = (await response.json()) as { error?: string; delivered?: boolean };
      if (!response.ok) throw new Error(payload.error ?? "Could not send your message.");
      form.reset();
      setSuccess(
        payload.delivered
          ? "Message sent. A SupplyLine specialist will reply during business hours."
          : "Message received. Email delivery is not configured in this environment, but your note was accepted.",
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not send your message.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={fieldClass.LABEL} htmlFor="contact-name">
            Name
          </label>
          <input id="contact-name" name="name" className={fieldClass.INPUT} autoComplete="name" required />
        </div>
        <div>
          <label className={fieldClass.LABEL} htmlFor="contact-email">
            Work email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            className={fieldClass.INPUT}
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label className={fieldClass.LABEL} htmlFor="contact-company">
            Company
          </label>
          <input
            id="contact-company"
            name="company"
            className={fieldClass.INPUT}
            autoComplete="organization"
          />
        </div>
        <div>
          <label className={fieldClass.LABEL} htmlFor="contact-phone">
            Phone
          </label>
          <input id="contact-phone" name="phone" type="tel" className={fieldClass.INPUT} autoComplete="tel" />
        </div>
      </div>
      <div>
        <label className={fieldClass.LABEL} htmlFor="contact-topic">
          How can we help?
        </label>
        <select id="contact-topic" name="topic" className={fieldClass.INPUT} defaultValue="Wholesale account">
          {TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={fieldClass.LABEL} htmlFor="contact-message">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          className={`${fieldClass.INPUT} h-auto py-3`}
          placeholder="Tell us about your operation, typical case volume, or a delivery question."
          required
          minLength={10}
        />
      </div>
      {error ? (
        <p className="text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-emerald-800" role="status">
          {success}
        </p>
      ) : null}
      <button type="submit" className={fieldClass.BUTTON} disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
