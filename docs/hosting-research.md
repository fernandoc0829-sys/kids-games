# Migrating "Alebrijes Garden" to a Free Self-Hosted Stack: Recommended Path (2026)

## TL;DR
- **Recommended stack: GitHub Pages (static hosting) + Firebase Realtime Database on the free "Spark" plan (shared data store) + Cloudflare Web Analytics (traffic monitoring).** All three are genuinely free forever, require no credit card, and are set up entirely through web dashboards — realistic for a non-developer in about an hour.
- **Firebase Realtime Database beats the alternatives for this exact use case**: it syncs shared JSON to all connected tablets in real time (sub-second), its free tier needs no payment method, and — critically — it does **not** pause on inactivity, unlike Supabase (which pauses free projects after 7 days idle) and unlike Cloudflare KV/D1 or Deno KV (which require writing server code and, for Deno, a credit card to lift restrictions).
- **Watch three gotchas**: (1) Firebase "Test mode" rules auto-expire after 30 days and lock the database — you must set permanent rules; (2) the Spark plan caps simultaneous connections at 100 and downloads at 10 GB/month (both far above your <10-user needs); (3) your Firebase config is visible in page source, so treat access control seriously (use Anonymous Auth + an unguessable data node rather than relying on the URL alone).

## Key Findings

### Static hosting: GitHub Pages wins for this use case
- **GitHub Pages** free tier, per GitHub's official docs (docs.github.com/en/pages): published sites "may be no larger than 1 GB," carry "a soft bandwidth limit of 100 GB per month," and "a soft limit of 10 builds per hour." No credit card, never expires, and [FreeTiers](https://www.freetiers.com/directory/github-pages) it has had zero recorded pricing changes — a strong stability signal. [CostBench](https://costbench.com/software/developer-tools/github/) Custom subdomains are free with automatic HTTPS [supadrop](https://supadrop.host/blog/github-pages-limits/) via Let's Encrypt. Requirement: the repository must be public on the free plan (fine for a game with no secrets in the code).
- **Cloudflare Pages** free tier: unlimited bandwidth, unlimited static requests, 500 builds/month, commercial use allowed. Technically the most generous, but it requires connecting a GitHub/GitLab repo (no simple drag-and-drop), and Cloudflare has been consolidating Pages into Workers since April 2025. [Puter](https://developer.puter.com/blog/cloudflare-pages-alternatives/)
- **Vercel Hobby** free tier: 100 GB bandwidth, 6,000 build minutes/month, excellent developer experience — but its Hobby plan is **non-commercial only** by ToS (a family game qualifies as non-commercial, so this is not a blocker) and it is really optimized for Next.js, which is overkill here. If usage exceeds Hobby limits, the site is paused until the next month.
- **Verdict**: For a single-file HTML app maintained by a non-developer, GitHub Pages is the best fit because you can edit the file directly in the browser (github.com → open file → pencil icon → "Commit changes") and it goes live within seconds to a couple of minutes. No local tooling, no build step, no command line required.

### Shared data store: Firebase Realtime Database (Spark plan) is the best fit

**Primary-source free-tier limits (official Firebase docs, 2026):**
- **Storage: 1 GB** of stored data; **downloads: 10 GB/month** of egress. Firebase's billing docs state: "You get no-cost usage that includes 1 GB of data storage and 10 GB/month of data downloads." Your total data is well under 1 MB, so these are effectively unlimited for you.
- **Simultaneous connections: 100** on the Spark plan (the global non-free limit is 200,000). Firebase's Realtime Database limits page notes "The Spark plan limit on simultaneous connections is 100," where one connection equals "one mobile device, browser tab, or server app connected to the database." A Firebase engineer notes on the firebase-talk group that once you reach the maximum, "subsequent connection attempts will be rejected by the server." With under 10 users you will use a handful.
- **No payment method needed** on Spark — the official pricing page lists the Spark plan as "No-cost" with "No payment method needed." Spark uses hard quota caps enforced "strictly with no overage billing," so there is no risk of a surprise charge. You would have to deliberately upgrade to the pay-as-you-go "Blaze" plan to ever be charged.
- Real-time sync: the Realtime Database pushes changes to all connected clients over a persistent WebSocket, so one kid's action appears on another tablet in well under a second — better than the "polling every few seconds" fallback you said was acceptable.

**Why not the alternatives:**
- **Supabase free tier** (500 MB Postgres, 200 concurrent realtime connections, 2 million realtime messages/month, no credit card) is capable, but **free projects pause automatically after one week of inactivity** (policy tightened to 1 week on 2026-02-01). Per Supabase's own definition, "inactivity" means "no database activity, not no dashboard visits," and "when a project resumes, it takes around 30 seconds to wake up." A paused project goes offline until manually restored from the dashboard. For a family game that may sit unused for a week, this is a real dealbreaker unless you set up a keep-alive ping — extra complexity a non-developer should avoid.
- **Cloudflare Workers KV** free tier, per Cloudflare's official blog: "100,000 read operations and 1,000 each of write, list and delete operations per day, resetting daily at UTC 00:00, with a maximum total storage size of 1 GB. Operations that exceed these limits will fail with an error." The 100:1 read/write asymmetry is the problem — a garden game where kids frequently tend plots is write-heavy, and 1,000 writes/day could be hit. KV also requires writing a Cloudflare Worker (server code) to mediate access, which is beyond a non-developer's hour.
- **Cloudflare D1** free tier: 5 million rows read/day, 100,000 rows written/day, 5 GB storage — more generous on writes, but Cloudflare's official changelog states: "Beginning September 1, 2026, D1 queries on the Workers Free plan will fail when an account exceeds the daily row read or row write limits. Queries via the Workers Binding API and the REST API will return errors until the limit resets at midnight UTC." More importantly, D1 must be queried from a Worker; it cannot be called directly from a static HTML page.
- **Deno Deploy + Deno KV** free tier: 1 GiB KV, 1M requests/month, no expiry — but you must write and deploy a Deno server (TypeScript), and Deno's own docs note that free organizations "can only make use of restricted Free plan limits until they verify their organization by linking a credit card." [Deno](https://docs.deno.com/deploy/changelog/) Both facts make it a poor fit for a non-developer who explicitly wants no credit card.
- **Firestore** (the other Firebase database) also works and shares the Spark plan (1 GiB storage, 50,000 reads/day, 20,000 writes/day, 20,000 deletes/day per the official pricing page), but for a small set of shared JSON blobs that everyone watches live, the Realtime Database's simpler "one JSON tree + onValue listener" model is easier to reason about and has no per-day read/write cap that a chatty listener could brush against.

**How the JS integration works (no server required):** You add the Firebase web SDK via a `<script>` tag (or ES module import from gstatic.com), paste your project's config object (apiKey, databaseURL, etc.), then use `set()`/`update()` to write and `onValue()` to subscribe to live changes. Example pattern:
```js
import { getDatabase, ref, set, onValue } from "firebase/database";
const db = getDatabase();
// write
set(ref(db, 'garden/plot3'), { plant: 'alebrije-cactus', water: 2 });
// live read — fires immediately and on every change
onValue(ref(db, 'garden'), (snap) => renderGarden(snap.val()));
```
This is a direct swap for the old `window.storage` calls: reads become `onValue` subscriptions and writes become `set`/`update`.

### Traffic monitoring: Cloudflare Web Analytics (primary) or GoatCounter (alternative)
- **Cloudflare Web Analytics** is free, privacy-first (no cookies, no personal data, no GDPR banner needed), and works on **any** site including GitHub Pages via a single JavaScript beacon snippet — you do not need to move DNS to Cloudflare. You add a site in the Cloudflare dashboard, copy the `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"..."}'>` snippet into your HTML, and you get page views, visitors, top pages, and referrers. The token appearing in page source is expected and not a security risk. Gotcha: ad blockers/Firefox Enhanced Tracking Protection block the beacon, so counts undercount somewhat.
- **GoatCounter** is a strong alternative: free hosted tier for personal/non-commercial use, a tiny (~3.5 KB) cookieless script, one `<script>` tag to install, and a simple dashboard of visits and referrers. It is ideal for exactly your goal — spotting if the URL gets shared beyond the family.
- Either lets you catch unexpected traffic spikes indicating the URL leaked. Cloudflare's is slightly easier if you may later use Cloudflare for anything else; GoatCounter is the most minimal and privacy-focused.

## Details

### Recommended step-by-step path

**Phase 1 — Stand up the static site (GitHub Pages), ~15 min**
1. Create a free GitHub account.
2. Create a new public repository (e.g., `alebrijes-garden`).
3. Upload/paste your single `index.html` (use "Add file" → "Upload files" or "Create new file").
4. Go to Settings → Pages → Source: "Deploy from a branch" → select `main` and `/ (root)` → Save.
5. Your game is live at `https://<username>.github.io/alebrijes-garden/` within a minute or two.
6. (Optional) Add a custom subdomain: create a CNAME record at your DNS provider pointing your chosen subdomain to `<username>.github.io`, enter the subdomain in Settings → Pages, wait for the SSL certificate, then tick "Enforce HTTPS."

**Phase 2 — Add the shared data store (Firebase Realtime Database), ~25 min**
1. Go to console.firebase.google.com and create a project (no credit card requested on Spark).
2. In "Build → Realtime Database," click "Create Database," pick a region.
3. **Enable Anonymous Authentication** (Build → Authentication → Sign-in method → Anonymous → Enable). This gives every tablet a unique identity automatically with no login screen.
4. Set **permanent security rules** so the database is not wide open and does not expire. A pragmatic pattern for a tiny private game: require an authenticated (anonymous) session and keep the data under a hard-to-guess top-level node, e.g.:
```json
{
  "rules": {
    "garden-x7f9q2": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```
5. In Project Settings, register a "Web app" to get the config object; paste it into your HTML and add the Firebase SDK `<script>` includes.
6. In your JS, call anonymous sign-in on load, then wire `onValue` (reads) and `set`/`update` (writes) against the `garden-x7f9q2` node — this replaces `window.storage`.

**Phase 3 — Add analytics (Cloudflare Web Analytics), ~10 min**
1. Create a free Cloudflare account.
2. Dashboard → Web Analytics → "Add a site" → enter your GitHub Pages hostname.
3. Copy the JS beacon snippet and paste it just before `</body>` in your HTML.
4. Commit; within a day you will see visits, top pages, and referrers.

**Day-to-day updates:** Edit `index.html` directly on github.com (open the file → pencil icon → make changes → "Commit changes"), or edit locally and `git push`. Changes go live automatically in seconds to a couple of minutes. No rebuild, no redeploy button, no CLI required.

### How this maps to your data model
Your four data types map cleanly onto a single JSON tree under the private node:
- Garden plot states → `garden-x7f9q2/plots` (object keyed by plot id)
- Codex of discovered items → `garden-x7f9q2/codex` (array or object)
- Rolling discovery feed → `garden-x7f9q2/feed` (use `push()` for append-only entries)
- Numeric counter → `garden-x7f9q2/counter` (use a transaction to avoid two tablets clobbering each other's increment)

All four are tiny and sync live to every tablet through one or a few `onValue` listeners.

## Recommendations
1. **Adopt GitHub Pages + Firebase Realtime Database + Cloudflare Web Analytics now.** It is the only combination that is free with no credit card, needs no server code, syncs in real time, and does not pause on inactivity.
2. **Do not use Firebase "Test mode" and forget it.** Test mode makes the database world-readable/writable and, per Firebase docs, its rules "expire after 30 days and lock your database completely" (locked mode blocks all client access) — which would then break the game entirely. Set the permanent `auth != null` rules above on day one.
3. **Use Anonymous Auth, not "security by URL alone."** Because your Firebase config (including the database URL) is visible in page source, an unguessable URL is not truly secret. Anonymous Auth blocks casual scanners with almost no added complexity and no login screen for the kids.
4. **Use a `transaction()` for the numeric counter** so simultaneous increments from two tablets don't overwrite each other.
5. **Keep GoatCounter as a backup analytics option** if ad blockers make Cloudflare's counts look too low, or if you prefer the simplest possible privacy-first tool.

**Thresholds that would change the recommendation:**
- If simultaneous devices ever approach ~100, or monthly data downloads approach 10 GB, you'd need Firebase Blaze (pay-as-you-go) — extremely unlikely at <10 users with <1 MB of data.
- If you later want the game fully off Google's ecosystem, Supabase becomes viable **only if** you add a keep-alive ping (e.g., a free UptimeRobot monitor every 5 minutes) to defeat the 7-day inactivity pause.
- If write volume ever became genuinely tiny and read-dominated, Cloudflare Workers KV would be viable, but only if someone is comfortable writing a small Worker.

## Caveats
- **Free-tier terms change.** All figures here reflect 2026 sources; re-check firebase.google.com/pricing, the Supabase and Cloudflare pricing pages, and GitHub Pages limits before relying on specific caps.
- **Firebase config is public.** This is normal for client-side Firebase apps, but it means security rests entirely on your security rules, not on secrecy of the config. The Anonymous Auth + unguessable-node pattern is appropriate for a low-stakes family game but is not bank-grade security; anyone who both discovers your database URL and creates an anonymous session could in principle read/write the node. For a kids' garden game the stakes are low, but do not store anything sensitive.
- **Cloudflare's April-2025 consolidation of Pages into Workers** means new Cloudflare features ship Workers-first; this doesn't affect the recommended GitHub Pages + Firebase stack but is a reason not to bet the static hosting on Cloudflare Pages specifically.
- **Ad blockers undercount analytics.** Both Cloudflare Web Analytics and GoatCounter rely on a JS beacon that privacy tools can block, so treat visit counts as directional, not exact.
- **GitHub Pages requires a public repo on the free plan.** Your game code will be publicly viewable. Since the app is a client-side game with no secrets beyond the (already-public) Firebase config, this is acceptable — but don't commit any private keys.
- **The 30-day Test-mode expiry** for Realtime Database is surfaced mainly through the Firebase console UI and warning emails rather than a single static docs sentence; the mechanism is a `now < <timestamp>` rule you can extend or replace with permanent rules.