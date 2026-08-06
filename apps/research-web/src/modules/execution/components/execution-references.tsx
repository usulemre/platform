import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import type { ReferenceVm } from '../domain/view-model';

/**
 * Portfolio / Strategy / Signal references (traceability). Each links to its
 * module (Portfolio Registry / Strategy Registry / Signal Registry).
 */
export function ExecutionReferences({ references }: { references: readonly ReferenceVm[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>References</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-sm">
          {references.map((reference) => (
            <li
              key={`${reference.kindLabel}-${reference.id}`}
              className="flex items-center justify-between gap-4 border-b py-1"
            >
              <span className="text-muted-foreground">{reference.kindLabel}</span>
              {reference.href ? (
                <Link href={reference.href} className="font-medium hover:underline">
                  {reference.name}
                </Link>
              ) : (
                <span className="font-medium">{reference.name}</span>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
