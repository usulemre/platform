import { ChevronsUpDown } from 'lucide-react';
import { Button } from '@platform/ui';

export interface WorkspaceSwitcherProps {
  current?: string;
}

/** Placeholder workspace switcher. Multi-workspace support arrives later; for
 *  now it displays the active workspace and is inert. */
export function WorkspaceSwitcher({ current = 'Default' }: WorkspaceSwitcherProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled
      aria-label="Switch workspace"
      className="w-full justify-between gap-2"
    >
      <span className="truncate">{current}</span>
      <ChevronsUpDown className="h-4 w-4" />
    </Button>
  );
}
