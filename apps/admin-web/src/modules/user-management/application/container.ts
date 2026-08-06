/**
 * Composition root for the User & Role Management Module. The single place a
 * concrete repository is bound. Replace MockUserManagementRepository with
 * `new ApiUserManagementRepository(apiClient)` to go live — no UI/hook/service
 * changes.
 */
import { MockUserManagementRepository } from '../data/mock-repository';
import { UserManagementService } from './user-management-service';

export const userManagementService = new UserManagementService(new MockUserManagementRepository());
