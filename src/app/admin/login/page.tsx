"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKey) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() || undefined, secretKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("An unexpected network error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-line bg-surface p-8 shadow-card sm:p-10">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success-bg text-success shadow-card">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-fg">
            Editorial Admin Login
          </h2>
          <p className="mt-2 text-xs text-muted">
            Secure editorial verification and opportunity management console
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-danger-line bg-danger-bg p-3 text-xs text-danger">
            <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="admin-username" className="block text-sm font-semibold text-fg">
              Email or username
            </label>
            <input
              id="admin-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1.5 min-h-11 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-base text-fg"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-sm font-semibold text-fg">
              Password
            </label>
            <input
              id="admin-password"
              autoComplete="current-password"
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
                            required
              className="mt-1.5 w-full rounded-xl border border-line bg-surface-muted px-3.5 py-2.5 text-sm text-fg placeholder:text-muted focus:border-success-line focus:bg-surface"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !secretKey}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying Credentials...
              </>
            ) : (
              <>
                Authenticate <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 text-sm text-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          <span>Protected by cryptographically signed HMAC sessions</span>
        </div>
      </div>
    </div>
  );
}
