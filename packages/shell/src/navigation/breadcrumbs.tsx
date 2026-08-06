'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbsProps {
  /** Optional overrides mapping a path segment to a display label. */
  labels?: Record<string, string>;
}

function humanize(segment: string): string {
  return segment.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

/** Derives a breadcrumb trail from the current pathname. */
export function Breadcrumbs({ labels = {} }: BreadcrumbsProps) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => ({
    href: `/${segments.slice(0, index + 1).join('/')}`,
    label: labels[segment] ?? humanize(segment),
  }));

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <Fragment key={crumb.href}>
            {index > 0 ? <ChevronRight className="h-3.5 w-3.5" aria-hidden /> : null}
            {isLast ? (
              <span className="text-foreground">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground">
                {crumb.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
