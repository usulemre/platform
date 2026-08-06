'use client';

import { Bell } from 'lucide-react';
import { Button, Badge } from '@platform/ui';

/** Placeholder notification center. Real notifications will arrive via governed
 *  domain events (observability spine) in a later phase. */
export function NotificationCenter() {
  return (
    <Button variant="ghost" size="sm" aria-label="Notifications" className="relative">
      <Bell className="h-4 w-4" />
      <Badge variant="secondary" className="absolute -right-1 -top-1 px-1 py-0 text-[10px]">
        0
      </Badge>
    </Button>
  );
}
