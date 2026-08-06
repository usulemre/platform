/**
 * Dataset application service — the ONLY layer the UI/hooks call ("do not bypass
 * the application layer"). It orchestrates the repository and maps canonical DTOs
 * to view models. It contains no infrastructure and no UI. Governed state changes
 * (certification, retirement) are NOT performed here — they run through governed
 * workflows (WCON-2); v1 is read-only presentation.
 */
import type { DatasetDetailVm, DatasetListItemVm } from '../domain/view-model';
import { toDetailVm, toListItemVm } from '../domain/mappers';
import type { DatasetQuery } from '../domain/query';
import type { DatasetRepository } from '../data/repository';

export class DatasetService {
  constructor(private readonly repository: DatasetRepository) {}

  async listDatasets(query: DatasetQuery = {}): Promise<DatasetListItemVm[]> {
    const datasets = await this.repository.list(query);
    return datasets.map(toListItemVm);
  }

  async getDataset(id: string): Promise<DatasetDetailVm | null> {
    const dataset = await this.repository.getById(id);
    return dataset ? toDetailVm(dataset) : null;
  }
}
