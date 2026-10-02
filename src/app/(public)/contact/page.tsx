"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, MessageSquare, Send, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "editorial-correction",
    opportunityName: "",
    message: "",
    website_hp: "", // Honeypot field
  });

  const [formRenderedAt, setFormRenderedAt] = useState<number>(0);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setFormRenderedAt(Date.now());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
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

    // Simulate submission (or send to server route)
    setTimeout(() => {
      setStatus("success");
    }, 800);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-8 dark:border-slate-800">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
          <MessageSquare className="h-4 w-4" />
          Editorial Transparency &amp; Corrections Desk
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Contact &amp; Public Grievance Desk
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Found an outdated exam date, an unlisted government scheme, or a broken official link? Submit a notification correction to our editorial team.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Contact Info Sidebar */}
        <div className="space-y-6 md:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Editorial Contacts
            </h2>
            <div className="mt-4 space-y-4 text-xs text-slate-600 dark:text-slate-400">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">Corrections &amp; Updates</span>
                <a href="mailto:editorial@governit.in" className="text-emerald-600 underline dark:text-emerald-400">
                  editorial@governit.in
                </a>
              </div>
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">Privacy &amp; Grievances</span>
                <a href="mailto:privacy@governit.in" className="text-emerald-600 underline dark:text-emerald-400">
                  privacy@governit.in
                </a>
              </div>
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">Official Entity Office</span>
                <span className="text-slate-500">[TODO: add registered business address for official operations]</span>
              </div>
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">Expected Response Window</span>
                <span>Within 24&ndash;48 business hours for verified corrigendum requests.</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <p>
                <strong>Notice:</strong> We cannot assist with candidate application statuses, admit card generation, or exam hall tickets. Please contact the respective commission&apos;s helpline.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8 dark:border-slate-800 dark:bg-slate-900">
            {status === "success" ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                  Report Received
                </h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
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
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Submit Another Report
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
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
                    <label htmlFor="name" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ramesh Kumar"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. ramesh@example.com"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Topic of Report
                  </label>
                  <select
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="editorial-correction">Date or Eligibility Corrigendum</option>
                    <option value="new-opportunity">Suggest an Unlisted Exam or Scheme</option>
                    <option value="broken-link">Report Broken Official Portal Link</option>
                    <option value="general-inquiry">General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="opportunityName" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Opportunity / Exam Name (Optional)
                  </label>
                  <input
                    type="text"
                    id="opportunityName"
                    value={formData.opportunityName}
                    onChange={(e) => setFormData({ ...formData, opportunityName: e.target.value })}
                    placeholder="e.g. UPSC CSE 2026 or PM-Kisan Samman Nidhi"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Detailed Message &amp; Gazette Reference <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Provide specific details, notification numbers, or link to the official corrigendum..."
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
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
