'use client';

/**
 * Shared constraint state (Zustand) — the Constraint Editor writes it; the Allocation Explorer,
 * Efficient Frontier and Portfolio Comparison read it, so a constraint change flows through the
 * whole optimization surface. Client-only; holds a plain `ConstraintDto`.
 */
import { create } from 'zustand';
import { DEFAULT_CONSTRAINTS, type ConstraintDto } from '../data/runner';

interface ConstraintState {
  readonly constraints: ConstraintDto;
  readonly update: (patch: Partial<ConstraintDto>) => void;
  readonly reset: () => void;
}

export const useConstraintStore = create<ConstraintState>((set) => ({
  constraints: DEFAULT_CONSTRAINTS,
  update: (patch) => set((state) => ({ constraints: { ...state.constraints, ...patch } })),
  reset: () => set({ constraints: DEFAULT_CONSTRAINTS }),
}));
