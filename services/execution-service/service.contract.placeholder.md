# execution-service — Execution Engine implemented in Phase 2.9

This service contains the Execution Engine (the `execution_service` package): the execution aggregate,
plan/instruction, session, context, authorization, lifecycle, planning, constraints, validation
coordination, scheduling, monitoring interfaces, reporting, governance, service/repository interfaces,
policies, specifications, domain events, and errors. Broker APIs, exchange connectivity, FIX, REST
clients, order routing, market connectivity, persistence, infrastructure, and APIs remain forbidden
here. The engine produces execution PLANS only; the external execution adapter is downstream and out
of scope. Live execution is impossible without a valid, time-boxed governance authorization token.
