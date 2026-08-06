import { ShieldAlert } from 'lucide-react';

/**
 * Advisory-only notice. Portfolios represent research outputs and PROPOSED
 * allocations; they do NOT authorize live trading or execution. Any live
 * deployment is token-gated by Execution Governance (paper-first).
 */
export function AdvisoryNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-2 rounded-md border border-muted-foreground/30 bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        Portfolios are{' '}
        <span className="font-medium text-foreground">
          research outputs and proposed allocations
        </span>
        . This console never authorizes live trading or execution; live deployment is token-gated by
        Execution Governance (paper-first).
      </p>
    </div>
  );
}
