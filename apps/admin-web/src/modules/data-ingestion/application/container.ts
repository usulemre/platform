/**
 * Composition root for the data-ingestion admin module. The single place a
 * concrete repository is bound. Replace MockDataIngestionRepository with
 * `new ApiDataIngestionRepository(apiClient)` (over the data-ingestion service
 * gateway) to go live — no UI/hook/service changes.
 */
import { MockDataIngestionRepository } from '../data/mock-repository';
import { DataIngestionService } from './data-ingestion-service';

export const dataIngestionService = new DataIngestionService(new MockDataIngestionRepository());
