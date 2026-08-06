/**
 * @platform/ui — presentational, headless-friendly components (shadcn/ui style).
 * Pure UI: no data fetching, no decisions, no business logic. Consumed as
 * source and transpiled by the apps (`transpilePackages`).
 */
export { Button, buttonVariants, type ButtonProps } from './components/button';
export { Input, type InputProps } from './components/input';
export { Label, type LabelProps } from './components/label';
export { Card, CardHeader, CardTitle, CardContent, CardFooter } from './components/card';
export { Spinner } from './components/spinner';
export { Alert, type AlertProps } from './components/alert';
export { Badge, type BadgeProps } from './components/badge';
export { Skeleton } from './components/skeleton';
export { LoginForm, type LoginFormValues, type LoginFormProps } from './components/login-form';
export { cn } from './lib/utils';
