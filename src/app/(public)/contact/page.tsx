"use client";

import { useState } from "react";

import { MessageSquare, Send, CheckCircle2, AlertTriangle } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "editorial-correction",
    opportunityName: "",
    message: "",
    website_hp: "", // Honeypot field
  });

  const [formRenderedAt, setFormRenderedAt] = useState<number>(() => Date.now());
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Honeypot check (Bots fill this)
    if (formData.website_hp) {
      console.warn("[SPAM DEFENSE] Honeypot field triggered");
      // Silently pretend success to mislead bot
      setStatus("success");
      return;
    }

    // 2. Time-to-submit check (Reject if submitted under 2 seconds)
    const elapsedMs = Date.now() - formRenderedAt;
    if (elapsedMs < 2000) {
      setErrorMessage("Please take a moment to review your message before submitting.");
      return;
    }

    // 3. Client Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    setStatus("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          renderedAt: formRenderedAt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to submit grievance. Please try again later.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMessage("Network error occurred. Please check your connection or contact editorial@governit.in directly.");
      setStatus("error");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-line pb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-info-bg px-3 py-1 text-xs font-semibold text-link">
          <MessageSquare className="h-4 w-4" />
          Editorial Transparency &amp; Corrections Desk
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          Contact &amp; Public Grievance Desk
        </h1>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          Found an outdated exam date, an unlisted government scheme, or a broken official link? Submit a notification correction to our editorial team.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Contact Info Sidebar */}
        <div className="space-y-6 md:col-span-1">
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
            <h2 className="text-sm font-bold text-fg uppercase tracking-wider">
              Editorial Contacts
            </h2>
            <div className="mt-4 space-y-4 text-xs text-muted">
              <div>
                <span className="font-semibold text-fg block">Corrections &amp; Updates</span>
                <a href="mailto:editorial@governit.in" className="text-success underline">
                  editorial@governit.in
                </a>
              </div>
              <div>
                <span className="font-semibold text-fg block">Privacy &amp; Grievances</span>
                <a href="mailto:privacy@governit.in" className="text-success underline">
                  privacy@governit.in
                </a>
              </div>
              <div>
                <span className="font-semibold text-fg block">Official Entity Office</span>
                <span className="text-muted">[TODO: add registered business address for official operations]</span>
              </div>
              <div>
                <span className="font-semibold text-fg block">Expected Response Window</span>
                <span>Within 24&ndash;48 business hours for verified corrigendum requests.</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-urgent-line bg-urgent-bg p-5 text-xs text-urgent">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-urgent mt-0.5" />
              <p>
                <strong>Notice:</strong> We cannot assist with candidate application statuses, admit card generation, or exam hall tickets. Please contact the respective commission&apos;s helpline.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2">
          <div className="rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-8">
            {status === "success" ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success-bg text-success border border-success-line">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-fg">
                  Report Received
                </h3>
                <p className="mt-2 text-xs text-muted max-w-md mx-auto leading-relaxed">
                  Thank you for contributing to public information accuracy. Our editorial verification desk will review the provided details against the authoritative gazette and update the opportunity record.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setStatus("idle");
                      setFormData({
                        name: "",
                        email: "",
                        subject: "editorial-correction",
                        opportunityName: "",
                        message: "",
                        website_hp: "",
                      });
                      setFormRenderedAt(Date.now());
                    }}
                    className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-muted hover:bg-surface-muted"
                  >
                    Submit Another Report
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="rounded-xl border border-danger-line bg-danger-bg p-3 text-xs text-danger">
                    {errorMessage}
                  </div>
                )}

                {/* Honeypot Field (CSS & Screenreader hidden to capture bot spam) */}
                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="website_hp">Leave this empty</label>
                  <input
                    type="text"
                    id="website_hp"
                    name="website_hp"
                    tabIndex={-1}
                    autoComplete="off"
                    value={formData.website_hp}
                    onChange={(e) => setFormData({ ...formData, website_hp: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block text-xs font-semibold text-fg">
                      Your Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ramesh Kumar"
                      className="mt-1.5 w-full rounded-xl border border-line bg-surface-muted px-3.5 py-2 text-xs text-fg focus:border-success-line focus:bg-surface"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-fg">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. ramesh@example.com"
                      className="mt-1.5 w-full rounded-xl border border-line bg-surface-muted px-3.5 py-2 text-xs text-fg focus:border-success-line focus:bg-surface"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-xs font-semibold text-fg">
                    Topic of Report
                  </label>
                  <select
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-line bg-surface-muted px-3.5 py-2 text-xs text-fg focus:border-success-line focus:bg-surface"
                  >
                    <option value="editorial-correction">Date or Eligibility Corrigendum</option>
                    <option value="new-opportunity">Suggest an Unlisted Exam or Scheme</option>
                    <option value="broken-link">Report Broken Official Portal Link</option>
                    <option value="general-inquiry">General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="opportunityName" className="block text-xs font-semibold text-fg">
                    Opportunity / Exam Name (Optional)
                  </label>
                  <input
                    type="text"
                    id="opportunityName"
                    value={formData.opportunityName}
                    onChange={(e) => setFormData({ ...formData, opportunityName: e.target.value })}
                    placeholder="e.g. UPSC CSE 2026 or PM-Kisan Samman Nidhi"
                    className="mt-1.5 w-full rounded-xl border border-line bg-surface-muted px-3.5 py-2 text-xs text-fg focus:border-success-line focus:bg-surface"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-semibold text-fg">
                    Detailed Message &amp; Gazette Reference <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Provide specific details, notification numbers, or link to the official corrigendum..."
                    className="mt-1.5 w-full rounded-xl border border-line bg-surface-muted px-3.5 py-2 text-xs text-fg focus:border-success-line focus:bg-surface"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-semibold text-white shadow-card transition-colors hover:bg-primary-hover disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {status === "submitting" ? "Submitting Report..." : "Submit to Editorial Desk"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
