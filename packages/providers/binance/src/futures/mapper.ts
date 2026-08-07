/**
 * `BinanceFuturesMapper` — the aggregate façade over the USDⓈ-M Futures mappers (order, position,
 * account, config, metadata), constructed once with a shared symbol {@link SymbolResolver} so every
 * canonical projection names instruments consistently. It exposes the canonical Futures domain to the
 * services and never lets a Binance-specific DTO cross the provider boundary. Holds no state beyond its
 * mappers; pure and deterministic.
 */
import { IDENTITY_SYMBOL_RESOLVER, type SymbolResolver } from '../websocket/event-mapper';
import { BinanceFuturesOrderMapper } from './order-mapper';
import { BinanceFuturesPositionMapper } from './position-mapper';
import { BinanceFuturesAccountMapper } from './account-mapper';
import { BinanceFuturesConfigMapper } from './config-mapper';
import { BinanceFuturesMetadataMapper } from './metadata-mapper';

export class BinanceFuturesMapper {
  readonly orders: BinanceFuturesOrderMapper;
  readonly positions: BinanceFuturesPositionMapper;
  readonly account: BinanceFuturesAccountMapper;
  readonly config: BinanceFuturesConfigMapper;
  readonly metadata: BinanceFuturesMetadataMapper;

  constructor(resolver: SymbolResolver = IDENTITY_SYMBOL_RESOLVER) {
    this.orders = new BinanceFuturesOrderMapper();
    this.positions = new BinanceFuturesPositionMapper(resolver);
    this.account = new BinanceFuturesAccountMapper(resolver);
    this.config = new BinanceFuturesConfigMapper(resolver);
    this.metadata = new BinanceFuturesMetadataMapper(resolver);
  }
}
