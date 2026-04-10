# Production Checklist

## Before first deploy
- Copy [backend/.env.example](/C:/Users/slovv/Desktop/Job%20Activeincome/AdminAgentLotterry/backend/.env.example) to `.env` on the target environment.
- Set a strong `JWT_SECRET`.
- Set `FRONTEND_URL` to the real frontend origin.
- Set `AUTO_SEED_ADMIN=false` after the first controlled bootstrap.
- If you want an external cron fallback, set `CRON_SYNC_TOKEN` to a long random value.
- Confirm at least one active admin account exists in MongoDB.
- Run `npm run production:preflight`.

## Before every deploy
- Run `npm run legacy:cleanup:validate`.
- Run `npm run e2e:smoke`.
- Run `npm run e2e:regression`.
- Run `npm run db:backup -- --tag=predeploy`.
- Verify `/api/health` and `/api/ready` on the current environment.
- If external cron is enabled, verify `POST /api/lottery/sync-latest/cron` with `X-Cron-Token` returns `200`.

## After deploy
- Verify `/api/health` returns `ok`.
- Verify `/api/ready` returns `ready=true`.
- Log in with `admin`, `agent`, and `member` test accounts.
- Check wallet transfer, member bet submit, and result read flow.
- Review server logs for request IDs tied to any 4xx/5xx spikes.

## External cron example
```bash
curl -X POST https://your-backend.example.com/api/lottery/sync-latest/cron \
  -H "X-Cron-Token: <CRON_SYNC_TOKEN>"
```

## Rollback trigger
- `/api/ready` stays `503`
- login fails across multiple roles
- wallet ledger writes fail
- result settlement produces wrong `wonAmount`
- agent reports diverge from submitted items

## Rollback baseline
- restore the previous app build
- restore the latest database backup if data migration caused the issue
- rerun `npm run production:preflight`
