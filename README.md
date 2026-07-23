<div align="center">

# 🌐 GESN-NET

### Modern ISP Management & Billing ERP System

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Clerk](https://img.shields.io/badge/Clerk-Authentication-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

*A full-featured, enterprise-grade ERP application for Internet Service Providers (ISPs) to manage customers, automate monthly billing, generate PDF invoices, track operational expenses, and analyze real-time financial metrics.*

[Explore Documentation](docs/APP_DOCUMENTATION.md) · [Report Bug](https://github.com/ninazmul/gsen.net/issues) · [Request Feature](https://github.com/ninazmul/gsen.net/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the Application](#running-the-application)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Database Models](#-database-models)
- [Main Application Routes](#-main-application-routes)
- [Scripts Reference](#-scripts-reference)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🚀 Overview

**GESN-NET** is built specifically to address the operational challenges of modern Internet Service Providers. From subscription management and IP/router tracking to automatic monthly bill generation, expense tracking, and custom PDF invoice generation, GESN-NET streamlines ISP operations into a single intuitive control panel.

### Why GESN-NET?
- ⚡ **Automated Billing Pipeline:** Batch generate bills for active subscribers with single-click payment status updates.
- 📄 **Professional Invoices:** Export and print customizable PDF invoices embedded with your company branding, logo, and terms.
- 📊 **Real-Time Financial Intelligence:** Interactive charts and breakdown metrics for monthly revenue, dues, expenses, and net profit.
- 🔒 **Secure Multi-Tenant RBAC:** Clerk authentication paired with MongoDB authorization ensures only verified administrators access sensitive business data.

---

## ✨ Key Features

### 📊 Real-Time Analytics & Dashboard
- **Executive Summaries:** Track active, inactive, and disconnected customer totals.
- **Financial Metrics:** Instant breakdown of current month's collection, pending dues, operational expenses, and net profit.
- **Interactive Visualizations:** Revenue vs. Expense trends over time powered by **Recharts**.
- **Activity Stream:** Real-time log of recent bill payments and operational expense entries.

### 👥 Customer Management
- Full lifecycle management for subscriber accounts (Active, Inactive, Disconnected).
- Detailed customer profiles: Customer Code, Name, Phone, Email, Physical Address.
- Technical connection details: Package Name, Monthly Fee, Connection Date, Assigned Router, and IP Address.
- Quick search, filtering by status, and soft-delete capabilities.

### 💳 Automated Billing & Invoicing
- **One-Click Monthly Bill Generation:** Automatically targets all active subscribers for any chosen billing cycle.
- **Payment Lifecycle Management:** Easily record partial/full payments and update bill states (`Paid` / `Unpaid`).
- **PDF Invoice Generation & Printing:** Pixel-perfect invoice downloads using `html2canvas` and `jsPDF`.
- Customizable invoice headers, prefix IDs, tax details, and terms.

### 💸 Operational Expense Tracking
- Categorized expense recording (Bandwidth, Electricity, Staff Salary, Maintenance, Equipment, Rent, Transport, Misc).
- Date-based expense tracking with category and monthly filtering.
- Automatic integration into profit & loss reports.

### 📈 Reports & Data Export
- Comprehensive breakdown for Income, Expenses, Profitability, and Outstanding Dues.
- **CSV Data Export:** Instant one-click export for financial auditing and external accounting tools.
- Flexible date range and monthly filtering.

### ⚙️ Company Settings & Custom Branding
- Configure company identity, logo URL, contact info, and tax registration.
- Customize invoice prefix tags (e.g., `INV-2026-`) and global currency symbols.
- Role-based Admin user management to control team access.

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client[Web Browser Client] -->|HTTP / React 19| AppRouter[Next.js 15 App Router]
    
    subgraph Security & Access Control
        Clerk[Clerk Auth Provider] -->|Verify Token| AppRouter
        AppRouter -->|Email Whitelist Check| AdminGuard[Admin RBAC Middleware / Action Guard]
    end

    subgraph Core Application Layer
        AppRouter -->|Server Actions| ServerActions[lib/actions]
        ServerActions --> DashboardActions[Dashboard & Metrics]
        ServerActions --> CustomerActions[Customer CRUD]
        ServerActions --> BillActions[Billing & Invoice Engine]
        ServerActions --> ExpenseActions[Expense Tracker]
    end

    subgraph Data & Storage Layer
        ServerActions -->|Mongoose ODM| Mongo[(MongoDB Database)]
        Mongo --> CustomerModel[Customer Schema]
        Mongo --> BillModel[Bill Schema]
        Mongo --> ExpenseModel[Expense Schema]
        Mongo --> SettingModel[Setting Schema]
        Mongo --> AdminModel[Admin Schema]
    end

    subgraph Output Services
        BillActions --> PDFGen[jsPDF + html2canvas Engine]
        ServerActions --> CSVExport[CSV Generator]
    end
```

---

## 🛠️ Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 15](https://nextjs.org/) | App Router with React Server Components & Turbopack |
| **UI Library** | [React 19](https://react.dev/) | High-performance client components & hooks |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Strict type safety across client and server |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) | Utility-first responsive design & dark mode primitives |
| **Components** | [Radix UI Primitives](https://www.radix-ui.com/) | Accessible, unstyled UI components |
| **Database** | [MongoDB](https://www.mongodb.com/) + [Mongoose 8](https://mongoosejs.com/) | Document database with schema validation & indexing |
| **Authentication** | [Clerk Auth](https://clerk.com/) | Passwordless, OAuth, and multi-factor admin login |
| **Data Viz** | [Recharts](https://recharts.org/) | Responsive SVG charts for revenue and expense trends |
| **Document Export** | `jsPDF` & `html2canvas` | Client-side PDF invoice rendering and printing |
| **Form Handling** | `react-hook-form` + `zod` | Schema-based client and server form validations |

---

## 🏁 Getting Started

### Prerequisites

Ensure you have the following installed on your development machine:
- **Node.js**: `v18.17.0` or higher (Node v20+ recommended)
- **npm**: `v9.0.0` or higher
- **MongoDB**: A running local MongoDB instance or a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster URI.
- **Clerk Account**: A free account on [Clerk.com](https://clerk.com) to manage API keys.

---

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ninazmul/gsen.net.git
   cd gsen.net
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

---

### Environment Configuration

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Fill in your configuration credentials:

```env
# Clerk Authentication Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk Route Redirects
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Database Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/GESN-net?retryWrites=true&w=majority
```

---

### Running the Application

1. **Start Development Server:**
   ```bash
   npm run dev
   ```
   The app will start with **Turbopack** enabled at [http://localhost:3000](http://localhost:3000).

2. **Initial Admin Registration:**
   - Navigate to `http://localhost:3000/sign-in` and register an admin account.
   - *Note:* The very first user to sign in automatically becomes the primary Admin in MongoDB. Subsequent sign-ins must be authorized in `/admins`.

---

## 🔑 Environment Variables

| Variable | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | String | Yes | Clerk public API key for frontend authentication |
| `CLERK_SECRET_KEY` | String | Yes | Clerk secret key for backend token verification |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | String | Yes | Path for sign-in page (`/sign-in`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | String | Yes | Path for sign-up page (`/sign-up`) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | String | Yes | Redirect path after successful authentication (`/`) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | String | Yes | Redirect path after sign-up completion (`/`) |
| `MONGODB_URI` | String | Yes | MongoDB connection string including database name |

---

## 📁 Project Structure

```text
GESN-net/
├── app/
│   ├── (auth)/              # Public Clerk authentication routes (sign-in, sign-up)
│   ├── (root)/              # Protected ERP dashboard and module routes
│   │   ├── billing/         # Monthly bill generation & payment tracking
│   │   ├── customers/       # Subscriber management & connection details
│   │   ├── expenses/        # Operational expense recording & categorization
│   │   ├── reports/         # Financial metrics & CSV data exports
│   │   ├── settings/        # Invoice formatting & company profile settings
│   │   ├── admins/          # Admin user RBAC authorization management
│   │   └── page.tsx         # Executive Overview Dashboard
│   ├── api/                 # Next.js API endpoints
│   ├── favicon.ico
│   ├── globals.css          # Tailwind CSS global styles & custom theme tokens
│   └── layout.tsx           # Root layout with ClerkProvider & Toast notifications
├── components/
│   ├── ui/                  # Radix UI primitives (Button, Dialog, Select, etc.)
│   └── shared/              # Shared layouts, Sidebar, Navbar & Modals
├── docs/
│   └── APP_DOCUMENTATION.md # Full technical specification and architecture guide
├── hooks/                   # Reusable React custom hooks
├── lib/
│   ├── actions/             # Next.js Server Actions (customer, bill, expense, settings)
│   ├── database/            # Mongoose connection & data models
│   └── utils.ts             # Formatting helpers (currency, date, classnames)
├── public/                  # Static assets & brand logos
├── types/                   # Global TypeScript interface & type definitions
├── middleware.ts            # Clerk Auth routing guard middleware
├── next.config.ts           # Next.js build & header configurations
├── tailwind.config.ts       # Tailwind CSS custom themes & plugin settings
└── package.json             # Project dependencies & script commands
```

---

## 🗄️ Database Models

| Model Name | Description | Primary Fields |
| :--- | :--- | :--- |
| **`Customer`** | Subscriber records | `customerCode`, `name`, `phone`, `package`, `monthlyFee`, `connectionDate`, `router`, `ipAddress`, `status` |
| **`Bill`** | Monthly billing records | `customer`, `month`, `year`, `amount`, `status` (`Paid`/`Unpaid`), `paidDate`, `paymentMethod` |
| **`Expense`** | Operational expenses | `title`, `amount`, `category`, `date`, `month`, `year`, `notes` |
| **`Setting`** | Company invoice identity | `companyName`, `logoUrl`, `phone`, `email`, `address`, `invoicePrefix`, `currency` |
| **`Admin`** | Authorized team members | `clerkId`, `email`, `name`, `role`, `createdAt` |

---

## 🗺️ Main Application Routes

| Route Path | Access | Purpose |
| :--- | :--- | :--- |
| `/` | Admin | Executive Overview Dashboard with live metrics & charts |
| `/customers` | Admin | Search, add, edit, and filter ISP customer accounts |
| `/billing` | Admin | Monthly billing engine, payment status, and PDF invoice export |
| `/expenses` | Admin | Operational expense logger with category filtering |
| `/reports` | Admin | Financial P&L breakdown and CSV data exports |
| `/settings` | Admin | Configure company branding, invoice prefix, and currency |
| `/admins` | Admin | Manage administrative access and whitelisted team emails |
| `/sign-in` | Public | Clerk authentication login portal |
| `/access-denied` | Signed-in | Restricted access page for non-whitelisted users |

---

## 📜 Scripts Reference

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server with Turbopack at `localhost:3000`. |
| `npm run build` | Compiles production assets, runs type check, and checks ESLint rules. |
| `npm run start` | Launches the production Node.js server post-build. |
| `npm run lint` | Runs ESLint syntax and code quality checks across the codebase. |
| `npx tsc --noEmit` | Runs the TypeScript compiler in dry-run mode for type validation. |

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👤 Author & Contact

**N. I. Nazmul**
- Email: [nazmulsaw@gmail.com](mailto:nazmulsaw@gmail.com)
- GitHub: [@ninazmul](https://github.com/ninazmul)
- Website: [gsen.net](https://gsen.net)

---

<div align="center">
  <sub>Built with ❤️ for modern Internet Service Providers.</sub>
</div>
