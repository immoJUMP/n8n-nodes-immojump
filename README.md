ImmoJump n8n Community Nodes (Trigger + Actions)

This package provides:
- Credentials: ImmoJump API (base URL, API key/token)
- Trigger: ImmoJump Trigger (registers a webhook subscription for selected event types)
- Node: ImmoJump (actions: create immobilie, post feed message)

Install (local dev)
- Clone into your n8n custom nodes directory and run `npm install && npm run build`.
- In n8n, enable community nodes and load this folder.

Credentials
- Base URL (e.g. https://app.immokalkulation.de)
- API Token (Bearer token from profile or API key)
- Organisation ID (optional if encoded in token; otherwise n8n sends `X-Organisation-Id`)

Trigger
- On node activation, POST /api/integrations/webhooks to register n8n webhook URL.
- On deactivation, DELETE the created subscription.

Actions
- immobilie.create → POST /api/v2/immobilien
- feed.post → POST /api/organisation-feed/post

