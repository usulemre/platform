/**
 * Synthetic in-memory seed for development and tests. Feature METADATA ONLY — no
 * feature calculations, no statistics, no persistence. Datasets/features are
 * referenced by ref so cross-links resolve; nothing is computed.
 */
import type { FeatureFamily, RegisteredFeature } from '@platform/feature-store-sdk';
import type { DiscoveryCandidate } from '../ports';

export const FEATURES: readonly RegisteredFeature[] = [
  {
    id: 'FS-RESID-RETURN',
    slug: 'residual-return-1d',
    name: 'Residual return (1d)',
    description: 'One-day residual return after removing market and sector betas.',
    namespace: 'equities',
    family: 'momentum',
    status: 'APPROVED',
    version: '2.1.0',
    approval: 'APPROVED',
    validation: 'PASSED',
    owner: { owner: 'Ada Researcher', team: 'Equity Research', steward: 'Feature Guild' },
    definition: {
      entity: 'security',
      valueType: 'FLOAT',
      timeframe: '1d',
      rationale: 'Reversal effect after risk removal.',
      schema: {
        entity: 'security',
        timeframe: '1d',
        fields: [
          {
            name: 'security_id',
            type: 'CATEGORICAL',
            nullable: false,
            description: 'Security identifier.',
          },
          { name: 'asof', type: 'TIMESTAMP', nullable: false, description: 'Knowledge time.' },
          {
            name: 'resid_return_1d',
            type: 'FLOAT',
            nullable: true,
            description: 'Residual return value.',
          },
        ],
      },
    },
    versions: [
      {
        version: '2.1.0',
        status: 'APPROVED',
        createdAt: '2026-07-26T00:00:00.000Z',
        note: 'Sector beta refresh.',
        manifestHash: 'sha256:aa11',
      },
      {
        version: '2.0.0',
        status: 'DEPRECATED',
        createdAt: '2026-05-01T00:00:00.000Z',
        note: 'Initial approval.',
        manifestHash: 'sha256:aa00',
      },
    ],
    dependencies: [
      {
        id: 'DEP-1',
        kind: 'DATASET',
        ref: 'ds-equity-eod',
        name: 'US Equity Prices (EOD)',
        status: 'SATISFIED',
      },
    ],
    lineage: {
      nodes: [
        { id: 'N-1', kind: 'RAW_SOURCE', ref: 'vendor-eod', label: 'Vendor EOD' },
        { id: 'N-2', kind: 'DATASET', ref: 'ds-equity-eod', label: 'US Equity Prices (EOD)' },
        { id: 'N-3', kind: 'TRANSFORM', ref: 'risk-residualize', label: 'Risk residualize' },
        { id: 'N-4', kind: 'FEATURE', ref: 'feat-resid-return', label: 'Residual return (1d)' },
      ],
      edges: [
        { from: 'N-1', to: 'N-2' },
        { from: 'N-2', to: 'N-3' },
        { from: 'N-3', to: 'N-4' },
      ],
    },
    usage: {
      consumers: '12',
      signals: '3',
      backtests: '18',
      lastAccessedAt: '2026-08-01T00:00:00.000Z',
    },
    quality: {
      grade: 'PASS',
      completeness: 0.999,
      stability: 0.996,
      checkedAt: '2026-08-01T00:00:00.000Z',
    },
    health: { status: 'HEALTHY', message: 'Nominal.', lastRefreshedAt: '2026-08-02T00:00:00.000Z' },
    sync: {
      status: 'SYNCED',
      registryRef: 'REG-feat-resid-return',
      lastSyncedAt: '2026-08-02T00:00:00.000Z',
    },
    tags: ['reversal', 'equity', 'risk-adjusted'],
    metadata: [
      { key: 'universe', value: 'US large-cap' },
      { key: 'pit', value: 'true' },
    ],
    registryRef: 'REG-feat-resid-return',
    registeredAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-07-26T00:00:00.000Z',
  },
  {
    id: 'FS-CARRY',
    slug: 'fx-carry',
    name: 'FX carry',
    description: 'Interest-rate differential carry feature for G10 FX.',
    namespace: 'fx',
    family: 'carry',
    status: 'APPROVED',
    version: '1.2.0',
    approval: 'APPROVED',
    validation: 'PASSED',
    owner: { owner: 'Blaise Quant', team: 'Macro Research', steward: 'Feature Guild' },
    definition: {
      entity: 'currency_pair',
      valueType: 'FLOAT',
      timeframe: '1d',
      rationale: 'Carry premium.',
      schema: {
        entity: 'currency_pair',
        timeframe: '1d',
        fields: [
          { name: 'pair', type: 'CATEGORICAL', nullable: false, description: 'Currency pair.' },
          { name: 'carry', type: 'FLOAT', nullable: true, description: 'Carry value.' },
        ],
      },
    },
    versions: [
      {
        version: '1.2.0',
        status: 'APPROVED',
        createdAt: '2026-07-22T00:00:00.000Z',
        note: 'Crowding overlay.',
        manifestHash: 'sha256:bb12',
      },
    ],
    dependencies: [
      {
        id: 'DEP-2',
        kind: 'DATASET',
        ref: 'ds-fx-spot',
        name: 'FX Spot Rates',
        status: 'SATISFIED',
      },
    ],
    lineage: {
      nodes: [
        { id: 'N-1', kind: 'DATASET', ref: 'ds-fx-spot', label: 'FX Spot Rates' },
        { id: 'N-2', kind: 'FEATURE', ref: 'feat-carry', label: 'FX carry' },
      ],
      edges: [{ from: 'N-1', to: 'N-2' }],
    },
    usage: {
      consumers: '5',
      signals: '2',
      backtests: '7',
      lastAccessedAt: '2026-07-30T00:00:00.000Z',
    },
    quality: {
      grade: 'WARN',
      completeness: 0.972,
      stability: 0.981,
      checkedAt: '2026-07-30T00:00:00.000Z',
    },
    health: {
      status: 'STALE',
      message: 'Awaiting refresh.',
      lastRefreshedAt: '2026-07-25T00:00:00.000Z',
    },
    sync: {
      status: 'SYNCED',
      registryRef: 'REG-feat-carry',
      lastSyncedAt: '2026-07-30T00:00:00.000Z',
    },
    tags: ['carry', 'fx', 'macro'],
    metadata: [{ key: 'universe', value: 'G10 FX' }],
    registryRef: 'REG-feat-carry',
    registeredAt: '2026-06-10T00:00:00.000Z',
    updatedAt: '2026-07-22T00:00:00.000Z',
  },
  {
    id: 'FS-VOL-REGIME',
    slug: 'vol-regime',
    name: 'Volatility regime',
    description: 'Categorical volatility-regime label per security.',
    namespace: 'equities',
    family: 'volatility',
    status: 'PROPOSED',
    version: '0.3.0',
    approval: 'PENDING',
    validation: 'PENDING',
    owner: { owner: 'Cleo Analyst', team: 'Equity Research', steward: 'Feature Guild' },
    definition: {
      entity: 'security',
      valueType: 'CATEGORICAL',
      timeframe: '1d',
      rationale: 'Regime conditioning.',
      schema: {
        entity: 'security',
        timeframe: '1d',
        fields: [
          { name: 'regime', type: 'CATEGORICAL', nullable: false, description: 'Low/Med/High.' },
        ],
      },
    },
    versions: [
      {
        version: '0.3.0',
        status: 'PROPOSED',
        createdAt: '2026-07-28T00:00:00.000Z',
        note: 'Proposed; awaiting validation.',
        manifestHash: 'sha256:cc03',
      },
    ],
    dependencies: [
      {
        id: 'DEP-3',
        kind: 'FEATURE',
        ref: 'feat-resid-return',
        name: 'Residual return (1d)',
        status: 'SATISFIED',
      },
    ],
    lineage: {
      nodes: [
        { id: 'N-1', kind: 'FEATURE', ref: 'feat-resid-return', label: 'Residual return (1d)' },
        { id: 'N-2', kind: 'FEATURE', ref: 'feat-vol-regime', label: 'Volatility regime' },
      ],
      edges: [{ from: 'N-1', to: 'N-2' }],
    },
    usage: { consumers: '0', signals: '0', backtests: '1' },
    quality: {
      grade: 'WARN',
      completeness: 0.95,
      stability: 0.96,
      checkedAt: '2026-07-28T00:00:00.000Z',
    },
    health: {
      status: 'UNKNOWN',
      message: 'Not yet approved.',
      lastRefreshedAt: '2026-07-28T00:00:00.000Z',
    },
    sync: { status: 'PENDING', registryRef: 'REG-feat-vol-regime' },
    tags: ['volatility', 'regime', 'equity'],
    metadata: [{ key: 'levels', value: '3' }],
    registryRef: 'REG-feat-vol-regime',
    registeredAt: '2026-07-28T00:00:00.000Z',
    updatedAt: '2026-07-28T00:00:00.000Z',
  },
  {
    id: 'FS-ILLIQUIDITY',
    slug: 'amihud-illiquidity',
    name: 'Amihud illiquidity',
    description: 'Amihud illiquidity ratio per security.',
    namespace: 'equities',
    family: 'microstructure',
    status: 'APPROVED',
    version: '3.0.0',
    approval: 'APPROVED',
    validation: 'PASSED',
    owner: { owner: 'Ada Researcher', team: 'Equity Research', steward: 'Feature Guild' },
    definition: {
      entity: 'security',
      valueType: 'FLOAT',
      timeframe: '1d',
      rationale: 'Liquidity premium.',
      schema: {
        entity: 'security',
        timeframe: '1d',
        fields: [
          { name: 'illiq', type: 'FLOAT', nullable: true, description: 'Illiquidity ratio.' },
        ],
      },
    },
    versions: [
      {
        version: '3.0.0',
        status: 'APPROVED',
        createdAt: '2026-07-01T00:00:00.000Z',
        note: 'Window retune.',
        manifestHash: 'sha256:dd30',
      },
    ],
    dependencies: [
      {
        id: 'DEP-4',
        kind: 'DATASET',
        ref: 'ds-equity-eod',
        name: 'US Equity Prices (EOD)',
        status: 'SATISFIED',
      },
    ],
    lineage: {
      nodes: [
        { id: 'N-1', kind: 'DATASET', ref: 'ds-equity-eod', label: 'US Equity Prices (EOD)' },
        { id: 'N-2', kind: 'FEATURE', ref: 'feat-illiq', label: 'Amihud illiquidity' },
      ],
      edges: [{ from: 'N-1', to: 'N-2' }],
    },
    usage: {
      consumers: '8',
      signals: '1',
      backtests: '9',
      lastAccessedAt: '2026-07-29T00:00:00.000Z',
    },
    quality: {
      grade: 'PASS',
      completeness: 0.998,
      stability: 0.994,
      checkedAt: '2026-07-29T00:00:00.000Z',
    },
    health: { status: 'HEALTHY', message: 'Nominal.', lastRefreshedAt: '2026-08-01T00:00:00.000Z' },
    sync: {
      status: 'DRIFTED',
      registryRef: 'REG-feat-illiq',
      lastSyncedAt: '2026-07-10T00:00:00.000Z',
    },
    tags: ['liquidity', 'microstructure', 'equity'],
    metadata: [{ key: 'window', value: '21d' }],
    registryRef: 'REG-feat-illiq',
    registeredAt: '2026-04-15T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
  },
  {
    id: 'FS-SEASONAL',
    slug: 'seasonal-encoding',
    name: 'Seasonal encoding',
    description: 'Deprecated seasonal encoding for agricultural futures.',
    namespace: 'commodity',
    family: 'seasonality',
    status: 'DEPRECATED',
    version: '0.9.0',
    approval: 'APPROVED',
    validation: 'FAILED',
    owner: { owner: 'Dara Researcher', team: 'Commodity Research', steward: 'Feature Guild' },
    definition: {
      entity: 'contract',
      valueType: 'FLOAT',
      timeframe: '1d',
      rationale: 'Seasonal patterns.',
      schema: {
        entity: 'contract',
        timeframe: '1d',
        fields: [
          { name: 'seasonal', type: 'FLOAT', nullable: true, description: 'Seasonal value.' },
        ],
      },
    },
    versions: [
      {
        version: '0.9.0',
        status: 'DEPRECATED',
        createdAt: '2026-06-01T00:00:00.000Z',
        note: 'Deprecated: leakage risk.',
        manifestHash: 'sha256:ee09',
      },
    ],
    dependencies: [
      {
        id: 'DEP-5',
        kind: 'DATASET',
        ref: 'ds-cme-es-index',
        name: 'CME ES index prices',
        status: 'MISSING',
      },
    ],
    lineage: {
      nodes: [{ id: 'N-1', kind: 'FEATURE', ref: 'feat-carry', label: 'Seasonal encoding' }],
      edges: [],
    },
    usage: { consumers: '0', signals: '0', backtests: '2' },
    quality: {
      grade: 'FAIL',
      completeness: 0.88,
      stability: 0.9,
      checkedAt: '2026-07-19T00:00:00.000Z',
    },
    health: {
      status: 'DEGRADED',
      message: 'Deprecated; leakage risk.',
      lastRefreshedAt: '2026-06-01T00:00:00.000Z',
    },
    sync: {
      status: 'ERROR',
      registryRef: 'REG-feat-seasonal',
      lastSyncedAt: '2026-06-05T00:00:00.000Z',
    },
    tags: ['seasonality', 'commodity', 'deprecated'],
    metadata: [{ key: 'universe', value: 'Ags' }],
    registryRef: 'REG-feat-seasonal',
    registeredAt: '2026-05-20T00:00:00.000Z',
    updatedAt: '2026-07-19T00:00:00.000Z',
  },
];

export const FAMILIES: readonly FeatureFamily[] = [
  {
    namespace: 'equities',
    family: 'momentum',
    description: 'Momentum and reversal features.',
    featureCount: 1,
  },
  {
    namespace: 'equities',
    family: 'volatility',
    description: 'Volatility-regime features.',
    featureCount: 1,
  },
  {
    namespace: 'equities',
    family: 'microstructure',
    description: 'Liquidity and microstructure features.',
    featureCount: 1,
  },
  { namespace: 'fx', family: 'carry', description: 'FX carry features.', featureCount: 1 },
  {
    namespace: 'commodity',
    family: 'seasonality',
    description: 'Seasonality features.',
    featureCount: 1,
  },
];

export const DISCOVERY_CANDIDATES: readonly DiscoveryCandidate[] = [
  { ref: 'cand-skew', name: 'Options skew factor' },
  { ref: 'cand-flow', name: 'Order-flow imbalance' },
];
