/**
 * Authentication error hierarchy. Errors carry the credential id and scheme for correlation but NEVER
 * carry secret material — messages are always safe to log.
 */
export type AuthErrorKind =
  | 'missing-credential'
  | 'expired-credential'
  | 'not-supported'
  | 'validation'
  | 'signature';

export class AuthError extends Error {
  readonly kind: AuthErrorKind;
  constructor(kind: AuthErrorKind, message: string) {
    super(message);
    this.name = 'AuthError';
    this.kind = kind;
  }
}

export class AuthMissingCredentialError extends AuthError {
  constructor(readonly credentialId: string) {
    super('missing-credential', `Credential "${credentialId}" is not registered.`);
    this.name = 'AuthMissingCredentialError';
  }
}

export class AuthExpiredCredentialError extends AuthError {
  constructor(readonly credentialId: string) {
    super('expired-credential', `Credential "${credentialId}" is expired.`);
    this.name = 'AuthExpiredCredentialError';
  }
}

export class AuthNotSupportedError extends AuthError {
  constructor(readonly feature: string) {
    super(
      'not-supported',
      `"${feature}" is a foundation with no live implementation; inject an adapter to enable it.`,
    );
    this.name = 'AuthNotSupportedError';
  }
}

export class AuthValidationError extends AuthError {
  constructor(message: string) {
    super('validation', message);
    this.name = 'AuthValidationError';
  }
}

export function isAuthError(value: unknown): value is AuthError {
  return value instanceof AuthError;
}
