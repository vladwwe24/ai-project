# ApplianceTrack — Backend API Reference

## Overview

| | |
|---|---|
| **Framework** | Django REST Framework |
| **Database** | PostgreSQL |
| **Base URL** | `/api/v1/` |
| **Authentication** | Bearer token — `Authorization: Bearer <token>` |
| **Timestamps** | ISO 8601 UTC — `2026-05-18T14:30:00Z` |
| **Monetary values** | Decimal numbers — store as `DECIMAL(10,2)` in PostgreSQL |
| **IDs** | UUID v4 |

All authenticated endpoints return `401 Unauthorized` when the token is missing or invalid.

---

## Data Models

### Customer

```
customers
├── id              UUID          PK
├── name            VARCHAR(255)  required
├── phone           VARCHAR(20)   required
├── email           VARCHAR(255)  nullable
├── address         TEXT          nullable
└── created_at      TIMESTAMPTZ   auto
```

### Job

```
jobs
├── id                UUID          PK
├── customer_id       UUID          FK → customers.id, required
├── appliance_type    VARCHAR(100)  required
├── brand             VARCHAR(100)  nullable
├── model             VARCHAR(100)  nullable
├── issue             TEXT          nullable
├── status            VARCHAR(20)   enum (see below), default NEW
├── scheduled_at      TIMESTAMPTZ   required
├── scheduled_end_at  TIMESTAMPTZ   nullable
├── name              VARCHAR(255)  nullable
├── job_number        VARCHAR(20)   nullable, zero-padded sequential (e.g. "00001")
├── completed_at      TIMESTAMPTZ   nullable
├── created_at        TIMESTAMPTZ   auto
└── updated_at        TIMESTAMPTZ   auto
```

**JobStatus enum:** `NEW` `SCHEDULED` `IN_PROGRESS` `WAITING_PARTS` `ESTIMATE_SENT` `APPROVED` `INVOICED` `PAID` `COMPLETED` `CANCELLED`

### Note

```
notes
├── id          UUID        PK
├── job_id      UUID        FK → jobs.id, CASCADE DELETE
├── body        TEXT        required
├── created_at  TIMESTAMPTZ auto
└── updated_at  TIMESTAMPTZ auto
```

### Attachment

```
attachments
├── id          UUID        PK
├── job_id      UUID        FK → jobs.id, CASCADE DELETE
├── data_url    TEXT        base64 data URL — consider replacing with S3 key in production
└── created_at  TIMESTAMPTZ auto
```

> **Production note:** `data_url` stores a full `data:image/jpeg;base64,...` string. For production, store the raw binary in S3/GCS and return a signed URL instead.

### Estimate

```
estimates
├── id               UUID          PK
├── job_id           UUID          FK → jobs.id
├── estimate_number  VARCHAR(10)   6-digit zero-padded sequential (e.g. "000001")
├── tax_rate         DECIMAL(5,2)  e.g. 10.35
├── status           VARCHAR(10)   enum (see below), default DRAFT
├── approval_token   VARCHAR(64)   unique, nullable — generated when status → SENT
├── approved_by      VARCHAR(255)  nullable — customer name on approval
├── approved_at      TIMESTAMPTZ   nullable
├── sent_at          TIMESTAMPTZ   nullable
├── created_at       TIMESTAMPTZ   auto
└── updated_at       TIMESTAMPTZ   auto
```

**EstimateStatus enum:** `DRAFT` `SENT` `APPROVED` `REJECTED`

### LineItem

Line items belong to either an Estimate or an Invoice.

```
line_items
├── id           UUID           PK
├── estimate_id  UUID           FK → estimates.id, nullable, CASCADE DELETE
├── invoice_id   UUID           FK → invoices.id, nullable, CASCADE DELETE
├── description  VARCHAR(500)   required
├── quantity     DECIMAL(10,3)  required (supports fractional hours, e.g. 1.5)
├── unit_price   DECIMAL(10,2)  required
├── taxable      BOOLEAN        default true
└── category     VARCHAR(10)    enum: labor | material
```

> Exactly one of `estimate_id` or `invoice_id` must be set per row.

### Invoice

```
invoices
├── id              UUID           PK
├── job_id          UUID           FK → jobs.id, UNIQUE (one invoice per job)
├── invoice_number  VARCHAR(20)    sequential (e.g. "INV-2026-00001")
├── tax_rate        DECIMAL(5,2)
├── status          VARCHAR(10)    enum (see below), default UNPAID
├── paid_at         TIMESTAMPTZ    nullable
├── paid_amount     DECIMAL(10,2)  nullable — amount actually paid
├── payment_method  VARCHAR(50)    nullable
├── created_at      TIMESTAMPTZ    auto
└── updated_at      TIMESTAMPTZ    auto
```

**InvoiceStatus enum:** `UNPAID` `PARTIAL` `PAID` `OVERDUE` `CANCELLED`

### AppSettings

One row per user (or global if single-user).

```
app_settings
├── id                      UUID           PK
├── user_id                 UUID           FK → auth user, nullable for global
├── default_tax_rate        DECIMAL(5,2)   default 8.50
├── default_inspection_fee  DECIMAL(10,2)  default 75.00
└── overdue_threshold_days  INTEGER        default 10
```

---

## Entity Relationships

```
Customer (1) ──────────────────────── Job (many)
                                       │
                              ┌────────┼────────┐
                              │        │        │
                           Note[]  Attachment[]  │
                                                 │
                                    ┌────────────┤
                                    │            │
                                 Estimate     Invoice
                                (many)        (one)
                                    │            │
                                LineItem[]  LineItem[]
```

---

## Business Rules

1. **Job creation atomically creates an Invoice.** When `POST /jobs/` succeeds, the backend also creates an `UNPAID` Invoice with one labor line item: `description="Inspection"`, `quantity=1`, `unit_price=settings.default_inspection_fee` (default $75.00), `taxable=true`, `category=labor`. Both are committed in a single DB transaction — if either fails, both roll back.

2. **Mark Invoice PAID cascades to Job.** When `POST /invoices/{id}/mark-paid/` is called, the Invoice status becomes `PAID` and the linked Job status becomes `COMPLETED` in the same transaction.

3. **Invoice total cannot fall below paid_amount.** `PUT /invoices/{id}/` must reject (`400`) if the new computed total (subtotal + tax) would be less than the existing `paid_amount`.

4. **Auto-derive invoice status on update.** After `PUT /invoices/{id}/`, if the invoice has a `paid_amount`:
   - `new_total > paid_amount` → status = `PARTIAL`
   - `new_total <= paid_amount` → status = `PAID`

5. **Estimate approval token is single-use.** `POST /public/estimates/{token}/approve/` only succeeds if the estimate's current status is `SENT`. Any other status returns `409 Conflict`.

6. **OVERDUE auto-logic.** A background task (or on-read check) marks an Invoice `OVERDUE` if its status is `UNPAID` or `PARTIAL` and `NOW() - created_at > settings.overdue_threshold_days` (default 10 days).

7. **Estimate editable only in DRAFT.** `PUT /estimates/{id}/` returns `403` if status is not `DRAFT`.

8. **Estimate deletable only in DRAFT.** `DELETE /estimates/{id}/` returns `403` if status is not `DRAFT`.

9. **Apply estimate to invoice appends, never replaces.** `POST /estimates/{id}/apply-to-invoice/` adds estimate line items to the invoice with new IDs — existing invoice line items are kept.

10. **Sequential number generation.** `job_number`, `invoice_number`, and `estimate_number` are zero-padded integers based on total count. Use a DB sequence or `SELECT COUNT(*) + 1` inside a transaction to avoid race conditions.

11. **`taxable` defaults to `true`.** If omitted in a request body, treat as `true` server-side.

---

## Tax Calculation

```
subtotal          = SUM(quantity × unit_price)  for ALL line items
taxable_subtotal  = SUM(quantity × unit_price)  for items where taxable = true
tax               = taxable_subtotal × (tax_rate / 100)
total             = subtotal + tax
```

---

## Endpoints

---

### Customers

#### `GET /api/v1/customers/`

List all customers, ordered by `name` ascending.

**Auth:** Required

**Response `200`:**
```json
[
  {
    "id": "a1b2c3d4-...",
    "name": "Elizabeth Schindler",
    "phone": "555-234-5678",
    "email": "elizabeth@example.com",
    "address": "742 Evergreen Terrace, Springfield, 62701 IL",
    "created_at": "2026-05-18T10:00:00Z"
  }
]
```

---

#### `POST /api/v1/customers/`

Create a new customer.

**Auth:** Required

**Request body:**
```json
{
  "name": "Elizabeth Schindler",
  "phone": "555-234-5678",
  "email": "elizabeth@example.com",
  "address": "742 Evergreen Terrace, Springfield, 62701 IL"
}
```

| Field | Required | Validation |
|-------|----------|------------|
| name | Yes | 1–255 chars |
| phone | Yes | 1–20 chars |
| email | No | valid email format |
| address | No | free text |

**Response `201`:** Full customer object (same shape as list item)

**Errors:**
- `400` — validation failure: `{ "field": ["error message"] }`

---

#### `GET /api/v1/customers/{id}/`

Fetch a single customer.

**Auth:** Required

**Response `200`:** Full customer object
**Response `404`:** `{ "detail": "Not found." }`

---

#### `PUT /api/v1/customers/{id}/`

Update a customer. All writable fields must be included (full replace). Use `PATCH` for partial updates if preferred.

**Auth:** Required

**Request body:** Same as `POST /customers/`

**Response `200`:** Updated customer object
**Errors:** `400` validation, `404` not found

---

### Jobs

#### `GET /api/v1/jobs/`

List all jobs. Supports filtering.

**Auth:** Required

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| date | `YYYY-MM-DD` | Filter by scheduled date (matches jobs where `scheduled_at::date = date`) |
| status | string | Filter by status, e.g. `?status=SCHEDULED` |
| customer_id | UUID | Filter by customer |

**Response `200`:**
```json
[
  {
    "id": "job-uuid",
    "customer_id": "customer-uuid",
    "appliance_type": "Dishwasher",
    "brand": "GE",
    "model": "GDT695SSJSS",
    "issue": null,
    "status": "SCHEDULED",
    "scheduled_at": "2026-05-18T09:00:00Z",
    "scheduled_end_at": "2026-05-18T11:00:00Z",
    "name": "Job for Elizabeth Schindler",
    "job_number": "00001",
    "completed_at": null,
    "notes": [],
    "attachments": [],
    "created_at": "2026-05-18T08:00:00Z",
    "updated_at": "2026-05-18T08:00:00Z"
  }
]
```

---

#### `POST /api/v1/jobs/`

Create a job. **Atomically creates a linked Invoice** with one Inspection line item.

**Auth:** Required

**Request body:**
```json
{
  "customer_id": "customer-uuid",
  "appliance_type": "Dishwasher",
  "brand": "GE",
  "model": "GDT695SSJSS",
  "scheduled_at": "2026-05-18T09:00:00Z",
  "scheduled_end_at": "2026-05-18T11:00:00Z"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| customer_id | Yes | Must exist |
| appliance_type | Yes | |
| brand | No | |
| model | No | |
| scheduled_at | Yes | |
| scheduled_end_at | No | |

**Response `201`:**
```json
{
  "job": { /* full job object */ },
  "invoice": { /* full invoice object with one line item */ }
}
```

**Errors:** `400` validation, `404` customer not found

---

#### `GET /api/v1/jobs/{id}/`

Fetch a single job including nested notes and attachments.

**Auth:** Required

**Response `200`:** Full job object (same shape as list, notes and attachments always included)

---

#### `PUT /api/v1/jobs/{id}/`

Update job fields (name, job_number, status, scheduled_at, scheduled_end_at, etc.).

**Auth:** Required

**Request body** (only include fields to change — or send all for full replace):
```json
{
  "status": "IN_PROGRESS",
  "scheduled_at": "2026-05-20T09:00:00Z",
  "scheduled_end_at": "2026-05-20T12:00:00Z",
  "name": "GE Dishwasher — Leveling",
  "job_number": "00001"
}
```

**Response `200`:** Updated job object

---

#### `POST /api/v1/jobs/{id}/notes/`

Add a note to a job.

**Auth:** Required

**Request body:**
```json
{
  "body": "Customer mentioned noise started after last cycle."
}
```

**Response `201`:**
```json
{
  "id": "note-uuid",
  "job_id": "job-uuid",
  "body": "Customer mentioned noise started after last cycle.",
  "created_at": "2026-05-18T10:00:00Z",
  "updated_at": "2026-05-18T10:00:00Z"
}
```

---

#### `PUT /api/v1/jobs/{id}/notes/{note_id}/`

Edit an existing note.

**Auth:** Required

**Request body:**
```json
{
  "body": "Updated note text."
}
```

**Response `200`:** Updated note object

---

#### `DELETE /api/v1/jobs/{id}/notes/{note_id}/`

Delete a note.

**Auth:** Required

**Response `204`:** No content
**Response `404`:** Note or job not found

---

#### `POST /api/v1/jobs/{id}/attachments/`

Upload an image attachment. Accepts `multipart/form-data` **or** a JSON body with a base64 data URL.

**Auth:** Required

**Option A — multipart/form-data:**
```
Content-Type: multipart/form-data
file: <binary image>
```

**Option B — JSON:**
```json
{
  "data_url": "data:image/jpeg;base64,/9j/4AAQSkZJRgAB..."
}
```

**Response `201`:**
```json
{
  "id": "attachment-uuid",
  "job_id": "job-uuid",
  "data_url": "data:image/jpeg;base64,...",
  "created_at": "2026-05-18T10:00:00Z"
}
```

> In production, store the image in S3 and return `{ "url": "https://s3.amazonaws.com/..." }` instead of the raw data URL.

---

#### `DELETE /api/v1/jobs/{id}/attachments/{attachment_id}/`

Delete an attachment.

**Auth:** Required

**Response `204`:** No content

---

### Estimates

#### `GET /api/v1/jobs/{job_id}/estimates/`

List all estimates for a job, ordered by `created_at` descending.

**Auth:** Required

**Response `200`:**
```json
[
  {
    "id": "estimate-uuid",
    "job_id": "job-uuid",
    "estimate_number": "000001",
    "line_items": [
      {
        "id": "li-uuid",
        "description": "GE Dishwasher Leveling Service",
        "quantity": 1.0,
        "unit_price": 95.00,
        "taxable": true,
        "category": "labor"
      }
    ],
    "tax_rate": 10.35,
    "status": "APPROVED",
    "approval_token": null,
    "approved_by": "Elizabeth Schindler",
    "approved_at": "2026-05-18T12:00:00Z",
    "sent_at": "2026-05-18T11:00:00Z",
    "created_at": "2026-05-18T10:00:00Z",
    "updated_at": "2026-05-18T12:00:00Z"
  }
]
```

---

#### `POST /api/v1/jobs/{job_id}/estimates/`

Create a new DRAFT estimate for a job.

**Auth:** Required

**Request body:**
```json
{
  "tax_rate": 10.35,
  "line_items": []
}
```

| Field | Required | Notes |
|-------|----------|-------|
| tax_rate | No | Defaults to `settings.default_tax_rate` |
| line_items | No | Defaults to empty array |

**Response `201`:** Full estimate object with `status: "DRAFT"`

---

#### `GET /api/v1/estimates/{id}/`

Fetch a single estimate.

**Auth:** Required

**Response `200`:** Full estimate object

---

#### `PUT /api/v1/estimates/{id}/`

Update an estimate's line items and/or tax rate. **Only allowed when `status = DRAFT`.**

**Auth:** Required

**Request body:**
```json
{
  "tax_rate": 10.35,
  "line_items": [
    {
      "id": "existing-li-uuid",
      "description": "GE Dishwasher Leveling Service",
      "quantity": 1.0,
      "unit_price": 95.00,
      "taxable": true,
      "category": "labor"
    },
    {
      "description": "Spray Arm Replacement",
      "quantity": 1.0,
      "unit_price": 42.00,
      "taxable": true,
      "category": "material"
    }
  ]
}
```

> If a line item includes an `id` that already exists, it is updated. If no `id` is provided, a new line item is created. Line items not present in the request body are deleted.

**Response `200`:** Updated estimate object
**Response `403`:** `{ "detail": "Estimate is not editable in its current status." }`

---

#### `DELETE /api/v1/estimates/{id}/`

Delete an estimate. **Only allowed when `status = DRAFT`.**

**Auth:** Required

**Response `204`:** No content
**Response `403`:** `{ "detail": "Only DRAFT estimates can be deleted." }`

---

#### `POST /api/v1/estimates/{id}/send/`

Mark the estimate as SENT and generate a unique `approval_token`. The frontend uses this token to build the public approval URL: `https://app.example.com/approve/{token}`.

**Auth:** Required

**Request body:** Empty `{}`

**Response `200`:**
```json
{
  "id": "estimate-uuid",
  "status": "SENT",
  "approval_token": "abc123xyz...",
  "sent_at": "2026-05-18T11:00:00Z"
  /* ...rest of estimate fields */
}
```

**Errors:**
- `400` — estimate has no line items
- `409` — estimate is not in DRAFT status

---

#### `POST /api/v1/estimates/{id}/apply-to-invoice/`

Append this estimate's line items to the job's invoice. **Existing invoice line items are kept.**

**Auth:** Required

**Request body:** Empty `{}`

**Business logic:**
1. Fetch the invoice linked to this estimate's `job_id`
2. Append estimate line items to invoice with new UUIDs
3. Recompute invoice total
4. If invoice status is `PAID` and new total > `paid_amount`, downgrade status to `PARTIAL`

**Response `200`:**
```json
{
  "invoice": { /* updated invoice object with all line items */ }
}
```

**Errors:**
- `404` — no invoice found for this job
- `400` — estimate has no line items

---

### Invoices

#### `GET /api/v1/invoices/`

List all invoices. Supports filtering.

**Auth:** Required

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| status | string | e.g. `?status=UNPAID` or `?status=UNPAID,OVERDUE` (comma-separated) |
| job_id | UUID | Filter by job |

**Response `200`:**
```json
[
  {
    "id": "invoice-uuid",
    "job_id": "job-uuid",
    "invoice_number": "INV-2026-00001",
    "line_items": [
      {
        "id": "li-uuid",
        "description": "Inspection",
        "quantity": 1.0,
        "unit_price": 75.00,
        "taxable": true,
        "category": "labor"
      }
    ],
    "tax_rate": 8.50,
    "status": "UNPAID",
    "paid_at": null,
    "paid_amount": null,
    "payment_method": null,
    "created_at": "2026-05-18T08:00:00Z",
    "updated_at": "2026-05-18T08:00:00Z"
  }
]
```

---

#### `GET /api/v1/invoices/{id}/`

Fetch a single invoice.

**Auth:** Required

**Response `200`:** Full invoice object

---

#### `PUT /api/v1/invoices/{id}/`

Update invoice line items and/or tax rate. **Not allowed when `status = CANCELLED`.**

**Auth:** Required

**Request body:**
```json
{
  "tax_rate": 10.35,
  "line_items": [
    {
      "id": "existing-li-uuid",
      "description": "Inspection",
      "quantity": 1.0,
      "unit_price": 75.00,
      "taxable": true,
      "category": "labor"
    }
  ]
}
```

> Same upsert/delete logic as estimate line items.

**Business logic:**
- Recompute total after update
- If invoice has `paid_amount` and new total < `paid_amount` → return `400`
- If invoice has `paid_amount` and new total > `paid_amount` → status = `PARTIAL`
- If invoice has `paid_amount` and new total <= `paid_amount` → status = `PAID`

**Response `200`:** Updated invoice object

**Errors:**
- `400` — `{ "detail": "Total cannot be less than amount already paid ($X.XX)." }`
- `403` — `{ "detail": "Cancelled invoices cannot be edited." }`

---

#### `POST /api/v1/invoices/{id}/mark-paid/`

Mark an invoice as fully paid. **Atomically sets the linked Job status to `COMPLETED`.**

**Auth:** Required

**Request body:**
```json
{
  "payment_method": "credit_card"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| payment_method | No | Free text |

**Business logic:**
1. Compute total from current line items
2. Set `invoice.status = PAID`, `invoice.paid_amount = total`, `invoice.paid_at = now()`
3. Set `job.status = COMPLETED` in same transaction

**Response `200`:**
```json
{
  "invoice": { /* updated invoice */ },
  "job": { /* updated job with status COMPLETED */ }
}
```

**Errors:**
- `409` — invoice is already `PAID` or `CANCELLED`

---

#### `POST /api/v1/invoices/{id}/mark-partial/`

Record a partial payment (deposit).

**Auth:** Required

**Request body:**
```json
{
  "paid_amount": 150.00,
  "payment_method": "check"
}
```

| Field | Required | Validation |
|-------|----------|------------|
| paid_amount | Yes | > 0, must not exceed invoice total |
| payment_method | No | Free text |

**Response `200`:** Updated invoice object with `status: "PARTIAL"`

**Errors:**
- `400` — `{ "detail": "paid_amount must be greater than 0." }`
- `400` — `{ "detail": "paid_amount cannot exceed invoice total." }`
- `409` — invoice is `PAID` or `CANCELLED`

---

### Public Endpoints (No Authentication)

These endpoints are accessed by the customer via the approval link. No `Authorization` header is required or accepted.

---

#### `GET /api/v1/public/estimates/{token}/`

Fetch an estimate by its public approval token. Used to render the customer-facing approval page.

**Auth:** None

**Response `200`:**
```json
{
  "id": "estimate-uuid",
  "estimate_number": "000001",
  "status": "SENT",
  "tax_rate": 10.35,
  "line_items": [
    {
      "id": "li-uuid",
      "description": "GE Dishwasher Leveling Service",
      "quantity": 1.0,
      "unit_price": 95.00,
      "taxable": true,
      "category": "labor"
    }
  ],
  "sent_at": "2026-05-18T11:00:00Z",
  "created_at": "2026-05-18T10:00:00Z"
}
```

> Do **not** include `approval_token`, `job_id`, or any internal IDs in this response.

**Response `404`:** Token not found

---

#### `POST /api/v1/public/estimates/{token}/approve/`

Customer approves the estimate.

**Auth:** None

**Request body:**
```json
{
  "approved_by": "Elizabeth Schindler"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| approved_by | Yes | Customer's name as entered on the form |

**Business logic:**
1. Look up estimate by `approval_token`
2. Verify `status = SENT` — if not, return `409`
3. Set `status = APPROVED`, `approved_by`, `approved_at = now()`
4. Clear `approval_token` (token is consumed; prevent reuse)

**Response `200`:**
```json
{
  "status": "APPROVED",
  "approved_by": "Elizabeth Schindler",
  "approved_at": "2026-05-18T13:00:00Z"
}
```

**Errors:**
- `404` — token not found
- `409` — `{ "detail": "This estimate has already been responded to." }`

---

#### `POST /api/v1/public/estimates/{token}/reject/`

Customer rejects the estimate.

**Auth:** None

**Request body:** Empty `{}`

**Business logic:**
1. Look up estimate by `approval_token`
2. Verify `status = SENT` — if not, return `409`
3. Set `status = REJECTED`, clear `approval_token`

**Response `200`:**
```json
{
  "status": "REJECTED"
}
```

**Errors:**
- `404` — token not found
- `409` — `{ "detail": "This estimate has already been responded to." }`

---

### Export

#### `GET /api/v1/export/invoices/`

Export invoices as a downloadable CSV file.

**Auth:** Required

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| from | `YYYY-MM-DD` | Start date (inclusive), filters by `created_at` |
| to | `YYYY-MM-DD` | End date (inclusive), filters by `created_at` |
| status | string | Comma-separated statuses, e.g. `PAID,PARTIAL`. Omit for all statuses. |

**Response `200`:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="invoices-2026-05-18.csv"

Invoice #,Customer,Appliance,Status,Subtotal,Tax,Total,Created
INV-2026-00001,Elizabeth Schindler,GE Dishwasher,PAID,$75.00,$7.76,$82.76,2026-05-18
```

**CSV columns:** Invoice #, Customer, Appliance (type + brand), Status, Subtotal, Tax, Total, Created

---

### Settings

#### `GET /api/v1/settings/`

Fetch current app settings.

**Auth:** Required

**Response `200`:**
```json
{
  "default_tax_rate": 8.50,
  "default_inspection_fee": 75.00,
  "overdue_threshold_days": 10
}
```

---

#### `PUT /api/v1/settings/`

Update app settings.

**Auth:** Required

**Request body:**
```json
{
  "default_tax_rate": 10.35,
  "default_inspection_fee": 85.00,
  "overdue_threshold_days": 14
}
```

| Field | Validation |
|-------|------------|
| default_tax_rate | 0.00 – 99.99 |
| default_inspection_fee | >= 0.00 |
| overdue_threshold_days | >= 1 |

**Response `200`:** Updated settings object

---

## Error Response Format

All errors follow DRF's default format:

```json
{ "detail": "Human-readable message." }
```

Or for field-level validation:

```json
{
  "name": ["This field is required."],
  "email": ["Enter a valid email address."]
}
```

**HTTP status codes used:**

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | Deleted (no content) |
| 400 | Validation error |
| 401 | Missing or invalid auth token |
| 403 | Action not allowed in current state |
| 404 | Resource not found |
| 409 | Conflict (wrong status for action) |
