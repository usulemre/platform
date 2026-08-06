'use client';

import { useCalendar, useSessions } from '../hooks/use-market-data';
import { InfoCard, MarketEmpty, MarketError, MarketLoading, StatusBadge } from './market-atoms';

/** Trading Sessions — trading hours and current session state per exchange. */
export function TradingSessions() {
  const { data, isLoading, isError, refetch } = useSessions();
  return (
    <InfoCard title="Trading sessions">
      {isLoading ? (
        <MarketLoading />
      ) : isError ? (
        <MarketError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <MarketEmpty label="No sessions configured." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Trading sessions</caption>
            <thead className="border-b text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="py-1 pr-4">
                  Exchange
                </th>
                <th scope="col" className="py-1 pr-4">
                  Session
                </th>
                <th scope="col" className="py-1 pr-4">
                  Hours
                </th>
                <th scope="col" className="py-1 pr-4">
                  Days
                </th>
                <th scope="col" className="py-1">
                  State
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((session) => (
                <tr key={session.id} className="border-b last:border-0">
                  <td className="py-1 pr-4 font-mono text-xs">{session.exchangeId}</td>
                  <td className="py-1 pr-4">{session.name}</td>
                  <td className="py-1 pr-4">
                    {session.hours}{' '}
                    <span className="text-xs text-muted-foreground">{session.timezone}</span>
                  </td>
                  <td className="py-1 pr-4 text-xs text-muted-foreground">{session.days}</td>
                  <td className="py-1">
                    <StatusBadge label={session.state.label} tone={session.state.tone} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </InfoCard>
  );
}

/** Market Calendar — market events and holiday calendars per exchange. */
export function MarketCalendar() {
  const { data, isLoading, isError, refetch } = useCalendar();
  return (
    <div className="space-y-6">
      <InfoCard title="Market events">
        {isLoading ? (
          <MarketLoading />
        ) : isError ? (
          <MarketError onRetry={() => refetch()} />
        ) : !data || data.events.length === 0 ? (
          <MarketEmpty label="No upcoming market events." />
        ) : (
          <ul className="space-y-1 text-sm">
            {data.events.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-4 border-b py-1">
                <span>
                  <StatusBadge label={event.type.label} tone={event.type.tone} />{' '}
                  <span className="font-medium">{event.label}</span>{' '}
                  <span className="font-mono text-xs text-muted-foreground">
                    {event.exchangeId}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{event.dateLabel}</span>
              </li>
            ))}
          </ul>
        )}
      </InfoCard>

      <InfoCard title="Holiday calendars">
        {isLoading ? (
          <MarketLoading />
        ) : isError ? (
          <MarketError onRetry={() => refetch()} />
        ) : !data || data.calendars.length === 0 ? (
          <MarketEmpty label="No holiday calendars." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.calendars.map((calendar) => (
              <div key={calendar.id}>
                <h3 className="mb-1 text-sm font-semibold">{calendar.name}</h3>
                <ul className="space-y-0.5 text-sm">
                  {calendar.holidays.map((holiday) => (
                    <li key={holiday.date} className="flex justify-between gap-3 border-b py-0.5">
                      <span className="text-muted-foreground">{holiday.name}</span>
                      <span className="shrink-0 font-mono text-xs">{holiday.date}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </InfoCard>

      <TradingSessions />
    </div>
  );
}
