import { RoleDetailView } from '@/modules/user-management';

/** Role Details page (Server Component). Route params are async in Next 15. */
export default async function RoleDetailPage({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  return <RoleDetailView roleId={roleId} />;
}
