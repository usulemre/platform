import { ProjectDetailView } from '@/modules/research';

/** Research project details page (Server Component). Params are async in Next 15. */
export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <ProjectDetailView projectId={projectId} />;
}
