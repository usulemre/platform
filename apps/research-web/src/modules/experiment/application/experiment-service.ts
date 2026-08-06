/**
 * Experiment application service — the ONLY layer the UI/hooks call. It
 * orchestrates the repository, maps canonical DTOs to view models, and computes
 * the dashboard summary (pure aggregation — NOT statistics). No infrastructure,
 * no UI, no experiment execution. Lifecycle transitions run through governed
 * workflows (WCON-2), not this service; v1 is read-only presentation.
 */
import type {
  ExperimentDetailVm,
  ExperimentListItemVm,
  ExperimentSummaryVm,
} from '../domain/view-model';
import { toDetailVm, toListItemVm, toSummaryVm } from '../domain/mappers';
import type { ExperimentQuery } from '../domain/query';
import type { ExperimentRepository } from '../data/repository';

export class ExperimentService {
  constructor(private readonly repository: ExperimentRepository) {}

  async listExperiments(query: ExperimentQuery = {}): Promise<ExperimentListItemVm[]> {
    const experiments = await this.repository.list(query);
    return experiments.map(toListItemVm);
  }

  async getExperiment(id: string): Promise<ExperimentDetailVm | null> {
    const experiment = await this.repository.getById(id);
    return experiment ? toDetailVm(experiment) : null;
  }

  async getSummary(): Promise<ExperimentSummaryVm> {
    const experiments = await this.repository.list({});
    return toSummaryVm(experiments);
  }
}
