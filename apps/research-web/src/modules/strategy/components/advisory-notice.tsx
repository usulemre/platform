import { ShieldAlert } from 'lucide-react';

/**
 * Advisory-only notice. Strategies remain advisory until explicitly approved for
 * portfolio construction (governed). This console never constructs portfolios or
 * executes; it presents governed state only.
 */
export function AdvisoryNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-2 rounded-md border border-muted-foreground/30 bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        Strategies are <span className="font-medium text-foreground">advisory</span> until
        explicitly approved for portfolio construction. Approval and construction are governed
        elsewhere; this console never constructs portfolios or executes.
      </p>
    </div>
  );
}
