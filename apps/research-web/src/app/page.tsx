import { redirect } from 'next/navigation';

/** The entry point routes into the protected area; the middleware and the
 *  protected layout enforce authentication. */
export default function RootPage() {
  redirect('/dashboard');
}
