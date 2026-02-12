# SoloPrice Pro - AI Development Standards (Supabase-First)

This document enforces strict standards for all AI-driven development within the SoloPrice Pro codebase.

## 1. Single Data Source
- **MANDATORY**: All application data must reside in Supabase.
- **PROHIBITED**: Use of `localStorage`, `sessionStorage`, or `indexedDB` for business data (Quotes, Clients, Invoices, etc.). 
- **EXCEPTION**: Authentication tokens and ephemeral UI state (e.g., "is sidebar collapsed") may use local storage.

## 2. Object Integrity & Naming
- All table references in the frontend MUST correspond to the `sp_` prefixed tables in Supabase.
- Use explicit naming in `supabase.from()` or API calls.
- Column names must match the Supabase schema exactly (snake_case).

## 3. Storage Policy
- **NO BASE64**: All binary files (logos, attachments, exports) must be stored in Supabase Storage buckets.
- Use the `logos` bucket for company logos.
- Document URLs must be signed or public if appropriate, but never hardcoded as raw strings from local storage.

## 4. Contract & Rendering Verification
- Any modification to a data flow requires updating the corresponding test suite.
- **Fail-Fast Policy**: If Supabase returns an error or empty data, the UI must show a clear error state. Do not use silent defaults or "Unknown" placeholders.
- CI must block any PR where a query references a non-existent table, view, or RPC.

## 5. Security
- Row Level Security (RLS) must be enabled on all tables.
- All frontend queries must be scoped to the authenticated user's `user_id`.
- Sensitive operations must be performed via authenticated RPC functions or protected backend routes.
