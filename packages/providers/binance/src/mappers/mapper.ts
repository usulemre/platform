/**
 * `BinanceMapper` — the aggregate mapping facade. It bundles the per-concern mappers (symbol, order,
 * trade, balance, position, execution, market data) behind one object so the REST/WebSocket clients
 * and the provider depend on a single injectable seam. All venue-vocabulary translation for a given
 * market is reached through here; nothing outside the mappers touches Binance field names.
 */
import { BinanceBalanceMapper } from './balance-mapper';
import { BinanceExecutionMapper } from './execution-mapper';
import { BinanceMarketDataMapper } from './market-data-mapper';
import { BinanceOrderMapper } from './order-mapper';
import { BinancePositionMapper } from './position-mapper';
import { BinanceSymbolMapper } from './symbol-mapper';
import { BinanceTradeMapper } from './trade-mapper';
import type { BinanceMarket } from '../constants';

export class BinanceMapper {
  readonly market: BinanceMarket;
  readonly symbols: BinanceSymbolMapper;
  readonly orders: BinanceOrderMapper;
  readonly trades: BinanceTradeMapper;
  readonly balances: BinanceBalanceMapper;
  readonly positions: BinancePositionMapper;
  readonly executions: BinanceExecutionMapper;
  readonly marketData: BinanceMarketDataMapper;

  constructor(market: BinanceMarket) {
    this.market = market;
    this.symbols = new BinanceSymbolMapper(market);
    this.orders = new BinanceOrderMapper(this.symbols);
    this.trades = new BinanceTradeMapper(this.symbols);
    this.balances = new BinanceBalanceMapper();
    this.positions = new BinancePositionMapper(this.symbols);
    this.executions = new BinanceExecutionMapper(this.symbols);
    this.marketData = new BinanceMarketDataMapper(this.symbols);
  }
}
