# data-connectors — implemented in Phase 3.1

This shared library contains the Data Connectors Framework (the `data_connectors` package): connector
core + connector-type abstractions, provider model, provider registry, connector factory, connector
lifecycle, configuration, authentication abstractions, request/response models, health monitoring,
retry & rate-limit policies, connector metadata, and the error model. Provider APIs, REST/WebSocket
clients, authentication logic, and infrastructure remain forbidden here. Concrete provider adapters
plug in behind these canonical interfaces; raw responses are opaque and quarantine-bound.
