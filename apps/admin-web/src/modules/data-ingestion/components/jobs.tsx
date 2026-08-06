'use client';

import { useDeadLetterJobs, useFailedJobs, useRetryQueue } from '../hooks/use-ingestion';
import { IngestionError, IngestionLoading, InfoCard, JobsTable } from './ingestion-atoms';

/** Failed Jobs — jobs whose latest attempt failed and await a retry decision. */
export function FailedJobs() {
  const { data, isLoading, isError, refetch } = useFailedJobs();
  return (
    <InfoCard title="Failed jobs">
      {isLoading ? (
        <IngestionLoading />
      ) : isError ? (
        <IngestionError onRetry={() => refetch()} />
      ) : (
        <JobsTable jobs={data ?? []} emptyLabel="No failed jobs." />
      )}
    </InfoCard>
  );
}

/** Retry Queue — jobs currently retrying or awaiting a retry, plus the
 *  dead-letter queue of jobs that exhausted their retry budget. */
export function RetryQueue() {
  const retry = useRetryQueue();
  const dead = useDeadLetterJobs();
  return (
    <div className="space-y-6">
      <InfoCard title="Retry queue">
        {retry.isLoading ? (
          <IngestionLoading />
        ) : retry.isError ? (
          <IngestionError onRetry={() => retry.refetch()} />
        ) : (
          <JobsTable jobs={retry.data ?? []} emptyLabel="Retry queue is empty." />
        )}
      </InfoCard>
      <InfoCard title="Dead-letter queue">
        {dead.isLoading ? (
          <IngestionLoading />
        ) : dead.isError ? (
          <IngestionError onRetry={() => dead.refetch()} />
        ) : (
          <JobsTable jobs={dead.data ?? []} emptyLabel="Dead-letter queue is empty." />
        )}
      </InfoCard>
    </div>
  );
}
