# PLAN.MD — ApplianceTrack: Job Management System for Appliance Repair Technicians

---

## ⚠️ Development Rule — MUST BE FOLLOWED

We move **strictly step by step** through the "Development Order" section.

- Complete **only one step at a time**
- After each step, show the code and ask: **"Ready to move to the next step?"**
- **Never write code for upcoming steps** without an explicit instruction from the user
- If the user has not given the go-ahead — wait
- Update docs/checklist.md after any step is completed
- Make sure that the dev server is running after each step so I can verify result and test them

---

## Project Overview

ApplianceTrack is a web application for managing appliance repair service jobs. It allows technicians and managers to maintain a customer database, schedule jobs on a daily timeline, issue estimates, collect customer approval, convert estimates to invoices.

We need to have mobile friendly web-app:

1. **Search & filtering** — global search across customers, jobs, invoices
2. **Export** — CSV/PDF export of reports and invoice lists for accounting
3. **Overdue reminders** — cron job to notify about overdue invoices
4. **Mobile UI** — fully responsive; technicians work from their phones
5. **On-site signature** — customer signs the work order directly in the app
6. **Estimate templates** — save common line item sets for reuse

Analyze which CRUD operations we need for this project, according to the models below. Ask me before implementing

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 and React Router |
| UI | Chakra UI |
| Bundler | Vite |
| Language | TypeScript (strict mode) |
| Styles | SASS (CSS Modules, `*.module.scss`) |
| State | React Context + useReducer |
| Tests | Jest + React Testing Library |
| API & Database | Store to localStorage (will figure this out later), mock interface for CRUD, but save to localStorage |
| Email | Nodemailer (transactional emails) |

---
## Project Structure

Propose project structures, that will fit to this project description and will be scalable for the future features. Ask me for confimation, don't apply any structures by yourself.

---

## Database (Prisma Schema)

```
model Customer {
  id          String     @id @default(cuid())
  name        String
  email       String?
  phone       String
  address     String
  city        String?
  zip         String?
  jobs        Job[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Job {
  id            String      @id @default(cuid())
  title         String
  status        JobStatus   @default(NEW)
  priority      Priority    @default(NORMAL)
  scheduledAt   DateTime?   // Start time for timeline placement
  scheduledEnd  DateTime?   // End time for timeline placement
  completedAt   DateTime?
  address       String
  notes         String?
  photos        String[]    // URLs from Blob/S3
  customerId    String
  customer      Customer    @relation(fields: [customerId], references: [id])
  estimate      Estimate?
  invoice       Invoice?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

enum JobStatus {
  NEW
  SCHEDULED
  IN_PROGRESS
  WAITING_PARTS
  ESTIMATE_SENT
  APPROVED
  INVOICED
  PAID
  CANCELLED
}
enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}

model Estimate {
  id            String         @id @default(cuid())
  jobId         String         @unique
  job           Job            @relation(fields: [jobId], references: [id])
  lineItems     LineItem[]
  subtotal      Float
  tax           Float          @default(0)
  total         Float
  status        EstimateStatus @default(DRAFT)
  approvalToken String?        @unique  // UUID for public approval link
  approvedAt    DateTime?
  approvedBy    String?        // Customer name at approval
  sentAt        DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

enum EstimateStatus {
  DRAFT
  SENT
  APPROVED
  DECLINED
  EXPIRED
}

model LineItem {
  id          String    @id @default(cuid())
  description String
  quantity    Float
  unitPrice   Float
  total       Float
  taxable     Bool     @default(false)
  type        LineItemType @default(LABOR)
  sortOrder   Int          @default(0) // First item shown on timeline card
}

enum LineItemType {
  LABOR
  PART
  FEE
  DISCOUNT
}

model Invoice {
  id              String        @id @default(cuid())
  jobId           String        @unique
  job             Job           @relation(fields: [jobId], references: [id])
  invoiceNumber   String        @unique  // INV-2024-0001
  lineItems       LineItem[]
  subtotal        Float
  tax             Float         @default(0)  // WA sales tax: 10.35% default
  total           Float
  status          InvoiceStatus @default(UNPAID)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

enum InvoiceStatus {
  UNPAID
  PARTIAL
  PAID
  OVERDUE
  CANCELLED
}
```