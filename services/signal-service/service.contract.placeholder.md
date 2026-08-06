# signal-service — Signal Engine implemented in Phase 2.7

This service contains the Signal Engine (the `signal_service` package): the signal aggregate,
lifecycle, generation, classification, validation coordination, ranking, scoring, approval, registry
integration, metadata, governance, decision model, dependencies, service/repository interfaces,
policies, specifications, domain events, and errors. Signal-generation algorithms, ranking algorithms,
scoring formulas, ML, portfolio construction, execution authority, broker integration, persistence,
infrastructure, and APIs remain forbidden here. The deterministic scoring/ranking engines plug in
behind the interfaces; portfolio construction and execution belong to their own layers.
