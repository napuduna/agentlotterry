# AGENTS.md

This file records verified repo workflows and commands only.

## Repo structure
- No root task runner was found. Run npm scripts from `backend/` or `frontend/`.

## Local development
- Backend (`backend/`): `npm install`, `npm run dev`, `npm start`, `npm run seed`
- Frontend (`frontend/`): `npm install`, `npm run dev`, `npm run build`, `npm run preview`
- Verified local ports/config:
  - frontend Vite runs on `3000` and proxies `/api` to `http://localhost:5000`
  - backend defaults to `PORT=5000`

## Backend operational workflows
- Pre-deploy checklist (`backend/`):
  1. `npm run production:preflight`
  2. `npm run legacy:cleanup:validate`
  3. `npm run e2e:smoke`
  4. `npm run e2e:regression`
  5. `npm run db:backup -- --tag=predeploy`
  6. Verify `/api/health` and `/api/ready`
- Backup / restore (`backend/`):
  - `npm run db:backup -- --tag=manual`
  - `npm run db:backup -- --tag=predeploy --collections=users,betslips,betitems`
  - `npm run db:restore -- --path=backups/<timestamp>_manual`
  - `npm run db:restore -- --path=backups/<timestamp>_manual --drop`
  - `npm run db:restore -- --path=backups/<timestamp>_manual --drop --collections=users,betslips,betitems`
- Additional backend verification scripts (`backend/`):
  - `npm run test:feed-mapping`
  - `npm run test:settlement-rules`
- Legacy cleanup modes (`backend/`):
  - `npm run legacy:cleanup:dry`
  - `npm run legacy:cleanup:validate`
  - `npm run legacy:cleanup:migrate`
  - `npm run legacy:cleanup:archive`
  - `npm run legacy:cleanup:purge`
  - TODO: no repo runbook was found for when to execute destructive cleanup modes; only `legacy:cleanup:validate` is listed in the production checklist.
