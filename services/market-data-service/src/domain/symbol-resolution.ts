/**
 * Symbol resolution domain service — a thin, pure wrapper over the SDK's
 * canonical resolution primitives. No IO. Backs the Symbol Resolution capability.
 */
import { resolveSymbol, type SymbolRecord } from '@platform/market-data-sdk';

export function resolve(query: string, symbols: readonly SymbolRecord[]): SymbolRecord | null {
  return resolveSymbol(query, symbols);
}

/** True when a query resolves to exactly one canonical symbol. */
export function isResolvable(query: string, symbols: readonly SymbolRecord[]): boolean {
  return resolve(query, symbols) !== null;
}
