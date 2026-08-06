# portfolio-service — Portfolio Engine implemented in Phase 2.8

This service contains the Portfolio Engine (the `portfolio_service` package): the portfolio aggregate,
candidate, lifecycle, construction, allocation, constraints, diversification, exposure, rebalancing,
validation coordination, reporting, registry integration, optimization interface, service/repository
interfaces, policies, specifications, domain events, and errors. Optimization algorithms, allocation
mathematics, trade execution, order management, broker/market connectivity, persistence, infrastructure,
and APIs remain forbidden here. The deterministic optimizer plugs in behind the interface; execution
belongs to the Execution Layer.
