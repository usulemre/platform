import { InfoCard, Timeline } from './agent-atoms';
import type { ActivityEventVm, AgentVersionVm, TimelineStepVm } from '../domain/view-model';

/** Agent lifecycle timeline (registration → evaluation → active → retirement). */
export function AgentLifecycle({ steps }: { steps: readonly TimelineStepVm[] }) {
  return (
    <InfoCard title="Lifecycle">
      <Timeline steps={steps} />
    </InfoCard>
  );
}

/** Activity timeline (agent history — recent events). */
export function ActivityTimeline({ events }: { events: readonly ActivityEventVm[] }) {
  return (
    <InfoCard title="Activity">
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity.</p>
      ) : (
        <ol className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="flex items-start gap-3 text-sm">
              <span
                aria-hidden
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/50"
              />
              <div className="flex flex-1 items-center justify-between gap-2">
                <span>
                  {event.label}
                  {event.actor ? (
                    <span className="ml-1 text-xs text-muted-foreground">· {event.actor}</span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {event.occurredLabel}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </InfoCard>
  );
}

/** Agent versioning panel. */
export function AgentVersions({ versions }: { versions: readonly AgentVersionVm[] }) {
  return (
    <InfoCard title="Versions">
      {versions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No version history.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {versions.map((version) => (
            <li
              key={version.version}
              className="flex items-center justify-between gap-4 border-b py-1"
            >
              <span className="font-medium">{version.version}</span>
              <span className="truncate text-muted-foreground">{version.note}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {version.registeredLabel}
              </span>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}
