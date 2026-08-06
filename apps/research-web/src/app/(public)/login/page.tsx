import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginContainer } from './login-container';

export const metadata: Metadata = {
  title: 'Sign in · Research Platform',
};

/** Login page (Server Component). The interactive container is a Client
 *  Component wrapped in Suspense (it reads the `next` search param). */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginContainer />
    </Suspense>
  );
}
