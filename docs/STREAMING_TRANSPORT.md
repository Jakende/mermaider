# Optional local streaming relay

The default hosted Appwrite transport remains buffered, with a 50-second timeout
and 512 KB request/response bounds. These limits match the deployed server.
The optional relay lets the hosted browser use real provider SSE and a longer
180-second request lifetime without moving credentials into a shared server.

From a checked-out Mermaider repository with Node 20 and `npm ci` completed:

```bash
npm run gateway:local
```

The service binds only to `127.0.0.1:8003`. In **Settings → Connection → Optional
streaming relay**, enable it and save `http://127.0.0.1:8003`. Allow local-network
access when the browser asks. For development, set `MERMAIDER_GATEWAY_ORIGIN` to
your exact browser origin before starting the process. Do not expose this service
publicly; it is a per-user local adapter, not an authenticated multi-user service.

Only official OpenAI/Jev routes are allowed. The relay keeps no credentials or
request history, rejects foreign origins, allows at most four simultaneous
requests, stops cancelled connections and caps responses at 512 KB. Provider
errors are sanitized. The saved browser preference contains only the endpoint.
Native desktop provider transport stays direct. Disable the preference to return
to the standard hosted path; errors never silently choose another provider.

SSE bytes reach the browser incrementally. Existing AI features still present
completed results rather than displaying token-by-token chat text. Automated
stream tests verify transport semantics, not provider latency or model quality.
