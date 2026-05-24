# Recent Bets

A server-rendered "Recent Bets" widget for a fictional iGaming player. Built as a take-home exercise.

## Stack

| Layer      | Choice                                          |
| ---------- | ----------------------------------------------- |
| Backend    | NestJS (TypeScript)                             |
| Templating | Nunjucks                                        |
| Hypermedia | HTMX 2 + htmx-ext-sse                           |
| Styling    | Vanilla CSS                                     |
| Data       | In-memory, 75 seeded bets, one added every 10 s |

No database, no client-side framework.

### [Live Demo](https://demo.codebrew.cc/3b408cc8)

## Running it

```bash
npm install
npm run start:dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Both optional. The app works out of the box without either.

| Variable      | Default   | Effect                                                        |
| ------------- | --------- | ------------------------------------------------------------- |
| `BASE_PATH`   | _(empty)_ | URL prefix, e.g. `BASE_PATH=my-app` puts the app at `/my-app` |
| `SERVER_PORT` | `3000`    | Port to listen on                                             |
| `PRODUCTION`  | _(empty)_ | Simple flag only used for interval duration for SSE           |

## Trade-offs

### State lives in the URL

Filter and page are query params `?filter=win&page=2`. The server reads them on every request, whether it's a full page load or an HTMX fragment swap. HTMX's `hx-push-url` keeps the address bar in sync after each interaction.

This means refresh, back/forward, and bookmarking all work correctly with zero client-side state. The alternative, keeping filter state in the DOM via data attributes or a JS variable, is simpler to wire up initially but breaks silently on refresh and makes sharing a filtered view impossible. The URL is a better store for anything the user might care to revisit.

### SSE over polling for live updates

New bets are pushed via a `GET /bets/events` Server-Sent Events endpoint, backed by an RxJS Subject in `BetsService`. When a bet is added, the controller renders the toast template server-side and sends it as the SSE payload. The response includes an out-of-band HTMX swap for the header stats, so the balance, total bets, and win rate all update in the same round-trip, no second request, no client-side arithmetic.

A polling approach (`hx-trigger="every Ns"`) would have worked but the interval is always wrong: too short wastes requests when nothing happened, too long means stale data. SSE gives true push with automatic reconnection built into `EventSource`.

### Page-based pagination over infinite scroll

Infinite scroll fights the hypermedia model. It requires client-side state for how many rows are currently loaded, non-trivial scroll position restoration across navigations, and a different URL strategy to represent "loaded up to row N". Page-based pagination maps cleanly to `?page=N`, stays fully bookmarkable, and the prev/next controls are straightforward to render server-side alongside the rows. The trade-off is that reaching a specific bet requires paging rather than scrolling, which is acceptable for a widget of this size.

## What I'd polish with another day

**Accessibility** - filter buttons need `aria-pressed` to communicate active state to screen readers, HTMX swaps should trigger live region announcements, and focus should return to a sensible element after pagination updates. None of this is hard; it just needs time and testing with a real screen reader.

**Real persistence** - `BetsService` already encapsulates all data access behind `findAll()` and `addRandomBet()`. The controllers know nothing about storage. Swapping the in-memory array for a SQLite or Postgres repository is a clean seam, no controller or template changes required, just a new repository class and a migration.

**Relative timestamps** - showing "2 min ago" is more useful than "17 May 2026, 14:32" for recent bets. The label would be recomputed server-side on each render (not frozen at generation time), so HTMX fragment swaps always return accurate relative time. For bets older than a day, fall back to the absolute date.
