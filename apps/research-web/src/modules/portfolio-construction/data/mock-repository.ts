/**
 * In-memory mock adapter for the Portfolio Construction Engine UI. Synthetic portfolio
 * METADATA ONLY — no optimization, no weight calculation, no risk computation, no
 * persistence. Signal/strategy/feature/dataset/backtest/experiment references use the
 * other research-web modules' ids so cross-links resolve; target weights, constraint
 * bounds and metric VALUES are inert strings. This is the UI's own mock, independent
 * of the service tier.
 */
import {
  isActiveOptimization,
  type Portfolio,
  type PortfolioComparison,
  type PortfolioFamily,
  type PortfolioTemplate,
} from '@platform/portfolio-sdk';
import { applyPortfolioQuery, type PortfolioQuery } from '../domain/query';
import type { PortfolioConstructionRepository } from './repository';

const PORTFOLIOS: readonly Portfolio[] = [
  {
    id: 'PF-EQUITY-MN',
    slug: 'equity-market-neutral',
    name: 'Equity market-neutral',
    description:
      'Published US equity market-neutral portfolio composed from approved reversal and quality signals.',
    namespace: 'equities',
    family: 'market-neutral',
    stage: 'PUBLISHED',
    version: '2.0.0',
    templateRef: 'TPL-MARKET-NEUTRAL',
    universe: {
      id: 'UNI-US-LC',
      name: 'US large-cap',
      description: 'US large-cap liquid equities.',
      assetClasses: ['equity'],
      instrumentCount: 500,
    },
    signalSelection: [
      {
        id: 'SEL-1',
        ref: 'sig-reversal',
        name: 'Short-horizon reversal',
        weightHint: '0.6',
        status: 'SATISFIED',
      },
      {
        id: 'SEL-2',
        ref: 'sig-quality',
        name: 'Quality composite',
        weightHint: '0.4',
        status: 'SATISFIED',
      },
    ],
    constraints: [
      {
        id: 'CON-1',
        kind: 'EXPOSURE',
        label: 'Market neutral',
        bound: '|net| ≤ 2%',
        status: 'SATISFIED',
      },
      { id: 'CON-2', kind: 'WEIGHT', label: 'Max name weight', bound: '≤ 3%', status: 'SATISFIED' },
      {
        id: 'CON-3',
        kind: 'TURNOVER',
        label: 'Monthly turnover',
        bound: '≤ 20%',
        status: 'SATISFIED',
      },
    ],
    allocation: {
      allocationModel: 'signal-weighted',
      baseCurrency: 'USD',
      rebalanceFrequency: 'monthly',
      holdings: [
        {
          id: 'H-1',
          ref: 'AAPL',
          name: 'Apple Inc.',
          assetClass: 'equity',
          side: 'LONG',
          targetWeight: '2.4%',
        },
        {
          id: 'H-2',
          ref: 'MSFT',
          name: 'Microsoft Corp.',
          assetClass: 'equity',
          side: 'LONG',
          targetWeight: '2.1%',
        },
        {
          id: 'H-3',
          ref: 'XYZ',
          name: 'Example Short Co.',
          assetClass: 'equity',
          side: 'SHORT',
          targetWeight: '-1.8%',
        },
      ],
      notes: 'Weights supplied by the optimizer; shown here as inert values.',
    },
    optimization: {
      id: 'OPT-3',
      status: 'COMPLETED',
      objective: 'max-diversification',
      attempt: 1,
      progress: 100,
      requestedAt: '2026-07-20T00:00:00.000Z',
      completedAt: '2026-07-20T01:00:00.000Z',
      note: 'Optimization completed nominally.',
    },
    optimizationRequests: [
      {
        id: 'OPT-3',
        status: 'COMPLETED',
        objective: 'max-diversification',
        attempt: 1,
        progress: 100,
        requestedAt: '2026-07-20T00:00:00.000Z',
        completedAt: '2026-07-20T01:00:00.000Z',
        note: 'Optimization completed nominally.',
      },
    ],
    sessions: [
      {
        id: 'SES-1',
        author: 'Ada Researcher',
        summary: 'Configured allocation and constraints.',
        startedAt: '2026-07-19T00:00:00.000Z',
        endedAt: '2026-07-19T01:00:00.000Z',
      },
    ],
    metrics: [
      { key: 'holdings', value: '182' },
      { key: 'gross_exposure', value: '198%' },
      { key: 'net_exposure', value: '1.2%' },
      { key: 'largest_weight', value: '2.4%' },
      { key: 'concentration', value: '0.041' },
      { key: 'turnover', value: '0.18x' },
      { key: 'active_share', value: '86%' },
      { key: 'tracking_error', value: '4.1%' },
    ],
    validation: {
      status: 'PASSED',
      method: 'Point-in-time + constraint check',
      checkedAt: '2026-07-19T12:00:00.000Z',
      note: 'PIT verified; constraints satisfied.',
    },
    approval: 'APPROVED',
    reviews: [
      {
        id: 'PRV-1',
        reviewer: 'Portfolio Review',
        stage: 'REVIEW',
        status: 'PASSED',
        reviewedAt: '2026-07-21T00:00:00.000Z',
      },
    ],
    approvals: [
      {
        id: 'PAP-1',
        role: 'Investment Committee',
        status: 'APPROVED',
        decidedAt: '2026-07-22T00:00:00.000Z',
        rationale: 'Constraints satisfied; capital-eligible signals only.',
      },
    ],
    dependencies: [
      {
        id: 'PDEP-1',
        kind: 'SIGNAL',
        ref: 'sig-reversal',
        name: 'Short-horizon reversal',
        status: 'SATISFIED',
      },
      {
        id: 'PDEP-2',
        kind: 'SIGNAL',
        ref: 'sig-quality',
        name: 'Quality composite',
        status: 'SATISFIED',
      },
      {
        id: 'PDEP-3',
        kind: 'BACKTEST',
        ref: 'bt-reversal',
        name: 'Reversal L/S historical',
        status: 'SATISFIED',
      },
    ],
    lineage: {
      nodes: [
        { id: 'N-1', kind: 'SIGNAL', ref: 'sig-reversal', label: 'Short-horizon reversal' },
        { id: 'N-2', kind: 'SIGNAL', ref: 'sig-quality', label: 'Quality composite' },
        { id: 'N-3', kind: 'BACKTEST', ref: 'bt-reversal', label: 'Reversal L/S historical' },
        { id: 'N-4', kind: 'PORTFOLIO', ref: 'pf-equity-mn', label: 'Equity market-neutral' },
      ],
      edges: [
        { from: 'N-1', to: 'N-4' },
        { from: 'N-2', to: 'N-4' },
        { from: 'N-3', to: 'N-4' },
      ],
    },
    artifacts: [
      { id: 'ART-1', kind: 'DEFINITION', ref: 'def-equity-mn-2', name: 'Portfolio definition' },
      { id: 'ART-2', kind: 'ALLOCATION', ref: 'alloc-equity-mn-2', name: 'Allocation set' },
      { id: 'ART-3', kind: 'MANIFEST', ref: 'man-equity-mn-2', name: 'Construction manifest' },
    ],
    versions: [
      {
        version: '2.0.0',
        stage: 'PUBLISHED',
        createdAt: '2026-07-22T00:00:00.000Z',
        note: 'Published.',
        manifestHash: 'sha256:pf20',
      },
      {
        version: '1.0.0',
        stage: 'PUBLISHED',
        createdAt: '2026-06-01T00:00:00.000Z',
        note: 'First publication.',
        manifestHash: 'sha256:pf10',
      },
    ],
    snapshots: [
      {
        portfolioId: 'PF-EQUITY-MN',
        version: '2.0.0',
        stage: 'PUBLISHED',
        capturedAt: '2026-07-22T00:00:00.000Z',
        manifestHash: 'sha256:pf20',
      },
    ],
    owner: { owner: 'Ada Researcher', team: 'Equity Research', steward: 'Portfolio Guild' },
    tags: ['market-neutral', 'equity', 'published'],
    metadata: [
      { key: 'base-currency', value: 'USD' },
      { key: 'benchmark', value: 'cash' },
    ],
    experimentRef: 'exp-momentum-reversal',
    backtestRef: 'bt-reversal',
    registryRef: 'REG-pf-equity-mn',
    registeredAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-07-22T00:00:00.000Z',
  },
  {
    id: 'PF-MULTI-ASSET',
    slug: 'multi-asset-risk-balanced',
    name: 'Multi-asset risk-balanced',
    description: 'Risk-balanced multi-asset portfolio awaiting a governance approval decision.',
    namespace: 'multi-asset',
    family: 'risk-balanced',
    stage: 'APPROVAL',
    version: '1.1.0',
    templateRef: 'TPL-RISK-BALANCED',
    universe: {
      id: 'UNI-GLOBAL',
      name: 'Global multi-asset',
      description: 'Global equity/rates/credit/FX sleeves.',
      assetClasses: ['equity', 'rates', 'credit', 'fx'],
      instrumentCount: 120,
    },
    signalSelection: [
      {
        id: 'SEL-3',
        ref: 'sig-fx-carry',
        name: 'FX carry',
        weightHint: '0.3',
        status: 'SATISFIED',
      },
      {
        id: 'SEL-4',
        ref: 'sig-quality',
        name: 'Quality composite',
        weightHint: '0.3',
        status: 'SATISFIED',
      },
    ],
    constraints: [
      {
        id: 'CON-4',
        kind: 'RISK',
        label: 'Risk-parity target',
        bound: 'equal risk contribution',
        status: 'SATISFIED',
      },
      {
        id: 'CON-5',
        kind: 'CONCENTRATION',
        label: 'Sleeve concentration',
        bound: '≤ 40% per sleeve',
        status: 'SATISFIED',
      },
    ],
    allocation: {
      allocationModel: 'risk-balanced',
      baseCurrency: 'USD',
      rebalanceFrequency: 'quarterly',
      holdings: [
        {
          id: 'H-4',
          ref: 'EQ-SLEEVE',
          name: 'Equity sleeve',
          assetClass: 'equity',
          side: 'LONG',
          targetWeight: '28%',
        },
        {
          id: 'H-5',
          ref: 'RATES-SLEEVE',
          name: 'Rates sleeve',
          assetClass: 'rates',
          side: 'LONG',
          targetWeight: '34%',
        },
        {
          id: 'H-6',
          ref: 'CREDIT-SLEEVE',
          name: 'Credit sleeve',
          assetClass: 'credit',
          side: 'LONG',
          targetWeight: '22%',
        },
      ],
      notes: 'Sleeve weights supplied by the optimizer.',
    },
    optimization: {
      id: 'OPT-7',
      status: 'COMPLETED',
      objective: 'risk-parity',
      attempt: 2,
      progress: 100,
      requestedAt: '2026-07-28T00:00:00.000Z',
      completedAt: '2026-07-28T02:00:00.000Z',
      note: 'Retried after universe refresh.',
    },
    optimizationRequests: [
      {
        id: 'OPT-6',
        status: 'FAILED',
        objective: 'risk-parity',
        attempt: 1,
        progress: 40,
        requestedAt: '2026-07-27T00:00:00.000Z',
        completedAt: '2026-07-27T00:30:00.000Z',
        note: 'Universe gap.',
      },
      {
        id: 'OPT-7',
        status: 'COMPLETED',
        objective: 'risk-parity',
        attempt: 2,
        progress: 100,
        requestedAt: '2026-07-28T00:00:00.000Z',
        completedAt: '2026-07-28T02:00:00.000Z',
        note: 'Retried after universe refresh.',
      },
    ],
    sessions: [
      {
        id: 'SES-2',
        author: 'Blaise Quant',
        summary: 'Balanced sleeve risk contributions.',
        startedAt: '2026-07-29T00:00:00.000Z',
      },
    ],
    metrics: [
      { key: 'holdings', value: '64' },
      { key: 'gross_exposure', value: '100%' },
      { key: 'net_exposure', value: '84%' },
      { key: 'largest_weight', value: '34%' },
      { key: 'concentration', value: '0.088' },
      { key: 'turnover', value: '0.09x' },
      { key: 'active_share', value: '71%' },
      { key: 'tracking_error', value: '2.6%' },
    ],
    validation: {
      status: 'PASSED',
      method: 'Point-in-time + constraint check',
      checkedAt: '2026-07-28T06:30:00.000Z',
      note: 'Constraints satisfied across sleeves.',
    },
    approval: 'PENDING',
    reviews: [
      {
        id: 'PRV-2',
        reviewer: 'Portfolio Review',
        stage: 'REVIEW',
        status: 'PASSED',
        reviewedAt: '2026-07-29T00:00:00.000Z',
      },
    ],
    approvals: [{ id: 'PAP-2', role: 'Investment Committee', status: 'PENDING' }],
    dependencies: [
      { id: 'PDEP-4', kind: 'SIGNAL', ref: 'sig-fx-carry', name: 'FX carry', status: 'SATISFIED' },
      {
        id: 'PDEP-5',
        kind: 'STRATEGY',
        ref: 'str-fx-carry',
        name: 'FX carry strategy',
        status: 'SATISFIED',
      },
      {
        id: 'PDEP-6',
        kind: 'RISK',
        ref: 'risk-multi-asset',
        name: 'Multi-asset risk assessment',
        status: 'SATISFIED',
      },
    ],
    lineage: {
      nodes: [
        { id: 'N-1', kind: 'SIGNAL', ref: 'sig-fx-carry', label: 'FX carry' },
        { id: 'N-2', kind: 'STRATEGY', ref: 'str-fx-carry', label: 'FX carry strategy' },
        { id: 'N-3', kind: 'PORTFOLIO', ref: 'pf-multi-asset', label: 'Multi-asset risk-balanced' },
      ],
      edges: [
        { from: 'N-1', to: 'N-2' },
        { from: 'N-2', to: 'N-3' },
      ],
    },
    artifacts: [
      { id: 'ART-4', kind: 'DEFINITION', ref: 'def-multi-asset', name: 'Portfolio definition' },
      { id: 'ART-5', kind: 'ATTRIBUTION', ref: 'attr-multi-asset', name: 'Attribution' },
    ],
    versions: [
      {
        version: '1.1.0',
        stage: 'APPROVAL',
        createdAt: '2026-07-28T07:00:00.000Z',
        note: 'Awaiting approval.',
        manifestHash: 'sha256:pfma11',
      },
    ],
    snapshots: [
      {
        portfolioId: 'PF-MULTI-ASSET',
        version: '1.1.0',
        stage: 'APPROVAL',
        capturedAt: '2026-07-28T07:00:00.000Z',
        manifestHash: 'sha256:pfma11',
      },
    ],
    owner: { owner: 'Blaise Quant', team: 'Macro Research', steward: 'Portfolio Guild' },
    tags: ['risk-balanced', 'multi-asset', 'approval'],
    metadata: [{ key: 'base-currency', value: 'USD' }],
    experimentRef: 'exp-carry-fx',
    backtestRef: 'bt-carry-wf',
    registryRef: 'REG-pf-multi-asset',
    registeredAt: '2026-07-25T00:00:00.000Z',
    updatedAt: '2026-07-29T00:00:00.000Z',
  },
  {
    id: 'PF-CREDIT-CARRY',
    slug: 'credit-carry',
    name: 'Credit carry',
    description: 'Credit carry portfolio with an optimization request currently running.',
    namespace: 'credit',
    family: 'carry',
    stage: 'OPTIMIZATION_REQUEST',
    version: '0.5.0',
    templateRef: 'TPL-SIGNAL-WEIGHTED',
    universe: {
      id: 'UNI-IG',
      name: 'IG credit',
      description: 'Investment-grade credit universe.',
      assetClasses: ['credit'],
      instrumentCount: 300,
    },
    signalSelection: [
      {
        id: 'SEL-5',
        ref: 'sig-fx-carry',
        name: 'Carry composite',
        weightHint: '1.0',
        status: 'SATISFIED',
      },
    ],
    constraints: [
      {
        id: 'CON-6',
        kind: 'LIQUIDITY',
        label: 'Min ADV',
        bound: '≥ $5m ADV',
        status: 'NOT_EVALUATED',
      },
      {
        id: 'CON-7',
        kind: 'SECTOR',
        label: 'Sector cap',
        bound: '≤ 25% per sector',
        status: 'NOT_EVALUATED',
      },
    ],
    allocation: {
      allocationModel: 'signal-weighted',
      baseCurrency: 'USD',
      rebalanceFrequency: 'monthly',
      holdings: [],
      notes: 'Awaiting optimizer output.',
    },
    optimization: {
      id: 'OPT-9',
      status: 'RUNNING',
      objective: 'max-carry',
      attempt: 1,
      progress: 55,
      requestedAt: '2026-08-02T00:00:00.000Z',
      note: 'Optimization in progress (external optimizer).',
    },
    optimizationRequests: [
      {
        id: 'OPT-9',
        status: 'RUNNING',
        objective: 'max-carry',
        attempt: 1,
        progress: 55,
        requestedAt: '2026-08-02T00:00:00.000Z',
        note: 'Optimization in progress (external optimizer).',
      },
    ],
    sessions: [
      {
        id: 'SES-3',
        author: 'Cleo Analyst',
        summary: 'Requested optimization.',
        startedAt: '2026-08-02T00:00:00.000Z',
      },
    ],
    metrics: [],
    validation: {
      status: 'PASSED',
      method: 'Point-in-time',
      checkedAt: '2026-08-01T00:00:00.000Z',
      note: 'PIT verified.',
    },
    approval: 'NOT_REQUESTED',
    reviews: [],
    approvals: [],
    dependencies: [
      {
        id: 'PDEP-7',
        kind: 'SIGNAL',
        ref: 'sig-fx-carry',
        name: 'Carry composite',
        status: 'SATISFIED',
      },
      {
        id: 'PDEP-8',
        kind: 'DATASET',
        ref: 'ds-credit-spreads',
        name: 'Credit spreads',
        status: 'SATISFIED',
      },
    ],
    lineage: {
      nodes: [
        { id: 'N-1', kind: 'SIGNAL', ref: 'sig-fx-carry', label: 'Carry composite' },
        { id: 'N-2', kind: 'PORTFOLIO', ref: 'pf-credit-carry', label: 'Credit carry' },
      ],
      edges: [{ from: 'N-1', to: 'N-2' }],
    },
    artifacts: [
      { id: 'ART-6', kind: 'MANIFEST', ref: 'man-credit-carry', name: 'Construction manifest' },
    ],
    versions: [
      {
        version: '0.5.0',
        stage: 'OPTIMIZATION_REQUEST',
        createdAt: '2026-08-02T00:00:00.000Z',
        note: 'Optimizing.',
        manifestHash: 'sha256:pfcc05',
      },
    ],
    snapshots: [],
    owner: { owner: 'Cleo Analyst', team: 'Credit Research', steward: 'Portfolio Guild' },
    tags: ['carry', 'credit', 'optimizing'],
    metadata: [{ key: 'base-currency', value: 'USD' }],
    experimentRef: 'exp-credit-momentum',
    registryRef: 'REG-pf-credit-carry',
    registeredAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 'PF-FX-MOM-DRAFT',
    slug: 'fx-momentum-draft',
    name: 'FX momentum draft',
    description: 'Draft FX momentum portfolio with an optimization request queued.',
    namespace: 'fx',
    family: 'momentum',
    stage: 'ALLOCATION_CONFIGURATION',
    version: '0.1.0',
    universe: {
      id: 'UNI-G10FX',
      name: 'G10 FX',
      description: 'G10 currency pairs.',
      assetClasses: ['fx'],
      instrumentCount: 28,
    },
    signalSelection: [
      {
        id: 'SEL-6',
        ref: 'sig-fx-carry',
        name: 'FX momentum',
        weightHint: '1.0',
        status: 'PENDING',
      },
    ],
    constraints: [
      {
        id: 'CON-8',
        kind: 'WEIGHT',
        label: 'Max pair weight',
        bound: '≤ 15%',
        status: 'NOT_EVALUATED',
      },
    ],
    allocation: {
      allocationModel: 'equal-risk',
      baseCurrency: 'USD',
      rebalanceFrequency: 'weekly',
      holdings: [],
      notes: 'Configuration in progress.',
    },
    optimization: {
      id: 'OPT-0',
      status: 'QUEUED',
      objective: 'max-momentum',
      attempt: 0,
      progress: 0,
      note: 'Queued for the optimizer.',
    },
    optimizationRequests: [
      {
        id: 'OPT-0',
        status: 'QUEUED',
        objective: 'max-momentum',
        attempt: 0,
        progress: 0,
        note: 'Queued for the optimizer.',
      },
    ],
    sessions: [
      {
        id: 'SES-4',
        author: 'Dara Researcher',
        summary: 'Drafting allocation configuration.',
        startedAt: '2026-08-01T00:00:00.000Z',
      },
    ],
    metrics: [],
    validation: { status: 'NOT_RUN', method: 'Point-in-time', note: 'Validation not yet run.' },
    approval: 'NOT_REQUESTED',
    reviews: [],
    approvals: [],
    dependencies: [
      {
        id: 'PDEP-9',
        kind: 'FEATURE',
        ref: 'feat-fx-mom',
        name: 'FX momentum feature',
        status: 'PENDING',
      },
    ],
    lineage: {
      nodes: [
        { id: 'N-1', kind: 'FEATURE', ref: 'feat-fx-mom', label: 'FX momentum feature' },
        { id: 'N-2', kind: 'PORTFOLIO', ref: 'pf-fx-mom-draft', label: 'FX momentum draft' },
      ],
      edges: [{ from: 'N-1', to: 'N-2' }],
    },
    artifacts: [],
    versions: [
      {
        version: '0.1.0',
        stage: 'ALLOCATION_CONFIGURATION',
        createdAt: '2026-08-01T00:00:00.000Z',
        note: 'Draft.',
        manifestHash: 'sha256:pffx01',
      },
    ],
    snapshots: [],
    owner: { owner: 'Dara Researcher', team: 'Macro Research', steward: 'Portfolio Guild' },
    tags: ['momentum', 'fx', 'draft'],
    metadata: [{ key: 'base-currency', value: 'USD' }],
    experimentRef: 'exp-carry-fx',
    registryRef: 'REG-pf-fx-mom-draft',
    registeredAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'PF-VOL-CANCELLED',
    slug: 'vol-target-cancelled',
    name: 'Vol target (cancelled)',
    description:
      'Volatility-target portfolio whose optimization request was cancelled and awaits retry.',
    namespace: 'equities',
    family: 'volatility',
    stage: 'OPTIMIZATION_REQUEST',
    version: '0.3.0',
    templateRef: 'TPL-SIGNAL-WEIGHTED',
    universe: {
      id: 'UNI-US-VOL',
      name: 'US options',
      description: 'US listed options surface.',
      assetClasses: ['equity', 'volatility'],
      instrumentCount: 200,
    },
    signalSelection: [
      {
        id: 'SEL-7',
        ref: 'sig-quality',
        name: 'Vol carry composite',
        weightHint: '1.0',
        status: 'SATISFIED',
      },
    ],
    constraints: [
      {
        id: 'CON-9',
        kind: 'RISK',
        label: 'Vol target',
        bound: '10% annualized',
        status: 'NOT_EVALUATED',
      },
    ],
    allocation: {
      allocationModel: 'vol-target',
      baseCurrency: 'USD',
      rebalanceFrequency: 'weekly',
      holdings: [],
      notes: 'Cancelled; awaiting data fix and retry.',
    },
    optimization: {
      id: 'OPT-5',
      status: 'CANCELLED',
      objective: 'vol-target',
      attempt: 1,
      progress: 20,
      requestedAt: '2026-07-26T00:00:00.000Z',
      completedAt: '2026-07-26T00:20:00.000Z',
      note: 'Cancelled by researcher (data issue).',
    },
    optimizationRequests: [
      {
        id: 'OPT-5',
        status: 'CANCELLED',
        objective: 'vol-target',
        attempt: 1,
        progress: 20,
        requestedAt: '2026-07-26T00:00:00.000Z',
        completedAt: '2026-07-26T00:20:00.000Z',
        note: 'Cancelled by researcher (data issue).',
      },
    ],
    sessions: [
      {
        id: 'SES-5',
        author: 'Dara Researcher',
        summary: 'Investigating vol surface gap.',
        startedAt: '2026-07-26T01:00:00.000Z',
      },
    ],
    metrics: [],
    validation: { status: 'PENDING', method: 'Point-in-time', note: 'Pending data fix.' },
    approval: 'NOT_REQUESTED',
    reviews: [],
    approvals: [],
    dependencies: [
      {
        id: 'PDEP-10',
        kind: 'DATASET',
        ref: 'ds-cme-es-index',
        name: 'CME ES index prices',
        status: 'MISSING',
      },
    ],
    lineage: {
      nodes: [
        { id: 'N-1', kind: 'PORTFOLIO', ref: 'pf-vol-cancelled', label: 'Vol target (cancelled)' },
      ],
      edges: [],
    },
    artifacts: [],
    versions: [
      {
        version: '0.3.0',
        stage: 'OPTIMIZATION_REQUEST',
        createdAt: '2026-07-26T00:00:00.000Z',
        note: 'Cancelled; awaiting retry.',
        manifestHash: 'sha256:pfv03',
      },
    ],
    snapshots: [],
    owner: { owner: 'Dara Researcher', team: 'Volatility Research', steward: 'Portfolio Guild' },
    tags: ['volatility', 'vol-target', 'cancelled'],
    metadata: [{ key: 'base-currency', value: 'USD' }],
    experimentRef: 'exp-vol-carry',
    registryRef: 'REG-pf-vol-cancelled',
    registeredAt: '2026-07-25T00:00:00.000Z',
    updatedAt: '2026-07-26T00:20:00.000Z',
  },
];

const FAMILIES: readonly PortfolioFamily[] = [
  {
    namespace: 'equities',
    family: 'market-neutral',
    description: 'Market-neutral equity portfolios.',
    portfolioCount: 1,
  },
  {
    namespace: 'equities',
    family: 'volatility',
    description: 'Volatility-target portfolios.',
    portfolioCount: 1,
  },
  {
    namespace: 'multi-asset',
    family: 'risk-balanced',
    description: 'Risk-balanced multi-asset portfolios.',
    portfolioCount: 1,
  },
  {
    namespace: 'credit',
    family: 'carry',
    description: 'Credit carry portfolios.',
    portfolioCount: 1,
  },
  {
    namespace: 'fx',
    family: 'momentum',
    description: 'FX momentum portfolios.',
    portfolioCount: 1,
  },
];

const TEMPLATES: readonly PortfolioTemplate[] = [
  {
    id: 'TPL-MARKET-NEUTRAL',
    name: 'Market-neutral',
    description: 'Signal-weighted, dollar-neutral equity template.',
    allocationModel: 'signal-weighted',
    constraintKinds: ['EXPOSURE', 'WEIGHT', 'TURNOVER'],
  },
  {
    id: 'TPL-RISK-BALANCED',
    name: 'Risk-balanced',
    description: 'Equal-risk-contribution multi-asset template.',
    allocationModel: 'risk-balanced',
    constraintKinds: ['RISK', 'CONCENTRATION'],
  },
  {
    id: 'TPL-SIGNAL-WEIGHTED',
    name: 'Signal-weighted',
    description: 'Generic signal-weighted allocation template.',
    allocationModel: 'signal-weighted',
    constraintKinds: ['WEIGHT', 'LIQUIDITY', 'SECTOR'],
  },
];

const COMPARISONS: readonly PortfolioComparison[] = [
  {
    id: 'PCMP-1',
    name: 'Market-neutral vs risk-balanced',
    portfolioIds: ['PF-EQUITY-MN', 'PF-MULTI-ASSET'],
    metricKeys: ['holdings', 'net_exposure', 'largest_weight', 'turnover', 'tracking_error'],
    createdAt: '2026-07-29T00:00:00.000Z',
    note: 'Head-to-head of the two constructed portfolios.',
  },
];

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockPortfolioConstructionRepository implements PortfolioConstructionRepository {
  private readonly latencyMs: number;

  constructor(options: MockRepositoryOptions = {}) {
    this.latencyMs = options.latencyMs ?? 0;
  }

  async listPortfolios(query: PortfolioQuery): Promise<readonly Portfolio[]> {
    await this.delay();
    return applyPortfolioQuery(PORTFOLIOS, query);
  }

  async getPortfolio(id: string): Promise<Portfolio | null> {
    await this.delay();
    return PORTFOLIOS.find((portfolio) => portfolio.id === id) ?? null;
  }

  async listFamilies(): Promise<readonly PortfolioFamily[]> {
    await this.delay();
    return FAMILIES;
  }

  async listTemplates(): Promise<readonly PortfolioTemplate[]> {
    await this.delay();
    return TEMPLATES;
  }

  async optimizationQueue(): Promise<readonly Portfolio[]> {
    await this.delay();
    return PORTFOLIOS.filter((portfolio) => isActiveOptimization(portfolio.optimization.status));
  }

  async approvalQueue(): Promise<readonly Portfolio[]> {
    await this.delay();
    return PORTFOLIOS.filter((portfolio) =>
      portfolio.approvals.some((approval) => approval.status === 'PENDING'),
    );
  }

  async listComparisons(): Promise<readonly PortfolioComparison[]> {
    await this.delay();
    return COMPARISONS;
  }

  async getComparison(id: string): Promise<PortfolioComparison | null> {
    await this.delay();
    return COMPARISONS.find((comparison) => comparison.id === id) ?? null;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export const PORTFOLIO_CONSTRUCTION_SEED = {
  portfolios: PORTFOLIOS,
  families: FAMILIES,
  templates: TEMPLATES,
  comparisons: COMPARISONS,
} as const;
