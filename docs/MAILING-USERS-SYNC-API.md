# Mailing Users Sync API

This endpoint lets an external mailing system pull user records securely without manual CSV exports.

## Endpoint

- Method: `GET`
- URL: `/api/integrations/mailing/users`

## Authentication

Send one of these headers:

- `x-integration-key: <MAILING_SYNC_API_KEY>`
- `x-api-key: <MAILING_SYNC_API_KEY>`
- `Authorization: Bearer <MAILING_SYNC_API_KEY>`

## Environment Variables

Required:

- `MAILING_SYNC_API_KEY` - active integration key

Optional:

- `MAILING_SYNC_API_KEY_PREVIOUS` - previous key kept active temporarily during rotation
- `MAILING_SYNC_ALLOWED_IPS` - comma-separated IP allowlist (for example: `1.2.3.4,5.6.7.8`)

## Query Parameters

- `limit` - number of records per page (default `250`, max `1000`)
- `cursor` - last user id from previous page
- `since` - ISO date to fetch records updated after a timestamp

## Response Shape

```json
{
  "data": [
    {
      "id": "clx...",
      "email": "user@example.com",
      "name": "Jane Doe",
      "updatedAt": "2026-04-22T08:12:00.000Z",
      "createdAt": "2026-03-11T10:30:00.000Z",
      "isActive": true
    }
  ],
  "paging": {
    "hasMore": true,
    "nextCursor": "clx...",
    "limit": 250
  },
  "sync": {
    "since": "2026-04-20T00:00:00.000Z",
    "latestSyncAt": "2026-04-22T08:12:00.000Z"
  }
}
```

## Suggested Pull Strategy (Mailing Project)

1. Start with `since` as your last successful sync timestamp.
2. Fetch pages until `hasMore` is false.
3. Upsert users by `email` in the mailing database.
4. Save `sync.latestSyncAt` for the next run.

## Notes

- This endpoint is server-to-server and should not be used from client-side code.
- Keep the API key in environment variables only.
- Rotate keys periodically using `MAILING_SYNC_API_KEY_PREVIOUS` during cutover.
