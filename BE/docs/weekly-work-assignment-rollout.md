# Weekly Work Assignment Rollout

## Goal

Normalize weekly work participants from `WEEKLY_WORK_ITEM.participants` into `WEEKLY_WORK_ASSIGNMENT`.

## Commands

Run from [BE](C:\InternShip\Project_out\ThaiAn_HDM\Hospital_Management_Web\BE):

```bash
npm run db:mysql-version
npm run db:status
npm run db:migrate
npm run db:weekly-work:backfill
npm run db:weekly-work:finalize
```

## Rollout Checklist

1. Backup the database before making schema changes.
2. Deploy backend code that supports `WEEKLY_WORK_ASSIGNMENT`.
3. Check server version with `npm run db:mysql-version`.
4. Review pending migrations with `npm run db:status`.
5. Run `npm run db:migrate` to create `WEEKLY_WORK_ASSIGNMENT`.
6. Run `npm run db:weekly-work:backfill` to move legacy participant ids into the new table.
7. Verify backfill result with:

```sql
SELECT COUNT(*) AS item_count FROM WEEKLY_WORK_ITEM;
SELECT COUNT(*) AS assignment_count FROM WEEKLY_WORK_ASSIGNMENT;
SELECT weekly_work_item_id, participants FROM WEEKLY_WORK_ITEM WHERE participants IS NOT NULL LIMIT 20;
SELECT weekly_work_item_id, user_id FROM WEEKLY_WORK_ASSIGNMENT LIMIT 20;
```

8. Run `npm run db:weekly-work:finalize` to drop the legacy `participants` column.
9. Restart backend and frontend services.
10. Smoke test:
   - create weekly work item
   - update participants
   - import weekly work file
   - open weekly schedule page
   - open my schedule page
   - export weekly work PDF

## Notes

- Migration `005` is DDL-only and safe for MySQL 5.7+ / 8.x.
- Backfill expects the legacy `participants` value to be a JSON array of user ids.
- If legacy rows contain free text instead of JSON ids, fix those rows manually before finalize.
