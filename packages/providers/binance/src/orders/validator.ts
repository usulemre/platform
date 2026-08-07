/**
 * `BinanceOrderValidator` — deterministic pre-flight validation of a canonical order request against
 * the market's {@link BinanceOrderCapabilities} and, when available, the instrument's trading rules
 * from the Exchange Metadata & Symbol Registry (tick size, lot size, min notional). It fails closed
 * with a {@link BinanceOrderValidationError} listing every issue, so an invalid or unsupported request
 * never reaches the venue. It also validates the raw order response shape. Pure; no IO.
 */
import { BinanceOrderUnsupportedError, BinanceOrderValidationError } from './errors';
import type { BinanceOrderCapabilities } from './capabilities';
import type { BinanceOrder } from '../types/binance';
import type { ExchangeSymbol } from '../metadata/types';
import type { CanonicalOrderRequest, CanonicalOrderType } from './canonical';

/** Order types that require a limit price. */
const PRICED_TYPES: ReadonlySet<CanonicalOrderType> = new Set(['LIMIT', 'STOP_LIMIT']);
/** Order types that require a stop/trigger price. */
const STOP_TYPES: ReadonlySet<CanonicalOrderType> = new Set(['STOP', 'STOP_LIMIT', 'TAKE_PROFIT']);

function almostMultiple(value: number, step: number): boolean {
  if (step <= 0) return true;
  const ratio = value / step;
  return Math.abs(ratio - Math.round(ratio)) < 1e-8;
}

export class BinanceOrderValidator {
  constructor(private readonly capabilities: BinanceOrderCapabilities) {}

  /** Validate a create/replace request; throws with all issues on failure. */
  validateRequest(request: CanonicalOrderRequest, symbol?: ExchangeSymbol): void {
    const issues: string[] = [];

    if (!request.symbol) issues.push('symbol is required.');
    if (!this.capabilities.supportsOrderType(request.type))
      throw new BinanceOrderUnsupportedError(
        `order type ${request.type}`,
        this.capabilities.market,
      );

    const usesQuote = request.quoteQuantity !== undefined && request.type === 'MARKET';
    if (usesQuote && !this.capabilities.supportsQuoteQuantity)
      throw new BinanceOrderUnsupportedError('quoteQuantity', this.capabilities.market);
    if (!usesQuote && !(request.quantity > 0)) issues.push('quantity must be positive.');
    if (usesQuote && !(request.quoteQuantity! > 0)) issues.push('quoteQuantity must be positive.');

    if (PRICED_TYPES.has(request.type) && !(request.price !== undefined && request.price > 0))
      issues.push(`order type ${request.type} requires a positive price.`);
    if (STOP_TYPES.has(request.type) && !(request.stopPrice !== undefined && request.stopPrice > 0))
      issues.push(`order type ${request.type} requires a positive stopPrice.`);

    if (request.timeInForce && !this.capabilities.supportsTimeInForce(request.timeInForce))
      issues.push(`time-in-force ${request.timeInForce} is not supported.`);
    if (request.reduceOnly && !this.capabilities.supportsReduceOnly)
      throw new BinanceOrderUnsupportedError('reduceOnly', this.capabilities.market);

    if (symbol) this.validateAgainstRules(request, symbol, issues, usesQuote);

    if (issues.length > 0) throw new BinanceOrderValidationError(issues);
  }

  private validateAgainstRules(
    request: CanonicalOrderRequest,
    symbol: ExchangeSymbol,
    issues: string[],
    usesQuote: boolean,
  ): void {
    const rule = symbol.tradingRule;
    if (!usesQuote) {
      if (rule.minQuantity !== undefined && request.quantity < rule.minQuantity)
        issues.push(`quantity ${request.quantity} is below minQty ${rule.minQuantity}.`);
      if (rule.maxQuantity !== undefined && request.quantity > rule.maxQuantity)
        issues.push(`quantity ${request.quantity} exceeds maxQty ${rule.maxQuantity}.`);
      if (rule.stepSize !== undefined && !almostMultiple(request.quantity, rule.stepSize))
        issues.push(`quantity ${request.quantity} is not a multiple of stepSize ${rule.stepSize}.`);
    }
    if (request.price !== undefined) {
      if (rule.minPrice !== undefined && rule.minPrice > 0 && request.price < rule.minPrice)
        issues.push(`price ${request.price} is below minPrice ${rule.minPrice}.`);
      if (rule.maxPrice !== undefined && rule.maxPrice > 0 && request.price > rule.maxPrice)
        issues.push(`price ${request.price} exceeds maxPrice ${rule.maxPrice}.`);
      if (rule.tickSize !== undefined && !almostMultiple(request.price, rule.tickSize))
        issues.push(`price ${request.price} is not a multiple of tickSize ${rule.tickSize}.`);
      if (
        rule.minNotional !== undefined &&
        !usesQuote &&
        request.price * request.quantity < rule.minNotional
      )
        issues.push(`notional is below minNotional ${rule.minNotional}.`);
    }
  }

  /** Validate the raw order response shape; throws when a required field is missing. */
  validateResponse(order: unknown): BinanceOrder {
    if (typeof order !== 'object' || order === null)
      throw new BinanceOrderValidationError(['order response is not an object.']);
    const o = order as Record<string, unknown>;
    const issues: string[] = [];
    if (typeof o['orderId'] !== 'number') issues.push('response is missing orderId.');
    if (typeof o['symbol'] !== 'string') issues.push('response is missing symbol.');
    if (typeof o['status'] !== 'string') issues.push('response is missing status.');
    if (issues.length > 0) throw new BinanceOrderValidationError(issues);
    return order as BinanceOrder;
  }
}
