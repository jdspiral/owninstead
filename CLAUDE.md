# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OwnInstead is a behavior-triggered investing app. When users spend less than their targets on specified categories, the app automatically invests the difference via their brokerage account.

## Commands

```bash
# Install dependencies
pnpm install

# Development (runs all apps)
pnpm dev

# Development (individual apps)
pnpm dev:backend          # Backend API server
pnpm dev:mobile           # Expo mobile app

# Build all packages
pnpm build

# Type checking
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix

# Formatting
pnpm format
pnpm format:check

# Database
pnpm db:migrate           # Push migrations to Supabase
pnpm db:reset             # Reset database
pnpm db:generate-types    # Generate TypeScript types from schema

# Individual package commands
pnpm --filter @owninstead/backend dev
pnpm --filter @owninstead/mobile dev
pnpm --filter @owninstead/shared build
```

## Architecture

### Monorepo Structure (pnpm + Turborepo)

- `apps/backend/` - Express API server (Node.js + TypeScript)
- `apps/mobile/` - React Native app (Expo + Expo Router)
- `packages/shared/` - Shared types, Zod schemas, constants
- `supabase/migrations/` - Database migrations

### Package Dependencies

The shared package must be built before backend or mobile can use it. Turborepo handles this automatically via `dependsOn: ["^build"]`.

```
@owninstead/shared  ←── @owninstead/backend
                    ←── @owninstead/mobile
```

### Backend (`apps/backend/`)

Express server with routes organized by domain:
- `src/api/routes/` - Route handlers (auth, rules, plaid, snaptrade, transactions, evaluations, orders)
- `src/api/middleware/` - Auth middleware, error handling
- `src/lib/` - Supabase client, logger
- `src/config/` - Environment validation (Zod)

Authentication uses Supabase JWT tokens. Protected routes use `authMiddleware` which sets `userId` on the request.

### Mobile (`apps/mobile/`)

Expo Router file-based navigation:
- `src/app/(auth)/` - Login/register screens
- `src/app/(onboarding)/` - 4-step onboarding flow
- `src/app/(tabs)/` - Main tab navigation (dashboard, rules, history, settings)
- `src/stores/` - Zustand stores (authStore with SecureStore persistence)
- `src/services/api/` - Axios client with auth interceptors

### Shared Package (`packages/shared/`)

- `src/types/` - TypeScript interfaces (User, Rule, Transaction, Evaluation, Order)
- `src/schemas/` - Zod validation schemas (used by both backend and mobile)
- `src/constants/` - Categories with merchant mappings, error codes, supported assets (VTI/VOO/SPY)

Import from shared: `import { createRuleSchema, RuleCategory, CATEGORIES } from '@owninstead/shared'`

### Database (Supabase)

Tables: `profiles`, `plaid_connections`, `snaptrade_connections`, `rules`, `transactions`, `evaluations`, `orders`

All tables have Row Level Security (RLS) policies. Users can only access their own data.

### External Integrations

- **Plaid**: Bank account linking, transaction sync
- **SnapTrade**: Brokerage OAuth, trade execution
- **BullMQ + Redis**: Background job processing (weekly evaluations, trade execution)

## Key Patterns

### Request Authentication (Backend)
```typescript
// Routes with params need double cast
const { userId } = req as unknown as AuthenticatedRequest;
```

### Zod Schema Validation
```typescript
const input = createRuleSchema.parse(req.body);
```

### Mobile Navigation
Routes are defined by file structure. Groups in parentheses `(auth)`, `(tabs)` create navigation contexts without affecting the URL.
