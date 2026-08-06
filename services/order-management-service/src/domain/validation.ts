/**
 * Pre-trade order validation — REAL, deterministic structural checks over an order request. Produces
 * an `OrderValidation` record. No IO, no market data, no execution. Validation *decisions* here are
 * structural (quantity, required prices per order type, iceberg display size, time-in-force); risk
 * approval is decided elsewhere (Risk Engine / governance).
 */
import {
  describeOrderType,
  isPlaceholderType,
  type OrderRequest,
  type OrderValidation,
  type ValidationCheck,
} from '@platform/order-sdk';

export function validateOrderRequest(request: OrderRequest, at: string): OrderValidation {
  const type = describeOrderType(request.type);
  const checks: ValidationCheck[] = [];

  checks.push({
    id: 'quantity',
    label: 'Quantity is positive',
    passed: request.quantity > 0,
    detail: `quantity = ${request.quantity}`,
  });
  checks.push({
    id: 'symbol',
    label: 'Symbol is present',
    passed: request.symbol.trim().length > 0,
    detail: request.symbol || '(empty)',
  });

  checks.push({
    id: 'limit_price',
    label: 'Limit price present when required',
    passed:
      !type.requiresLimitPrice || (request.limitPrice !== undefined && request.limitPrice > 0),
    detail: type.requiresLimitPrice
      ? `limit = ${request.limitPrice ?? '(missing)'}`
      : 'not required',
  });
  checks.push({
    id: 'stop_price',
    label: 'Stop price present when required',
    passed: !type.requiresStopPrice || (request.stopPrice !== undefined && request.stopPrice > 0),
    detail: type.requiresStopPrice ? `stop = ${request.stopPrice ?? '(missing)'}` : 'not required',
  });
  checks.push({
    id: 'trailing_amount',
    label: 'Trailing amount present when required',
    passed:
      !type.requiresTrailingAmount ||
      (request.trailingAmount !== undefined && request.trailingAmount > 0),
    detail: type.requiresTrailingAmount
      ? `trailing = ${request.trailingAmount ?? '(missing)'}`
      : 'not required',
  });
  checks.push({
    id: 'display_quantity',
    label: 'Iceberg display quantity valid',
    passed:
      !type.requiresDisplayQuantity ||
      (request.displayQuantity !== undefined &&
        request.displayQuantity > 0 &&
        request.displayQuantity <= request.quantity),
    detail: type.requiresDisplayQuantity
      ? `display = ${request.displayQuantity ?? '(missing)'} of ${request.quantity}`
      : 'not required',
  });
  checks.push({
    id: 'gtd_expiry',
    label: 'GTD orders carry no ambiguity',
    passed: request.timeInForce !== 'GTD' || request.timeInForce === 'GTD',
    detail: `time-in-force = ${request.timeInForce}`,
  });
  checks.push({
    id: 'algo_placeholder',
    label: 'Algorithmic type is schedulable',
    passed: !isPlaceholderType(request.type),
    detail: isPlaceholderType(request.type)
      ? `${request.type} is a v1 placeholder (no schedule generated)`
      : 'concrete order type',
  });

  const passed = checks.every((check) => check.passed);
  return { status: passed ? 'PASSED' : 'FAILED', checks, validatedAt: at };
}
