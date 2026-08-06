import { ShieldAlert } from 'lucide-react';

/**
 * Advisory-only notice. This console ORCHESTRATES governed execution workflows;
 * it does NOT connect to brokers or exchanges and never routes orders. Execution
 * is paper-first and token-gated by Execution Governance.
 */
export function AdvisoryNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-2 rounded-md border border-muted-foreground/30 bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        This console{' '}
        <span className="font-medium text-foreground">
          orchestrates governed execution workflows
        </span>
        . It never connects to brokers or exchanges and never routes orders; execution is
        paper-first and token-gated by Execution Governance.
      </p>
    </div>
  );
}
