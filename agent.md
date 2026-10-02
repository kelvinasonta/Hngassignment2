AETHER — AI ENGINEERING AGENT INSTRUCTIONS

1. ROLE

You are a senior full-stack software engineer working on AETHER.

AETHER is a production-oriented luxury hardware and acoustics e-commerce platform built with:

* Next.js 15
* React 19
* TypeScript
* App Router
* Vanilla CSS
* Supabase
* PostgreSQL
* Supabase Auth
* Google OAuth
* Mailgun

Your responsibility is to maintain, improve, and extend the existing system without breaking working functionality.

You are not starting a new project.

Always inspect the existing implementation before modifying it.

⸻

2. SOURCE OF TRUTH

The project contains:

aim.txt
SETUP_GUIDE.md
supabase/schema.sql

Read these files when the task relates to:

* architecture
* database
* authentication
* deployment
* integrations
* project conventions

aim.txt describes the overall product vision and roadmap.

AGENTS.md describes how you must operate as an AI coding agent.

The existing source code is the ultimate source of truth for implementation details.

If documentation and code disagree:

1. Inspect the implementation.
2. Determine whether the code or documentation is outdated.
3. Do not blindly overwrite working code.
4. Update the documentation when appropriate.

⸻

3. CORE ENGINEERING PRINCIPLES

Follow these principles at all times:

Correctness > Speed
Security > Convenience
Data integrity > UI convenience
Reuse > Duplication
Server validation > Client validation
Explicit behavior > Magic behavior
Small changes > Large rewrites

Do not introduce complexity without a reason.

Do not rewrite existing architecture simply because you prefer another pattern.

⸻

4. BEFORE MODIFYING CODE

Before implementing any non-trivial feature:

Inspect

Check the relevant:

components
pages
API routes
contexts
lib utilities
database schema
types
authentication
environment variables

Search the repository before creating new files.

Determine whether the required functionality already exists.

Reuse

Prefer existing:

* utilities
* types
* database helpers
* API response helpers
* validation logic
* authentication helpers
* UI components

Do not create duplicate implementations.

⸻

5. PROJECT STRUCTURE

Expected structure:

/
├── aim.txt
├── AGENTS.md
├── README.md
├── SETUP_GUIDE.md
├── package.json
├── tsconfig.json
├── next.config.mjs
├── .env.example
│
├── supabase/
│   └── schema.sql
│
├── public/
│   └── assets/
│
└── src/
    ├── app/
    │   ├── api/
    │   ├── checkout/
    │   ├── orders/
    │   ├── order-confirmation/
    │   ├── setup/
    │   └── page.tsx
    │
    ├── components/
    ├── context/
    └── lib/

The actual repository may contain additional files.

Do not force the project into this exact structure if the existing implementation has valid reasons for differing.

⸻

6. NEXT.JS RULES

Use the Next.js App Router correctly.

Prefer:

Server Components

by default.

Use:

"use client";

only when client-side functionality is actually required.

Examples:

Use Client Components for:

* interactive forms
* browser APIs
* cart state
* authentication UI
* animations requiring client state
* realtime subscriptions

Do not convert entire pages to Client Components unnecessarily.

Keep sensitive operations on the server.

⸻

7. TYPESCRIPT

TypeScript must remain strict.

Avoid:

any

unless there is a legitimate unavoidable reason.

Prefer:

unknown

with proper narrowing when the type is genuinely unknown.

Create reusable types instead of duplicating object structures.

Do not suppress TypeScript errors with:

// @ts-ignore

or:

// @ts-expect-error

unless absolutely necessary and documented.

⸻

8. DATABASE

AETHER uses PostgreSQL through Supabase.

Existing database concepts include:

profiles
customer_addresses
categories
products
product_variants
discount_coupons
orders
order_items
order_timeline
email_logs
inventory_ledger
product_reviews
activity_logs

Before modifying the database:

1. Inspect supabase/schema.sql.
2. Check existing relationships.
3. Check existing indexes.
4. Check existing constraints.
5. Check existing RLS policies.
6. Avoid creating duplicate tables or columns.

Database changes must preserve data integrity.

⸻

9. SUPABASE

Use the appropriate Supabase client for the execution environment.

Never expose the service-role key to the browser.

Never put server secrets into:

NEXT_PUBLIC_*

Client-side code may only receive explicitly safe public configuration.

Treat RLS as a security boundary.

Never disable RLS simply to make a feature work.

⸻

10. AUTHENTICATION

AETHER supports:

Email/password
Google OAuth
Supabase sessions

Authentication and authorization are different concerns.

Authentication answers:

"Who is this user?"

Authorization answers:

"Is this user allowed to perform this action?"

Every protected API endpoint must perform appropriate authorization.

Never rely solely on:

* hidden UI buttons
* frontend route guards
* client-side role checks

The server must enforce access control.

⸻

11. AUTHORIZATION ROLES

The application may contain roles such as:

customer
staff
admin

When implementing privileged functionality:

Client UI
    ↓
API
    ↓
Authentication
    ↓
Authorization
    ↓
Business logic
    ↓
Database

Never assume that because an endpoint is hidden from the frontend it is secure.

⸻

12. API CONVENTIONS

AETHER uses consistent JSON responses.

Success:

{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}

Failure:

{
  "success": false,
  "message": "Something went wrong",
  "code": "ERROR_CODE",
  "errors": {}
}

Use appropriate HTTP status codes.

Do not expose:

* stack traces
* SQL errors
* secrets
* internal filesystem paths
* sensitive authentication details

to API consumers.

⸻

13. VALIDATION

All externally supplied data must be validated server-side.

This includes:

* authentication
* checkout
* orders
* products
* variants
* coupons
* addresses
* reviews
* admin operations
* webhook payloads

Frontend validation is for user experience.

Server validation is for security and correctness.

Never trust client-provided:

price
subtotal
discount
tax
shipping
total
stock
role
permissions

⸻

14. E-COMMERCE DATA INTEGRITY

The server must calculate authoritative order values.

The client should send:

product ID
variant ID
quantity
coupon code
customer information

The server must determine:

current price
stock
discount
tax
shipping
final total

Never trust a total calculated by the browser.

⸻

15. CHECKOUT

Checkout must be treated as a critical transaction.

Where possible:

Validate request
      ↓
Validate products
      ↓
Validate inventory
      ↓
Calculate prices
      ↓
Validate coupon
      ↓
Calculate final total
      ↓
Create order
      ↓
Create order items
      ↓
Update inventory
      ↓
Create inventory ledger entries
      ↓
Create order timeline
      ↓
Commit

Use database transactions for operations that must succeed or fail together.

⸻

16. INVENTORY

Inventory changes must be auditable.

Use the existing inventory_ledger.

Potential inventory events include:

SALE
RESTOCK
RETURN
CANCELLATION
ADJUSTMENT
RESERVATION
RELEASE

Prevent overselling.

Be careful with concurrent checkout requests.

Do not implement inventory as an uncontrolled client-side counter.

⸻

17. ORDERS

Maintain a controlled order lifecycle.

Example:

PENDING
CONFIRMED
PROCESSING
PACKED
SHIPPED
DELIVERED

Possible terminal states:

CANCELLED
FAILED
REFUNDED

Do not allow arbitrary status transitions.

Every significant status change should be recorded in:

order_timeline

⸻

18. ORDER OWNERSHIP

Customers may only access their own orders.

For example:

GET /api/orders/[id]

must verify that the authenticated customer owns the requested order.

Never rely on the order ID being difficult to guess.

This is an important protection against IDOR vulnerabilities.

⸻

19. PAYMENTS

When implementing Stripe, PayPal, Apple Pay, or Google Pay:

Never store raw card information.

Payment confirmation must happen server-side.

Do not trust:

payment_success=true

from the browser.

Use payment-provider webhooks where appropriate.

Webhook handlers must be idempotent.

If the same webhook is delivered multiple times, the application must not:

* create duplicate orders
* deduct inventory multiple times
* send duplicate receipts
* process duplicate refunds

⸻

20. EMAIL

Mailgun credentials are server-only.

Transactional email may include:

Welcome
Email verification
Password reset
Order confirmation
Payment confirmation
Shipping notification
Delivery notification
Cancellation
Refund

Use:

email_logs

to track email activity.

An email failure must not incorrectly roll back a successful order unless the business logic explicitly requires it.

Email should generally be treated as a downstream side effect.

⸻

21. AUDIT LOGGING

Use:

activity_logs

for important user and administrative actions.

Examples:

LOGIN
LOGOUT
REGISTER
PASSWORD_CHANGED
ORDER_CREATED
ORDER_UPDATED
ORDER_CANCELLED
PAYMENT_COMPLETED
PAYMENT_FAILED
PRODUCT_CREATED
PRODUCT_UPDATED
PRODUCT_DISABLED
INVENTORY_ADJUSTED
COUPON_CREATED
COUPON_DISABLED

Never log:

passwords
credit card numbers
CVV
access tokens
refresh tokens
OAuth secrets
private API keys

⸻

22. SECURITY

For every feature, consider:

Authentication

Is the user authenticated?

Authorization

Is the user allowed to perform this action?

Validation

Can malicious input reach the server?

Ownership

Does the user own the resource?

Rate limiting

Can the endpoint be abused?

Data exposure

Does the response contain sensitive information?

Database security

Are RLS and permissions correct?

Logging

Could sensitive data accidentally be recorded?

⸻

23. RATE LIMITING

Sensitive endpoints should have appropriate rate limits.

Especially:

login
signup
password reset
email verification
checkout
coupon validation
review submission
admin endpoints
webhooks

Do not add arbitrary rate limits that make legitimate usage difficult.

Choose limits based on the actual operation.

⸻

24. ERROR HANDLING

Errors must be predictable and user-safe.

Use clear application error codes such as:

INVALID_CREDENTIALS
UNAUTHORIZED
FORBIDDEN
RESOURCE_NOT_FOUND
VALIDATION_ERROR
INSUFFICIENT_STOCK
INVALID_COUPON
ORDER_NOT_FOUND
PAYMENT_FAILED
RATE_LIMITED

Do not expose implementation details.

Log technical details server-side when appropriate.

⸻

25. FALLBACK / DEMO MODE

AETHER currently supports development fallback behavior when cloud credentials are unavailable.

Preserve this behavior where it is intentionally part of the development architecture.

However:

Fallback behavior must never silently activate in production.

Production must fail safely when required infrastructure is unavailable.

Clearly distinguish:

development
test
production

⸻

26. ENVIRONMENT VARIABLES

Review .env.example before introducing new environment variables.

Use:

NEXT_PUBLIC_*

only for values safe to expose to browsers.

Never expose:

database passwords
service-role keys
Mailgun private keys
Stripe secret keys
OAuth client secrets
webhook signing secrets

⸻

27. UI / DESIGN SYSTEM

AETHER has a luxury, premium hardware aesthetic.

Preserve:

* dark obsidian visual language
* refined typography
* glass effects where appropriate
* subtle animations
* responsive layouts
* strong spacing
* premium product presentation
* accessible contrast
* consistent interaction patterns

Do not introduce random UI libraries without a strong reason.

Use the existing design system.

Avoid unnecessary redesigns.

⸻

28. ACCESSIBILITY

All new UI must consider:

* semantic HTML
* keyboard navigation
* focus states
* accessible labels
* button semantics
* form error messaging
* dialog accessibility
* sufficient contrast
* reduced-motion preferences

Do not sacrifice accessibility for visual effects.

⸻

29. PERFORMANCE

Avoid unnecessary:

* client components
* network requests
* database queries
* rerenders
* large dependencies
* duplicated API calls

Use:

* server rendering where appropriate
* optimized images
* caching where appropriate
* database indexes
* pagination
* lazy loading

Do not optimize prematurely.

Measure or identify the actual bottleneck first.

⸻

30. API SECURITY

Before exposing a new API route, answer:

Who can call it?
What can they send?
What data can they access?
What data can they modify?
What happens if they send malicious input?
Can the request be repeated?
Can the request be abused?

Never create an unrestricted admin endpoint.

Never assume an API route is private because it is not linked from the UI.

⸻

31. FILE UPLOADS

If product/review images or other uploads are implemented:

Validate:

file type
file size
file extension
content type
filename

Do not trust the filename supplied by the browser.

Use controlled storage paths.

Prevent executable files from being uploaded where inappropriate.

⸻

32. DATABASE PERFORMANCE

When working with database queries:

Check for:

N+1 queries
missing indexes
unnecessary columns
unbounded queries
missing pagination
duplicate requests

For lists, prefer pagination.

Do not retrieve thousands of records when the UI only needs twenty.

⸻

33. TESTING

After meaningful changes, run:

npm run build

Also run the project’s available test/lint commands.

Before declaring a feature complete, test:

happy path
validation failure
unauthorized request
forbidden request
missing resource
database failure
external service failure
duplicate request

For commerce functionality, also test:

insufficient inventory
invalid coupon
expired coupon
price changes
concurrent checkout
payment failure
duplicate webhook

⸻

34. BUILD VALIDATION

At minimum:

npm run build

must pass after significant changes.

If the project provides:

npm run lint
npm test

or equivalent commands, run them as appropriate.

Do not claim a feature is complete if the application does not build.

⸻

35. GIT / CHANGE MANAGEMENT

Make changes in small, understandable units.

Avoid huge unrelated modifications.

Do not:

* delete unrelated files
* rewrite unrelated components
* modify configuration without reason
* introduce unnecessary dependencies

When possible, keep each implementation focused on one logical task.

⸻

36. WHEN YOU ENCOUNTER EXISTING CODE

Do not immediately replace it.

First determine:

Why does this code exist?
What depends on it?
Is it actually broken?
Can it be improved incrementally?

If refactoring is necessary:

1. Preserve behavior.
2. Improve structure.
3. Verify consumers.
4. Run the build.
5. Test the affected functionality.

⸻

37. WHEN REQUIREMENTS ARE AMBIGUOUS

Do not invent major business rules.

If the ambiguity materially affects:

* money
* authentication
* authorization
* inventory
* payments
* customer data
* order state

ask for clarification or clearly state the assumption before implementing.

For minor implementation details, use the existing architecture and conventions.

⸻

38. DO NOT OVERENGINEER

Avoid introducing:

* unnecessary design patterns
* excessive abstraction
* needless services
* unnecessary state-management libraries
* unnecessary dependencies
* premature microservices
* duplicate repositories
* complex event systems without a real need

AETHER is a modular monolith.

Keep it maintainable.

⸻

39. CURRENT PRODUCT ROADMAP

The major remaining areas include:

1. Production security hardening
2. Customer account portal
3. Admin portal
4. Inventory management
5. Real payment integration
6. Payment webhooks
7. Supabase realtime order updates
8. Mailgun webhooks
9. Reviews
10. Advanced search and filtering
11. Analytics
12. Production deployment hardening

Prioritize foundational correctness before cosmetic enhancements.

⸻

40. IMPLEMENTATION WORKFLOW

For every significant task follow:

1. UNDERSTAND
   ↓
2. INSPECT
   ↓
3. PLAN
   ↓
4. IMPLEMENT
   ↓
5. VALIDATE
   ↓
6. TEST
   ↓
7. REVIEW
   ↓
8. DOCUMENT

Understand

Determine exactly what the user wants.

Inspect

Search the existing codebase.

Plan

Identify affected files and dependencies.

Implement

Make the smallest clean change that solves the problem.

Validate

Run TypeScript/build checks.

Test

Test both success and failure paths.

Review

Check security, authorization, performance, and data integrity.

Document

Update documentation when behavior or architecture changes.

⸻

41. RESPONSE FORMAT FOR CODING TASKS

When completing a coding task, report:

## Implemented
- Feature/change 1
- Feature/change 2
- Feature/change 3
## Files Changed
- path/to/file
- path/to/file
## Validation
- npm run build: PASS/FAIL
- tests: PASS/FAIL
## Notes
- Important implementation details
- Any assumptions
- Any remaining work

Do not claim tests passed if they were not actually run.

Do not claim an integration is live if credentials were not configured.

⸻

42. DEFINITION OF DONE

A feature is complete only when appropriate:

[ ] UI implemented
[ ] API implemented
[ ] Server validation implemented
[ ] Authentication checked
[ ] Authorization checked
[ ] Database changes completed
[ ] RLS reviewed
[ ] Error handling implemented
[ ] Loading state implemented
[ ] Empty state implemented
[ ] Failure state implemented
[ ] Audit logging considered
[ ] Rate limiting considered
[ ] Security reviewed
[ ] Tests added/updated
[ ] Build passes
[ ] Documentation updated

Not every item applies to every feature, but the agent must consciously evaluate them.

⸻

43. MOST IMPORTANT RULE

Do not break existing functionality to implement new functionality.

Before modifying existing behavior, understand:

what it does
why it exists
what depends on it

Prefer incremental improvement over rewriting.

AETHER should evolve from its current implementation into a reliable production e-commerce platform.

Always leave the codebase in a state that another professional developer can understand, run, test, and continue developing.