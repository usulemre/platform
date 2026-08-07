/**
 * `BinanceFuturesPositionService` — the USDⓈ-M Futures position & risk-configuration facade. It reads
 * canonical positions (`positionRisk`) and owns the Futures-only risk configuration operations:
 * leverage, margin type, position mode and isolated position margin. Each operation is validated
 * pre-flight, invoked through the injected {@link FuturesAccountClient}/{@link FuturesConfigClient}
 * (reusing the resilient signed REST client), mapped to canonical results, and has its errors
 * canonicalized. The account's position mode is cached after it is read so the order service can honour
 * hedge/one-way validation. It reads and configures only — it never places orders.
 */
import { BinanceFuturesValidator } from './validator';
import { BinanceFuturesCapabilityRegistry } from './capability-registry';
import { BinanceFuturesErrorMapper } from './error-mapper';
import { BinanceFuturesPositionMapper } from './position-mapper';
import { BinanceFuturesConfigMapper } from './config-mapper';
import { BinanceFuturesRequestBuilder } from './request-builder';
import { BinanceFuturesMetrics } from './metrics';
import { IDENTITY_SYMBOL_RESOLVER, type SymbolResolver } from '../websocket/event-mapper';
import type { FuturesAccountClient, FuturesConfigClient } from './client';
import type {
  FuturesLeverage,
  FuturesMarginDirection,
  FuturesMarginType,
  FuturesMarginTypeChange,
  FuturesPosition,
  FuturesPositionMarginChange,
  FuturesPositionMode,
  FuturesPositionModeState,
  PositionSide,
} from './types';

export interface BinanceFuturesPositionServiceDeps {
  readonly accountClient: FuturesAccountClient;
  readonly configClient: FuturesConfigClient;
  readonly resolver?: SymbolResolver;
  readonly capabilities?: BinanceFuturesCapabilityRegistry;
  readonly validator?: BinanceFuturesValidator;
  readonly metrics?: BinanceFuturesMetrics;
  readonly clock?: () => number;
}

export class BinanceFuturesPositionService {
  private readonly accountClient: FuturesAccountClient;
  private readonly configClient: FuturesConfigClient;
  private readonly positions: BinanceFuturesPositionMapper;
  private readonly config: BinanceFuturesConfigMapper;
  private readonly builder = new BinanceFuturesRequestBuilder();
  private readonly validator: BinanceFuturesValidator;
  private readonly errors = new BinanceFuturesErrorMapper();
  private readonly metrics: BinanceFuturesMetrics;
  private readonly clock: () => number;
  private cachedMode: FuturesPositionMode = 'ONE_WAY';

  constructor(deps: BinanceFuturesPositionServiceDeps) {
    const resolver = deps.resolver ?? IDENTITY_SYMBOL_RESOLVER;
    this.accountClient = deps.accountClient;
    this.configClient = deps.configClient;
    this.positions = new BinanceFuturesPositionMapper(resolver);
    this.config = new BinanceFuturesConfigMapper(resolver);
    this.validator =
      deps.validator ??
      new BinanceFuturesValidator(deps.capabilities ?? new BinanceFuturesCapabilityRegistry());
    this.metrics = deps.metrics ?? new BinanceFuturesMetrics();
    this.clock = deps.clock ?? Date.now;
  }

  private async run<T>(kind: 'config' | 'read', operation: () => Promise<T>): Promise<T> {
    try {
      const result = await operation();
      this.metrics.onOperation(kind, this.clock());
      return result;
    } catch (error) {
      this.metrics.onError();
      throw this.errors.map(error);
    }
  }

  /** The last-known account position mode (cached; defaults to `ONE_WAY` until first read). */
  positionMode(): FuturesPositionMode {
    return this.cachedMode;
  }

  /* ------------------------------ reads ------------------------------ */

  /** Open positions (drops flat positions). Optionally scoped to a single symbol. */
  getPositions(canonicalSymbol?: string): Promise<readonly FuturesPosition[]> {
    const venue = canonicalSymbol ? this.builder.venueSymbol(canonicalSymbol) : undefined;
    return this.run('read', async () =>
      this.positions.fromPositionRiskMany(await this.accountClient.positionRisk(venue)),
    );
  }

  /** Read the account's position mode and cache it. */
  getPositionMode(): Promise<FuturesPositionModeState> {
    return this.run('read', async () => {
      const state = this.config.positionMode(await this.configClient.getPositionMode());
      this.cachedMode = state.mode;
      return state;
    });
  }

  /* ------------------------------ configuration ------------------------------ */

  /** Change initial leverage on a symbol (validated to an integer within the documented ceiling). */
  setLeverage(canonicalSymbol: string, leverage: number): Promise<FuturesLeverage> {
    const venue = this.builder.venueSymbol(canonicalSymbol);
    return this.run('config', async () => {
      this.validator.validateLeverage(leverage);
      return this.config.leverage(await this.configClient.setLeverage(venue, leverage));
    });
  }

  /** Change margin type (ISOLATED/CROSSED) on a symbol. */
  setMarginType(
    canonicalSymbol: string,
    marginType: FuturesMarginType,
  ): Promise<FuturesMarginTypeChange> {
    const venue = this.builder.venueSymbol(canonicalSymbol);
    return this.run('config', async () =>
      this.config.marginType(
        venue,
        marginType,
        await this.configClient.setMarginType(venue, marginType),
      ),
    );
  }

  /** Change the account's position mode (ONE_WAY/HEDGE) and update the cache. */
  setPositionMode(mode: FuturesPositionMode): Promise<FuturesPositionModeState> {
    return this.run('config', async () => {
      await this.configClient.setPositionMode(mode === 'HEDGE');
      this.cachedMode = mode;
      return { mode };
    });
  }

  /** Adjust isolated position margin (add or reduce). */
  modifyPositionMargin(
    canonicalSymbol: string,
    amount: number,
    direction: FuturesMarginDirection,
    positionSide?: PositionSide,
  ): Promise<FuturesPositionMarginChange> {
    const venue = this.builder.venueSymbol(canonicalSymbol);
    return this.run('config', async () => {
      this.validator.validatePositionMargin(amount, direction);
      const params = this.builder.buildPositionMargin(
        canonicalSymbol,
        amount,
        direction,
        positionSide,
      );
      return this.config.positionMargin(
        venue,
        direction,
        await this.configClient.modifyPositionMargin(params),
      );
    });
  }
}
