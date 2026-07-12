# GESN NET

GESN NET is a Next.js application for managing an internet service provider business. It includes authenticated admin access, customer records, monthly billing, expenses, reports, settings, and invoice export.

For full app documentation, see [docs/APP_DOCUMENTATION.md](docs/APP_DOCUMENTATION.md).

## Features

- Clerk authentication for protected dashboard routes
- Dashboard summaries for customers, collections, dues, expenses, and profit
- Customer management with package, monthly fee, connection, router, and IP details
- Monthly bill generation for active customers
- Payment marking and invoice download support
- Expense tracking by category, month, and year
- Income, expense, profit, and due reports with CSV export
- Company and invoice settings stored in MongoDB

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Clerk
- MongoDB with Mongoose
- Radix UI components
- Recharts
- jsPDF and html2canvas

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
MONGODB_URI=
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev
```

Runs the app in development mode with Turbopack.

```bash
npm run build
```

Creates a production build and runs Next.js type and lint checks.

```bash
npm run start
```

Starts the production server after a successful build.

```bash
npm run lint
```

Runs the configured Next.js lint command.

## Project Structure

```text
app/
  (auth)/              Clerk sign-in and sign-up pages
  (root)/              Protected ERP pages and dashboard
components/ui/         Shared UI primitives
hooks/                 Client hooks
lib/actions/           Server actions for app data
lib/database/          MongoDB connection and Mongoose models
types/                 Shared TypeScript interfaces
```

## Main Routes

- `/` - Dashboard
- `/customers` - Customer records
- `/billing` - Bill generation and payment management
- `/expenses` - Expense records
- `/reports` - Financial reports and CSV export
- `/settings` - Company and invoice settings
- `/admins` - Admin management

## Database

The app uses MongoDB through Mongoose. Set `MONGODB_URI` in `.env.local`. The database connection uses the `GESN-net` database name.

Core models:

- `Customer`
- `Bill`
- `Expense`
- `Setting`
- `Admin`

## Build Notes

Run the TypeScript compiler directly when checking types:

```bash
npx tsc --noEmit
```

`npm run build` may attempt to connect to MongoDB while generating pages. Make sure `MONGODB_URI` is reachable from the build environment.
