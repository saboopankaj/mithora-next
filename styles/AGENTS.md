# Mithora Project Rules

## General
- This is a production Mithora Kitchen project.
- Prefer minimal, targeted changes.
- Do not rewrite working functionality unnecessarily.
- Preserve existing business logic unless explicitly asked to change it.
- Do not change API contracts unless explicitly requested.

## Before changing code
- Inspect the existing implementation first.
- Identify all files affected by the change.
- Explain the proposed change briefly before making major changes.

## Frontend
- Preserve the existing Mithora visual identity.
- Maintain responsive desktop and mobile behavior.
- Do not remove existing functionality while fixing UI issues.
- Prefer existing components and styles over creating duplicates.

## Backend / API
- Do not change API request/response structures without explicit approval.
- Preserve existing authentication and validation.
- Handle API failures gracefully.

## Cart
- Preserve existing cart calculations.
- Pay particular attention to:
  - unavailable products
  - cutoff times
  - delivery charges
  - pincode rules
  - category-specific delivery
  - mixed-category carts

## Database
- Do not modify database schema without first explaining the migration.
- Never delete or truncate production data unless explicitly instructed.

## Testing
After code changes:
- Run TypeScript/build checks.
- Report any errors.
- Do not claim a change is complete if the build/check fails.

## CSS
- Check desktop and mobile breakpoints.
- Avoid unnecessary global CSS changes.
- Preserve existing responsive behavior.

## Git Rules

- Never commit automatically after making code changes.
- Never push automatically.
- Before committing, run the relevant build/type checks.
- Before committing, show the user:
  - git status
  - changed files
  - relevant diff
  - build/test result
- Only run git add, commit, or push when explicitly instructed by the user.
- Never use git reset --hard, git checkout --, or other destructive Git commands unless explicitly approved.