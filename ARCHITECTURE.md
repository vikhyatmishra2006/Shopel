# Architecture Blueprint & System Layout - Shopel

## 1. Software Development Life Cycle (SDLC) Workflow
Shopel utilizes an Agile-Scrum SDLC lifecycle iteration path:
1. **Requirements & Analytics:** Formatting data structures and core endpoints.
2. **Architecture Blueprinting:** Formulating database relations and REST architectural patterns.
3. **Sprint Execution Phase:** Building isolated backend API servers followed by interactive visual client components.
4. **Integration Testing:** Stress-testing database transactions, review mutation actions, and secure token access.
5. **Continuous Deployment (CI/CD):** Pushing code changes to staging platforms.

## 2. Checkout & Product Review System Workflows
```text
[Customer Order Placed] ──> [Order Fulfilled & Delivered]
                                         │
                                         ▼
                 [Access Product Page / Write Review Section]
                                         │
                                         ▼
                     [System Checks Order History Database]
                                         │
               ┌─────────────────────────┴─────────────────────────┐
               ▼                                                   ▼
     [Match Found: Status Verified]                     [No Record / Incomplete]
               │                                                   │
               ▼                                                   ▼
     {Allow Submission Form}                              {Render Lock Warning}
               │                                                   │
               ▼                                                   ▼
 [API updates DB & Recalculates Averages]                [Disable Submission UI]
```

## 3. Entity-Relationship (ER) Schema Data Model
```text
  ┌──────────────────┐               ┌──────────────────┐
  │      USER        │               │     PRODUCT      │
  ├──────────────────┤               ├──────────────────┤
  │ _id (PK)         │◄──────┐       │ _id (PK)         │◄──────┐
  │ name             │       │       │ name             │       │
  │ email            │       │       │ price            │       │
  │ password         │       │       │ rating           │       │
  │ isAdmin          │       │       │ numReviews       │       │
  └──────────────────┘       │       └──────────────────┘       │
           │                 │                 │                │
           │ 1               │ 1               │ 1              │ 1
           │                 │                 │                │
           ▼ N               │                 ▼ N              │
  ┌──────────────────┐       │       ┌──────────────────┐       │
  │      ORDER       │       │       │      REVIEW      │       │
  ├──────────────────┤       │       ├──────────────────┤       │
  │ _id (PK)         │       │       │ _id (PK)         │       │
  │ user (FK)  ──────┼───────┘       │ product (FK) ────┼───────┘
  │ items [Product]  │               │ user (FK)  ──────┼───────
  │ isDelivered      │               │ rating (Int)     │
  └──────────────────┘               │ comment (Text)   │
                                     │ helpfulVotes     │
                                     └──────────────────┘
```