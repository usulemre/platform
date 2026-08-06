'use client';

import { useEffect } from 'react';
import { useCommandStore, type Command } from './command-store';

/** Register commands for the lifetime of the calling component. Pass a stable
 *  (memoized) array to avoid re-registration churn. */
export function useRegisterCommands(commands: readonly Command[]): void {
  const register = useCommandStore((state) => state.register);
  const unregister = useCommandStore((state) => state.unregister);

  useEffect(() => {
    register(commands);
    return () => unregister(commands.map((command) => command.id));
  }, [commands, register, unregister]);
}
