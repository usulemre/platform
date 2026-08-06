/**
 * @platform/utils — pure, deterministic, framework-agnostic helpers.
 * No side effects, no ambient time/RNG access (CLAUDE.md CS-3: non-determinism
 * is injected, never read ambiently). No business logic.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional Tailwind class lists, de-duplicating conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Serialize an explicitly-provided instant to ISO-8601 (clock is injected). */
export function toIso8601(instant: Date): string {
  return instant.toISOString();
}

/** Type guard: value is neither null nor undefined. */
export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
