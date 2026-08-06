# performance-analytics module (admin-web · Phase 7.1)

The administrator-facing UI for the **Performance Analytics Engine**. Renders the reports
registry, report details, the versioned metric registry/catalog + explorer, the review and
approval queues, the benchmark registry and performance comparisons — reading through the shared
vocabulary in `@platform/performance-sdk`.

Self-contained copy of the layered stack; the admin mappers do not deep-link into research-web
modules (dependency/subject cross-links render as plain labels).

## What it is (and is not)

- **Is:** presentation + administration surfaces (metric registry with versioning, review/approval
  governance, benchmarks).
- **Is not:** an analytics runtime. It evaluates **no** formulas, calculates **no** metrics, runs
  **no** statistical algorithms, holds **no** business logic and **no** persistence. Metric values
  are inert supplied data; definitions carry prose formula descriptions, never code.

## Routes

`/performance-analytics` (dashboard + registry) · `/[reportId]` (report details) ·
`/catalog` (metric registry) · `/catalog/[metricKey]` (metric explorer) · `/review` (review +
approval queues) · `/benchmarks` · `/comparisons` (+ `/[comparisonId]`).
