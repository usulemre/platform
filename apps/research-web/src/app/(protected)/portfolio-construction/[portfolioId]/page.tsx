import { PortfolioDetailView } from '@/modules/portfolio-construction';

/** Portfolio details page (Server Component). Params are async in Next 15. */
export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ portfolioId: string }>;
}) {
  const { portfolioId } = await params;
  return <PortfolioDetailView portfolioId={portfolioId} />;
}
