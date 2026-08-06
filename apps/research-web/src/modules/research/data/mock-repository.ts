/**
 * In-memory mock adapter for the Research Engine UI. Synthetic research METADATA
 * ONLY — no quantitative algorithms, no statistics, no persistence. Artifacts
 * reference the other research-web modules' ids so cross-links resolve. This is
 * the UI's own mock, independent of the service tier.
 */
import {
  RESEARCH_STAGES,
  stageOrder,
  type ResearchProject,
  type ResearchStage,
  type ResearchTemplate,
  type StageProgress,
} from '@platform/research-sdk';
import { applyProjectQuery, type ProjectQuery } from '../domain/query';
import type { ResearchRepository, WorkspaceLink } from './repository';

function stagesFor(current: ResearchStage, owner: string, blocked = false): StageProgress[] {
  const currentOrder = stageOrder(current);
  return RESEARCH_STAGES.map((stage) => {
    const order = stageOrder(stage);
    if (order < currentOrder)
      return {
        stage,
        state: 'COMPLETE',
        owner,
        completedAt: '2026-07-15T00:00:00.000Z',
        artifactRefs: [],
      };
    if (order === currentOrder)
      return {
        stage,
        state: blocked ? 'BLOCKED' : 'IN_PROGRESS',
        owner,
        startedAt: '2026-07-20T00:00:00.000Z',
        artifactRefs: [],
      };
    return { stage, state: 'PENDING', artifactRefs: [] };
  });
}

const TEMPLATES: readonly ResearchTemplate[] = [
  {
    id: 'TPL-FULL',
    name: 'Full alpha lifecycle',
    description: 'Hypothesis → approval across all stages.',
    stages: [...RESEARCH_STAGES],
    objectives: [
      'Pre-register a falsifiable hypothesis',
      'Select governed datasets',
      'Validate features and signals',
      'Reach capital-eligibility approval',
    ],
  },
  {
    id: 'TPL-FEATURE',
    name: 'Feature study',
    description: 'Focused feature research and validation.',
    stages: [
      'HYPOTHESIS',
      'RESEARCH_PROJECT',
      'DATASET_SELECTION',
      'FEATURE_RESEARCH',
      'FEATURE_VALIDATION',
    ],
    objectives: ['Propose candidate features', 'Clear the feature validation gate'],
  },
];

const PROJECTS: readonly ResearchProject[] = [
  {
    id: 'RP-MOMENTUM',
    slug: 'short-horizon-reversal',
    name: 'Short-horizon reversal in US equities',
    description: 'Orchestrates the reversal hypothesis through feature and signal validation.',
    owner: 'Ada Researcher',
    team: 'Equity Research',
    status: 'ACTIVE',
    templateId: 'TPL-FULL',
    hypothesis: {
      id: 'H-1',
      statement: 'Short-horizon reversal earns net-of-cost alpha in liquid US equities.',
      prediction: 'Reversal signal Sharpe > 1.0 net of costs.',
      successCriteria: 'Deflated Sharpe clears the multiple-testing budget.',
      preRegistered: true,
      registeredAt: '2026-06-01T00:00:00.000Z',
    },
    questions: [
      { id: 'Q-1', question: 'Does the effect survive realistic costs?', answered: false },
    ],
    objectives: [
      { id: 'OBJ-1', label: 'Pre-register hypothesis', status: 'MET' },
      { id: 'OBJ-2', label: 'Validate reversal feature', status: 'MET' },
      { id: 'OBJ-3', label: 'Validate reversal signal', status: 'IN_PROGRESS' },
    ],
    stages: stagesFor('SIGNAL_VALIDATION', 'Ada Researcher'),
    dependencies: [
      {
        id: 'D-1',
        stage: 'FEATURE_RESEARCH',
        dependsOnStage: 'DATASET_SELECTION',
        status: 'SATISFIED',
      },
      {
        id: 'D-2',
        stage: 'SIGNAL_VALIDATION',
        dependsOnStage: 'SIGNAL_RESEARCH',
        status: 'PENDING',
      },
    ],
    milestones: [
      {
        id: 'M-1',
        label: 'Feature validated',
        stage: 'FEATURE_VALIDATION',
        status: 'REACHED',
        dueAt: '2026-07-10T00:00:00.000Z',
      },
      {
        id: 'M-2',
        label: 'Signal validated',
        stage: 'SIGNAL_VALIDATION',
        status: 'PENDING',
        dueAt: '2026-08-15T00:00:00.000Z',
      },
    ],
    approvals: [{ id: 'AP-1', role: 'Scientific Governance', status: 'NOT_REQUESTED' }],
    reviews: [
      {
        id: 'RV-1',
        stage: 'FEATURE_VALIDATION',
        reviewer: 'Validation',
        status: 'PASSED',
        reviewedAt: '2026-07-10T00:00:00.000Z',
      },
      { id: 'RV-2', stage: 'SIGNAL_VALIDATION', reviewer: 'Validation', status: 'PENDING' },
    ],
    sessions: [
      {
        id: 'S-1',
        author: 'Ada Researcher',
        summary: 'Built reversal feature set.',
        startedAt: '2026-07-05T00:00:00.000Z',
        endedAt: '2026-07-05T02:00:00.000Z',
      },
    ],
    artifacts: [
      {
        id: 'A-1',
        kind: 'DATASET',
        ref: 'ds-equity-eod',
        name: 'US Equity Prices (EOD)',
        stage: 'DATASET_SELECTION',
      },
      {
        id: 'A-2',
        kind: 'FEATURE',
        ref: 'feat-resid-return',
        name: 'Residual return (1d)',
        stage: 'FEATURE_RESEARCH',
      },
      {
        id: 'A-3',
        kind: 'SIGNAL',
        ref: 'sig-reversal',
        name: 'Reversal signal',
        stage: 'SIGNAL_RESEARCH',
      },
    ],
    notebooks: [{ id: 'NB-1', title: 'Reversal EDA', ref: 'nb-reversal-eda' }],
    tags: ['equity', 'reversal', 'advisory'],
    metadata: [
      { key: 'universe', value: 'US large-cap' },
      { key: 'horizon', value: '1-5d' },
    ],
    version: '1.4.0',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-07-27T00:00:00.000Z',
  },
  {
    id: 'RP-CARRY',
    slug: 'fx-carry-crowding',
    name: 'FX carry with crowding adjustment',
    description: 'Carry strategy research with a crowding-aware overlay.',
    owner: 'Blaise Quant',
    team: 'Macro Research',
    status: 'ACTIVE',
    templateId: 'TPL-FULL',
    hypothesis: {
      id: 'H-2',
      statement: 'Crowding-adjusted FX carry improves risk-adjusted return.',
      prediction: 'Adjusted carry beats naive carry net of costs.',
      successCriteria: 'Positive information ratio after crowding penalty.',
      preRegistered: true,
      registeredAt: '2026-05-15T00:00:00.000Z',
    },
    questions: [
      { id: 'Q-2', question: 'Is the crowding signal robust out-of-sample?', answered: false },
    ],
    objectives: [
      { id: 'OBJ-4', label: 'Assemble carry signal', status: 'MET' },
      { id: 'OBJ-5', label: 'Compose strategy', status: 'IN_PROGRESS' },
    ],
    stages: stagesFor('STRATEGY_RESEARCH', 'Blaise Quant'),
    dependencies: [
      {
        id: 'D-3',
        stage: 'STRATEGY_RESEARCH',
        dependsOnStage: 'SIGNAL_VALIDATION',
        status: 'SATISFIED',
      },
    ],
    milestones: [
      {
        id: 'M-3',
        label: 'Signal validated',
        stage: 'SIGNAL_VALIDATION',
        status: 'REACHED',
        dueAt: '2026-07-01T00:00:00.000Z',
      },
    ],
    approvals: [{ id: 'AP-2', role: 'Scientific Governance', status: 'NOT_REQUESTED' }],
    reviews: [
      {
        id: 'RV-3',
        stage: 'SIGNAL_VALIDATION',
        reviewer: 'Validation',
        status: 'PASSED',
        reviewedAt: '2026-07-01T00:00:00.000Z',
      },
    ],
    sessions: [
      {
        id: 'S-2',
        author: 'Blaise Quant',
        summary: 'Drafted strategy composition.',
        startedAt: '2026-07-22T00:00:00.000Z',
      },
    ],
    artifacts: [
      {
        id: 'A-4',
        kind: 'SIGNAL',
        ref: 'sig-fx-carry',
        name: 'FX carry signal',
        stage: 'SIGNAL_RESEARCH',
      },
      {
        id: 'A-5',
        kind: 'STRATEGY',
        ref: 'str-multi-equity',
        name: 'Multi-signal strategy',
        stage: 'STRATEGY_RESEARCH',
      },
    ],
    notebooks: [],
    tags: ['fx', 'carry', 'crowding'],
    metadata: [{ key: 'universe', value: 'G10 FX' }],
    version: '0.9.0',
    createdAt: '2026-05-15T00:00:00.000Z',
    updatedAt: '2026-07-24T00:00:00.000Z',
  },
  {
    id: 'RP-RATES',
    slug: 'rates-curve-value',
    name: 'Curve value in government rates',
    description: 'End-to-end rates value project awaiting governance approval.',
    owner: 'Cleo Analyst',
    team: 'Rates Research',
    status: 'ACTIVE',
    templateId: 'TPL-FULL',
    hypothesis: {
      id: 'H-3',
      statement: 'Curve value predicts government-rate returns.',
      prediction: 'Value factor is significant after deflation.',
      successCriteria: 'Independent replication passes.',
      preRegistered: true,
      registeredAt: '2026-04-01T00:00:00.000Z',
    },
    questions: [{ id: 'Q-3', question: 'Is capacity sufficient?', answered: true }],
    objectives: [
      { id: 'OBJ-6', label: 'Construct portfolio', status: 'MET' },
      { id: 'OBJ-7', label: 'Pass risk review', status: 'MET' },
      { id: 'OBJ-8', label: 'Obtain approval', status: 'IN_PROGRESS' },
    ],
    stages: stagesFor('APPROVAL', 'Cleo Analyst'),
    dependencies: [
      { id: 'D-4', stage: 'APPROVAL', dependsOnStage: 'RISK_REVIEW', status: 'SATISFIED' },
    ],
    milestones: [
      {
        id: 'M-4',
        label: 'Risk review passed',
        stage: 'RISK_REVIEW',
        status: 'REACHED',
        dueAt: '2026-07-18T00:00:00.000Z',
      },
    ],
    approvals: [{ id: 'AP-3', role: 'Scientific Governance', status: 'PENDING' }],
    reviews: [
      {
        id: 'RV-4',
        stage: 'RISK_REVIEW',
        reviewer: 'Risk Oversight',
        status: 'PASSED',
        reviewedAt: '2026-07-18T00:00:00.000Z',
      },
    ],
    sessions: [
      {
        id: 'S-3',
        author: 'Cleo Analyst',
        summary: 'Prepared approval package.',
        startedAt: '2026-07-25T00:00:00.000Z',
      },
    ],
    artifacts: [
      {
        id: 'A-6',
        kind: 'STRATEGY',
        ref: 'str-reversal-ls',
        name: 'Rates value strategy',
        stage: 'STRATEGY_RESEARCH',
      },
      {
        id: 'A-7',
        kind: 'PORTFOLIO',
        ref: 'port-core',
        name: 'Core portfolio',
        stage: 'PORTFOLIO_CONSTRUCTION',
      },
    ],
    notebooks: [{ id: 'NB-2', title: 'Rates value replication', ref: 'nb-rates-value' }],
    tags: ['rates', 'value', 'approval'],
    metadata: [{ key: 'universe', value: 'G7 rates' }],
    version: '2.0.0',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-07-26T00:00:00.000Z',
  },
  {
    id: 'RP-SEASONAL',
    slug: 'commodity-seasonality',
    name: 'Commodity seasonality (blocked)',
    description: 'Seasonality study blocked at feature validation pending data.',
    owner: 'Dara Researcher',
    team: 'Commodity Research',
    status: 'BLOCKED',
    templateId: 'TPL-FEATURE',
    hypothesis: {
      id: 'H-4',
      statement: 'Seasonal patterns persist in agricultural futures.',
      prediction: 'Seasonality factor is significant.',
      successCriteria: 'Leakage harness clears.',
      preRegistered: true,
      registeredAt: '2026-06-20T00:00:00.000Z',
    },
    questions: [
      { id: 'Q-4', question: 'Is there look-ahead in the seasonal encoding?', answered: false },
    ],
    objectives: [{ id: 'OBJ-9', label: 'Clear leakage harness', status: 'IN_PROGRESS' }],
    stages: stagesFor('FEATURE_VALIDATION', 'Dara Researcher', true),
    dependencies: [
      {
        id: 'D-5',
        stage: 'FEATURE_VALIDATION',
        dependsOnStage: 'FEATURE_RESEARCH',
        status: 'BLOCKED',
      },
    ],
    milestones: [
      {
        id: 'M-5',
        label: 'Feature validated',
        stage: 'FEATURE_VALIDATION',
        status: 'MISSED',
        dueAt: '2026-07-20T00:00:00.000Z',
      },
    ],
    approvals: [{ id: 'AP-4', role: 'Scientific Governance', status: 'NOT_REQUESTED' }],
    reviews: [
      {
        id: 'RV-5',
        stage: 'FEATURE_VALIDATION',
        reviewer: 'Validation',
        status: 'CHANGES_REQUESTED',
        note: 'Potential look-ahead in seasonal encoding.',
        reviewedAt: '2026-07-19T00:00:00.000Z',
      },
    ],
    sessions: [
      {
        id: 'S-4',
        author: 'Dara Researcher',
        summary: 'Investigating leakage flag.',
        startedAt: '2026-07-21T00:00:00.000Z',
      },
    ],
    artifacts: [
      {
        id: 'A-8',
        kind: 'FEATURE',
        ref: 'feat-carry',
        name: 'Seasonality feature',
        stage: 'FEATURE_RESEARCH',
      },
    ],
    notebooks: [],
    tags: ['commodity', 'seasonality', 'blocked'],
    metadata: [{ key: 'universe', value: 'Ags' }],
    version: '0.4.0',
    createdAt: '2026-06-20T00:00:00.000Z',
    updatedAt: '2026-07-21T00:00:00.000Z',
  },
];

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockResearchRepository implements ResearchRepository {
  private readonly latencyMs: number;

  constructor(options: MockRepositoryOptions = {}) {
    this.latencyMs = options.latencyMs ?? 0;
  }

  async listProjects(query: ProjectQuery): Promise<readonly ResearchProject[]> {
    await this.delay();
    return applyProjectQuery(PROJECTS, query);
  }

  async getProject(id: string): Promise<ResearchProject | null> {
    await this.delay();
    return PROJECTS.find((project) => project.id === id) ?? null;
  }

  async listTemplates(): Promise<readonly ResearchTemplate[]> {
    await this.delay();
    return TEMPLATES;
  }

  async getWorkspaceLink(): Promise<WorkspaceLink> {
    await this.delay();
    return { href: '/workspace', pinnedProjects: 3 };
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export const RESEARCH_SEED = { projects: PROJECTS, templates: TEMPLATES } as const;
