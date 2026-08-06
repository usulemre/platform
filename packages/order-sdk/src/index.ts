/**
 * @platform/order-sdk — the shared Order Management System (OMS) SDK.
 *
 * The single source of truth for the OMS *vocabulary and lifecycle rules*: the 12 canonical order
 * statuses and the **order lifecycle state machine** (the transition table `created → validated →
 * pending approval → approved → queued → submitted → accepted → partially filled → filled /
 * cancelled / rejected / expired`), the lifecycle actions (replace / amend / suspend / resume /
 * cancel / retry) and their permission predicates, the lifecycle event types, the order types
 * (market / limit / stop / stop-limit / trailing-stop / iceberg / TWAP+VWAP placeholders), side and
 * time-in-force, the canonical order domain models (Order, OrderRequest, OrderExecution, OrderFill,
 * OrderState, OrderEvent, OrderAudit, OrderHistory, OrderMetadata, OrderRoute, OrderApproval,
 * OrderValidation) and pure identifier/order-arithmetic primitives.
 *
 * It contains NO broker SDK, NO exchange API, NO FIX, NO HTTP/WebSocket transport, NO persistence,
 * NO caching and NO order routing implementation. The transition table and action predicates are
 * REAL deterministic lifecycle rules; the transitions themselves are applied by the Order Management
 * Service, and routing to an execution venue happens downstream. Consumed by the order-management
 * service and its trading-web / admin-web UIs.
 */
export * from './lifecycle';
export * from './order-types';
export * from './contracts';
export * from './identifiers';
