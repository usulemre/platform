import { ShieldAlert } from 'lucide-react';

/**
 * Advisory-only notice. Signals are advisory research outputs and MUST NOT
 * execute trades. Any execution eligibility is governed by Execution Governance
 * (token-gated, paper-first) — never actioned from this console.
 */
export function AdvisoryNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-2 rounded-md border border-muted-foreground/30 bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        Signals are <span className="font-medium text-foreground">advisory research outputs</span>.
        This console never executes trades; execution is token-gated by Execution Governance
        (paper-first).
      </p>
    </div>
  );
}
