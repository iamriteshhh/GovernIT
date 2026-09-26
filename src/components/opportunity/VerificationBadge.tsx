import { ShieldCheck } from "lucide-react";
import { formatDateIST } from "@/lib/dates";

interface VerificationBadgeProps {
  lastVerifiedAt: Date | string | null | undefined;
}

export function VerificationBadge({ lastVerifiedAt }: VerificationBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      <span>
        Verified on <strong className="font-medium text-slate-700 dark:text-slate-300">{formatDateIST(lastVerifiedAt)}</strong>
      </span>
    </div>
  );
}
