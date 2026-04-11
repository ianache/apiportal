# AGENTS.md

## Prisma Migration Guidelines

### ⚠️ Data Safety Rule

**NEVER run `prisma migrate reset` or commands that can destroy data.**

When executing Prisma migrations:
- Use `prisma migrate dev` for development schema changes
- Use `prisma db push` to sync schema without migration history
- If a migration fails, use `prisma migrate resolve --rolled-back <migration_name>` to mark it as rolled back
- Always verify the migration SQL preview before applying
- **Avoid `prisma migrate reset`** - it deletes all data in the database

### Safe Migration Workflow

1. Before applying migrations, review the planned SQL changes
2. For schema changes that don't require migration history: use `prisma db push`
3. For complex schema changes: create a new migration with `prisma migrate dev --name <description>`
4. Test migrations on a backup/dev database first

### Fixing Stuck Migrations

If a migration fails and leaves the database in an inconsistent state:

```bash
# Mark the failed migration as rolled back
npx prisma migrate resolve --rolled-back <migration_name>

# Push the current schema state to the database
npx prisma db push
```
