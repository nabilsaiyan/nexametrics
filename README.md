# NexaMetrics — E-Commerce Analytics Dashboard

A production-grade analytics dashboard for e-commerce built as a portfolio project. Real API calls, live order streaming, interactive charts, dark/light theming, and a complete settings + billing flow — the kind of internal tool real companies ship.

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=flat-square&logo=vite&logoColor=white)
![SCSS](https://img.shields.io/badge/SCSS-CC6699?style=flat-square&logo=sass&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?style=flat-square&logo=express)
![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=flat-square)

---

## Features

**Dashboard**
- KPI cards with live sparklines (revenue, orders, customers, AOV)
- Revenue area chart with time-range selector (7D / 30D / 90D / 1Y)
- Category breakdown pie chart
- Live order feed — new orders stream in every 8 seconds via polling
- Top products bar with mini progress bars

**Orders**
- Full paginated orders table with sort, search, date-range and status filters
- Slide-out panel with order details, customer info, item breakdown, and status timeline

**Products**
- Grid / table view toggle
- Category filter, multi-sort (revenue, price, rating, stock)
- Dismissible low-stock alert banner

**Customers**
- Segment filter (VIP, standard, new)
- Customer detail panel with order history and lifetime value

**Analytics**
- Revenue trend: this year vs last year (area chart)
- Orders by day of week and hour of day (bar charts)
- Revenue by category (horizontal bar)
- Conversion funnel
- Payment method split (pie chart)
- Top countries by revenue

**Profile & Billing**
- Plan cards (Starter / Pro / Enterprise) with live plan switching
- Billing history with invoice download
- Payment method and security cards

**Settings**
- Account management (name, email, password reset)
- Theme toggle (dark / light), density, and language
- Per-notification toggles
- Store settings (currency, date format, timezone)
- Third-party integration cards (Shopify, Stripe, WooCommerce, Klaviyo)
- Danger zone (export data, delete account)

**UX**
- Dark / Light mode with CSS custom property theming, persisted to localStorage
- Command palette (`⌘K`) — fuzzy search across orders, customers, and products
- Framer Motion page transitions
- Responsive: desktop sidebar + mobile bottom nav + hamburger overlay
- Scroll position reset on every navigation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript — strict mode |
| Build tool | Vite 8 |
| Styling | SCSS Modules with CSS custom properties for runtime theming |
| Font | Space Grotesk + Inconsolata (numbers) |
| Charts | Recharts 3 |
| Animations | Framer Motion 12 |
| Icons | Lucide React |
| Routing | React Router v7 |
| API server | Express 5 (dev) / Vercel serverless (production) |
| Data | @faker-js/faker — seeded deterministic generation (server-side only) |
| Notifications | react-hot-toast |
| Date utils | date-fns |
| Deployment | Vercel |

---

## Project Structure

```
storix/
├── server/
│   └── index.ts              # Express API — 17 endpoints, exports app for Vercel
├── src/
│   ├── components/
│   │   ├── layout/           # Header, Sidebar, Layout, ScrollToTop
│   │   └── ui/               # KpiCard, DataTable, Badge, Avatar, SlidePanel, CommandPalette, Skeleton
│   ├── context/
│   │   ├── SidebarContext.tsx # Collapsed / mobile-open state
│   │   └── ThemeContext.tsx   # Dark / light toggle, localStorage persistence
│   ├── data/
│   │   ├── generators.ts     # Faker-seeded data generation (server-only)
│   │   └── types.ts          # Shared TypeScript interfaces
│   ├── hooks/
│   │   ├── useApi.ts         # Generic fetch hook with AbortController
│   │   ├── useLiveMetrics.ts # Polls /api/orders/live every 8s
│   │   ├── useSidebar.ts
│   │   └── useDebounce.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Orders.tsx
│   │   ├── Products.tsx
│   │   ├── Customers.tsx
│   │   ├── Analytics.tsx
│   │   ├── Profile.tsx       # Plan management + billing
│   │   └── Settings.tsx      # Account, appearance, notifications, integrations
│   ├── router/
│   │   └── index.tsx
│   └── styles/
│       ├── global.scss       # CSS custom properties — full dark + light token set
│       ├── _variables.scss   # SCSS aliases → CSS custom properties
│       ├── _typography.scss
│       └── _reset.scss
├── vercel.json               # SPA rewrites + API route
└── vite.config.ts
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/metrics/current` | Current month KPIs |
| GET | `/api/metrics/daily?days=N` | Daily metrics for N days |
| GET | `/api/metrics/monthly` | Monthly revenue + orders (12 months) |
| GET | `/api/metrics/sparkline` | Sparkline data for KPI cards |
| GET | `/api/orders/live` | Single random order (used for live feed) |
| GET | `/api/orders/recent` | N most recent orders |
| GET | `/api/orders` | Paginated, filtered, sortable order list |
| GET | `/api/orders/by-status` | Order count by status |
| GET | `/api/orders/by-country` | Revenue by country |
| GET | `/api/orders/by-day` | Orders by day of week |
| GET | `/api/orders/by-hour` | Orders by hour of day |
| GET | `/api/products` | Filterable, sortable product list |
| GET | `/api/products/top` | Top N products by revenue |
| GET | `/api/products/revenue-by-category` | Revenue per category |
| GET | `/api/customers` | Filterable customer list |
| GET | `/api/customers/top` | Top N customers by spend |
| GET | `/api/customers/:id/orders` | Order history for a customer |

---

## Getting Started

### Prerequisites

- Node.js 20+

### Installation

```bash
git clone https://github.com/nabilsaiyan/nexametrics.git
cd nexametrics
npm install
```

### Run

```bash
npm run dev
```

Opens the app at [http://localhost:5173](http://localhost:5173). The Express API starts in parallel on port 3001 and the Vite dev server proxies `/api/*` to it.

---

## Deployment

This project deploys on [Vercel](https://vercel.com). The `vercel.json` handles:
- Building the Vite SPA
- Routing `/api/*` to the Express server as a Vercel serverless function
- Falling back all other routes to `index.html` for client-side routing

```bash
vercel deploy
```

---

## Design Decisions

**CSS custom property theming** — All colors live as CSS custom properties on `:root` (dark) and `[data-theme='light']`. SCSS variables are thin aliases (`$accent-cyan: var(--accent)`), so toggling the theme is a single `setAttribute` call with zero re-renders. Precomputed alpha tokens (`--a-a08: rgba(124,58,237,0.08)`) work around the `rgba(var(), x)` limitation in CSS.

**Server-side data generation** — `@faker-js/faker` runs only in `server/index.ts`. The browser bundle never imports it, keeping the client chunk small.

**Live metrics without WebSockets** — The dashboard polls `/api/orders/live` every 8 seconds with a simple `setInterval`. No socket infrastructure, no reconnect logic — good enough for a demo context and trivially replaceable with a real stream.

---

## License

MIT
