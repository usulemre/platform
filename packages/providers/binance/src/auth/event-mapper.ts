/**
 * `AuthenticationEventMapper` — translates validated raw user-data payloads into the canonical account
 * events. It is the ONLY component that reads Binance user-data field names; downstream consumers see
 * canonical events exclusively. It is market-aware (Spot `outboundAccountPosition`/`balanceUpdate`/
 * `executionReport` vs Futures `ACCOUNT_UPDATE`/`ORDER_TRADE_UPDATE`) and canonicalizes symbols through
 * an injected {@link SymbolResolver} (reused from the market-data module). Pure and deterministic.
 */
import { num, toCanonicalSide, toCanonicalStatus, toCanonicalType } from '../mappers/parse';
import { IDENTITY_SYMBOL_RESOLVER, type SymbolResolver } from '../websocket/event-mapper';
import type { BinanceMarket } from '../constants';
import type {
  BinanceBalanceUpdate,
  BinanceSpotExecutionReport,
  BinanceFuturesAccountUpdate,
  BinanceFuturesOrderTradeUpdate,
  BinanceListenKeyExpired,
  BinanceOutboundAccountPosition,
} from './binance-user-events';
import type {
  AccountBalance,
  AccountPosition,
  AccountUpdatedEvent,
  BalanceUpdatedEvent,
  ExecutionReportEvent,
  ExecutionType,
  ListenKeyExpiredEvent,
  OrderUpdatedEvent,
  PositionUpdatedEvent,
  TradeExecutionEvent,
} from './events';

const EXECUTION_TYPES: ReadonlySet<string> = new Set([
  'NEW',
  'CANCELED',
  'REPLACED',
  'REJECTED',
  'TRADE',
  'EXPIRED',
  'CALCULATED',
  'RESTATED',
  'AMENDMENT',
  'TRADE_PREVENTION',
]);

function executionType(value: string): ExecutionType {
  return EXECUTION_TYPES.has(value) ? (value as ExecutionType) : 'UNKNOWN';
}

/** An order update decomposed into its canonical projections. */
export interface OrderEventBundle {
  readonly order: OrderUpdatedEvent;
  readonly report: ExecutionReportEvent;
  /** Present only when the execution type is `TRADE` (a fill). */
  readonly trade?: TradeExecutionEvent;
}

export class AuthenticationEventMapper {
  constructor(
    private readonly market: BinanceMarket,
    private readonly resolver: SymbolResolver = IDENTITY_SYMBOL_RESOLVER,
  ) {}

  private symbol(venueSymbol: string): string {
    return this.resolver.toCanonical(venueSymbol);
  }

  /* ------------------------------ spot ------------------------------ */

  outboundAccountPosition(raw: BinanceOutboundAccountPosition): AccountUpdatedEvent {
    const balances: AccountBalance[] = raw.B.map((b) => ({
      asset: b.a,
      free: num(b.f),
      locked: num(b.l),
    }));
    return {
      kind: 'accountUpdated',
      market: this.market,
      balances,
      positions: [],
      eventTime: raw.E,
      lastUpdateTime: raw.u,
    };
  }

  balanceUpdate(raw: BinanceBalanceUpdate): BalanceUpdatedEvent {
    return {
      kind: 'balanceUpdated',
      asset: raw.a,
      delta: num(raw.d),
      clearTime: raw.T,
      eventTime: raw.E,
    };
  }

  executionReport(raw: BinanceSpotExecutionReport): OrderEventBundle {
    const symbol = this.symbol(raw.s);
    const exType = executionType(raw.x);
    const order: OrderUpdatedEvent = {
      kind: 'orderUpdated',
      market: this.market,
      venueOrderId: String(raw.i),
      clientOrderId: raw.c,
      symbol,
      venueSymbol: raw.s,
      side: toCanonicalSide(raw.S),
      type: toCanonicalType(raw.o),
      status: toCanonicalStatus(raw.X),
      price: num(raw.p),
      stopPrice: num(raw.P) || undefined,
      quantity: num(raw.q),
      filledQuantity: num(raw.z),
      cumulativeQuoteQuantity: num(raw.Z),
      eventTime: raw.E,
      orderTime: raw.O,
    };
    const report: ExecutionReportEvent = {
      kind: 'executionReport',
      market: this.market,
      venueOrderId: String(raw.i),
      clientOrderId: raw.c,
      symbol,
      venueSymbol: raw.s,
      side: order.side,
      type: order.type,
      status: order.status,
      executionType: exType,
      price: order.price,
      quantity: order.quantity,
      lastFilledQuantity: num(raw.l),
      cumulativeFilledQuantity: num(raw.z),
      lastFilledPrice: num(raw.L),
      commission: num(raw.n),
      commissionAsset: raw.N ?? undefined,
      tradeId: raw.t >= 0 ? raw.t : undefined,
      isMaker: raw.m,
      rejectReason: raw.r !== 'NONE' ? raw.r : undefined,
      eventTime: raw.E,
    };
    const trade =
      exType === 'TRADE' && raw.t >= 0 ? this.tradeFrom(report, raw.m, undefined) : undefined;
    return { order, report, trade };
  }

  /* ------------------------------ futures ------------------------------ */

  futuresAccountUpdate(raw: BinanceFuturesAccountUpdate): {
    account: AccountUpdatedEvent;
    positions: readonly PositionUpdatedEvent[];
  } {
    const balances: AccountBalance[] = raw.a.B.map((b) => ({
      asset: b.a,
      free: num(b.wb),
      locked: 0,
      walletBalance: num(b.wb),
      crossWalletBalance: num(b.cw),
      balanceChange: num(b.bc),
    }));
    const positions: AccountPosition[] = raw.a.P.map((p) => ({
      symbol: this.symbol(p.s),
      venueSymbol: p.s,
      positionAmount: num(p.pa),
      entryPrice: num(p.ep),
      unrealizedPnl: num(p.up),
      accumulatedRealized: num(p.cr),
      marginType: p.mt,
      isolatedWallet: num(p.iw),
      positionSide: p.ps,
    }));
    const account: AccountUpdatedEvent = {
      kind: 'accountUpdated',
      market: this.market,
      reason: raw.a.m,
      balances,
      positions,
      eventTime: raw.E,
      lastUpdateTime: raw.T,
    };
    const positionEvents: PositionUpdatedEvent[] = positions.map((p) => ({
      kind: 'positionUpdated',
      ...p,
      reason: raw.a.m,
      eventTime: raw.E,
    }));
    return { account, positions: positionEvents };
  }

  futuresOrderTradeUpdate(raw: BinanceFuturesOrderTradeUpdate): OrderEventBundle {
    const o = raw.o;
    const symbol = this.symbol(o.s);
    const exType = executionType(o.x);
    const order: OrderUpdatedEvent = {
      kind: 'orderUpdated',
      market: this.market,
      venueOrderId: String(o.i),
      clientOrderId: o.c,
      symbol,
      venueSymbol: o.s,
      side: toCanonicalSide(o.S),
      type: toCanonicalType(o.o),
      status: toCanonicalStatus(o.X),
      price: num(o.p),
      stopPrice: num(o.sp) || undefined,
      quantity: num(o.q),
      filledQuantity: num(o.z),
      averagePrice: num(o.ap) || undefined,
      reduceOnly: o.R,
      positionSide: o.ps,
      eventTime: raw.E,
      orderTime: raw.T,
    };
    const report: ExecutionReportEvent = {
      kind: 'executionReport',
      market: this.market,
      venueOrderId: String(o.i),
      clientOrderId: o.c,
      symbol,
      venueSymbol: o.s,
      side: order.side,
      type: order.type,
      status: order.status,
      executionType: exType,
      price: order.price,
      quantity: order.quantity,
      lastFilledQuantity: num(o.l),
      cumulativeFilledQuantity: num(o.z),
      lastFilledPrice: num(o.L),
      commission: num(o.n),
      commissionAsset: o.N || undefined,
      tradeId: o.t > 0 ? o.t : undefined,
      isMaker: o.m,
      eventTime: raw.E,
    };
    const trade =
      exType === 'TRADE' && o.t > 0 ? this.tradeFrom(report, o.m, num(o.rp)) : undefined;
    return { order, report, trade };
  }

  listenKeyExpired(raw: BinanceListenKeyExpired): ListenKeyExpiredEvent {
    return { kind: 'listenKeyExpired', listenKey: raw.listenKey, eventTime: raw.E };
  }

  private tradeFrom(
    report: ExecutionReportEvent,
    isMaker: boolean,
    realizedPnl: number | undefined,
  ): TradeExecutionEvent {
    return {
      kind: 'tradeExecution',
      market: report.market,
      venueOrderId: report.venueOrderId,
      clientOrderId: report.clientOrderId,
      symbol: report.symbol,
      venueSymbol: report.venueSymbol,
      tradeId: report.tradeId ?? 0,
      side: report.side,
      price: report.lastFilledPrice,
      quantity: report.lastFilledQuantity,
      commission: report.commission,
      commissionAsset: report.commissionAsset,
      isMaker,
      realizedPnl,
      eventTime: report.eventTime,
    };
  }
}
