import { InfoCard, Timeline } from './connector-atoms';
import type { ActivityEventVm, ConnectorVersionVm, TimelineStepVm } from '../domain/view-model';

/** Connector lifecycle timeline (registered → configured → enabled → retirement). */
export function ConnectorLifecycle({ steps }: { steps: readonly TimelineStepVm[] }) {
  return (
    <InfoCard title="Lifecycle">
      <Timeline steps={steps} />
    </InfoCard>
  );
}

/** Connector activity timeline (recent operational/administrative events). */
export function ConnectorActivity({ events }: { events: readonly ActivityEventVm[] }) {
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

/** Connector versioning panel. */
export function ConnectorVersions({ versions }: { versions: readonly ConnectorVersionVm[] }) {
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
              <span className="font-medium">
                {version.version}
                {version.apiVersion ? (
                  <span className="ml-1 font-mono text-xs text-muted-foreground">
                    API {version.apiVersion}
                  </span>
                ) : null}
              </span>
              <span className="truncate text-muted-foreground">{version.note}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {version.releasedLabel}
              </span>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}
