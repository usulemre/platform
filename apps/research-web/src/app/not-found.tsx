import { NotFound } from '@platform/shell';

/** Global 404 page. */
export default function NotFoundPage() {
  return <NotFound homeHref="/dashboard" />;
}
