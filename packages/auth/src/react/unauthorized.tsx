/**
 * @platform/auth/react · unauthorized — a framework-independent 403 surface.
 * Uses a plain anchor (no Next dependency) so it is reusable in every app; apps
 * may wrap it with their own router link if desired.
 */
export interface UnauthorizedProps {
  title?: string;
  message?: string;
  homeHref?: string;
  homeLabel?: string;
}

export function Unauthorized({
  title = 'Access denied',
  message = 'You do not have permission to view this resource. If you believe this is an error, contact your administrator.',
  homeHref,
  homeLabel = 'Go back',
}: UnauthorizedProps) {
  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center"
    >
      <div className="text-4xl font-bold">403</div>
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {homeHref ? (
        <a
          href={homeHref}
          className="text-sm text-muted-foreground underline hover:text-foreground"
        >
          {homeLabel}
        </a>
      ) : null}
    </div>
  );
}
