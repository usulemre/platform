'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@platform/ui';

export interface RouteErrorProps {
  error: Error;
  reset: () => void;
}

/** Presentational error surface, reused by React error boundaries and Next.js
 *  route-level `error.tsx` files. */
export function RouteError({ error, reset }: RouteErrorProps) {
  return (
    <div className="flex flex-col items-center gap-3 p-10 text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <Button onClick={reset} variant="outline" size="sm">
        Try again
      </Button>
    </div>
  );
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Component-level error boundary for wrapping interactive subtrees. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Reserved for the governed observability sink in a later phase.
    void error;
    void info;
  }

  private readonly reset = (): void => this.setState({ error: null });

  override render(): ReactNode {
    const { error } = this.state;
    if (error) {
      return this.props.fallback ? (
        this.props.fallback(error, this.reset)
      ) : (
        <RouteError error={error} reset={this.reset} />
      );
    }
    return this.props.children;
  }
}
