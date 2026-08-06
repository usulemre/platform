/**
 * Canonical asset-class taxonomy. Asset-agnostic vocabulary: the core never
 * branches on a specific exchange or provider (CP-8), only on these classes where
 * a capability contract requires it.
 */
export type AssetClass =
  | 'CRYPTO'
  | 'EQUITY'
  | 'FUTURES'
  | 'OPTIONS'
  | 'FX'
  | 'RATES'
  | 'COMMODITY'
  | 'INDEX'
  | 'MACRO';

export interface AssetClassDescriptor {
  readonly assetClass: AssetClass;
  readonly label: string;
  readonly description: string;
}

export const ASSET_CLASSES: readonly AssetClass[] = [
  'CRYPTO',
  'EQUITY',
  'FUTURES',
  'OPTIONS',
  'FX',
  'RATES',
  'COMMODITY',
  'INDEX',
  'MACRO',
];

const DESCRIPTORS: Record<AssetClass, AssetClassDescriptor> = {
  CRYPTO: {
    assetClass: 'CRYPTO',
    label: 'Crypto',
    description: 'Digital assets — spot and derivatives.',
  },
  EQUITY: {
    assetClass: 'EQUITY',
    label: 'Equity',
    description: 'Listed shares and depositary receipts.',
  },
  FUTURES: {
    assetClass: 'FUTURES',
    label: 'Futures',
    description: 'Exchange-traded futures contracts.',
  },
  OPTIONS: { assetClass: 'OPTIONS', label: 'Options', description: 'Listed options and greeks.' },
  FX: { assetClass: 'FX', label: 'FX', description: 'Foreign-exchange pairs.' },
  RATES: {
    assetClass: 'RATES',
    label: 'Rates',
    description: 'Interest-rate instruments and curves.',
  },
  COMMODITY: {
    assetClass: 'COMMODITY',
    label: 'Commodity',
    description: 'Physical and financial commodities.',
  },
  INDEX: { assetClass: 'INDEX', label: 'Index', description: 'Reference indices and benchmarks.' },
  MACRO: { assetClass: 'MACRO', label: 'Macro', description: 'Macroeconomic series.' },
};

export function describeAssetClass(assetClass: AssetClass): AssetClassDescriptor {
  return DESCRIPTORS[assetClass];
}

export function assetClassLabel(assetClass: AssetClass): string {
  return DESCRIPTORS[assetClass].label;
}

export function listAssetClasses(): readonly AssetClassDescriptor[] {
  return ASSET_CLASSES.map((assetClass) => DESCRIPTORS[assetClass]);
}
