/**
 * Composition root for the research-web authentication surface.
 *
 * The API base URL is read from the environment BY REFERENCE (no secrets in
 * code, SEC-3). The session is a backend-issued httpOnly cookie sent with each
 * request; there is no token in client memory and no external identity provider.
 */
import { ApiClient } from '@platform/api-client';
import { AuthClient } from '@platform/auth';
import { WorkflowSdk } from '@platform/workflow-sdk';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';

export const apiClient = new ApiClient({ baseUrl });
export const authClient = new AuthClient(apiClient);
export const workflowSdk = new WorkflowSdk(apiClient);
