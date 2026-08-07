/**
 * `BinanceFuturesMetadataMapper` — raw USDⓈ-M Futures market-metadata payloads → their canonical
 * models: `premiumIndex` → {@link FuturesMarkPrice}, `fundingRate` → {@link FuturesFundingRate}, and
 * `leverageBracket` → {@link FuturesLeverageBracket}. These endpoints report the derivatives-specific
 * reference data (mark/index price, funding, notional/leverage brackets) that has no Spot equivalent.
 * Symbols are canonicalized via the injected resolver. Pure and deterministic.
 */
import { num } from '../mappers/parse';
import { IDENTITY_SYMBOL_RESOLVER, type SymbolResolver } from '../websocket/event-mapper';
import type {
  BinanceFundingRate,
  BinanceLeverageBracket,
  BinancePremiumIndex,
} from '../types/binance';
import type { FuturesFundingRate, FuturesLeverageBracket, FuturesMarkPrice } from './types';

export class BinanceFuturesMetadataMapper {
  constructor(private readonly resolver: SymbolResolver = IDENTITY_SYMBOL_RESOLVER) {}

  private symbol(venueSymbol: string): string {
    return this.resolver.toCanonical(venueSymbol);
  }

  /** `GET /fapi/v1/premiumIndex` → canonical mark price. */
  markPrice(raw: BinancePremiumIndex): FuturesMarkPrice {
    return {
      symbol: this.symbol(raw.symbol),
      venueSymbol: raw.symbol,
      markPrice: num(raw.markPrice),
      indexPrice: raw.indexPrice !== undefined ? num(raw.indexPrice) : undefined,
      estimatedSettlePrice:
        raw.estimatedSettlePrice !== undefined ? num(raw.estimatedSettlePrice) : undefined,
      lastFundingRate: raw.lastFundingRate !== undefined ? num(raw.lastFundingRate) : undefined,
      interestRate: raw.interestRate !== undefined ? num(raw.interestRate) : undefined,
      nextFundingTime: raw.nextFundingTime,
      time: raw.time,
    };
  }

  /** `GET /fapi/v1/fundingRate` row → canonical funding rate. */
  fundingRate(raw: BinanceFundingRate): FuturesFundingRate {
    return {
      symbol: this.symbol(raw.symbol),
      venueSymbol: raw.symbol,
      fundingRate: num(raw.fundingRate),
      fundingTime: raw.fundingTime,
      markPrice: raw.markPrice !== undefined ? num(raw.markPrice) : undefined,
    };
  }

  /** `GET /fapi/v1/leverageBracket` entry → canonical leverage bracket. */
  leverageBracket(raw: BinanceLeverageBracket): FuturesLeverageBracket {
    return {
      symbol: this.symbol(raw.symbol),
      venueSymbol: raw.symbol,
      brackets: raw.brackets.map((b) => ({
        bracket: b.bracket,
        initialLeverage: b.initialLeverage,
        notionalCap: b.notionalCap,
        notionalFloor: b.notionalFloor,
        maintMarginRatio: b.maintMarginRatio,
        cum: b.cum,
      })),
    };
  }
}
