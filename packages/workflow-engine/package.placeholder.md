# workflow-engine — implemented in Phase 1.3

This package now contains the Workflow Engine Foundation (the `workflow_engine` package): the
canonical state machine, transitions, definition/instance/context, validation/approval/escalation/
execution interfaces, workflow events, audit, policies, and results. Orchestration logic, the
engine implementation (Temporal per the TDR), infrastructure, and persistence remain forbidden here.
