/**
 * `BinanceFuturesValidator` — deterministic pre-flight validation of canonical USDⓈ-M Futures requests
 * against the {@link BinanceFuturesCapabilityRegistry}, the account's position mode, and (when
 * available) the instrument's trading rules from the Exchange Metadata & Symbol Registry. It encodes
 * the Futures-specific rules that have no Spot equivalent: `closePosition` excludes `quantity` and
 * `reduceOnly`; hedge mode requires an explicit LONG/SHORT `positionSide` and forbids `reduceOnly`;
 * one-way mode requires `BOTH`; trailing-stop orders need a callback rate; leverage must be a positive
 * integer. It fails closed with a {@link BinanceFuturesValidationError} listing every issue, so an
 * invalid or unsupported request never reaches the venue. It also validates the raw order response
 * shape. Pure; no IO.
 */
import {
  BinanceFuturesConfigError,
  BinanceFuturesUnsupportedError,
  BinanceFuturesValidationError,
} from './errors';
import type { BinanceFuturesCapabilityRegistry } from './capability-registry';
import type { BinanceOrder } from '../types/binance';
import type { ExchangeSymbol } from '../metadata/types';
import type { FuturesMarginDirection, FuturesOrderRequest, FuturesPositionMode } from './types';

/** Order types that require a limit price. */
const PRICED_TYPES = new Set(['LIMIT', 'STOP_LIMIT']);
/** Order types that require a stop/trigger price. */
const STOP_TYPES = new Set(['STOP', 'STOP_LIMIT', 'TAKE_PROFIT']);
const MAX_LEVERAGE = 125;

function almostMultiple(value: number, step: number): boolean {
  if (step <= 0) return true;
  const ratio = value / step;
  return Math.abs(ratio - Math.round(ratio)) < 1e-8;
}

export class BinanceFuturesValidator {
  constructor(private readonly capabilities: BinanceFuturesCapabilityRegistry) {}

  /** Validate a create request against capabilities, position mode and (optional) trading rules. */
  validateOrder(
    request: FuturesOrderRequest,
    positionMode: FuturesPositionMode,
    symbol?: ExchangeSymbol,
  ): void {
    const issues: string[] = [];

    if (!request.symbol) issues.push('symbol is required.');
    if (!this.capabilities.supportsOrderType(request.type))
      throw new BinanceFuturesUnsupportedError(`order type ${request.type}`);

    // Quantity vs closePosition.
    if (request.closePosition) {
      if (request.quantity > 0) issues.push('closePosition orders must not carry a quantity.');
      if (request.reduceOnly) issues.push('closePosition and reduceOnly are mutually exclusive.');
    } else if (!(request.quantity > 0)) {
      issues.push('quantity must be positive.');
    }

    // Position mode ↔ positionSide.
    if (positionMode === 'HEDGE') {
      if (!request.positionSide || request.positionSide === 'BOTH')
        issues.push('hedge mode requires an explicit LONG or SHORT positionSide.');
      if (request.reduceOnly)
        issues.push('reduceOnly is not accepted in hedge mode (use the opposing positionSide).');
    } else if (request.positionSide && request.positionSide !== 'BOTH') {
      issues.push('one-way mode requires positionSide BOTH (or omit it).');
    }

    if (PRICED_TYPES.has(request.type) && !(request.price !== undefined && request.price > 0))
      issues.push(`order type ${request.type} requires a positive price.`);
    if (STOP_TYPES.has(request.type) && !(request.stopPrice !== undefined && request.stopPrice > 0))
      issues.push(`order type ${request.type} requires a positive stopPrice.`);
    if (request.type === 'TRAILING_STOP' && !(request.callbackRate !== undefined))
      issues.push('TRAILING_STOP orders require a callbackRate.');

    if (request.timeInForce && !this.capabilities.supportsTimeInForce(request.timeInForce))
      issues.push(`time-in-force ${request.timeInForce} is not supported.`);

    if (symbol && !request.closePosition) this.validateAgainstRules(request, symbol, issues);

    if (issues.length > 0) throw new BinanceFuturesValidationError(issues);
  }

  private validateAgainstRules(
    request: FuturesOrderRequest,
    symbol: ExchangeSymbol,
    issues: string[],
  ): void {
    const rule = symbol.tradingRule;
    if (rule.minQuantity !== undefined && request.quantity < rule.minQuantity)
      issues.push(`quantity ${request.quantity} is below minQty ${rule.minQuantity}.`);
    if (rule.maxQuantity !== undefined && request.quantity > rule.maxQuantity)
      issues.push(`quantity ${request.quantity} exceeds maxQty ${rule.maxQuantity}.`);
    if (rule.stepSize !== undefined && !almostMultiple(request.quantity, rule.stepSize))
      issues.push(`quantity ${request.quantity} is not a multiple of stepSize ${rule.stepSize}.`);
    if (request.price !== undefined) {
      if (rule.tickSize !== undefined && !almostMultiple(request.price, rule.tickSize))
        issues.push(`price ${request.price} is not a multiple of tickSize ${rule.tickSize}.`);
      if (rule.minNotional !== undefined && request.price * request.quantity < rule.minNotional)
        issues.push(`notional is below minNotional ${rule.minNotional}.`);
    }
  }

  /** Validate a leverage value (positive integer within the documented ceiling). */
  validateLeverage(leverage: number): void {
    if (!Number.isInteger(leverage) || leverage < 1 || leverage > MAX_LEVERAGE)
      throw new BinanceFuturesConfigError(
        `leverage must be an integer in [1, ${MAX_LEVERAGE}], got ${leverage}.`,
      );
  }

  /** Validate an isolated position-margin adjustment. */
  validatePositionMargin(amount: number, direction: FuturesMarginDirection): void {
    if (!(amount > 0))
      throw new BinanceFuturesConfigError('position-margin amount must be positive.');
    if (direction !== 'ADD' && direction !== 'REDUCE')
      throw new BinanceFuturesConfigError(`unknown margin direction "${String(direction)}".`);
  }

  /** Validate the raw order response shape; throws when a required field is missing. */
  validateResponse(order: unknown): BinanceOrder {
    if (typeof order !== 'object' || order === null)
      throw new BinanceFuturesValidationError(['order response is not an object.']);
    const o = order as Record<string, unknown>;
    const issues: string[] = [];
    if (typeof o['orderId'] !== 'number') issues.push('response is missing orderId.');
    if (typeof o['symbol'] !== 'string') issues.push('response is missing symbol.');
    if (typeof o['status'] !== 'string') issues.push('response is missing status.');
    if (issues.length > 0) throw new BinanceFuturesValidationError(issues);
    return order as BinanceOrder;
  }
}
