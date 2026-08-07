/**
 * `BinanceFuturesEventMapper` — translates the USDⓈ-M Futures user-data payloads into canonical Futures
 * events. It reuses the Authentication module's {@link AuthenticationEventMapper} for the shared events
 * (`ACCOUNT_UPDATE`, `ORDER_TRADE_UPDATE`, `listenKeyExpired`) and adds the Futures-only mappings for
 * `ACCOUNT_CONFIG_UPDATE` and `MARGIN_CALL`. It is the ONLY component that reads these venue field
 * names; downstream consumers see canonical events exclusively. Symbols are canonicalized via the
 * injected {@link SymbolResolver}. Pure and deterministic.
 */
import { num } from '../mappers/parse';
import { AuthenticationEventMapper } from '../auth/event-mapper';
import { IDENTITY_SYMBOL_RESOLVER, type SymbolResolver } from '../websocket/event-mapper';
import { toCanonicalMarginType, toCanonicalPositionSide } from './constants';
import type { BinanceFuturesAccountConfigUpdate, BinanceFuturesMarginCall } from './binance-events';
import type { FuturesConfigUpdatedEvent, FuturesMarginCallEvent } from './events';

export class BinanceFuturesEventMapper {
  /** The reused authentication mapper for the shared account/order events (always Futures market). */
  readonly base: AuthenticationEventMapper;
  private readonly resolver: SymbolResolver;

  constructor(resolver: SymbolResolver = IDENTITY_SYMBOL_RESOLVER) {
    this.resolver = resolver;
    this.base = new AuthenticationEventMapper('FUTURES', resolver);
  }

  /** `ACCOUNT_CONFIG_UPDATE` → a canonical leverage / multi-assets-mode configuration change. */
  accountConfigUpdate(raw: BinanceFuturesAccountConfigUpdate): FuturesConfigUpdatedEvent {
    const event: FuturesConfigUpdatedEvent = {
      kind: 'futuresConfigUpdated',
      eventTime: raw.E,
      transactionTime: raw.T,
    };
    if (raw.ac) {
      return {
        ...event,
        symbol: this.resolver.toCanonical(raw.ac.s),
        venueSymbol: raw.ac.s,
        leverage: raw.ac.l,
      };
    }
    if (raw.ai) return { ...event, multiAssetsMode: raw.ai.j };
    return event;
  }

  /** `MARGIN_CALL` → a canonical margin-call warning. */
  marginCall(raw: BinanceFuturesMarginCall): FuturesMarginCallEvent {
    return {
      kind: 'futuresMarginCall',
      crossWalletBalance: raw.cw !== undefined ? num(raw.cw) : undefined,
      positions: raw.p.map((p) => ({
        symbol: this.resolver.toCanonical(p.s),
        venueSymbol: p.s,
        positionSide: toCanonicalPositionSide(p.ps),
        positionAmount: num(p.pa),
        marginType: toCanonicalMarginType(p.mt),
        isolatedWallet: p.iw !== undefined ? num(p.iw) : undefined,
        markPrice: num(p.mp),
        unrealizedPnl: num(p.up),
        maintenanceMargin: num(p.mm),
      })),
      eventTime: raw.E,
    };
  }
}
