# 🌵 Alebrijes Garden

A shared, magical garden for the family. Plant seeds, watch them grow in real
time, and discover alebrijes — fantastical spirit creatures — together. Works
great on tablets, needs no app store, and costs nothing to run.

It's a single file: **`index.html`**. No build step, no npm install, no
command line required to maintain it.

## Play it right now

Open `index.html` in any browser (double-click it, or drag it into a tab).
It works immediately in **offline demo mode** — one device, saved locally in
that browser. This is the easiest way to try the game or show it to the kids
before you set up live syncing.

To make it sync live across every tablet in the house, follow **Go live**
below (~50 minutes, no coding, no credit card).

## How the game works

- **The Garden** — a shared 3×3 plot of soil. Tap an empty plot to plant a
  seed. Tap a growing plant to water it (up to twice, speeds up growth). When
  it's fully grown it glows — tap it to reveal the alebrije and add it to the
  family Codex.
- **Seeds** — Sun, Moon, Star, and Rain seeds each favor different alebrijes
  and grow at different speeds. Star seeds are slow but have the best odds of
  something legendary; Rain seeds grow fastest but skew common.
- **The Codex** — every alebrije ever discovered by the family, with who
  found it first and how many times it's been grown. Undiscovered ones show
  as `???` until someone grows one.
- **The Feed** — a live scroll of every discovery, newest first, so everyone
  can see what just happened on another tablet.
- **The counter** — total alebrijes grown by the whole family, with little
  celebrations at milestones (1, 10, 25, 50, 100...).
- **Gardener profile** — the first time you open the game on a device, tap an
  avatar + name (no typing needed) so the Feed and Codex can credit the right
  person. Tap your name in the header anytime to change it.

Growth is calculated from timestamps, not countdowns — so it keeps growing
correctly even if a tablet is closed, asleep, or offline for a while, and it
needs zero extra network traffic to do it.

## Go live: sync across every tablet (free, no credit card)

This uses **GitHub Pages** (hosting) + **Firebase Realtime Database**
(shared live data) + **Cloudflare Web Analytics** (optional traffic
monitoring). All three are free forever with no payment method required.
See [`docs/hosting-research.md`](docs/hosting-research.md) for the full
reasoning and alternatives considered — this is the condensed, actionable
version.

### Phase 1 — Host the site on GitHub Pages (~10 min)

1. This repo already contains `index.html` at the root — that's all Pages
   needs.
2. On GitHub: **Settings → Pages → Source** → "Deploy from a branch" → pick
   `main` and `/ (root)` → **Save**.
3. Your game goes live at `https://<your-username>.github.io/<repo>/` within
   a minute or two.
4. From then on, editing `index.html` directly on github.com (pencil icon →
   edit → "Commit changes") updates the live site automatically — no rebuild
   step.

### Phase 2 — Add the shared Firebase database (~25 min)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
   and create a project (Spark/free plan — no credit card asked).
2. **Build → Realtime Database → Create Database** (pick any region).
3. **Build → Authentication → Sign-in method → Anonymous → Enable.** This
   gives every tablet a unique identity automatically, with no login screen
   for the kids.
4. **Realtime Database → Rules**, replace the contents with permanent rules
   (Firebase's default "test mode" rules expire after 30 days and lock the
   database — don't rely on them). Use your own random node name in place of
   the example below:

   ```json
   {
     "rules": {
       "your-random-node-name-here": {
         ".read": "auth != null",
         ".write": "auth != null"
       },
       "$other": {
         ".read": false,
         ".write": false
       }
     }
   }
   ```

   Then click **Publish**.
5. **Project settings → General → Your apps → Add app → Web**. Register the
   app (no hosting needed) and copy the `firebaseConfig` object it gives you.
6. Open `index.html`, find the `CONFIG` block near the top of the
   `<script type="module">` section, and fill in:

   ```js
   const CONFIG = {
     firebase: {
       apiKey: "...",
       authDomain: "...",
       databaseURL: "...",
       projectId: "...",
       appId: "..."
     },
     dataRoot: "your-random-node-name-here",   // must match the rules above
     ...
   };
   ```

   Pick `dataRoot` yourself — a short, hard-to-guess string (letters/numbers,
   no spaces). It must be identical in the rules and in `CONFIG`. Because the
   Firebase config is visible in your page's source (normal for client-side
   apps), the Anonymous Auth + unguessable node combo is what actually keeps
   strangers out — not the secrecy of the URL.
7. Commit the change. Open the live site on two devices and confirm that
   planting a seed on one shows up on the other within a second.

**Free-tier headroom for this game:** 1 GB storage / 10 GB downloads per
month, 100 simultaneous connections, no credit card, no charge is possible
without deliberately upgrading to the paid plan. A family of under 10 people
playing a garden game uses a tiny fraction of any of these.

### Phase 3 — Add analytics (optional, ~10 min)

1. Create a free account at [dash.cloudflare.com](https://dash.cloudflare.com).
2. **Web Analytics → Add a site** → enter your GitHub Pages hostname (you do
   **not** need to move DNS to Cloudflare).
3. Copy the `<script>` snippet Cloudflare gives you and paste it in
   `index.html` in place of the commented-out placeholder near the bottom of
   `<body>` (uncomment it and paste in your token).
4. Commit. Within a day you'll see visits, top pages, and referrers — mainly
   useful for noticing if the link ever leaks beyond the family.

## Data model (Firebase Realtime Database)

Everything lives under your one `dataRoot` node:

| Path | Shape | Purpose |
|---|---|---|
| `plots/{0-8}` | `{ seed, plantedAt, plantedBy, waters }` | One entry per occupied plot; removed on harvest. |
| `codex/{speciesId}` | `{ firstBy, firstAt, count }` | One entry per alebrije ever discovered. |
| `feed/{pushId}` | `{ text, emoji, ts }` | Append-only discovery log (`push()`), read with `limitToLast`. |
| `counter` | number | Total alebrijes grown, updated via `runTransaction` so two tablets can't clobber each other's increment. |

Planting and harvesting both use Firebase transactions so two tablets acting
on the same plot at the same instant can't corrupt it — the second action
is safely rejected with a friendly toast instead.

## Customizing

Everything gameplay-related is in a few clearly-labeled arrays/constants near
the top of the `<script type="module">` block in `index.html`:

- `CONFIG` — plot count, grow duration, watering rules, feed length.
- `SEEDS` — the four seed types, their odds, and growth speed.
- `SPECIES` — the alebrije roster (name, emoji, rarity, flavor text). Add
  your own by adding an entry with a unique `id`.
- `PROFILE_OPTIONS` — the tap-to-pick avatar/name pairs shown on first run.

No build step is needed for any of these — edit, save, commit, done.

## Notes & caveats

- Free-tier limits and terms can change — re-check the Firebase, GitHub
  Pages, and Cloudflare pricing/limits pages if you're relying on specific
  numbers years from now.
- The repo (and therefore `index.html`, including your Firebase config) is
  public on GitHub's free plan. That's expected for client-side Firebase
  apps — security rests on the database rules, not on hiding the config.
  Don't put anything sensitive in this project.
- If Firebase ever becomes unreachable (typo in config, offline, etc.) the
  game automatically falls back to solo demo mode with a banner explaining
  why, rather than showing a broken page.
