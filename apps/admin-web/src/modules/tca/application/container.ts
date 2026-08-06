/**
 * Composition root for the TCA UI module (trading-web). The single place a concrete repository is
 * bound. Replace MockTcaRepository with an API-backed repository over the tca-service gateway to go
 * live — no UI/hook/service changes.
 */
import { MockTcaRepository } from '../data/mock-repository';
import { TcaViewService } from './tca-view-service';

export type { ReportGroupBy, ScorecardDimension } from './tca-view-service';

export const tcaViewService = new TcaViewService(new MockTcaRepository());
