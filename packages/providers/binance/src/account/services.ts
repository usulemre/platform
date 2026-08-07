/**
 * `BinanceBalanceService`, `BinancePositionService` and `BinanceAccountService` — the snapshot-read
 * services that turn the account clients' raw reads into validated canonical models. They are
 * market-aware (Spot balances vs Futures wallet balances; positions are Futures-only) and reuse the
 * account mappers and validators. They read only — no orders. Errors are canonicalized by the caller
 * (the snapshot manager / synchronizer). Deterministic given their clients.
 */
import { AccountMapper, BalanceMapper, PositionMapper } from './mappers';
import type { SymbolResolver } from '../websocket/event-mapper';
import type { BinanceMarket } from '../constants';
import type { BinanceAccountClient, BinanceBalanceClient, BinancePositionClient } from './clients';
import type { AccountBalance, AccountPosition, AccountState } from './canonical';

export class BinanceBalanceService {
  private readonly mapper = new BalanceMapper();

  constructor(
    private readonly market: BinanceMarket,
    private readonly client: BinanceBalanceClient,
  ) {}

  /** All non-zero asset balances (Spot free/locked; Futures wallet/available). */
  async getBalances(): Promise<readonly AccountBalance[]> {
    if (this.market === 'FUTURES') {
      return this.mapper
        .fromFuturesMany(await this.client.futuresBalances())
        .filter((b) => b.free !== 0 || b.locked !== 0 || (b.walletBalance ?? 0) !== 0);
    }
    return this.mapper
      .fromSpotMany(await this.client.spotBalances())
      .filter((b) => b.free > 0 || b.locked > 0);
  }
}

export class BinancePositionService {
  private readonly mapper: PositionMapper;

  constructor(
    private readonly market: BinanceMarket,
    private readonly client: BinancePositionClient,
    resolver?: SymbolResolver,
  ) {
    this.mapper = new PositionMapper(resolver);
  }

  /** Open positions (Futures only; Spot returns an empty set). Flat positions are dropped. */
  async getPositions(): Promise<readonly AccountPosition[]> {
    if (this.market !== 'FUTURES') return [];
    return this.mapper
      .fromPositionRiskMany(await this.client.positionRisk())
      .filter((p) => p.positionAmount !== 0);
  }
}

export interface BinanceAccountServiceDeps {
  readonly market: BinanceMarket;
  readonly accountClient: BinanceAccountClient;
  readonly balanceService: BinanceBalanceService;
  readonly positionService: BinancePositionService;
  readonly clock?: () => number;
}

export class BinanceAccountService {
  private readonly accountMapper: AccountMapper;
  private readonly deps: BinanceAccountServiceDeps;
  private readonly clock: () => number;

  constructor(deps: BinanceAccountServiceDeps) {
    this.deps = deps;
    this.accountMapper = new AccountMapper(deps.market);
    this.clock = deps.clock ?? Date.now;
  }

  /** Read a full, validated canonical account state (metadata + balances + positions). */
  async getAccountState(): Promise<AccountState> {
    const [account, balances, positions] = await Promise.all([
      this.deps.accountClient.account().catch(() => undefined),
      this.deps.balanceService.getBalances(),
      this.deps.positionService.getPositions(),
    ]);
    const metadata = account
      ? this.accountMapper.metadata(account)
      : { permissions: this.deps.market === 'SPOT' ? ['SPOT'] : ['FUTURES'] };
    return {
      market: this.deps.market,
      accountType: metadata.accountType,
      canTrade: metadata.canTrade,
      permissions: metadata.permissions,
      balances,
      positions,
      updateTime: account?.updateTime ?? this.clock(),
    };
  }
}
