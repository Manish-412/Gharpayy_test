# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, Tailwind CSS, React Query, Wouter

## Artifacts

### Ghar Room Booking (`artifacts/ghar-booking`)
- **Preview path**: `/`
- A PG/room pre-booking payment tool for property owners in India
- Admin can create quotations (rent, discount, deposit, maintenance, token amount, stay duration, notice period)
- Admin approves → starts a 15-minute countdown timer (offer expires)
- Tenant-facing page shows live countdown + full quote + QR payment placeholder
- WhatsApp integration: generates pre-filled WhatsApp message with full quotation

### API Server (`artifacts/api-server`)
- **Preview path**: `/api`
- Express 5 backend serving REST endpoints for bookings
- All routes validated with Zod schemas from OpenAPI spec

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database Schema

### `bookings` table
- id, tenant_name, tenant_phone, property_name, room_number
- actual_rent, discounted_rent, deposit, maintenance_fee, token_amount
- stay_duration_months, notice_period_months
- status: pending | approved | paid | expired | cancelled
- approved_at, offer_expires_at, created_at, updated_at

## API Endpoints

- `GET /api/bookings` — list all bookings
- `POST /api/bookings` — create booking
- `GET /api/bookings/stats` — summary stats
- `GET /api/bookings/:id` — get booking
- `PATCH /api/bookings/:id` — update booking
- `DELETE /api/bookings/:id` — delete booking
- `POST /api/bookings/:id/approve` — approve & start 15-min timer
- `GET /api/bookings/:id/whatsapp` — generate WhatsApp message URL

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
