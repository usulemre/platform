/**
 * Pure symbol-resolution primitives backing the Symbol Resolution capability.
 * Deterministic, no IO — the canonical symbol format is `EXCHANGE:BASE-QUOTE`
 * (or `EXCHANGE:SYMBOL` when there is no pair). Resolution matches native symbols
 * and aliases case-insensitively.
 */
import type { SymbolRecord } from './contracts';

export interface CanonicalSymbolParts {
  readonly exchangeCode: string;
  readonly base?: string;
  readonly quote?: string;
  readonly symbol?: string;
}

export function canonicalSymbol(parts: CanonicalSymbolParts): string {
  const exchange = parts.exchangeCode.toUpperCase();
  if (parts.base && parts.quote) {
    return `${exchange}:${parts.base.toUpperCase()}-${parts.quote.toUpperCase()}`;
  }
  return `${exchange}:${(parts.symbol ?? parts.base ?? '').toUpperCase()}`;
}

/** Resolve a query (canonical, native or alias) to a single symbol record. */
export function resolveSymbol(
  query: string,
  symbols: readonly SymbolRecord[],
): SymbolRecord | null {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;
  return (
    symbols.find((symbol) => {
      if (symbol.canonical.toLowerCase() === needle) return true;
      if (symbol.native.toLowerCase() === needle) return true;
      return symbol.aliases.some((alias) => alias.toLowerCase() === needle);
    }) ?? null
  );
}
