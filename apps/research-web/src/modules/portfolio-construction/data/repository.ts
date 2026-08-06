/**
 * Portfolio Construction Engine repository boundary — the ONLY data abstraction the
 * application service depends on. Concrete adapters implement it; the UI never sees a
 * concrete data source and never touches the service tier, a broker, an optimizer, or
 * persistence.
 */
import type {
  Portfolio,
  PortfolioComparison,
  PortfolioFamily,
  PortfolioTemplate,
} from '@platform/portfolio-sdk';
import type { PortfolioQuery } from '../domain/query';

export type { PortfolioQuery };

export interface PortfolioConstructionRepository {
  listPortfolios(query: PortfolioQuery): Promise<readonly Portfolio[]>;
  getPortfolio(id: string): Promise<Portfolio | null>;
  listFamilies(): Promise<readonly PortfolioFamily[]>;
  listTemplates(): Promise<readonly PortfolioTemplate[]>;
  optimizationQueue(): Promise<readonly Portfolio[]>;
  approvalQueue(): Promise<readonly Portfolio[]>;
  listComparisons(): Promise<readonly PortfolioComparison[]>;
  getComparison(id: string): Promise<PortfolioComparison | null>;
}
