# experiment-service — Experiment Service implemented in Phase 2.3

This service contains the Experiment Service (the `experiment_service` package): the experiment
aggregate, lifecycle, registration, configuration, metadata, ownership, classification, dependency
management, execution coordination, validation coordination, archival, service/repository interfaces,
policies, specifications, domain events, and errors. Statistical algorithms, backtesting execution,
persistence, infrastructure, and APIs remain forbidden here. Adjudication belongs to the deterministic
Validation/Quant engines; execution belongs to the Backtesting engine.
