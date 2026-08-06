#!/usr/bin/env bash
# =============================================================================
# generate_frontend_monorepo.sh  —  Phase 4.0 (Platform Bootstrap)
# -----------------------------------------------------------------------------
# Idempotent generator for the production-grade frontend monorepo:
#   Turborepo + pnpm workspaces + Next.js 15 (App Router) + strict TypeScript.
#
# This lays down STRUCTURE, CONFIG and APPLICATION SHELLS only. It generates
# NO business/decision logic (CLAUDE.md LLM-2, AI-1..4, FB-1..4). Human consoles
# act only through governed service APIs (Architecture V2 §6.2); nothing here
# decides significance, validation, risk, allocation, promotion or execution.
#
# Boundaries honored:
#   - Strict TypeScript everywhere (CODE / QUALITY).
#   - No secrets, no credentials, no raw vendor data (SEC-3, FB-14). Auth tokens
#     are provided by REFERENCE only (getAuthToken callback), never stored.
#   - Modular: leaf packages -> composed packages -> apps; no circular deps
#     (AV2-13, IMP-12).
#   - Governance/navigational docs are NOT modified by this script.
#
# Re-running overwrites generated source; it never touches docs/ or governance.
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
echo "repo root: $ROOT"

# --- pinned toolchain versions (single source of truth) ----------------------
NEXT=15.1.6
REACT=19.0.0
TS=5.7.3
TAILWIND=3.4.17
TURBO=2.3.3

mkdir -p \
  packages/config/tsconfig packages/config/eslint packages/config/tailwind \
  packages/types/src packages/utils/src \
  packages/ui/src/components packages/ui/src/lib packages/ui/src/styles \
  packages/api-client/src packages/auth/src \
  packages/workflow-sdk/src packages/research-sdk/src \
  apps/research-web/src/app apps/research-web/tests apps/research-web/e2e \
  apps/admin-web/src/app apps/admin-web/tests apps/admin-web/e2e \
  apps/docs/src/app \
  .husky

# =============================================================================
# ROOT WORKSPACE
# =============================================================================
cat > package.json <<'EOF'
{
  "name": "quant-platform-frontend",
  "version": "0.0.0",
  "private": true,
  "packageManager": "pnpm@10.15.0",
  "engines": { "node": ">=20.0.0" },
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e",
    "format": "prettier --write \"**/*.{ts,tsx,js,cjs,mjs,json,md,css}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,cjs,mjs,json,md,css}\"",
    "clean": "turbo run clean",
    "prepare": "husky || true"
  },
  "devDependencies": {
    "prettier": "3.4.2",
    "turbo": "2.3.3",
    "typescript": "5.7.3",
    "husky": "9.1.7",
    "lint-staged": "15.4.1"
  },
  "lint-staged": {
    "*.{ts,tsx,js,cjs,mjs,json,md,css}": ["prettier --write"]
  }
}
EOF

cat > pnpm-workspace.yaml <<'EOF'
# pnpm workspace for the frontend monorepo (Phase 4.0).
# Only directories that contain a package.json are treated as workspace
# packages; the pre-existing Python placeholder directories under packages/
# are silently ignored.
packages:
  - "apps/*"
  - "packages/*"
EOF

cat > turbo.json <<'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "stream",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"]
    },
    "test:e2e": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
EOF

cat > .npmrc <<'EOF'
node-linker=hoisted
auto-install-peers=true
strict-peer-dependencies=false
EOF

cat > .nvmrc <<'EOF'
20
EOF

cat > .prettierrc.json <<'EOF'
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
EOF

cat > .prettierignore <<'EOF'
node_modules
.next
dist
.turbo
coverage
playwright-report
test-results
pnpm-lock.yaml
EOF

cat > .gitignore <<'EOF'
# dependencies
node_modules

# builds
.next
out
dist
*.tsbuildinfo
next-env.d.ts

# turbo
.turbo

# test / coverage
coverage
playwright-report
test-results

# env / os
.env*
!.env.example
.DS_Store
EOF

cat > .husky/pre-commit <<'EOF'
pnpm lint-staged
EOF
chmod +x .husky/pre-commit

# =============================================================================
# packages/config  —  shared tsconfig / eslint / tailwind presets (dev tooling)
# =============================================================================
cat > packages/config/package.json <<'EOF'
{
  "name": "@platform/config",
  "version": "0.0.0",
  "private": true,
  "license": "UNLICENSED",
  "files": ["tsconfig", "eslint", "tailwind"],
  "exports": {
    "./tsconfig/base.json": "./tsconfig/base.json",
    "./tsconfig/react-library.json": "./tsconfig/react-library.json",
    "./tsconfig/nextjs.json": "./tsconfig/nextjs.json",
    "./eslint/react-library": "./eslint/react-library.cjs",
    "./tailwind/preset": "./tailwind/preset.cjs"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "8.20.0",
    "@typescript-eslint/parser": "8.20.0",
    "eslint": "8.57.1",
    "eslint-config-prettier": "9.1.0",
    "eslint-plugin-react": "7.37.4",
    "eslint-plugin-react-hooks": "5.1.0",
    "tailwindcss": "3.4.17"
  }
}
EOF

cat > packages/config/tsconfig/base.json <<'EOF'
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Platform base (strict)",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "incremental": true
  },
  "exclude": ["node_modules", "dist", ".next", ".turbo"]
}
EOF

cat > packages/config/tsconfig/react-library.json <<'EOF'
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Platform React library",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
EOF

cat > packages/config/tsconfig/nextjs.json <<'EOF'
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Platform Next.js (App Router)",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": true,
    "noEmit": true,
    "incremental": true
  }
}
EOF

cat > packages/config/eslint/react-library.cjs <<'EOF'
/**
 * Shared ESLint config for internal React/TypeScript libraries.
 * Apps use their own `next/core-web-vitals` config (idiomatic + reliable
 * plugin resolution); this config governs the non-Next packages.
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  settings: { react: { version: 'detect' } },
  env: { browser: true, node: true, es2022: true },
  ignorePatterns: ['node_modules', 'dist', '.next', '.turbo', 'coverage'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
};
EOF

cat > packages/config/tailwind/preset.cjs <<'EOF'
/**
 * Shared Tailwind preset (design tokens). Consumed by every app's
 * tailwind.config.ts via `presets: [preset]`. Token values are supplied by
 * each app's globals.css (CSS custom properties).
 * @type {Partial<import('tailwindcss').Config>}
 */
const preset = {
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
    },
  },
  plugins: [],
};

module.exports = preset;
EOF

cat > packages/config/README.md <<'EOF'
# @platform/config

Shared build-time configuration: strict TypeScript bases, the ESLint config for
internal React libraries, and the Tailwind design-token preset. Dev tooling only
— it ships no runtime code.
EOF

# =============================================================================
# packages/types  —  shared, inert TypeScript types (no runtime logic)
# =============================================================================
cat > packages/types/package.json <<'EOF'
{
  "name": "@platform/types",
  "version": "0.0.0",
  "private": true,
  "license": "UNLICENSED",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --max-warnings 0",
    "clean": "rm -rf .turbo dist *.tsbuildinfo"
  },
  "devDependencies": {
    "@platform/config": "workspace:*",
    "eslint": "8.57.1",
    "typescript": "5.7.3"
  }
}
EOF

cat > packages/types/tsconfig.json <<'EOF'
{
  "extends": "@platform/config/tsconfig/base.json",
  "include": ["src"]
}
EOF

cat > packages/types/.eslintrc.cjs <<'EOF'
module.exports = { extends: [require.resolve('@platform/config/eslint/react-library')] };
EOF

cat > packages/types/src/index.ts <<'EOF'
/**
 * @platform/types — shared, technology-independent TypeScript types for the
 * frontend. These are inert type declarations only: no runtime logic, no
 * decisions (CLAUDE.md CP-8 asset-agnostic; LLM-2). They mirror the shapes the
 * governed service APIs expose; they never encode business rules.
 */

/** An ISO-8601 timestamp string (transport representation only). */
export type Iso8601 = string;

/** Opaque, content-addressed or versioned identifier (NM-2). */
export type Id = string;

export interface ApiVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

/** Read-only page envelope returned by list endpoints. */
export interface Page<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

/** Administrative response status surfaced by the governed Admin API. */
export type AdminStatus = 'OK' | 'ACCEPTED' | 'PENDING_COUNTER_SIGN' | 'REJECTED' | 'ERROR';

export type PrincipalKind = 'USER' | 'SERVICE' | 'AGENT';

export interface Principal {
  readonly id: Id;
  readonly kind: PrincipalKind;
  readonly displayName: string;
}

/** A pointer to a consequential decision made by a deterministic engine. */
export interface DecisionRef {
  readonly id: Id;
  readonly kind: string;
  readonly occurredAt: Iso8601;
}
EOF

cat > packages/types/README.md <<'EOF'
# @platform/types

Shared, inert TypeScript types for the frontend. Type declarations only — no
runtime logic. Consumed as source (transpiled by the apps).
EOF

# =============================================================================
# packages/utils  —  pure, framework-agnostic utilities
# =============================================================================
cat > packages/utils/package.json <<'EOF'
{
  "name": "@platform/utils",
  "version": "0.0.0",
  "private": true,
  "license": "UNLICENSED",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --max-warnings 0",
    "clean": "rm -rf .turbo dist *.tsbuildinfo"
  },
  "dependencies": {
    "clsx": "2.1.1",
    "tailwind-merge": "2.6.0"
  },
  "devDependencies": {
    "@platform/config": "workspace:*",
    "@platform/types": "workspace:*",
    "eslint": "8.57.1",
    "typescript": "5.7.3"
  }
}
EOF

cat > packages/utils/tsconfig.json <<'EOF'
{
  "extends": "@platform/config/tsconfig/base.json",
  "include": ["src"]
}
EOF

cat > packages/utils/.eslintrc.cjs <<'EOF'
module.exports = { extends: [require.resolve('@platform/config/eslint/react-library')] };
EOF

cat > packages/utils/src/index.ts <<'EOF'
/**
 * @platform/utils — pure, deterministic, framework-agnostic helpers.
 * No side effects, no ambient time/RNG access (CLAUDE.md CS-3: non-determinism
 * is injected, never read ambiently). No business logic.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional Tailwind class lists, de-duplicating conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Serialize an explicitly-provided instant to ISO-8601 (clock is injected). */
export function toIso8601(instant: Date): string {
  return instant.toISOString();
}

/** Type guard: value is neither null nor undefined. */
export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
EOF

cat > packages/utils/README.md <<'EOF'
# @platform/utils

Pure, deterministic utilities (class merging, formatting, type guards). No side
effects, no ambient clock/RNG, no business logic.
EOF

# =============================================================================
# packages/ui  —  shadcn/ui-style presentational components
# =============================================================================
cat > packages/ui/package.json <<'EOF'
{
  "name": "@platform/ui",
  "version": "0.0.0",
  "private": true,
  "license": "UNLICENSED",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./styles.css": "./src/styles/globals.css"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --max-warnings 0",
    "clean": "rm -rf .turbo dist *.tsbuildinfo"
  },
  "dependencies": {
    "@platform/utils": "workspace:*",
    "@radix-ui/react-slot": "1.1.1",
    "class-variance-authority": "0.7.1",
    "lucide-react": "0.469.0"
  },
  "peerDependencies": {
    "react": ">=19",
    "react-dom": ">=19"
  },
  "devDependencies": {
    "@platform/config": "workspace:*",
    "@types/react": "19.0.7",
    "@types/react-dom": "19.0.3",
    "eslint": "8.57.1",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "typescript": "5.7.3"
  }
}
EOF

cat > packages/ui/tsconfig.json <<'EOF'
{
  "extends": "@platform/config/tsconfig/react-library.json",
  "include": ["src"]
}
EOF

cat > packages/ui/.eslintrc.cjs <<'EOF'
module.exports = { extends: [require.resolve('@platform/config/eslint/react-library')] };
EOF

cat > packages/ui/src/lib/utils.ts <<'EOF'
export { cn } from '@platform/utils';
EOF

cat > packages/ui/src/components/button.tsx <<'EOF'
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@platform/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
});
EOF

cat > packages/ui/src/index.ts <<'EOF'
/**
 * @platform/ui — presentational, headless-friendly components (shadcn/ui style).
 * Pure UI: no data fetching, no decisions, no business logic. Consumed as
 * source and transpiled by the apps (`transpilePackages`).
 */
export { Button, buttonVariants, type ButtonProps } from './components/button';
export { cn } from './lib/utils';
EOF

cat > packages/ui/src/styles/globals.css <<'EOF'
/* Shared base styles for @platform/ui. Apps import their own globals.css which
   defines the design-token custom properties consumed by the Tailwind preset. */
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

cat > packages/ui/README.md <<'EOF'
# @platform/ui

Presentational component library (shadcn/ui style) built on Tailwind, Radix
primitives and CVA. Pure UI — no data fetching, no business logic.
EOF

# =============================================================================
# packages/api-client  —  typed transport over the governed service APIs
# =============================================================================
cat > packages/api-client/package.json <<'EOF'
{
  "name": "@platform/api-client",
  "version": "0.0.0",
  "private": true,
  "license": "UNLICENSED",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --max-warnings 0",
    "clean": "rm -rf .turbo dist *.tsbuildinfo"
  },
  "devDependencies": {
    "@platform/config": "workspace:*",
    "@platform/types": "workspace:*",
    "eslint": "8.57.1",
    "typescript": "5.7.3"
  }
}
EOF

cat > packages/api-client/tsconfig.json <<'EOF'
{
  "extends": "@platform/config/tsconfig/base.json",
  "compilerOptions": { "lib": ["ES2022", "DOM"] },
  "include": ["src"]
}
EOF

cat > packages/api-client/.eslintrc.cjs <<'EOF'
module.exports = { extends: [require.resolve('@platform/config/eslint/react-library')] };
EOF

cat > packages/api-client/src/index.ts <<'EOF'
/**
 * @platform/api-client — a thin, typed HTTP transport over the governed service
 * APIs (Research API / Admin API). It is transport ONLY: it never adjudicates,
 * validates significance, or makes decisions (WCON-2, LLM-2). Auth tokens are
 * supplied BY REFERENCE through a callback and never stored here (SEC-3, FB-14).
 */
import type { Page } from '@platform/types';

export interface ApiClientConfig {
  readonly baseUrl: string;
  /** Returns the current bearer token by reference; secrets are never stored. */
  readonly getAuthToken?: () => string | undefined;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  constructor(private readonly config: ApiClientConfig) {}

  async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = this.config.getAuthToken?.();
    const response = await fetch(`${this.config.baseUrl}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }
    return (await response.json()) as T;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  list<T>(path: string): Promise<Page<T>> {
    return this.request<Page<T>>(path, { method: 'GET' });
  }
}
EOF

cat > packages/api-client/README.md <<'EOF'
# @platform/api-client

Typed HTTP transport over the governed service APIs. Transport only — no
decisions, no business logic. Auth tokens are provided by reference; no secrets
are stored.
EOF

# =============================================================================
# packages/auth  —  framework-agnostic auth types (NOT an auth provider)
# =============================================================================
cat > packages/auth/package.json <<'EOF'
{
  "name": "@platform/auth",
  "version": "0.0.0",
  "private": true,
  "license": "UNLICENSED",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --max-warnings 0",
    "clean": "rm -rf .turbo dist *.tsbuildinfo"
  },
  "devDependencies": {
    "@platform/config": "workspace:*",
    "@platform/types": "workspace:*",
    "eslint": "8.57.1",
    "typescript": "5.7.3"
  }
}
EOF

cat > packages/auth/tsconfig.json <<'EOF'
{
  "extends": "@platform/config/tsconfig/base.json",
  "include": ["src"]
}
EOF

cat > packages/auth/.eslintrc.cjs <<'EOF'
module.exports = { extends: [require.resolve('@platform/config/eslint/react-library')] };
EOF

cat > packages/auth/src/index.ts <<'EOF'
/**
 * @platform/auth — framework-agnostic authentication SHAPES only.
 * This is NOT an auth provider and implements NO protocol (no JWT/OAuth/SSO).
 * It defines the session/token contracts the apps compose against; identity is
 * asserted by the governed backend, never minted here (SEC-3).
 */
import type { Principal } from '@platform/types';

export interface AuthSession {
  readonly principal: Principal | null;
  readonly isAuthenticated: boolean;
}

export const anonymousSession: AuthSession = {
  principal: null,
  isAuthenticated: false,
};

/** Supplies the current bearer token by reference (no storage of secrets). */
export interface AuthTokenProvider {
  getToken(): string | undefined;
}

export const noopTokenProvider: AuthTokenProvider = {
  getToken: () => undefined,
};
EOF

cat > packages/auth/README.md <<'EOF'
# @platform/auth

Framework-agnostic authentication types and token-provider contracts. Not an
auth provider — implements no protocol. Identity is asserted by the backend.
EOF

# =============================================================================
# packages/workflow-sdk  —  typed client for governed workflow endpoints
# =============================================================================
cat > packages/workflow-sdk/package.json <<'EOF'
{
  "name": "@platform/workflow-sdk",
  "version": "0.0.0",
  "private": true,
  "license": "UNLICENSED",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --max-warnings 0",
    "clean": "rm -rf .turbo dist *.tsbuildinfo"
  },
  "dependencies": {
    "@platform/api-client": "workspace:*",
    "@platform/types": "workspace:*"
  },
  "devDependencies": {
    "@platform/config": "workspace:*",
    "eslint": "8.57.1",
    "typescript": "5.7.3"
  }
}
EOF

cat > packages/workflow-sdk/tsconfig.json <<'EOF'
{
  "extends": "@platform/config/tsconfig/base.json",
  "include": ["src"]
}
EOF

cat > packages/workflow-sdk/.eslintrc.cjs <<'EOF'
module.exports = { extends: [require.resolve('@platform/config/eslint/react-library')] };
EOF

cat > packages/workflow-sdk/src/index.ts <<'EOF'
/**
 * @platform/workflow-sdk — typed client for the governed workflow endpoints.
 * It only reads/triggers workflows through the API; it orchestrates nothing and
 * adjudicates nothing (WCON-2: workflows orchestrate, they do not decide).
 */
import type { ApiClient } from '@platform/api-client';
import type { Id, Iso8601, Page } from '@platform/types';

export interface WorkflowSummary {
  readonly id: Id;
  readonly name: string;
  readonly status: string;
  readonly updatedAt: Iso8601;
}

export class WorkflowSdk {
  constructor(private readonly client: ApiClient) {}

  list(): Promise<Page<WorkflowSummary>> {
    return this.client.list<WorkflowSummary>('/workflows');
  }

  get(id: Id): Promise<WorkflowSummary> {
    return this.client.get<WorkflowSummary>(`/workflows/${id}`);
  }
}
EOF

cat > packages/workflow-sdk/README.md <<'EOF'
# @platform/workflow-sdk

Typed client for the governed workflow endpoints. Reads and triggers workflows
via the API; it does not orchestrate or decide (WCON-2).
EOF

# =============================================================================
# packages/research-sdk  —  typed client for governed research endpoints
# (implements the pre-existing Phase-0 placeholder directory)
# =============================================================================
rm -f packages/research-sdk/package.placeholder.md
cat > packages/research-sdk/package.json <<'EOF'
{
  "name": "@platform/research-sdk",
  "version": "0.0.0",
  "private": true,
  "license": "UNLICENSED",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --max-warnings 0",
    "clean": "rm -rf .turbo dist *.tsbuildinfo"
  },
  "dependencies": {
    "@platform/api-client": "workspace:*",
    "@platform/types": "workspace:*"
  },
  "devDependencies": {
    "@platform/config": "workspace:*",
    "eslint": "8.57.1",
    "typescript": "5.7.3"
  }
}
EOF

cat > packages/research-sdk/tsconfig.json <<'EOF'
{
  "extends": "@platform/config/tsconfig/base.json",
  "include": ["src"]
}
EOF

cat > packages/research-sdk/.eslintrc.cjs <<'EOF'
module.exports = { extends: [require.resolve('@platform/config/eslint/react-library')] };
EOF

cat > packages/research-sdk/src/index.ts <<'EOF'
/**
 * @platform/research-sdk — typed client for the governed Research API.
 * Read/propose transport only. It never validates significance, never accesses
 * OOS/holdout data, and never makes a research decision (AI-2, AI-5, LLM-2).
 */
import type { ApiClient } from '@platform/api-client';
import type { Id, Iso8601, Page } from '@platform/types';

export interface ExperimentSummary {
  readonly id: Id;
  readonly hypothesis: string;
  readonly status: string;
  readonly registeredAt: Iso8601;
}

export class ResearchSdk {
  constructor(private readonly client: ApiClient) {}

  listExperiments(): Promise<Page<ExperimentSummary>> {
    return this.client.list<ExperimentSummary>('/experiments');
  }

  getExperiment(id: Id): Promise<ExperimentSummary> {
    return this.client.get<ExperimentSummary>(`/experiments/${id}`);
  }
}
EOF

cat > packages/research-sdk/README.md <<'EOF'
# @platform/research-sdk

Typed client for the governed Research API. Read/propose transport only — never
validates significance, never touches OOS/holdout, never decides (AI-2, AI-5).
EOF

# =============================================================================
# APPS — shared per-app file emitter for the two Next.js consoles
# =============================================================================
emit_next_common () {
  # $1 = app dir (e.g. apps/research-web)
  local dir="$1"

  cat > "$dir/next.config.mjs" <<'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@platform/ui',
    '@platform/utils',
    '@platform/types',
    '@platform/api-client',
    '@platform/auth',
    '@platform/research-sdk',
    '@platform/workflow-sdk',
  ],
  // ESLint runs as its own pipeline task (`turbo lint`); keep it out of the
  // build critical path. TypeScript errors DO fail the build (strict compile).
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
EOF

  cat > "$dir/tsconfig.json" <<'EOF'
{
  "extends": "@platform/config/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

  cat > "$dir/next-env.d.ts" <<'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file is regenerated by `next build`. Do not edit.
EOF

  cat > "$dir/postcss.config.mjs" <<'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF

  cat > "$dir/tailwind.config.ts" <<'EOF'
import type { Config } from 'tailwindcss';
import preset from '@platform/config/tailwind/preset';

const config: Config = {
  presets: [preset],
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
};

export default config;
EOF

  cat > "$dir/.eslintrc.json" <<'EOF'
{
  "root": true,
  "extends": ["next/core-web-vitals", "prettier"]
}
EOF

  cat > "$dir/src/app/globals.css" <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --radius: 0.5rem;
  --background: 0 0% 100%;
  --foreground: 222.2 47.4% 11.2%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 47.4% 11.2%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
EOF

  cat > "$dir/src/app/providers.tsx" <<'EOF'
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
EOF

  cat > "$dir/vitest.config.ts" <<'EOF'
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
EOF

  cat > "$dir/vitest.setup.ts" <<'EOF'
import '@testing-library/jest-dom/vitest';
EOF

  cat > "$dir/tests/example.test.tsx" <<'EOF'
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from '@platform/ui';

describe('shell smoke test', () => {
  it('renders a UI Button from @platform/ui', () => {
    render(<Button>Continue</Button>);
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });
});
EOF

  cat > "$dir/playwright.config.ts" <<'EOF'
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000' },
});
EOF

  cat > "$dir/e2e/home.spec.ts" <<'EOF'
import { test, expect } from '@playwright/test';

// Skipped by default: requires a running dev server and installed browsers.
// Enable in CI once the e2e environment is provisioned.
test.skip('home page renders its heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
EOF
}

emit_next_common apps/research-web
emit_next_common apps/admin-web

# --- research-web specifics --------------------------------------------------
cat > apps/research-web/package.json <<'EOF'
{
  "name": "@apps/research-web",
  "version": "0.0.0",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "next lint --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "clean": "rm -rf .next .turbo dist *.tsbuildinfo"
  },
  "dependencies": {
    "@platform/ui": "workspace:*",
    "@platform/types": "workspace:*",
    "@platform/utils": "workspace:*",
    "@platform/api-client": "workspace:*",
    "@platform/auth": "workspace:*",
    "@platform/research-sdk": "workspace:*",
    "@platform/workflow-sdk": "workspace:*",
    "@tanstack/react-query": "5.64.2",
    "zustand": "5.0.3",
    "lucide-react": "0.469.0",
    "next": "15.1.6",
    "react": "19.0.0",
    "react-dom": "19.0.0"
  },
  "devDependencies": {
    "@platform/config": "workspace:*",
    "@testing-library/jest-dom": "6.6.3",
    "@testing-library/react": "16.1.0",
    "@types/node": "22.10.7",
    "@types/react": "19.0.7",
    "@types/react-dom": "19.0.3",
    "@vitejs/plugin-react": "4.3.4",
    "@playwright/test": "1.49.1",
    "autoprefixer": "10.4.20",
    "eslint": "8.57.1",
    "eslint-config-next": "15.1.6",
    "eslint-config-prettier": "9.1.0",
    "jsdom": "25.0.1",
    "postcss": "8.4.49",
    "tailwindcss": "3.4.17",
    "typescript": "5.7.3",
    "vitest": "2.1.8"
  }
}
EOF

cat > apps/research-web/src/app/layout.tsx <<'EOF'
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Research Console',
  description: 'Institutional quantitative research platform — research console (application shell).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
EOF

cat > apps/research-web/src/app/page.tsx <<'EOF'
import { Button } from '@platform/ui';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start gap-6 p-12">
      <h1 className="text-2xl font-semibold text-foreground">Research Console</h1>
      <p className="max-w-prose text-muted-foreground">
        Application shell only. This console acts exclusively through governed service APIs
        (Architecture V2 §6.2); it contains no decision logic and bypasses no control.
      </p>
      <Button>Get started</Button>
    </main>
  );
}
EOF

cat > apps/research-web/README.md <<'EOF'
# @apps/research-web

Research console (Next.js 15, App Router). Human-in-the-loop surface for
registries, experiments and verdicts. Acts only through governed service APIs —
no decision logic. Application shell only.
EOF

# --- admin-web specifics -----------------------------------------------------
cat > apps/admin-web/package.json <<'EOF'
{
  "name": "@apps/admin-web",
  "version": "0.0.0",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "clean": "rm -rf .next .turbo dist *.tsbuildinfo"
  },
  "dependencies": {
    "@platform/ui": "workspace:*",
    "@platform/types": "workspace:*",
    "@platform/utils": "workspace:*",
    "@platform/api-client": "workspace:*",
    "@platform/auth": "workspace:*",
    "@platform/research-sdk": "workspace:*",
    "@platform/workflow-sdk": "workspace:*",
    "@tanstack/react-query": "5.64.2",
    "zustand": "5.0.3",
    "lucide-react": "0.469.0",
    "next": "15.1.6",
    "react": "19.0.0",
    "react-dom": "19.0.0"
  },
  "devDependencies": {
    "@platform/config": "workspace:*",
    "@testing-library/jest-dom": "6.6.3",
    "@testing-library/react": "16.1.0",
    "@types/node": "22.10.7",
    "@types/react": "19.0.7",
    "@types/react-dom": "19.0.3",
    "@vitejs/plugin-react": "4.3.4",
    "@playwright/test": "1.49.1",
    "autoprefixer": "10.4.20",
    "eslint": "8.57.1",
    "eslint-config-next": "15.1.6",
    "eslint-config-prettier": "9.1.0",
    "jsdom": "25.0.1",
    "postcss": "8.4.49",
    "tailwindcss": "3.4.17",
    "typescript": "5.7.3",
    "vitest": "2.1.8"
  }
}
EOF

# admin-web runs on port 3001; align its Playwright baseURL.
cat > apps/admin-web/playwright.config.ts <<'EOF'
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3001' },
});
EOF

cat > apps/admin-web/src/app/layout.tsx <<'EOF'
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Admin Console',
  description: 'Institutional quantitative research platform — administration & approvals console (shell).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
EOF

cat > apps/admin-web/src/app/page.tsx <<'EOF'
import { Button } from '@platform/ui';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start gap-6 p-12">
      <h1 className="text-2xl font-semibold text-foreground">Admin Console</h1>
      <p className="max-w-prose text-muted-foreground">
        Application shell only. Administration, ownership, lifecycle and human sign-off surfaces.
        Capital-affecting actions are counter-signed at the governed backend (CLAUDE.md HO-2); this
        console never decides.
      </p>
      <Button variant="outline">Review queue</Button>
    </main>
  );
}
EOF

cat > apps/admin-web/README.md <<'EOF'
# @apps/admin-web

Admin console (Next.js 15, App Router). Administration, lifecycle and human
sign-off surfaces. Approvals are counter-signed at the governed backend; this
console never decides. Application shell only.
EOF

# =============================================================================
# apps/docs  —  minimal Next.js App Router docs shell
# =============================================================================
cat > apps/docs/package.json <<'EOF'
{
  "name": "@apps/docs",
  "version": "0.0.0",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "dev": "next dev -p 3002",
    "build": "next build",
    "start": "next start -p 3002",
    "lint": "next lint --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "test": "echo \"(no unit tests)\" && exit 0",
    "clean": "rm -rf .next .turbo dist *.tsbuildinfo"
  },
  "dependencies": {
    "@platform/ui": "workspace:*",
    "@platform/utils": "workspace:*",
    "@platform/types": "workspace:*",
    "next": "15.1.6",
    "react": "19.0.0",
    "react-dom": "19.0.0"
  },
  "devDependencies": {
    "@platform/config": "workspace:*",
    "@types/node": "22.10.7",
    "@types/react": "19.0.7",
    "@types/react-dom": "19.0.3",
    "autoprefixer": "10.4.20",
    "eslint": "8.57.1",
    "eslint-config-next": "15.1.6",
    "eslint-config-prettier": "9.1.0",
    "postcss": "8.4.49",
    "tailwindcss": "3.4.17",
    "typescript": "5.7.3"
  }
}
EOF

cat > apps/docs/next.config.mjs <<'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@platform/ui', '@platform/utils', '@platform/types'],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
EOF

cat > apps/docs/tsconfig.json <<'EOF'
{
  "extends": "@platform/config/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

cat > apps/docs/next-env.d.ts <<'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file is regenerated by `next build`. Do not edit.
EOF

cat > apps/docs/postcss.config.mjs <<'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF

cat > apps/docs/tailwind.config.ts <<'EOF'
import type { Config } from 'tailwindcss';
import preset from '@platform/config/tailwind/preset';

const config: Config = {
  presets: [preset],
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
};

export default config;
EOF

cat > apps/docs/.eslintrc.json <<'EOF'
{
  "root": true,
  "extends": ["next/core-web-vitals", "prettier"]
}
EOF

cat > apps/docs/src/app/globals.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --radius: 0.5rem;
  --background: 0 0% 100%;
  --foreground: 222.2 47.4% 11.2%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 47.4% 11.2%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
EOF

cat > apps/docs/src/app/layout.tsx <<'EOF'
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Platform Docs',
  description: 'Institutional quantitative research platform — documentation portal (shell).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF

cat > apps/docs/src/app/page.tsx <<'EOF'
export default function DocsHomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start gap-6 p-12">
      <h1 className="text-2xl font-semibold text-foreground">Platform Documentation</h1>
      <p className="max-w-prose text-muted-foreground">
        Documentation portal shell. The authoritative corpus lives in <code>docs/</code> and is
        governed by <code>CLAUDE.md</code> and the Architecture Canon. This app renders that corpus;
        it never restates or overrides it.
      </p>
    </main>
  );
}
EOF

cat > apps/docs/README.md <<'EOF'
# @apps/docs

Documentation portal (Next.js 15, App Router). Renders the governed docs corpus;
never restates or overrides it. Application shell only.
EOF

echo "GENERATED: frontend monorepo tree"
