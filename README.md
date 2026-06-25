# Cocky Portfolio + Website Roaster

A developer portfolio with an arrogant personality and a working "roast my website"
tool: paste a URL, get a real technical audit (not just AI vibes) with a score,
a list of actual problems, and a snarky write-up on top of them.

```
portfolio-project/
├── backend/       ← Node/Express API: fetches sites, analyzes them, writes the roast
├── frontend/      ← React/Vite site: hero, about, skills, projects, roast tool, contact
├── render.yaml    ← Render deployment config for the backend (see Deploying below)
└── frontend/vercel.json ← Vercel build config for the frontend
```

## How the roast tool actually works

1. You paste a URL into the form on the site.
2. The **backend** validates it, blocks anything pointing at internal/private
   infrastructure (see Security below), then fetches the page server-side.
3. `analyzer.js` runs real, deterministic checks against the HTML: title tag,
   meta description, viewport tag, heading structure, image alt-text coverage,
   render-blocking scripts, payload size, response time, HTTPS, security headers,
   Open Graph tags, favicon. Each issue found deducts points from a 100-point score.
4. `roastWriter.js` sends those *real* findings to Groq's free LLM API and asks
   it to write short, savage one-liners — one per finding, plus an opener and
   closer. The model is explicitly told not to invent issues outside the
   findings list, so the roast stays funny but grounded in something true.
   If no API key is configured, or the call fails, it falls back to
   deterministic copy instead of crashing.
5. The frontend renders the result as a terminal-style report with a stamped
   grade (A–F) and the score.

## Security measures built in

All of these live in the backend, since none of them are meaningful as
frontend-only features:

- **SSRF protection** (`ssrfGuard.js`) — the roast endpoint fetches a URL *you*
  give it, from the server. Without protection, that's an open invitation to
  probe your own internal network (`localhost`, `10.x.x.x`, cloud metadata
  endpoints like `169.254.169.254`, etc.) using your server as a proxy. The
  guard resolves the hostname's real IP and rejects anything in a private,
  loopback, link-local, or reserved range — including checking the *resolved*
  IP, not just the hostname string, to defend against DNS rebinding.
- **CORS lockdown** — only origins listed in `ALLOWED_ORIGINS` can call the API.
  Anything else gets a 403.
- **Rate limiting** — two tiers: a general limiter on all `/api/` routes, and a
  much stricter one (5 requests / 10 minutes) on `/api/roast` specifically,
  since that endpoint costs real money (LLM call) and time (network fetch) per
  request.
- **Input validation & sanitization** — `express-validator` checks the URL
  field for length and character set before it ever reaches the SSRF guard or
  the fetch call.
- **Honeypot field** — a form field (`company_website`) that's invisible to
  real users via CSS but present in the DOM. Bots that blind-fill every field
  on a form will populate it; if it's non-empty, the request is silently
  no-op'd without revealing that a honeypot was tripped.
- **Helmet** — standard security headers (CSP, X-Frame-Options, no-sniff, etc.)
- **Request size limits** — JSON body capped at 10kb; fetched HTML capped at 5MB
  with a hard timeout (8s) on the outbound fetch, so a slow or huge target site
  can't tie up server resources.
- **Content-type checking** — the fetched target must actually return
  `text/html`, so the endpoint can't be used to pull arbitrary files.

### Extra hardening you may want to add later
These weren't requested explicitly but are worth knowing about:
- Put this behind a CDN/WAF (Cloudflare, etc.) for an additional rate-limiting
  and bot-filtering layer.
- Add a real CAPTCHA (hCaptcha/Turnstile) if the honeypot alone isn't enough
  once this gets real traffic — honeypots stop simple bots, not targeted abuse.
- Log and alert on repeated SSRF attempts; a pattern of probing internal IPs
  is a useful signal even though each individual attempt is blocked.
- If you ever add user accounts or persistent storage, that's a much bigger
  security surface (auth, sessions, DB access) than what's covered here.

## Running it locally (before deploying anything)

You need two things running at once: the backend (port 3001) and the
frontend (port 5173). Open two terminal windows/tabs — one for each.

### 1. Get a free Groq API key
- Go to https://console.groq.com and sign up (free).
- Go to **API Keys** → **Create API Key**. Copy the key (starts with `gsk_`).
- This costs nothing on the free tier for the volume a portfolio site gets.

### 2. Start the backend (Terminal 1)
```bash
cd backend
npm install
cp .env.example .env
```
Open `backend/.env` in any text editor and:
- Paste your key into `GROQ_API_KEY=`
- Leave `ALLOWED_ORIGINS=http://localhost:5173,...` as-is for local dev

Then:
```bash
npm start
```
You should see:
```
Roast API listening on port 3001
Allowed origins: http://localhost:5173, https://yourdomain.com
```
Leave this terminal running. Quick sanity check — in a browser or another
terminal: `curl http://localhost:3001/api/health` should return `{"status":"ok"}`.

### 3. Start the frontend (Terminal 2, separate window)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
You should see Vite print something like:
```
VITE ready
➜  Local:   http://localhost:5173/
```
Leave this running too.

### 4. Open it
Visit **http://localhost:5173** in your browser. Scroll to the roast section,
paste any public URL (e.g. a site you own, or something like `wikipedia.org`),
and click "Roast me." It'll hit your local backend on port 3001, which fetches
the target site, runs the checks, and calls Groq for the commentary.

If the roast button just spins or errors:
- Check Terminal 1 (backend) for an error message printed there.
- Confirm `backend/.env` actually has your real Groq key, not the placeholder.
- Confirm both terminals are still running (closing either one kills that server).

### Stopping everything
`Ctrl+C` in each terminal.

### Note on the free tier
If you hit Groq's rate limit during testing (unlikely for personal use, but
possible if you're roasting a lot of sites back to back), the roast tool
won't crash — `roastWriter.js` catches the failure and falls back to
deterministic commentary built from the real findings, so the page still
works, it's just less witty for that one request.

## Deploying (Render for the backend, Vercel for the frontend)

This needs a GitHub repo first — both Render and Vercel deploy by connecting
to a Git repository, not by file upload. If this project isn't on GitHub yet:

```bash
cd portfolio-project
git init
git add .
git commit -m "Initial commit"
```
Then create a new repo on https://github.com/new (don't initialize it with a
README — you already have one) and follow the push instructions it shows you,
something like:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

There's a chicken-and-egg problem to solve in the order below: the backend
needs to know the frontend's URL (for CORS), and the frontend needs to know
the backend's URL (to call the API). Deploy the backend first, copy its URL,
*then* deploy the frontend with that URL, then circle back and update the
backend's CORS setting with the frontend's real URL.

### Step 1 — Deploy the backend to Render

1. Go to https://render.com and sign up (free, no credit card needed for the
   free tier).
2. Click **New +** → **Web Service**.
3. Connect your GitHub account and select this repository.
4. Render should detect the included `render.yaml` and pre-fill most settings.
   If it asks you to configure manually instead, set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Under **Environment Variables**, add:
   - `GROQ_API_KEY` → your real Groq key
   - `ALLOWED_ORIGINS` → put `http://localhost:5173` for now — you'll come
     back and add your real Vercel URL in Step 3.
6. Click **Create Web Service**. Render will build and deploy — this takes
   a few minutes the first time. When it's done, you'll have a URL like
   `https://roast-api-xxxx.onrender.com`. **Copy this URL.**
7. Sanity check it: visit `https://your-render-url.onrender.com/api/health`
   in a browser. You should see `{"status":"ok"}`.

**Important — free tier cold starts:** Render's free web services spin down
after 15 minutes with no traffic, and the next request wakes it back up,
which takes 30–60 seconds. The first time someone clicks "Roast me" after the
site's been idle, it'll hang for a bit before responding — that's the backend
waking up, not a bug. If that bothers you, the actual fix is upgrading that
one service to Render's paid tier (~$7/month) for an always-on instance;
there's no free way to eliminate it.

### Step 2 — Deploy the frontend to Vercel

1. Go to https://vercel.com and sign up (free).
2. Click **Add New** → **Project**, connect GitHub, select this same repo.
3. Vercel will ask for a **Root Directory** — set it to `frontend` (this repo
   has both frontend and backend in it, so Vercel needs to know which folder
   is the actual site).
4. Framework Preset should auto-detect as **Vite**. Build command
   `npm run build` and output directory `dist` should already be filled in
   (the included `frontend/vercel.json` sets these explicitly too).
5. Under **Environment Variables**, add:
   - `VITE_API_URL` → the Render URL you copied in Step 1
     (e.g. `https://roast-api-xxxx.onrender.com`, no trailing slash)
6. Click **Deploy**. After a minute or two you'll get a URL like
   `https://your-project.vercel.app`. **Copy this URL.**

### Step 3 — Close the loop: update CORS on the backend

1. Back in the Render dashboard, open your web service → **Environment**.
2. Edit `ALLOWED_ORIGINS` to your real Vercel URL, e.g.:
   `https://your-project.vercel.app`
   (You can list more than one, comma-separated, if you also keep
   `http://localhost:5173` for local dev.)
3. Save — Render will redeploy automatically with the new value.

### Step 4 — Test the live site

Visit your Vercel URL, scroll to the roast section, try a real URL. First
request after any idle period will be slow (see the cold-start note above);
after that it should respond quickly. If it errors instead of just being
slow, open your browser's dev tools console — a CORS error there means Step 3
didn't save correctly, or the Vercel URL changed (Vercel gives you a new
preview URL on every push to a non-production branch, but your main
production URL stays stable).

### Keeping it updated
Both Render and Vercel auto-deploy on every `git push` to your main branch —
edit code locally, commit, push, and both sides redeploy on their own within
a minute or two. No manual redeploy step needed after the first setup.

## Customizing the content

- `frontend/src/components/Hero.jsx` — headline and intro copy
- `frontend/src/components/About.jsx` — bio and stats
- `frontend/src/components/Skills.jsx` — the `SKILLS` array
- `frontend/src/components/Projects.jsx` — the `PROJECTS` array
- `frontend/src/components/Contact.jsx` — email and social links
- Colors/fonts: CSS variables at the top of `frontend/src/index.css`
