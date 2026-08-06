/**
 * Canonical Dataset DTOs — the transport contract the module consumes, mirroring
 * the governed Dataset registry (Dataset Governance / DSG). These are inert data
 * shapes only: no infrastructure types, no behaviour. Bitemporal (event/knowledge
 * time) and provenance metadata are included to reflect governance (PIT-*, DP-1).
 */
export type DatasetStatusDto =
  | 'DRAFT'
  | 'INGESTED'
  | 'QUARANTINED'
  | 'CERTIFIED'
  | 'DEPRECATED'
  | 'RETIRED';

export type ValidationStatusDto = 'PASSED' | 'FAILED' | 'PENDING' | 'NOT_RUN';
export type ValidationSeverityDto = 'ERROR' | 'WARNING' | 'INFO';

export interface ValidationIssueDto {
  readonly code: string;
  readonly severity: ValidationSeverityDto;
  readonly message: string;
}

export interface ValidationReportDto {
  readonly status: ValidationStatusDto;
  readonly issues: readonly ValidationIssueDto[];
  readonly checkedAt?: string;
}

export interface DatasetVersionDto {
  readonly version: string;
  readonly knowledgeTime: string;
  readonly note: string;
}

export interface DatasetLineageNodeDto {
  readonly id: string;
  readonly label: string;
  readonly kind: string;
}

export interface DatasetDto {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly status: DatasetStatusDto;
  readonly assetClass: string;
  readonly vendor: string;
  readonly owner: string;
  readonly version: string;
  readonly rowCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly eventTime: string;
  readonly knowledgeTime: string;
  readonly tags: readonly string[];
  readonly validation: ValidationReportDto;
  readonly provenanceComplete: boolean;
  readonly lineageRef?: string;
  readonly versions?: readonly DatasetVersionDto[];
  readonly lineage?: readonly DatasetLineageNodeDto[];
}
