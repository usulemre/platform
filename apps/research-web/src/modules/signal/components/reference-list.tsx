import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import type { ReferenceVm } from '../domain/view-model';

/**
 * Shared reference list used by Feature Dependencies, Strategy References and
 * Traceability (experiments). References with an `href` link out; those without
 * (e.g. Strategy refs, whose module does not exist yet) render as plain text.
 */
export function ReferenceList({
  title,
  references,
  emptyLabel,
}: {
  title: string;
  references: readonly ReferenceVm[];
  emptyLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {references.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {references.map((reference) => (
              <li
                key={reference.id}
                className="flex items-center justify-between gap-4 border-b py-1"
              >
                {reference.href ? (
                  <Link href={reference.href} className="font-medium hover:underline">
                    {reference.name}
                  </Link>
                ) : (
                  <span className="font-medium">{reference.name}</span>
                )}
                {reference.version ? (
                  <span className="text-xs text-muted-foreground">v{reference.version}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
