# Backup and Restore Runbook

## Create backup
```bash
npm run db:backup -- --tag=manual
```

Optional:
```bash
npm run db:backup -- --tag=predeploy --collections=users,betslips,betitems
```

Output:
- backups are written under `BACKUP_DIR`
- each backup folder contains:
  - `metadata.json`
  - `<collection>.data.ejson`
  - `<collection>.indexes.ejson`

## Restore backup
Restore into an empty target:
```bash
npm run db:restore -- --path=backups/<timestamp>_manual
```

Restore over existing data:
```bash
npm run db:restore -- --path=backups/<timestamp>_manual --drop
```

Restore only selected collections:
```bash
npm run db:restore -- --path=backups/<timestamp>_manual --drop --collections=users,betslips,betitems
```

## Safe workflow
1. Run `npm run production:preflight`
2. Create a fresh backup with `npm run db:backup`
3. Test restore on a staging database first
4. Only then restore on production if rollback is required
5. After restore, run `npm run e2e:smoke`
6. Run `npm run e2e:regression`

## Notes
- restore preserves `_id`, dates, and ObjectIds through EJSON
- restore refuses to write into non-empty collections unless `--drop` is passed
- backup/restore scripts use the same Mongo URI resolution logic as the app runtime
