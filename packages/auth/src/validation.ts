/**
 * @platform/auth · validation — integration with the Validation Foundation.
 *
 * Produces a deterministic, structured verdict shaped like the (Python)
 * `platform_validation` report. Client-side validation is advisory UX; the
 * backend Validation Foundation re-validates authoritatively. Pure function,
 * no side effects.
 */
import type { LoginInput } from './model';

export type ValidationSeverity = 'ERROR' | 'WARNING';

export interface ValidationIssue {
  readonly field: string;
  readonly code: string;
  readonly severity: ValidationSeverity;
  readonly message: string;
}

export interface ValidationReport {
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
}

const MIN_PASSWORD_LENGTH = 8;

export function validateLoginInput(input: LoginInput): ValidationReport {
  const issues: ValidationIssue[] = [];

  if (input.username.trim().length === 0) {
    issues.push({
      field: 'username',
      code: 'REQUIRED',
      severity: 'ERROR',
      message: 'Username is required.',
    });
  }

  if (input.password.length === 0) {
    issues.push({
      field: 'password',
      code: 'REQUIRED',
      severity: 'ERROR',
      message: 'Password is required.',
    });
  } else if (input.password.length < MIN_PASSWORD_LENGTH) {
    issues.push({
      field: 'password',
      code: 'TOO_SHORT',
      severity: 'ERROR',
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    });
  }

  return { valid: issues.every((issue) => issue.severity !== 'ERROR'), issues };
}
