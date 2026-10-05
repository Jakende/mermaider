# Reviewed external decision updates

The application never silently replaces a decision state from an external source.
Every update targets a session ID and its exact current revision. Any edit, answer
or replay increments that revision; stale updates require a fresh proposal.

In Decisions, open **Reports, replay & external updates** to see the session ID and
revision. Export a decision file or state report. The MCP tool
`create_decision_state_update` accepts the file's `session` object, a new `state`
and an optional `source`, and returns this envelope:

```json
{
  "format": "mermaider-state-update",
  "version": 1,
  "id": "example-update",
  "sessionId": "COPY_THE_CURRENT_SESSION_ID",
  "expectedRevision": 2,
  "state": "Publication approval was revoked.",
  "source": "Release checklist"
}
```

Save the envelope as JSON and use **Review state update file**. Read the proposed
state and click **Apply reviewed state update**. Applying pauses automation and
marks retained manual answers for review; model answers are invalidated.

For programmatic delivery, run the optional local service from the repository:

```bash
export MERMAIDER_UPDATES_TOKEN="$(openssl rand -hex 32)"
npm run decision-api
```

It binds to `127.0.0.1:8002`. On Windows PowerShell, generate a random token in a
password manager and assign it to `$env:MERMAIDER_UPDATES_TOKEN` before starting.
Keep the token local and out of version control. POST an envelope to `/updates`
with `Authorization: Bearer <token>` and JSON content type. Then enter the same
endpoint and token in Mermaider and use **Fetch external update**. The token stays
in component memory. Fetching alone never applies the update.

Only the configured browser origin is allowed (default hosted Mermaider). Set
`MERMAIDER_UPDATES_ORIGIN` for a local development origin. Up to 100 sessions are
queued in memory for 15 minutes; restart clears the queue. The service has no
provider credentials and does not connect to a model. Reports contain private
facts you supplied, so inspect them before sharing. History retains at most 50
events within a 750 KB character budget; older versions may lack snapshots.
