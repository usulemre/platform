# configuration — implemented in Phase 1.5

This package now contains the Configuration Foundation (the `platform_configuration` package): the
configuration model (secrets by reference only), schema, metadata, validation interfaces, policies,
versioning, scope, profiles, lifecycle, and registry. Loading, environment parsing, secret storage,
persistence, and infrastructure remain forbidden here. The concrete config loader and secrets broker
(OpenBao, per the TDR) plug in behind these abstractions.
