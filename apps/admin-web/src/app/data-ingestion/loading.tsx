import { IngestionLoading } from '@/modules/data-ingestion';

/** Route-level loading state for the Data Ingestion Pipeline. */
export default function DataIngestionLoading() {
  return <IngestionLoading rows={6} />;
}
