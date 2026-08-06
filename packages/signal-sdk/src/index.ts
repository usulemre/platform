/**
 * @platform/signal-sdk — the shared Signal Engine SDK.
 *
 * The single source of truth for the Signal Engine *vocabulary*: the signal
 * research lifecycle stages (candidate → research → validation → review →
 * approval → registry → production candidate), the validation / approval /
 * review / promotion / quality / health / sync statuses, the engine
 * capabilities, the canonical models (RegisteredSignal, SignalDefinition,
 * SignalVersion, SignalMetadata, SignalDependency, SignalLineage,
 * SignalValidation, SignalApproval, SignalReview, SignalPromotion, SignalFamily,
 * SignalOwner, SignalUsage, SignalSnapshot, …), and pure identifier/version
 * primitives. Consumed by both the signal-engine service and its UI.
 *
 * It contains NO alpha models, NO signal calculations, NO statistics, NO ML,
 * NO persistence, NO caching, NO database access, and NO transport.
 */
export * from './stages';
export * from './statuses';
export * from './capabilities';
export * from './contracts';
export * from './identifiers';
