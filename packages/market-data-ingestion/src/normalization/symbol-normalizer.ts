/**
 * The **symbol normalizer** — resolves a venue's own symbol string to a canonical instrument id via
 * the injected {@link InstrumentRegistry}. The ingestion layer owns no venue symbol convention; an
 * unknown symbol is rejected with `SYMBOL_UNKNOWN` (never guessed), and an inactive instrument is
 * surfaced so the caller can decide policy. Deterministic; the registry is the only dependency.
 */
import type { InstrumentDescriptor, InstrumentRegistry } from '../instruments/instrument-registry';
import { rejected, type Rejection } from '../validation/validation-result';

export type SymbolResolution =
  | { readonly resolved: true; readonly instrument: InstrumentDescriptor }
  | { readonly resolved: false; readonly rejection: Rejection };

export class SymbolNormalizer {
  constructor(private readonly registry: InstrumentRegistry) {}

  /** Resolve `providerSymbol` for `providerId` to a canonical instrument, or a rejection. */
  resolve(providerId: string, providerSymbol: string): SymbolResolution {
    const instrument = this.registry.resolve(providerId, providerSymbol);
    if (!instrument) {
      const outcome = rejected(
        'SYMBOL_UNKNOWN',
        `No canonical instrument registered for '${providerSymbol}' on provider '${providerId}'.`,
        { providerId, providerSymbol },
      );
      // `outcome` is always the invalid branch here.
      return {
        resolved: false,
        rejection: (outcome as { valid: false; rejection: Rejection }).rejection,
      };
    }
    return { resolved: true, instrument };
  }
}
