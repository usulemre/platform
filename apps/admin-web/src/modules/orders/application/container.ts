/**
 * Composition root for the Orders UI module (trading-web). The single place a concrete repository is
 * bound. Replace MockOrdersRepository with an API-backed repository over the order-management service
 * gateway to go live — no UI/hook/service changes.
 */
import { MockOrdersRepository } from '../data/mock-repository';
import { OrdersAdminService } from './orders-service';

export const ordersAdminService = new OrdersAdminService(new MockOrdersRepository());
