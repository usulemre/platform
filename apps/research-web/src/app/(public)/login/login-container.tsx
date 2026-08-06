'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { LoginForm, type LoginFormValues } from '@platform/ui';
import { useLogin } from '@platform/auth/react';
import { validateLoginInput, type ValidationReport } from '@platform/auth';
import { authClient } from '@/lib/auth';

/**
 * Login flow container: runs the Validation-Foundation check on input, calls
 * the auth mutation, and returns the user to their intended path on success.
 * It stores no credentials and performs no authentication itself.
 */
export function LoginContainer() {
  const router = useRouter();
  const params = useSearchParams();
  const login = useLogin(authClient);
  const [report, setReport] = useState<ValidationReport | null>(null);

  const onSubmit = (values: LoginFormValues) => {
    const input = { username: values.username, password: values.password };
    const validation = validateLoginInput(input);
    setReport(validation);
    if (!validation.valid) return;

    login.mutate(input, {
      onSuccess: () => {
        const next = params.get('next');
        router.replace(next && next.startsWith('/') ? next : '/dashboard');
      },
    });
  };

  const fieldErrors: Record<string, string> = Object.fromEntries(
    (report?.issues ?? []).map((issue) => [issue.field, issue.message]),
  );

  return (
    <LoginForm
      onSubmit={onSubmit}
      isSubmitting={login.isPending}
      errorMessage={
        login.isError ? 'Authentication failed. Please check your credentials and try again.' : null
      }
      fieldErrors={fieldErrors}
    />
  );
}
