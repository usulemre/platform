/**
 * The **provider interface** (capability contract) — the single abstraction every broker/venue
 * provider adapter implements, and the ONLY surface through which the gateway reaches a venue. It is
 * technology-independent: the methods are capability *contracts* whose concrete transport (REST,
 * WebSocket, FIX) is supplied by an injected adapter in a `@platform/providers/*` package — never
 * here. This SDK ships a placeholder factory whose capability methods deliberately throw, because v1
 * implements NO exchange REST call, NO WebSocket protocol and NO FIX message.
 */
import type { BrokerCapabilityType } from './capabilities';
import type { ProviderDescriptor } from './providers';
import type {
  BalanceSnapshot,
  GatewayConfiguration,
  OrderSyncRecord,
  PositionSnapshot,
} from './types';

/** Raised by a placeholder capability method — v1 has no live provider implementation. */
export class ProviderNotImplementedError extends Error {
  constructor(
    readonly providerId: string,
    readonly capability: string,
  ) {
    super(
      `Provider "${providerId}" has no live implementation for "${capability}" (placeholder). Inject a concrete adapter to enable it.`,
    );
    this.name = 'ProviderNotImplementedError';
  }
}

/** The context passed to every capability operation (no secrets — references only). */
export interface CapabilityContext {
  readonly brokerId: string;
  readonly config: GatewayConfiguration;
  readonly at: string;
}

export interface AuthResult {
  readonly tokenRef: string;
  readonly expiresAt?: string;
}
export interface HeartbeatResult {
  readonly at: string;
  readonly latencyMs: number;
}

/**
 * The broker provider port. A concrete adapter declares which capabilities it supports and implements
 * the corresponding operations behind its own transport. The gateway only ever calls an operation for
 * a capability the adapter declares via `supports`.
 */
export interface BrokerProviderPort {
  readonly descriptor: ProviderDescriptor;
  capabilities(): readonly BrokerCapabilityType[];
  supports(capability: BrokerCapabilityType): boolean;

  /* connectivity (transport supplied by the concrete adapter) */
  authenticate(ctx: CapabilityContext): Promise<AuthResult>;
  connect(ctx: CapabilityContext): Promise<void>;
  disconnect(ctx: CapabilityContext): Promise<void>;
  heartbeat(ctx: CapabilityContext): Promise<HeartbeatResult>;

  /* account synchronization reads */
  queryPositions(ctx: CapabilityContext): Promise<readonly PositionSnapshot[]>;
  queryBalances(ctx: CapabilityContext): Promise<readonly BalanceSnapshot[]>;
  queryOrders(ctx: CapabilityContext): Promise<readonly OrderSyncRecord[]>;
}

/** A zero-argument factory that constructs a provider adapter (registered in the gateway registry). */
export type BrokerProviderFactory = () => BrokerProviderPort;

/**
 * Build a **placeholder** provider adapter from a descriptor. It answers `descriptor`, `capabilities`
 * and `supports` truthfully (pure metadata) but every capability *operation* throws
 * `ProviderNotImplementedError` — v1 has no transport. Each `@platform/providers/*` package exports a
 * factory built on this helper; swapping in a real adapter later requires no gateway change.
 */
export function createPlaceholderProvider(descriptor: ProviderDescriptor): BrokerProviderPort {
  const notImplemented = (capability: string): never => {
    throw new ProviderNotImplementedError(descriptor.id, capability);
  };
  return {
    descriptor,
    capabilities: () => descriptor.capabilities,
    supports: (capability) => descriptor.capabilities.includes(capability),
    authenticate: async () => notImplemented('authenticate'),
    connect: async () => notImplemented('connect'),
    disconnect: async () => notImplemented('disconnect'),
    heartbeat: async () => notImplemented('HEARTBEAT'),
    queryPositions: async () => notImplemented('QUERY_POSITIONS'),
    queryBalances: async () => notImplemented('QUERY_BALANCES'),
    queryOrders: async () => notImplemented('QUERY_ORDER'),
  };
}
