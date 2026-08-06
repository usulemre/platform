import { create } from 'zustand';

/**
 * Command Palette abstraction. Feature modules register `Command`s at runtime;
 * the palette renders whatever is registered. A command navigates (`href`) or
 * runs a callback (`run`) — it never makes governed decisions itself.
 */
export interface Command {
  readonly id: string;
  readonly label: string;
  readonly group?: string;
  readonly href?: string;
  readonly run?: () => void;
  readonly keywords?: readonly string[];
}

interface CommandState {
  readonly isOpen: boolean;
  readonly commands: readonly Command[];
  readonly open: () => void;
  readonly close: () => void;
  readonly toggle: () => void;
  readonly register: (commands: readonly Command[]) => void;
  readonly unregister: (ids: readonly string[]) => void;
}

export const useCommandStore = create<CommandState>((set) => ({
  isOpen: false,
  commands: [],
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  register: (incoming) =>
    set((state) => ({
      commands: [
        ...state.commands.filter((existing) => !incoming.some((next) => next.id === existing.id)),
        ...incoming,
      ],
    })),
  unregister: (ids) =>
    set((state) => ({ commands: state.commands.filter((command) => !ids.includes(command.id)) })),
}));
