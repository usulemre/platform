/**
 * Composition root for the Broker Gateway UI module. The single place a concrete repository is bound.
 * Replace MockGatewayRepository with an API-backed repository over the broker-gateway service gateway
 * to go live — no UI/hook/service changes.
 */
import { MockGatewayRepository } from '../data/mock-repository';
import { GatewayViewService } from './gateway-service';

export const gatewayViewService = new GatewayViewService(new MockGatewayRepository());
