# TEEROP POS — Multi-Category POS & Inventory Management System

Final Capstone Project — TEEROP Web Development Internship, Batch 1

Built with an AI Coding Agent (Kiro)

---

## 🚀 Live Demo

**Frontend (Vercel):** https://teerop-pos-project.vercel.app/

**Backend API (Railway):** https://teerop-pos-production.up.railway.app

**API Health:** https://teerop-pos-production.up.railway.app/api/health

> **Deployment Note:** The backend is deployed on **Railway** instead of Render because Railway was used to avoid the card-payment requirement encountered during the Render deployment process. The frontend remains deployed on Vercel.

---

## Demo Credentials

| Role              | Email                                           | Password  |
| ----------------- | ----------------------------------------------- | --------- |
| Admin             | [admin@teerop.com](mailto:admin@teerop.com)     | Admin1234 |
| Inventory Manager | [manager@teerop.com](mailto:manager@teerop.com) | 123456    |
| Cashier           | [cashier@teerop.com](mailto:cashier@teerop.com) | 123456    |

> Create the Inventory Manager and Cashier accounts from the Admin → Users panel after first login.

---

## Project Overview

TEEROP POS is a full-stack, role-based Point-of-Sale and Inventory Management System. It supports three user roles (Admin, Inventory Manager, Cashier), five product categories with category-specific fields, a live billing/POS screen with SKU scanner simulation, automatic stock deduction on checkout, receipt generation, and store-wide analytics.

---

## Tech Stack

| Layer               | Technology                                   |
| ------------------- | -------------------------------------------- |
| Frontend            | React 19 + Tailwind CSS v4 + React Router v7 |
| Backend             | Node.js + Express 5                          |
| Database            | PostgreSQL + Sequelize 6                     |
| Authentication      | JWT + bcrypt                                 |
| File Upload         | Multer (local storage)                       |
| AI Build Assistant  | Kiro                                         |
| Backend Deployment  | Railway                                      |
| Frontend Deployment | Vercel                                       |

---

## Features

### Admin

* Full product CRUD across all 5 categories (Fragile, Cold, Tech, Cleaning, General)
* User management: create, edit, change password, deactivate
* Store-wide transaction history with receipt viewer
* Statistics: today's sales, all-time sales, total transactions, top-selling products, low-stock alert

### Inventory Manager

* Full product CRUD and image upload
* Low-stock alerts and restock actions
* Read-only sales overview for inventory planning
* Category-specific product fields with conditional form fields

### Cashier

* POS screen with SKU scanner simulation (press Enter to add to cart)
* Manual product search by name or SKU
* Live cart with quantity controls and stock enforcement
* 5% tax calculation with dynamic subtotal / grand total
* Checkout with atomic stock deduction and receipt generation
* Personal transaction history

---

## Product Categories

| Category | Extra Fields                                                                |
| -------- | --------------------------------------------------------------------------- |
| Fragile  | isFragile (badge), handlingNote                                             |
| Cold     | expiryDate (required, auto-flags items expiring within 3 days), storageTemp |
| Tech     | warrantyPeriod, serialNumber (unique)                                       |
| Cleaning | isHazardous (badge), safetyNote                                             |
| General  | No extra fields                                                             |

---

## Tax Rate

The POS uses a flat **5% tax rate**.

```text
Tax = Subtotal × 0.05
Grand Total = Subtotal + Tax
```

---

## Project Structure

```text
TEEROP-POS/

├── client/                  # React frontend (Vite)
│   └── src/
│       ├── api/             # Axios service functions
│       ├── components/      # Shared UI components
│       ├── context/         # AuthContext
│       └── pages/           # Role-based pages
│           ├── admin/
│           ├── inventory/
│           └── cashier/
├── server/                  # Express backend
│   └── src/
│       ├── config/          # Database config
│       ├── controllers/     # Route handlers
│       ├── middleware/      # Auth, error, upload
│       ├── models/          # Sequelize models
│       ├── routes/          # Express routers
│       └── validators/      # express-validator chains
├── docs/
│   ├── specs/               # Project specification
│   └── ai-prompts/          # AI agent prompt log
└── README.md
```

---

## Environment Variables

### Server (`server/.env`)

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://user:password@localhost:5432/teerop_pos
JWT_SECRET=replace_with_a_long_random_secret_string
JWT_EXPIRES_IN=8h
UPLOAD_DIR=uploads
```

### Client (`client/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

For production, set `VITE_API_URL` to the deployed Railway backend API URL:

```text
https://teerop-pos-production.up.railway.app/api
```

---

## Local Setup

### Prerequisites

* Node.js 18+
* PostgreSQL 14+

### Backend

```bash
cd server
cp .env.example .env
# Edit .env with your database credentials and JWT secret
npm install
node createAdmin.js   # Creates the admin account
npm run dev
```

### Frontend

```bash
cd client
cp .env.example .env
# Edit .env with your backend API URL
npm install
npm run dev
```

Open `http://localhost:5173` and log in with `admin@teerop.com` / `Admin1234`.

---

## API Overview

| Method | Endpoint                     | Access             | Description                               |
| ------ | ---------------------------- | ------------------ | ----------------------------------------- |
| POST   | /api/auth/login              | Public             | Login                                     |
| GET    | /api/auth/me                 | Auth               | Get current user                          |
| POST   | /api/auth/register           | Admin              | Create user (legacy)                      |
| GET    | /api/users                   | Admin              | List users                                |
| POST   | /api/users                   | Admin              | Create user                               |
| PUT    | /api/users/:id               | Admin              | Update user                               |
| PATCH  | /api/users/:id/password      | Admin              | Change password                           |
| PATCH  | /api/users/:id/deactivate    | Admin              | Deactivate user                           |
| GET    | /api/products                | All                | List products (search/filter)             |
| POST   | /api/products                | Admin, IM          | Create product                            |
| PUT    | /api/products/:id            | Admin, IM          | Update product                            |
| PATCH  | /api/products/:id/restock    | Admin, IM          | Add stock                                 |
| PATCH  | /api/products/:id/deactivate | Admin, IM          | Deactivate product                        |
| POST   | /api/products/:id/image      | Admin, IM          | Upload image                              |
| GET    | /api/products/low-stock      | Admin, IM          | Low stock list                            |
| POST   | /api/transactions            | Cashier            | Create sale / checkout                    |
| GET    | /api/transactions            | Admin, IM, Cashier | List transactions (cashier sees own only) |
| GET    | /api/transactions/:id        | Admin, IM, Cashier | View transaction                          |
| GET    | /api/statistics/dashboard    | Admin, IM          | Dashboard stats                           |
| GET    | /api/statistics/sales        | Admin              | Full sales stats                          |
| GET    | /api/statistics/inventory    | Admin, IM          | Inventory-focused stats                   |

---

## Deployment

### Backend (Railway)

1. Push the `server/` code to GitHub.
2. Create a new Railway project/service.
3. Connect the GitHub repository.
4. Configure the required environment variables.
5. Deploy the backend.
6. Verify the API using the health endpoint:
   `https://teerop-pos-production.up.railway.app/api/health`

### Frontend (Vercel)

1. Push the `client/` code to GitHub.
2. Import the project on Vercel.
3. Set the `VITE_API_URL` environment variable to the Railway backend API URL.
4. Deploy the frontend.
5. Verify the application at:
   `https://teerop-pos-project.vercel.app/`

---

## AI Agent Workflow

This project was built using Kiro as the AI coding agent. The development followed a strict phase-by-phase workflow:

1. Written spec before any code generation
2. One module per prompt — never "build everything at once"
3. Every generated file was reviewed before proceeding
4. Corrections made by re-prompting with the specific issue
5. Tested after every phase in Postman and the browser

See `docs/ai-prompts/PROMPT-LOG.md` for the full prompt history.

---

## Submission Checklist

* [x] GitHub repository with clear commit history
* [x] `client/` and `server/` folders
* [x] All three roles working end-to-end
* [x] Role-based access enforced on backend
* [x] Category-specific product fields
* [x] Image upload with Multer
* [x] POS with SKU scanner simulation
* [x] Cart with stock enforcement
* [x] Checkout with atomic stock deduction
* [x] Receipt generation
* [x] Transaction history (role-filtered)
* [x] Statistics: today's sales, all-time, top products, low stock
* [x] Responsive Tailwind CSS UI
* [x] README with env vars and credentials
* [x] AI prompt log
* [x] Backend deployed to Railway
* [x] Frontend deployed to Vercel
* [x] Demo walkthrough recorded
