# LendFlow | Loan Management System

LendFlow is a modern, high-end, production-grade **Loan Management System (LMS)** built as a CreditSea technical assignment. 

It provides an end-to-end sandbox representing a lending platform where borrowers can register, fill details, undergo an instant Business Rule Engine (BRE) eligibility audit, upload income slips, select custom sliders for loan calculations, and track approval processes. Simultaneously, an **Operations Dashboard** gives internal executives (Sales, Sanction, Disbursement, and Collection) role-based views to guide applications through their respective lifecycles.

---

## 🛠️ Technology Stack

- **Monorepo Structure**: Complete workspace with separated frontend and backend services.
- **Frontend Engine**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Lucide React.
- **Backend API**: Node.js + Express.js + TypeScript.
- **Database Engine**: MongoDB + Mongoose ODM.
- **Security & Auth**: JWT (JSON Web Tokens) + BcryptJS password hashing.
- **File Uploader**: Multer (stores files locally in `backend/uploads/`).

---

## 🔑 Sandbox Tester Credentials

A database seed script automatically prepares pre-created accounts for all roles with dummy loans in various stages. 

To test, log in using **`Password123`** as the password for all profiles:

| Account Type / Role | Sandbox Email | Target Dashboard Module / View |
| :--- | :--- | :--- |
| **System Administrator** | `admin@lendflow.com` | Access **ALL** modules (Sales, Sanction, Disburse, Collection) |
| **Sales Executive** | `sales@lendflow.com` | Lead tracking (registered borrowers in pre-application stages) |
| **Sanction Underwriter** | `sanction@lendflow.com` | Approve or Decline applied loans (review salary slips) |
| **Disbursement Officer** | `disbursement@lendflow.com` | Release funds for approved/sanctioned applications |
| **Collection Executive** | `collection@lendflow.com` | Repayment ledger (record payments with UTR, auto-close check) |
| **Borrower (Pending)** | `borrower2@lendflow.com` | Pre-applied loan in **APPLIED** stage (review-pending tracker) |
| **Borrower (Active)** | `borrower4@lendflow.com` | Active loan in **DISBURSED** stage (in-repayment tracker) |

---

## 🚀 Running the Project Locally

### 1. Prerequisites
- **Node.js** (v18 or higher is recommended).
- **MongoDB** running locally (`mongodb://127.0.0.1:27017/lendflow`) or access to MongoDB Atlas.

### 2. Set Up Environment Variables

Create a `.env` file in the `backend/` directory:
```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/lendflow
JWT_SECRET=lendflow-super-secret-key-12345
```

Create a `.env.local` file in the `frontend/` directory (optional - defaults to localhost:5001):
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

### 3. Install & Seed Heuristics

Install all monorepo dependencies and run the seed script from the **root workspace directory**:

```bash
# Install root, backend, and frontend packages concurrently
npm run install:all

# Seed database with the evaluator test profiles listed above
npm run seed
```

### 4. Start Development Servers

Run both Next.js and Express servers simultaneously in development mode with a single command:

```bash
npm run dev
```
- **Frontend** will be live on [http://localhost:3000](http://localhost:3000)
- **Backend API** will be active on [http://localhost:5001](http://localhost:5001)

---

## 📐 Schema & Architecture Specifications

### 1. Database Collections
- **Users**: Handles logins, hashes passwords, and locks role classifications.
- **Loans**: Integrates step records, salary file paths, calculated simple interest metrics (`SI = P * R * T / 36500`), and lifecycle statuses:
  `PRE_APPLIED` ➔ `APPLIED` ➔ `SANCTIONED` ➔ `DISBURSED` ➔ `CLOSED` (or `REJECTED`).
- **Payments**: Records transaction logs. Requires a **globally unique UTR** to prevent duplicates, and auto-calculates total paid vs loan repayment target to trigger automatic status closures.

### 2. Business Rule Engine (BRE) Guidelines
Run on the server for security during KYC personal detail submissions. Triggers rejection if:
- **Age**: Outside the `23` to `50` bracket (calculated dynamically from DOB).
- **Salary**: Net earnings fall below **₹25,000 / month**.
- **PAN**: Does not match standard alphanumeric regex `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`.
- **Employment**: Applicant is marked as **Unemployed**.
