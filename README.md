# MM Client Brief Form

New client onboarding brief form for Mechanic Marketing.

**Architecture:**

```
React form (Cloudflare Pages)
  → POST /submit-brief → Cloudflare Worker (mm-client-brief-worker)
    → Step 1: Creates a new ClickUp list inside MM Clients folder
    → Step 2: Creates a "Client Brief" task in that list with all form data
```

---

## Project structure

```
mm-client-brief-form/
  worker/
    src/index.js        ← Cloudflare Worker
    wrangler.toml
    package.json
  frontend/
    src/
      App.jsx
      main.jsx
      index.css
    index.html
    vite.config.js
    package.json
  README.md
```

---

## Setup & deploy

### 1. Worker — first-time setup

```bash
cd worker
npm install
```

Add the ClickUp API token as a Wrangler secret (never commit it):

```bash
npx wrangler secret put CLICKUP_API_TOKEN
```

`MM_CLIENTS_FOLDER_ID` is set as a plain var in `wrangler.toml` (value: `90164096236`).

Deploy:

```bash
npm run deploy
```

Note the deployed Worker URL (e.g. `https://mm-client-brief-worker.<account>.workers.dev`).

Once deployed, update the CORS origin in `worker/src/index.js`:

```js
// Line 10 — replace "*" with the exact Pages URL:
const CORS_ORIGIN = "https://mm-client-brief-form.pages.dev";
```

Then redeploy.

### 2. Frontend — Cloudflare Pages

```bash
cd frontend
npm install
npm run build   # outputs to dist/
```

Deploy via Cloudflare Pages dashboard or Wrangler:

```bash
npx wrangler pages deploy dist --project-name mm-client-brief-form
```

Set the following environment variable in the Pages project settings:

| Variable | Value |
|---|---|
| `VITE_WORKER_URL` | `https://mm-client-brief-worker.<account>.workers.dev` |

Rebuild and redeploy after setting the env var so Vite bakes it into the bundle.

### 3. MM Plan query param

The hidden `MM Plan` ClickUp field is derived from the `?plan=` URL param:

- `?plan=accelerate` → orderindex `0` (Accelerate plan)
- Anything else (no param, other value) → orderindex `1` (default)

Share the form URL with `?plan=accelerate` appended for Accelerate plan clients.

---

## Local development

**Worker:**

```bash
cd worker
npm run dev     # starts wrangler dev on http://localhost:8787
```

**Frontend:**

```bash
cd frontend
npm run dev     # starts Vite dev server on http://localhost:5173
```

The frontend falls back to `http://localhost:8787` for the Worker URL when `VITE_WORKER_URL` is not set.

---

## ClickUp config

| Item | Value |
|---|---|
| Workspace | `9016183089` |
| Space | Mechanic Marketing Clients (`90160888289`) |
| Folder | MM Clients (`90164096236`) |

New lists are created inside folder `90164096236`. Each list is named after the client's Business / Brand Name. Each list contains one task named `[Brand Name] — Client Brief`.

---

## Secrets checklist

- [ ] `CLICKUP_API_TOKEN` added via `wrangler secret put`
- [ ] `VITE_WORKER_URL` set in Cloudflare Pages env vars
- [ ] CORS origin in `worker/src/index.js` updated to Pages URL after deploy
