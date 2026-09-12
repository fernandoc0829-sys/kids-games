# 🎮 Kids Games

A family collection of browser games for the kids. Each game is a single
self-contained HTML file — no build step, no npm install, no command line
required to maintain any of them. Works great on tablets, needs no app
store, and costs nothing to run.

Open `index.html` to see the menu and pick a game, or jump straight into
one:

| Game | Folder | What it is |
|---|---|---|
| 🌵 Alebrijes Garden | [`alebrijes-garden/`](alebrijes-garden/index.html) | Plant seeds, grow spirit creatures, and discover them together. Shared family progress (optional Firebase sync). |
| 🦖 Dino Diet | [`dino-diet/`](dino-diet/index.html) | Feed each dinosaur only what it really eats — carnivore, herbivore, or omnivore — and watch it grow up. Solo play for now. |

## Repo structure

- **`index.html`** (root) — the landing page / game menu. Just links out to
  each game folder; there's nothing to configure here.
- **One folder per game** (`alebrijes-garden/`, `dino-diet/`, ...), each
  holding a single self-contained `index.html` with its own HTML/CSS/JS —
  no shared dependencies between games, no build step.

**Adding a new game:** create `<your-game>/index.html` as a single
self-contained file (see either existing game for the conventions this repo
follows — vanilla JS, no framework, Google Fonts only, `localStorage` for
persistence, mobile-first touch targets), then add a card for it to the
`.game-grid` in the root `index.html`.

## Hosting on GitHub Pages

All games are static files, so one GitHub Pages setup serves all of them.

1. On GitHub: **Settings → Pages → Source** → "Deploy from a branch" → pick
   `main` and `/ (root)` → **Save**.
2. The menu goes live at `https://<your-username>.github.io/<repo>/`, and
   each game at `https://<your-username>.github.io/<repo>/<game-folder>/`
   (e.g. `.../kids-games/dino-diet/`).
3. From then on, editing any file directly on github.com (pencil icon →
   edit → "Commit changes") updates the live site automatically — no
   rebuild step.

---

# 🌵 Alebrijes Garden

A shared, magical garden for the family. Plant seeds, watch them grow in
real time, and discover alebrijes — fantastical spirit creatures —
together.

Lives entirely in **`alebrijes-garden/index.html`**.

## Play it right now

Open `alebrijes-garden/index.html` in any browser (double-click it, or drag
it into a tab). It works immediately in **offline demo mode** — one device,
saved locally in that browser. This is the easiest way to try the game or
show it to the kids before you set up live syncing.

To make it sync live across every tablet in the house, follow **Go live**
below (~25 minutes, no coding, no credit card).

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

This uses the **GitHub Pages** hosting from above plus a **Firebase
Realtime Database** (shared live data) and, optionally, **Cloudflare Web
Analytics**. All free forever, no payment method required. See
[`docs/hosting-research.md`](docs/hosting-research.md) for the full
reasoning and alternatives considered — this is the condensed, actionable
version.

### Add the shared Firebase database (~25 min)

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
6. Open `alebrijes-garden/index.html`, find the `CONFIG` block near the top
   of the `<script type="module">` section, and fill in:

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

### Add analytics (optional, ~10 min)

1. Create a free account at [dash.cloudflare.com](https://dash.cloudflare.com).
2. **Web Analytics → Add a site** → enter your GitHub Pages hostname (you do
   **not** need to move DNS to Cloudflare).
3. Copy the `<script>` snippet Cloudflare gives you and paste it in
   `alebrijes-garden/index.html` in place of the commented-out placeholder
   near the bottom of `<body>` (uncomment it and paste in your token).
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
the top of the `<script type="module">` block in `alebrijes-garden/index.html`:

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
- The repo (and therefore `alebrijes-garden/index.html`, including your
  Firebase config) is public on GitHub's free plan. That's expected for
  client-side Firebase apps — security rests on the database rules, not on
  hiding the config. Don't put anything sensitive in this project.
- If Firebase ever becomes unreachable (typo in config, offline, etc.) the
  game automatically falls back to solo demo mode with a banner explaining
  why, rather than showing a broken page.

---

# 🦖 Dino Diet

Feed each dinosaur only what it really eats — carnivores get meat, herbivores
get plants, omnivores get both — and watch it grow from baby to giant. A
playful way to pick up real dinosaur diet facts along the way.

Lives entirely in **`dino-diet/index.html`**. Solo play only for now — no
account, no setup, just open it and play.

## How the game works

- **Feed by touch** — the dinosaur's mouth follows your finger (or the
  mouse, while held down) directly. Drag it onto food drifting around the
  play area to try to eat it.
- **Diet matters** — each dinosaur is a carnivore, herbivore, or omnivore.
  Feed it something outside its diet and it just bounces off with a gentle
  reminder — no penalty, no losing progress.
- **Size matters too** — a baby dinosaur can only manage small food, even if
  it's the right diet. Bigger food unlocks as it grows through Baby →
  Juvenile → Adult → Giant.
- **Dino-pedia** — reaching Giant for the first time unlocks that
  dinosaur's entry (diet + a real fact about it) and unlocks the next
  dinosaur to raise. Tap 📖 any time to browse what's been discovered.
- **Landscape** — the backdrop changes to match whichever dinosaur you're
  currently feeding (jungle, shrubland, volcanic rock, and so on).

Progress (growth stage per dinosaur, which are unlocked, and the Dino-pedia)
is saved to `localStorage`, so it's there when you come back — but it's
local to that one device/browser for now.

## Adding real artwork (optional)

By default every dinosaur and background is drawn with hand-coded SVG/CSS
shapes — no image files needed. If you want the real illustrated look
instead, drop image files into `dino-diet/assets/` using this naming
convention and the game picks them up automatically, no code changes:

- Dinosaur art: `assets/<speciesId>-<stage>.png` (e.g. `compsognathus-baby.png`,
  `compsognathus-giant.png`). Any species/stage without a file just keeps
  using the vector art — mix and match freely.
- Background art: `assets/bg-<speciesId>.png` (one per species/biome).

Images should be **PNGs with a real transparent background** (not just a
gray/white checkerboard baked into the pixels — some AI image tools only
draw a checker pattern to *look* transparent without an actual alpha
channel, which won't work here). Roughly square, any resolution — they're
scaled to fit.

These images aren't generated by this coding assistant — use an image
generation tool (e.g. ChatGPT/DALL-E, Gemini/ImageFX, Midjourney) with a
consistent prompt per image, something like: *"A cute chibi-style \[STAGE\]
\[SPECIES\] dinosaur, oversized head with huge glossy eyes, small body,
\[COLOR\] textured scaly skin, soft 3D rendered look, standing pose,
transparent background, PNG"* — then share the files here to have them
wired in.

**Stage progression rule** — to keep growth visually obvious across all four
stages, not just bigger, vary the `[STAGE]` description like this:
- **Baby** — smooth skin, no fur/feathers, roundest/most oversized head.
- **Juvenile** — fur or feather tufts start appearing (e.g. on the head/neck/tail).
- **Adult** — normal/proportionate features, no exaggeration.
- **Giant** — exaggerated, dramatic features (bigger horns/plates/sail/etc.).

## Customizing

Everything gameplay-related is in a few clearly-labeled constants near the
top of the `<script>` block in `dino-diet/index.html`:

- `CONFIG` — growth thresholds, spawn rate, item speed.
- `SPECIES` — the dinosaur roster (name, diet, color, fact, feature shapes)
  and unlock order. Add your own by adding an entry with a unique `id`.
- `FOOD_TYPES` — the food roster (which diet it belongs to, its size tier,
  its emoji).

## Roadmap: shared family progress (not built yet)

Right now Dino Diet is solo/local-only by design (phase 1). A natural phase
2 is shared family progress — e.g. a family Dino-pedia everyone contributes
to — following the same pattern Alebrijes Garden already uses: swap the
plain `localStorage` reads/writes for the same `LocalStore`/`FirebaseStore`
pair (identical interface, one backed by `localStorage`, one by Firebase
Realtime Database) so the game automatically falls back to solo demo mode
if Firebase isn't configured or unreachable.
</content>
