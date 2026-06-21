# Group CMS

A full-stack drag-and-drop CMS for managing websites across a group of companies. Built with Next.js, Express, PostgreSQL, and modern tooling.

## Features

- **Multi-tenant architecture** — Manage company groups, subsidiaries, and individual sites
- **Drag-and-drop page builder** — 16+ content blocks with live preview
- **Sortable navigation** — Drag-and-drop menu management
- **Media library** — Upload and manage images, videos, and documents
- **Role-based access** — Super Admin, Group Admin, Company Admin, Editor roles
- **Public site preview** — Render published pages with company branding
- **Activity logging** — Track all CMS changes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Drag & Drop | @dnd-kit |
| Backend | Express.js, TypeScript |
| Database | PostgreSQL 16, Prisma ORM |
| Auth | JWT |
| Validation | Zod |

## Project Structure

```
group-cms/
├── apps/
│   ├── api/          # Express REST API
│   └── web/          # Next.js admin dashboard
├── packages/
│   └── shared/       # Shared TypeScript types
├── docker-compose.yml
└── package.json      # Monorepo root
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

### 1. Install dependencies

```bash
cd group-cms
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

### 3. Start PostgreSQL

```bash
npm run docker:up
```

### 4. Set up database

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 5. Start development servers

```bash
npm run dev
```

- **Admin Dashboard:** http://localhost:3000
- **API Server:** http://localhost:4000
- **Login:** `admin@groupcms.com` / `admin123`

## Page Builder Blocks

| Block | Description |
|-------|-------------|
| Hero Banner | Full-width hero with CTA |
| Heading | H1–H4 headings |
| Rich Text | HTML content |
| Image | Single image with caption |
| Gallery | Multi-image grid |
| Video | Embedded video |
| Call to Action | CTA section |
| Columns | Multi-column layout |
| Features Grid | Icon feature cards |
| Testimonials | Client quotes |
| Team Members | Team grid |
| Contact Form | Contact form |
| Map | Location map |
| Divider / Spacer | Layout utilities |
| Custom HTML | Raw HTML block |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/groups` | List groups |
| GET | `/api/companies` | List companies |
| GET | `/api/sites` | List sites |
| GET | `/api/pages?siteId=` | List pages |
| PUT | `/api/pages/:id/blocks` | Save page blocks |
| POST | `/api/media/upload` | Upload media |
| GET | `/api/public/site/:id/home` | Public home page |

## User Roles

- **SUPER_ADMIN** — Full access to everything
- **GROUP_ADMIN** — Manage group and all companies
- **COMPANY_ADMIN** — Manage assigned companies
- **EDITOR** — Edit pages and content

## Seed Data

The seed script creates:
- 1 admin user
- 1 company group (ACME Holdings)
- 3 subsidiary companies with websites
- Home, About, and Contact pages for each
- Navigation menus

## Scripts

```bash
npm run dev          # Start API + Web
npm run dev:api      # API only
npm run dev:web      # Web only
npm run build        # Build all packages
npm run db:studio    # Open Prisma Studio
npm run docker:up    # Start PostgreSQL
npm run docker:down  # Stop PostgreSQL
```

## License

MIT
"# Isahaq-CMS" 
