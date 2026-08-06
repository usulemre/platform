# risk-service — Risk Engine implemented in Phase 2.6

This service contains the Risk Engine (the `risk_service` package): the risk assessment aggregate,
lifecycle, assessment, policies, constraints, exposure governance, limit management, classification,
approval, reporting, validation coordination, review, evaluation pipeline, service/repository
interfaces, specifications, domain events, and errors. Numerical risk algorithms, VaR calculations,
stress-testing algorithms, execution authority, broker integration, persistence, infrastructure, and
APIs remain forbidden here. Numerical computation plugs in behind the interfaces as deterministic,
golden-tested engines; execution belongs to the Execution Layer.
