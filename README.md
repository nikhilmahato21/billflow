# BillFlow — Production SaaS Invoicing Platform

Multi-tenant invoicing, subscriptions, POS, WhatsApp reminders, and Razorpay recurring billing for Indian businesses.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express + TypeScript, Prisma 5, PostgreSQL |
| Queue/Jobs | BullMQ 5 + Redis |
| Auth | JWT (access 15m + refresh 7d, rotated) |
| Payments | Razorpay (subscriptions, webhooks, HMAC verification) |
| Notifications | Meta WhatsApp Cloud API + SendGrid |
| PDF | Puppeteer (Chromium) |
| Frontend | React 18 + Vite + TypeScript + TailwindCSS |
| State | Zustand + React Query |
| Infra | Docker Compose + Nginx |

---

## Quick Start

```bash
cp .env.example .env        # fill in JWT_SECRET, RAZORPAY_KEY_ID, etc.
docker-compose up --build   # starts postgres, redis, api, frontend, nginx
```

App: http://localhost  
API: http://localhost/api  
Health: http://localhost/api/health

---

## Production Folder Structure

```
backend/src/
├── app.ts                        Express factory
├── index.ts                      Server bootstrap + graceful shutdown
├── shared/
│   ├── config/
│   │   ├── env.ts                Zod-validated env (throws on bad config)
│   │   └── seed.ts               Business template seeder
│   ├── prisma/index.ts           Singleton PrismaClient
│   ├── redis/index.ts            ioredis + bullMQConnection config
│   ├── queues/index.ts           invoiceQueue, notificationQueue, reminderQueue, billingQueue
│   ├── workers/
│   │   ├── invoiceWorker.ts      PDF generation via Puppeteer
│   │   ├── notificationWorker.ts WhatsApp Meta API + usage tracking
│   │   └── reminderWorker.ts     Overdue check + notification dispatch
│   ├── middlewares/
│   │   ├── index.ts              authMiddleware, ownerOnly, canWrite, canManagePayments,
│   │   │                         anyRole, canUsePOS, ownBusiness, errorHandler
│   │   └── planLimits.ts         checkInvoiceLimit, checkClientLimit, checkPosAccess,
│   │                             checkRazorpaySubAccess
│   ├── errors/index.ts           AppError, NotFoundError, PlanLimitError, ForbiddenError…
│   ├── types/index.ts            AuthUser, PaginatedResult, shared enums
│   └── utils/index.ts            generateInvoiceNumber, rupeesToPaisa, getPlanLimits…
│
└── modules/                      Each module: dto → repository → service → controller → routes
    ├── auth/                     Register, login, refresh, /me
    ├── business/                 Profile, settings, reminders, tax, templates
    ├── customers/                CRUD + search
    ├── items/                    CRUD + soft delete + grouped view
    ├── invoices/                 CRUD + reminder scheduling + PDF queue
    ├── payments/                 Record payments, auto-mark invoice paid
    ├── subscriptions/            Manual recurring billing (BillMQ scheduled)
    ├── pos/                      POS checkout, walk-in customer, WhatsApp receipt
    ├── dashboard/                Stats + 6-month revenue chart
    ├── staff/                    Invite, role change, remove (plan-gated)
    ├── webhooks/                 WhatsApp verify + receive
    └── razorpay/                 Full Razorpay subscription management
        ├── dto/                  CreateRazorpayPlanDto, CreateRazorpaySubscriptionDto…
        ├── repository/           razorpay_plans, razorpay_subscriptions, razorpay_payments
        ├── service/
        │   ├── client.ts         Razorpay SDK singleton
        │   └── index.ts          createPlan, createSubscription, cancel/pause/resume/sync,
        │                         verifyPayment, handleWebhook (9 events, idempotent)
        ├── controller/           Thin HTTP layer, calls service
        └── routes/               /plans, /subscriptions, /verify-payment, /webhook
```

---

## Razorpay Integration

### Setup
1. Create account at https://dashboard.razorpay.com
2. Get **Key ID** and **Key Secret** from Settings → API Keys
3. Add webhook URL: `https://yourdomain.com/api/razorpay/webhook`
4. Enable webhook events: `subscription.*` and `payment.*`
5. Copy **Webhook Secret** to `RAZORPAY_WEBHOOK_SECRET`

### Flow
```
Owner creates plan  →  Razorpay plan created (linked to item price)
Owner creates sub   →  Razorpay subscription created  →  short_url returned
Customer pays       →  Razorpay fires subscription.charged webhook
Webhook handler     →  Verifies HMAC signature
                    →  Idempotency check (razorpayPaymentId unique)
                    →  Creates paid Invoice in DB
                    →  Queues PDF generation
                    →  Updates subscription state (paidCount, chargeAt)
```

### Webhook events handled
| Event | Action |
|---|---|
| `subscription.activated` / `resumed` | Status → active |
| `subscription.charged` | Creates paid invoice + payment record |
| `subscription.halted` / `pending` | Status → halted / pending |
| `subscription.cancelled` / `completed` / `expired` | Status updated |
| `subscription.paused` | Status → paused |
| `payment.failed` | Subscription status → pending |

### DB tables added
- `razorpay_plans` — one per item per business
- `razorpay_subscriptions` — full lifecycle state
- `razorpay_payments` — each charge event (idempotent)

---

## RBAC

| Role | Can do |
|---|---|
| `owner` | Everything — delete, settings, staff, Razorpay, subscriptions |
| `staff` | Create invoices/customers/items, POS checkout |
| `accountant` | Record payments, read all data |

All enforced at both API (middleware) and UI (RoleGate component) layers.

---

## API Routes

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me

GET    /api/businesses/templates
POST   /api/businesses/templates/apply
PATCH  /api/businesses/onboarding/complete
GET    /api/businesses/:id
PATCH  /api/businesses/:id/profile
PATCH  /api/businesses/:id/settings
PATCH  /api/businesses/:id/reminders
PATCH  /api/businesses/:id/tax

GET    /api/customers          POST /api/customers
PATCH  /api/customers/:id      DELETE /api/customers/:id

GET    /api/items              POST /api/items
PATCH  /api/items/:id          DELETE /api/items/:id

GET    /api/invoices           POST /api/invoices
GET    /api/invoices/:id
PATCH  /api/invoices/:id/status
DELETE /api/invoices/:id

POST   /api/payments
GET    /api/payments/invoices/:invoiceId/payments

GET    /api/subscriptions      POST /api/subscriptions
PATCH  /api/subscriptions/:id

POST   /api/pos/checkout

GET    /api/dashboard/stats
GET    /api/dashboard/revenue

GET    /api/staff              POST /api/staff
PATCH  /api/staff/:id          DELETE /api/staff/:id

── Razorpay ──────────────────────────────────
GET    /api/razorpay/plans
POST   /api/razorpay/plans
POST   /api/razorpay/plans/item/:itemId

GET    /api/razorpay/subscriptions
POST   /api/razorpay/subscriptions
GET    /api/razorpay/subscriptions/:id
POST   /api/razorpay/subscriptions/:id/cancel
POST   /api/razorpay/subscriptions/:id/pause
POST   /api/razorpay/subscriptions/:id/resume
POST   /api/razorpay/subscriptions/:id/sync

POST   /api/razorpay/verify-payment
POST   /api/razorpay/webhook     (HMAC verified, no auth)

── Webhooks ──────────────────────────────────
GET    /api/webhooks/whatsapp    (verification)
POST   /api/webhooks/whatsapp    (events)
```

---

## Environment Variables

```env
DATABASE_URL=postgresql://billflow:secret@localhost:5432/billflow
REDIS_URL=redis://localhost:6379
JWT_SECRET=<min 32 chars>
JWT_REFRESH_SECRET=<min 32 chars>
WA_PHONE_ID=your-wa-phone-id
WA_TOKEN=your-wa-bearer-token
WA_WEBHOOK_SECRET=your-wa-verify-token
RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_KEY_SECRET=your-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
SENDGRID_API_KEY=SG.xxxxx
FROM_EMAIL=noreply@yourdomain.com
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://yourdomain.com
VITE_API_URL=https://yourdomain.com/api
VITE_RAZORPAY_KEY_ID=rzp_live_xxxx
```
