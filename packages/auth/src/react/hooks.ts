'use client';

/**
 * @platform/auth/react · hooks — login / logout / workflow-authorization.
 *
 * Mutations write the session into the TanStack Query cache (the single source
 * of session truth). `useAuthorizationWorkflow` is the Workflow Engine
 * integration: a read-only observation of a governed workflow (WFC ref) that
 * gates a privileged action or route. It never decides — the backend does.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WorkflowSdk } from '@platform/workflow-sdk';
import type { AuthClient } from '../client';
import type { LoginInput, SessionSnapshot } from '../model';
import { SESSION_QUERY_KEY } from './context';

export function useLogin(client: AuthClient) {
  const queryClient = useQueryClient();
  return useMutation<SessionSnapshot, Error, LoginInput>({
    mutationFn: (input) => client.login(input),
    onSuccess: (snapshot) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, snapshot);
    },
  });
}

export function useLogout(client: AuthClient) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => client.logout(),
    onSuccess: () => {
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
      void queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    },
  });
}

/** Observe a governed workflow that authorizes a privileged action/route. */
export function useAuthorizationWorkflow(sdk: WorkflowSdk, workflowRef: string) {
  return useQuery({
    queryKey: ['auth', 'workflow', workflowRef],
    queryFn: () => sdk.get(workflowRef),
    enabled: workflowRef.length > 0,
    retry: false,
  });
}
