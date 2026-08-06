/**
 * @platform/auth · iam · container — a convenience composition root binding the
 * mock repository. Apps MAY use this directly, or construct their own
 * `AccessControlService(new ApiIamRepository(apiClient))` when the backend
 * identity services become available.
 */
import { MockIamRepository } from './mock-repository';
import { AccessControlService } from './service';

export const accessControlService = new AccessControlService(new MockIamRepository());
