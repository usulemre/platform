import { UserDetailView } from '@/modules/user-management';

/** User Details page (Server Component). Route params are async in Next 15. */
export default async function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <UserDetailView userId={userId} />;
}
