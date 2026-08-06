import { InfoCard, KeyValueList, StatusBadge } from './market-atoms';
import type {
  CoverageVm,
  MetadataRowVm,
  QualityVm,
  TimeSeriesVm,
  VersionVm,
} from '../domain/view-model';

/** Data coverage panel (Data Coverage). */
export function CoveragePanel({ coverage }: { coverage: CoverageVm }) {
  return (
    <InfoCard title="Coverage">
      <div className="space-y-2 text-sm">
        <p className="flex items-center gap-2">
          <StatusBadge label={coverage.status.label} tone={coverage.status.tone} />
          <span className="text-xs text-muted-foreground">
            {coverage.completeness} complete · {coverage.gaps} gap{coverage.gaps === 1 ? '' : 's'}
          </span>
        </p>
        <p className="text-muted-foreground">
          Range: <span className="font-medium text-foreground">{coverage.range}</span>
        </p>
      </div>
    </InfoCard>
  );
}

/** Data quality panel (Data Quality Overview, per-dataset). */
export function QualityPanel({ quality }: { quality: QualityVm }) {
  return (
    <InfoCard title="Quality">
      <div className="space-y-2 text-sm">
        <p className="flex items-center gap-2">
          <StatusBadge label={quality.grade.label} tone={quality.grade.tone} />
          {quality.checkedLabel ? (
            <span className="text-xs text-muted-foreground">Checked {quality.checkedLabel}</span>
          ) : null}
        </p>
        <p className="text-xs text-muted-foreground">
          {quality.completeness} complete · {quality.validity} valid
        </p>
      </div>
    </InfoCard>
  );
}

/** Data version explorer panel (Data Version Explorer). */
export function VersionsPanel({ versions }: { versions: readonly VersionVm[] }) {
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
                {version.rows} rows · {version.createdLabel}
              </span>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Metadata explorer panel (Metadata Explorer). */
export function MetadataPanel({ title, rows }: { title: string; rows: readonly MetadataRowVm[] }) {
  return (
    <InfoCard title={title}>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No metadata.</p>
      ) : (
        <KeyValueList rows={rows} />
      )}
    </InfoCard>
  );
}

/** Time series explorer panel (Time Series Explorer). */
export function TimeSeriesPanel({ series }: { series: readonly TimeSeriesVm[] }) {
  return (
    <InfoCard title="Time series">
      {series.length === 0 ? (
        <p className="text-sm text-muted-foreground">No time series available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Available time series</caption>
            <thead className="border-b text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="py-1 pr-4">
                  Type
                </th>
                <th scope="col" className="py-1 pr-4">
                  Timeframe
                </th>
                <th scope="col" className="py-1 pr-4">
                  Range
                </th>
                <th scope="col" className="py-1">
                  Points
                </th>
              </tr>
            </thead>
            <tbody>
              {series.map((row) => (
                <tr key={`${row.datasetId}-${row.timeframe}`} className="border-b last:border-0">
                  <td className="py-1 pr-4">{row.marketDataType}</td>
                  <td className="py-1 pr-4">{row.timeframe}</td>
                  <td className="py-1 pr-4">{row.range}</td>
                  <td className="py-1 tabular-nums">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </InfoCard>
  );
}
