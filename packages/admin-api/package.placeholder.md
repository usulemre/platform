# admin-api — implemented in Phase 3.7

This shared library contains the Admin API administrative interface (the `admin_api` package): API
core models, canonical admin responses, administrative route hierarchy, controller interfaces,
validation/authorization/workflow/governance/audit integration, the error model, and per-domain admin
controller modules. HTTP framework code, endpoints, controller implementations, business logic,
infrastructure, and UI remain forbidden here. The concrete API plugs in behind these interfaces;
controllers delegate to administrative application services, and control-changing operations require
human counter-sign.
