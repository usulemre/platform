# research-api — implemented in Phase 3.6

This shared library contains the Research API application interface (the `research_api` package): API
core models, query models, route hierarchy, controller interfaces, validation/authorization/workflow
integration, the error model, and per-domain controller modules. HTTP framework code, endpoints,
controller implementations, business logic, and infrastructure remain forbidden here. The concrete
API (FastAPI/OpenAPI + gRPC, per the TDR) plugs in behind these interfaces; controllers delegate to
application services.
