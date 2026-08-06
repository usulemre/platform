'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@platform/ui';
import { useCommandStore, type Command } from './command-store';

/** Cmd/Ctrl+K command palette. Presentation over the command registry; it
 *  performs navigation or invokes a registered callback, nothing more. */
export function CommandPalette() {
  const router = useRouter();
  const isOpen = useCommandStore((state) => state.isOpen);
  const close = useCommandStore((state) => state.close);
  const toggle = useCommandStore((state) => state.toggle);
  const commands = useCommandStore((state) => state.commands);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        toggle();
      } else if (event.key === 'Escape') {
        close();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle, close]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter(
      (command) =>
        command.label.toLowerCase().includes(needle) ||
        (command.keywords ?? []).some((keyword) => keyword.toLowerCase().includes(needle)),
    );
  }, [query, commands]);

  if (!isOpen) return null;

  const runCommand = (command: Command) => {
    close();
    setQuery('');
    if (command.href) {
      router.push(command.href);
    } else {
      command.run?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh]"
      role="dialog"
      aria-modal
      aria-label="Command palette"
    >
      <div className="absolute inset-0 bg-black/50" onClick={close} aria-hidden />
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg border bg-background shadow-lg">
        <Input
          autoFocus
          placeholder="Type a command or search…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="border-0 focus-visible:ring-0"
        />
        <ul className="max-h-80 overflow-y-auto border-t">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No results</li>
          ) : (
            filtered.map((command) => (
              <li key={command.id}>
                <button
                  type="button"
                  onClick={() => runCommand(command)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <span>{command.label}</span>
                  {command.group ? (
                    <span className="text-xs text-muted-foreground">{command.group}</span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
