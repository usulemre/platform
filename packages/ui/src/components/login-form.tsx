'use client';

import * as React from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Alert } from './alert';
import { Card, CardContent, CardHeader, CardTitle } from './card';

export interface LoginFormValues {
  username: string;
  password: string;
}

export interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  fieldErrors?: Record<string, string>;
}

/**
 * Presentational login form. It owns only its input state and delegates the
 * submit to `onSubmit`; it performs no authentication and holds no secrets.
 */
export function LoginForm({
  onSubmit,
  isSubmitting = false,
  errorMessage,
  fieldErrors = {},
}: LoginFormProps) {
  const [values, setValues] = React.useState<LoginFormValues>({ username: '', password: '' });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {errorMessage ? <Alert variant="destructive">{errorMessage}</Alert> : null}

          <div className="space-y-1">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              value={values.username}
              aria-invalid={Boolean(fieldErrors.username)}
              onChange={(event) =>
                setValues((current) => ({ ...current, username: event.target.value }))
              }
            />
            {fieldErrors.username ? (
              <p className="text-xs text-destructive">{fieldErrors.username}</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              aria-invalid={Boolean(fieldErrors.password)}
              onChange={(event) =>
                setValues((current) => ({ ...current, password: event.target.value }))
              }
            />
            {fieldErrors.password ? (
              <p className="text-xs text-destructive">{fieldErrors.password}</p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
