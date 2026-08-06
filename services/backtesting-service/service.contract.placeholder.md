# backtesting-service — Backtesting Engine implemented in Phase 2.5

This service contains the Backtesting Engine (the `backtesting_service` package): the backtest
aggregate, session, scenario, configuration, execution context, historical-simulation coordination,
validation coordination, performance reporting, result management, scenario comparison, reproducibility
management, engine/runner interfaces, lifecycle, policies, specifications, domain events, errors, and
repositories. Simulation algorithms, statistical calculations, production execution, broker/market
connectivity, persistence, infrastructure, and APIs remain forbidden here. Significance is the
deterministic Statistics/Validation engines' domain; execution is the Execution Layer's.
