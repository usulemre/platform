# scheduler — implemented in Phase 3.4

This shared library contains the Scheduler Framework (the `platform_scheduler` package): scheduler
core, job & schedule registries, trigger model, execution planner, execution window, retry policy,
dependency management, job monitoring, scheduler metadata, job lifecycle, scheduling policies,
scheduler events, and the error model. Cron parsing, timers, distributed scheduling, and infrastructure
remain forbidden here. The concrete scheduler/orchestrator (Temporal, per the TDR) plugs in behind
these interfaces.
