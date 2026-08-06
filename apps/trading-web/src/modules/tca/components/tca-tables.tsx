import Link from 'next/link';
import type {
  BenchmarkRowVm,
  CommissionRowVm,
  ExecutionRowVm,
  ImpactRowVm,
  SlippageRowVm,
  TimelineRowVm,
  VenueRowVm,
} from '../domain/view-model';
import { ChipBadge, StatusBadge, TcaEmpty, ToneText } from './tca-atoms';

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`px-3 py-1.5 font-medium ${right ? 'text-right' : 'text-left'}`}>{children}</th>
  );
}
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function ExecutionTable({
  rows,
  hrefBase = '/tca/executions',
  emptyLabel = 'No executions.',
}: {
  rows: readonly ExecutionRowVm[];
  hrefBase?: string;
  emptyLabel?: string;
}) {
  if (rows.length === 0) return <TcaEmpty label={emptyLabel} />;
  return (
    <Shell>
      <thead className="bg-muted/50">
        <tr>
          <Th>Execution</Th>
          <Th>Symbol</Th>
          <Th>Side</Th>
          <Th>Venue</Th>
          <Th right>Qty</Th>
          <Th right>Notional</Th>
          <Th right>Slippage</Th>
          <Th right>Total cost</Th>
          <Th right>Score</Th>
          <Th>Grade</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t hover:bg-accent/40">
            <td className="px-3 py-1 font-mono text-xs">
              <Link href={`${hrefBase}/${row.id}`} className="underline-offset-2 hover:underline">
                {row.id}
              </Link>
            </td>
            <td className="px-3 py-1 font-medium">{row.symbol}</td>
            <td className="px-3 py-1">
              <ChipBadge chip={row.side} />
            </td>
            <td className="px-3 py-1">{row.venue}</td>
            <td className="px-3 py-1 text-right font-mono">{row.quantity}</td>
            <td className="px-3 py-1 text-right font-mono">{row.notional}</td>
            <td className="px-3 py-1 text-right">
              <ToneText value={row.slippageBps} tone={row.totalCostTone} />
            </td>
            <td className="px-3 py-1 text-right">
              <ToneText value={row.totalCostBps} tone={row.totalCostTone} />
            </td>
            <td className="px-3 py-1 text-right font-mono">{row.score}</td>
            <td className="px-3 py-1">
              <ChipBadge chip={row.grade} />
            </td>
          </tr>
        ))}
      </tbody>
    </Shell>
  );
}

export function SlippageTable({ rows }: { rows: readonly SlippageRowVm[] }) {
  if (rows.length === 0) return <TcaEmpty label="No executions." />;
  return (
    <Shell>
      <thead className="bg-muted/50">
        <tr>
          <Th>Execution</Th>
          <Th>Symbol</Th>
          <Th>Side</Th>
          <Th>Venue</Th>
          <Th right>vs Arrival</Th>
          <Th right>vs VWAP</Th>
          <Th right>vs TWAP</Th>
          <Th right>vs Decision</Th>
          <Th right>vs Mid</Th>
          <Th right>vs Close</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t hover:bg-accent/40">
            <td className="px-3 py-1 font-mono text-xs">{row.id}</td>
            <td className="px-3 py-1 font-medium">{row.symbol}</td>
            <td className="px-3 py-1">
              <ChipBadge chip={row.side} />
            </td>
            <td className="px-3 py-1">{row.venue}</td>
            <td className="px-3 py-1 text-right">
              <ToneText value={row.vsArrival} tone={row.vsArrivalTone} />
            </td>
            <td className="px-3 py-1 text-right font-mono">{row.vsVwap}</td>
            <td className="px-3 py-1 text-right font-mono">{row.vsTwap}</td>
            <td className="px-3 py-1 text-right font-mono">{row.vsDecision}</td>
            <td className="px-3 py-1 text-right font-mono">{row.vsMid}</td>
            <td className="px-3 py-1 text-right font-mono">{row.vsClose}</td>
          </tr>
        ))}
      </tbody>
    </Shell>
  );
}

export function CommissionTable({ rows }: { rows: readonly CommissionRowVm[] }) {
  if (rows.length === 0) return <TcaEmpty label="No executions." />;
  return (
    <Shell>
      <thead className="bg-muted/50">
        <tr>
          <Th>Execution</Th>
          <Th>Symbol</Th>
          <Th>Venue</Th>
          <Th right>Notional</Th>
          <Th right>Commission</Th>
          <Th right>Commission bps</Th>
          <Th right>Per share</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t hover:bg-accent/40">
            <td className="px-3 py-1 font-mono text-xs">{row.id}</td>
            <td className="px-3 py-1 font-medium">{row.symbol}</td>
            <td className="px-3 py-1">{row.venue}</td>
            <td className="px-3 py-1 text-right font-mono">{row.notional}</td>
            <td className="px-3 py-1 text-right font-mono">{row.commission}</td>
            <td className="px-3 py-1 text-right font-mono">{row.commissionBps}</td>
            <td className="px-3 py-1 text-right font-mono">{row.perShare}</td>
          </tr>
        ))}
      </tbody>
    </Shell>
  );
}

export function ImpactTable({ rows }: { rows: readonly ImpactRowVm[] }) {
  if (rows.length === 0) return <TcaEmpty label="No executions." />;
  return (
    <Shell>
      <thead className="bg-muted/50">
        <tr>
          <Th>Execution</Th>
          <Th>Symbol</Th>
          <Th>Side</Th>
          <Th>Venue</Th>
          <Th right>Total impact</Th>
          <Th right>Permanent</Th>
          <Th right>Temporary</Th>
          <Th right>Eff. spread</Th>
          <Th right>Real. spread</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t hover:bg-accent/40">
            <td className="px-3 py-1 font-mono text-xs">{row.id}</td>
            <td className="px-3 py-1 font-medium">{row.symbol}</td>
            <td className="px-3 py-1">
              <ChipBadge chip={row.side} />
            </td>
            <td className="px-3 py-1">{row.venue}</td>
            <td className="px-3 py-1 text-right">
              <ToneText value={row.totalBps} tone={row.totalTone} />
            </td>
            <td className="px-3 py-1 text-right font-mono">{row.permanentBps}</td>
            <td className="px-3 py-1 text-right font-mono">{row.temporaryBps}</td>
            <td className="px-3 py-1 text-right font-mono">{row.effectiveSpreadBps}</td>
            <td className="px-3 py-1 text-right font-mono">{row.realizedSpreadBps}</td>
          </tr>
        ))}
      </tbody>
    </Shell>
  );
}

export function VenueTable({ rows }: { rows: readonly VenueRowVm[] }) {
  if (rows.length === 0) return <TcaEmpty label="No venues." />;
  return (
    <Shell>
      <thead className="bg-muted/50">
        <tr>
          <Th>Venue</Th>
          <Th right>Executions</Th>
          <Th right>Notional</Th>
          <Th right>Slippage</Th>
          <Th right>Impact</Th>
          <Th right>Commission</Th>
          <Th right>Total cost</Th>
          <Th right>Score</Th>
          <Th>Grade</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.venueId} className="border-t hover:bg-accent/40">
            <td className="px-3 py-1 font-medium">{row.venueId}</td>
            <td className="px-3 py-1 text-right font-mono">{row.executions}</td>
            <td className="px-3 py-1 text-right font-mono">{row.totalNotional}</td>
            <td className="px-3 py-1 text-right font-mono">{row.avgSlippageBps}</td>
            <td className="px-3 py-1 text-right font-mono">{row.avgMarketImpactBps}</td>
            <td className="px-3 py-1 text-right font-mono">{row.avgCommissionBps}</td>
            <td className="px-3 py-1 text-right">
              <ToneText value={row.avgTotalCostBps} tone={row.avgTotalCostTone} />
            </td>
            <td className="px-3 py-1 text-right font-mono">{row.avgScore}</td>
            <td className="px-3 py-1">
              <ChipBadge chip={row.grade} />
            </td>
          </tr>
        ))}
      </tbody>
    </Shell>
  );
}

export function BenchmarkTable({ rows }: { rows: readonly BenchmarkRowVm[] }) {
  if (rows.length === 0) return <TcaEmpty label="Select an execution." />;
  return (
    <Shell>
      <thead className="bg-muted/50">
        <tr>
          <Th>Benchmark</Th>
          <Th>Category</Th>
          <Th right>Price</Th>
          <Th right>Slippage</Th>
          <Th right>Currency</Th>
          <Th>Result</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.type} className="border-t hover:bg-accent/40">
            <td className="px-3 py-1 font-medium">{row.label}</td>
            <td className="px-3 py-1 text-xs text-muted-foreground">
              {row.category.replace(/_/g, ' ').toLowerCase()}
            </td>
            <td className="px-3 py-1 text-right font-mono">{row.price}</td>
            <td className="px-3 py-1 text-right">
              <ToneText value={row.slippageBps} tone={row.slippageTone} />
            </td>
            <td className="px-3 py-1 text-right font-mono">{row.slippageCurrency}</td>
            <td className="px-3 py-1">
              <StatusBadge label={row.favorable.label} tone={row.favorable.tone} />
            </td>
          </tr>
        ))}
      </tbody>
    </Shell>
  );
}

export function TimelineTable({ rows }: { rows: readonly TimelineRowVm[] }) {
  if (rows.length === 0) return <TcaEmpty label="No executions." />;
  return (
    <Shell>
      <thead className="bg-muted/50">
        <tr>
          <Th>Time</Th>
          <Th>Execution</Th>
          <Th>Symbol</Th>
          <Th>Side</Th>
          <Th>Venue</Th>
          <Th>Mode</Th>
          <Th right>Total cost</Th>
          <Th>Grade</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t hover:bg-accent/40">
            <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
              {row.executedAtLabel}
            </td>
            <td className="px-3 py-1 font-mono text-xs">{row.id}</td>
            <td className="px-3 py-1 font-medium">{row.symbol}</td>
            <td className="px-3 py-1">
              <ChipBadge chip={row.side} />
            </td>
            <td className="px-3 py-1">{row.venue}</td>
            <td className="px-3 py-1">
              <ChipBadge chip={row.mode} />
            </td>
            <td className="px-3 py-1 text-right">
              <ToneText value={row.totalCostBps} tone={row.totalCostTone} />
            </td>
            <td className="px-3 py-1">
              <ChipBadge chip={row.grade} />
            </td>
          </tr>
        ))}
      </tbody>
    </Shell>
  );
}
