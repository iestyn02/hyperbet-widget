<p align="center">
  <img
    src="https://res.cloudinary.com/dzpt57igj/image/upload/v1779688535/173eb530-308e-4570-98ce-e4c72ff50fd9_sesr6y.png"
    alt="Hyperbet Widget"
    width="100%"
  />
</p>

# 🎲 HyperBet Widget

> A server-rendered **Recent Bets** widget for a fictional iGaming player, built as a take-home exercise.

![HTMX](https://img.shields.io/badge/HTMX-2.x-36C?style=flat-square)
![Vanilla CSS](https://img.shields.io/badge/CSS-Custom_Properties-1572B6?style=flat-square&logo=css3&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?style=flat-square&logo=nestjs&logoColor=white)

---

## Overview

A lightweight, hypermedia-driven widget that shows a player's betting history in real time. No client-side framework, no build step, just HTML over the wire.

**Live demo:** [demo.codebrew.cc/3b408cc8](https://demo.codebrew.cc/3b408cc8)

### Features

- **Server-rendered HTML:** Nunjucks templates, every response is just markup
- **Result filtering:** all / wins / losses, state lives in the URL (`?filter=win`)
- **Paginated list:** prev/next, bookmarkable, fully functional on back/forward
- **Real-time updates:** new bet pushed via SSE every 10s with a dismissible toast
- **Live header stats:** balance, total bets, and win rate update in the same SSE round-trip via HTMX out-of-band swaps
- **Responsive:** single-column card layout on mobile, full table on desktop

---

## Stack

| Layer      | Choice                                           |
| ---------- | ------------------------------------------------ |
| Runtime    | Node.js / NestJS (TypeScript)                    |
| Templating | Nunjucks (server-side HTML fragments)            |
| Hypermedia | HTMX 2 + htmx-ext-sse                           |
| Realtime   | Server-Sent Events via NestJS `@Sse()` + RxJS   |
| Styling    | Vanilla CSS with custom properties               |
| Data       | In-memory, 75 seeded bets, one added every 10s  |

No database. No client-side framework. No build pipeline.

---

## Architecture

```
Browser                          Server (NestJS)
───────────────────────────────────────────────────────────
GET /                   ──────►  AppController
                                 → renders index.njk with
                                   full initial page + bets

HTMX fragment swap      ──────►  BetsController GET /bets
(filter / paginate)              → validates ?filter & ?page
                                 → renders bets-fragment.njk
                                   (rows + OOB: filters, pagination)

EventSource             ──────►  BetsController GET /bets/events
(SSE, persistent)       ◄──────  BetsService.betCreated$ (RxJS Subject)
                                 → renders toast.njk
                                   (toast + OOB: header stats)
```

Every interaction returns **rendered HTML**. The server holds all state; the client holds none. URL query params are the single source of truth for filter and page.

> **SSE vs WebSockets:** this project uses Server-Sent Events, not WebSockets. SSE is a plain HTTP connection where the server streams `text/event-stream` data one-way to the browser. No protocol upgrade, no `ws://`, no full-duplex channel. The browser's native `EventSource` API handles reconnection automatically. It's the right fit here because the data flow is strictly one direction: server to client.

---

## Running it

```bash
npm install
npm run start:dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

All are optional. The app works out of the box without any of them.

| Variable      | Default    | Effect                                                   |
| ------------- | ---------- | -------------------------------------------------------- |
| `SERVER_PORT` | `3000`     | Port to listen on                                        |
| `BASE_PATH`   | _(empty)_  | URL prefix — `BASE_PATH=app` mounts the widget at `/app` |
| `PRODUCTION`  | _(empty)_  | When set, extends the SSE bet interval from 10s to 30s  |

---

## Trade-offs

### URL as the only state store

Filter and page are query params (`?filter=win&page=2`). The server reads them on every request, whether it's a full page load or an HTMX fragment swap, and `hx-push-url` keeps the address bar canonical after each interaction.

Refresh, back/forward, and sharing a filtered view all work correctly with zero client-side state. Storing filter state in DOM attributes or a JS variable is simpler to wire up initially but breaks silently on refresh and makes deep-linking impossible. The URL is a better store for anything the user might want to revisit.

### SSE over polling

New bets are pushed via `GET /bets/events`, backed by an RxJS `Subject` in `BetsService`. When a bet is added, the controller renders the toast template server-side and sends the HTML as the SSE payload. The same response includes an HTMX `hx-swap-oob` fragment for the header stats, so balance, total bets, and win rate all update in one push with no second request and no client-side arithmetic.

A polling approach (`hx-trigger="every Ns"`) would work, but the interval is always wrong. Too short wastes requests when nothing changed; too long means stale data. SSE gives true push with automatic reconnection at no extra cost.

### Page-based pagination over infinite scroll

Infinite scroll fights the hypermedia model. It requires client-side state for how many rows are loaded, non-trivial scroll-position restoration across navigations, and a different URL strategy to represent "loaded up to row N". Page-based pagination maps cleanly to `?page=N`, stays fully bookmarkable, and the prev/next controls render straightforwardly server-side alongside the rows.

---

## What I'd polish with more time

**Accessibility:** filter buttons need `aria-pressed` to communicate active state to screen readers, HTMX swaps should trigger live-region announcements, and focus should return to a sensible element after pagination updates. None of it is hard; it just needs time and real screen-reader testing.

**Persistence:** `BetsService` encapsulates all data access behind `findAll()` and `addRandomBet()`. Controllers know nothing about storage. Swapping the in-memory array for a SQLite or Postgres repository is a clean seam: a new repository class and a migration, no controller or template changes required.

**Relative timestamps:** "2 min ago" is more useful than "17 May 2026, 14:32" for recent bets. The label would be recomputed server-side on each render rather than frozen at generation time, so HTMX fragment swaps always return accurate relative time, falling back to the absolute date for older entries.

**Test coverage:** `BetsService` is pure logic and trivially unit-testable. A handful of controller integration tests using NestJS's `supertest` helpers would cover the fragment-swap contract (correct OOB structure, filter validation, pagination boundaries) without needing a real browser.
