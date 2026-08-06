import { PortfolioDetailView } from '@/modules/portfolio';

/** Portfolio Details page (Server Component). Route params are async in Next 15. */
export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ portfolioId: string }>;
}) {
  const { portfolioId } = await params;
  return <PortfolioDetailView portfolioId={portfolioId} />;
}
