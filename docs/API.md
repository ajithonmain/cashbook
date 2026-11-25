# HTTP API

Base path: `/api` on your deployment. JSON in, JSON out. Same-origin only (no CORS headers are sent).

Authenticated endpoints need `Authorization: Bearer <token>`, where the token comes from register or login.
Errors are `{ "error": "message" }` with an appropriate status. Responses are `Cache-Control: no-store`.
Request bodies are limited to 512 KB.

Common statuses: `400` invalid input, `401` not signed in / session expired / bad credentials, `403` signup
closed or bad invite code, `409` email already registered, `413` body too large, `429` rate limited, `500`
unexpected error.

## Public

### `GET /api/health`
`200 { "ok": true, "signup": "open" | "invite" | "closed" }`. The app uses it to decide which sign-up UI to show
and whether a backend exists.

### `POST /api/auth/register`
Body: `{ "email", "password", "inviteCode"?, "deviceName"? }`.
Password is 8 to 128 characters. `inviteCode` is required unless signup is open.
`201 { "token", "user": { "id", "email" } }`. Limited to 10 attempts per IP per hour.

### `POST /api/auth/login`
Body: `{ "email", "password", "deviceName"? }`.
`200 { "token", "user" }`. Unknown email and wrong password both return `401 "Incorrect email or password"`.
After 10 failures per email (or 40 per IP) in 15 minutes: `429`.

## Authenticated

### `GET /api/auth/me`
`200 { "user": { "id", "email" }, "sessionId" }`.

### `POST /api/auth/logout`
Deletes the current session. `200 { "ok": true }`.

### `GET /api/auth/sessions`
`200 { "sessions": [{ "id", "deviceName", "createdAt", "lastSeenAt", "current" }] }`.

### `DELETE /api/auth/sessions?id=<sessionId>`
Removes one of the caller's own sessions (signs that device out). Ids belonging to other users are ignored.

### `POST /api/auth/password`
Body: `{ "currentPassword", "newPassword" }`. Signs out every other device. `401` if the current password is wrong.

### `DELETE /api/auth/account`
Body: `{ "password" }`. Deletes the user, their sessions, books and transactions. `401` if the password is wrong.

### `POST /api/sync/push`
Body: `{ "items": [ { "entity": "book" | "transaction", "payload": <record> } ] }`, at most 200 items.
`200 { "ok": true, "accepted": <n> }`. Each record is upserted with last-write-wins on `updatedAt`; an older
record than the stored one is accepted but ignored.

Book record: `{ id, name, icon?, color?, settings?, createdAt, updatedAt, deleted? }`. `name` is 1 to 100 chars;
`icon` is a lowercase key such as `store` (up to 24 chars of `a-z`, `0-9`, `-`, default `book`); `color` is an
integer HSL hue from 0 to 359 or `null` (derive from the name). Older clients may omit `icon` and `color`.
`settings` is opaque to the server (stored and returned as-is after a shape/size check) and holds the book's
per-book entry-field configuration:
```json
{
  "categories": ["Food", "Travel"], "paymentModes": ["Cash", "Online"],
  "categoryEnabled": true, "categoryRequired": false,
  "paymentModeEnabled": true, "paymentModeRequired": false,
  "partyEnabled": true, "partyRequired": false,
  "customFields": [{ "id": "uuid", "name": "Invoice #" }]
}
```
Missing/`null` means "use the client's legacy defaults" (see `src/lib/bookSettings.ts`). Each list item is up
to 60 chars, at most 200 items per list; the whole object is capped at 20,000 chars of JSON.

Transaction record:
```json
{
  "id": "uuid", "bookId": "uuid", "type": "in", "amount": 1200.5,
  "category": "Salary", "party": "Acme", "paymentMode": "Cash", "remarks": "",
  "customFields": { "uuid-of-field": "INV-204" },
  "occurredAt": 1790000000000, "createdAt": 1790000000000, "updatedAt": 1790000000000, "deleted": false
}
```
Limits: amount finite, greater than 0 and below 1e12; category up to 60 chars (may be empty); party 120; paymentMode 40;
remarks 500; `customFields` is an object of id -> value (each up to 500 chars, object capped at 20,000 chars
of JSON) or `null`/omitted; ids up to 64; timestamps are integer milliseconds between 0 and year 2100.

### `GET /api/sync/pull?since=<cursor>`
`200 { "books": [...], "transactions": [...], "cursor": <number>, "hasMore": <boolean> }`.
Start with `since=0`. While `hasMore` is true, call again with `since=<cursor>`. Persist the final cursor and
use it next time. Records have the same shape as push and include soft-deleted ones (`deleted: true`). Rows at
the boundary may be returned twice; apply them idempotently.

## Example

```bash
BASE=https://your-app.pages.dev/api
TOKEN=$(curl -s $BASE/auth/login -H 'content-type: application/json' \
  -d '{"email":"me@example.com","password":"correct horse battery"}' | jq -r .token)
curl -s "$BASE/sync/pull?since=0" -H "authorization: Bearer $TOKEN" | jq '.books | length'
```

## Tests

`npm run test:e2e` runs 40 checks covering registration policy, authentication, multi-device sync,
last-write-wins, the server-clock cursor, validation, cross-user isolation, session revocation, password
change, rate limiting, and account deletion. See [DEVELOPMENT.md](DEVELOPMENT.md).
