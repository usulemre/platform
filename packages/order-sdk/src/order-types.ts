/**
 * Order type, side and time-in-force vocabulary. Descriptors declare each type's required parameters
 * (limit price, stop price, trailing amount, display quantity) and whether a type is a v1
 * placeholder (TWAP/VWAP algorithmic types are declared but produce no scheduling here). Pure
 * vocabulary — NO execution, NO broker/exchange/FIX.
 */

/** Supported order types (TWAP/VWAP are declared placeholders in v1). */
export type OrderType =
  | 'MARKET'
  | 'LIMIT'
  | 'STOP'
  | 'STOP_LIMIT'
  | 'TRAILING_STOP'
  | 'ICEBERG'
  | 'TWAP'
  | 'VWAP';

export type OrderSide = 'BUY' | 'SELL';

/** Time in force. */
export type TimeInForce = 'DAY' | 'GTC' | 'IOC' | 'FOK' | 'GTD';

export interface OrderTypeDescriptor {
  readonly type: OrderType;
  readonly label: string;
  readonly description: string;
  readonly requiresLimitPrice: boolean;
  readonly requiresStopPrice: boolean;
  readonly requiresTrailingAmount: boolean;
  readonly requiresDisplayQuantity: boolean;
  /** A v1 placeholder algorithmic type — declared but not scheduled here. */
  readonly placeholder: boolean;
}

export const ORDER_TYPES: readonly OrderType[] = [
  'MARKET',
  'LIMIT',
  'STOP',
  'STOP_LIMIT',
  'TRAILING_STOP',
  'ICEBERG',
  'TWAP',
  'VWAP',
];

const TYPE_DESCRIPTORS: Record<OrderType, OrderTypeDescriptor> = {
  MARKET: {
    type: 'MARKET',
    label: 'Market',
    description: 'Execute immediately at the prevailing price.',
    requiresLimitPrice: false,
    requiresStopPrice: false,
    requiresTrailingAmount: false,
    requiresDisplayQuantity: false,
    placeholder: false,
  },
  LIMIT: {
    type: 'LIMIT',
    label: 'Limit',
    description: 'Execute at a limit price or better.',
    requiresLimitPrice: true,
    requiresStopPrice: false,
    requiresTrailingAmount: false,
    requiresDisplayQuantity: false,
    placeholder: false,
  },
  STOP: {
    type: 'STOP',
    label: 'Stop',
    description: 'Become a market order once the stop price trades.',
    requiresLimitPrice: false,
    requiresStopPrice: true,
    requiresTrailingAmount: false,
    requiresDisplayQuantity: false,
    placeholder: false,
  },
  STOP_LIMIT: {
    type: 'STOP_LIMIT',
    label: 'Stop limit',
    description: 'Become a limit order once the stop price trades.',
    requiresLimitPrice: true,
    requiresStopPrice: true,
    requiresTrailingAmount: false,
    requiresDisplayQuantity: false,
    placeholder: false,
  },
  TRAILING_STOP: {
    type: 'TRAILING_STOP',
    label: 'Trailing stop',
    description: 'A stop that trails the price by a fixed amount.',
    requiresLimitPrice: false,
    requiresStopPrice: false,
    requiresTrailingAmount: true,
    requiresDisplayQuantity: false,
    placeholder: false,
  },
  ICEBERG: {
    type: 'ICEBERG',
    label: 'Iceberg',
    description: 'A limit order that displays only part of its quantity.',
    requiresLimitPrice: true,
    requiresStopPrice: false,
    requiresTrailingAmount: false,
    requiresDisplayQuantity: true,
    placeholder: false,
  },
  TWAP: {
    type: 'TWAP',
    label: 'TWAP (placeholder)',
    description: 'Time-weighted average price schedule — declared placeholder in v1.',
    requiresLimitPrice: false,
    requiresStopPrice: false,
    requiresTrailingAmount: false,
    requiresDisplayQuantity: false,
    placeholder: true,
  },
  VWAP: {
    type: 'VWAP',
    label: 'VWAP (placeholder)',
    description: 'Volume-weighted average price schedule — declared placeholder in v1.',
    requiresLimitPrice: false,
    requiresStopPrice: false,
    requiresTrailingAmount: false,
    requiresDisplayQuantity: false,
    placeholder: true,
  },
};

export function describeOrderType(type: OrderType): OrderTypeDescriptor {
  return TYPE_DESCRIPTORS[type];
}

export function isPlaceholderType(type: OrderType): boolean {
  return TYPE_DESCRIPTORS[type].placeholder;
}

export const TIME_IN_FORCE: readonly TimeInForce[] = ['DAY', 'GTC', 'IOC', 'FOK', 'GTD'];

const TIF_LABELS: Record<TimeInForce, string> = {
  DAY: 'Day',
  GTC: 'Good-till-cancel',
  IOC: 'Immediate-or-cancel',
  FOK: 'Fill-or-kill',
  GTD: 'Good-till-date',
};

export function describeTimeInForce(tif: TimeInForce): {
  readonly tif: TimeInForce;
  readonly label: string;
} {
  return { tif, label: TIF_LABELS[tif] };
}
