# Shopel

Shopel is a MERN storefront for considered everyday goods. The current slice implements the product collection, responsive editorial storefront, theme switcher, cart affordance, review summary, verified-buyer review feed, and review submission experience described in the product documents.

## Stack

- **Client:** React, Vite, Lucide React, custom CSS design tokens
- **API:** Node.js, Express, Mongoose
- **Database:** MongoDB

## Run locally

Prerequisites: Node.js 18+ and MongoDB (local or hosted).

```bash
npm install
Copy-Item server/.env.example server/.env
npm run dev
```

The storefront runs at `http://localhost:5173` and the API at `http://localhost:5000`.
Set a long random `JWT_SECRET` in `server/.env` before using the sign-in or registration forms.
If port `5000` is already in use, stop the existing API process or set another `PORT` in `server/.env` and update the client proxy in `client/vite.config.js` to match.
If the browser reports an HTML response while listing a product, the client is reaching the Vite page fallback instead of Express. Start both workspaces with `npm run dev` from the repository root. If the API uses another port, set `API_URL` in `client/.env` to the running API URL (for example `API_URL=http://127.0.0.1:5001`) and restart Vite. MongoDB must also be running for database-backed listing routes.

To run each workspace independently:

```bash
npm install --workspace client
npm run dev --workspace client

npm install --workspace server
npm run dev --workspace server
```

## API

- `GET /api/health` — health check
- `GET /api/products` — product catalog without review payloads
- `GET /api/products/:id` — product and populated reviews
- `POST /api/products/:id/reviews` — adds one authenticated community review per account
- `POST /api/auth/register` — creates an account and sets an HTTP-only session cookie
- `POST /api/auth/login` — authenticates an account and sets an HTTP-only session cookie
- `GET /api/auth/me` — returns the current authenticated user
- `POST /api/auth/logout` — clears the session cookie

## Marketplace features

- `/browse` is represented by the in-app browse view with product search, category filtering, price filtering, and sorting.
- The bag view supports quantities, item removal, totals, and a dummy checkout using test card `4242 4242 4242 4242`. It never charges a real card; replace the checkout handler with Stripe, Razorpay, or another provider when ready.
- Checkout accepts the sample coupon codes listed in `server/src/data/coupons.txt` and stores the applied discount on the order.
- Product cards open a detail page with descriptions and community reviews. Favorites are available from the heart controls and the top-bar favorites section.
- The account menu supports profile editing and sign out.
- Profiles can store a reusable delivery address. Checkout confirms the full delivery location, applies an optional coupon, creates a database order, and shows dummy payment success with an estimated arrival date.
- Buy now starts checkout for an individual product without adding it to the bag. Order history lists previous purchases, totals, delivery destination, arrival estimate, and current status.
- The seller studio lets an authenticated user publish and remove their own listings. Product ownership is enforced by the API.
- Checkout requires a database-authenticated user, saves the delivery address, product references, payment method, delivery charge, and order items in MongoDB, then runs a dummy payment gateway with an animated processing state and detailed thank-you confirmation. The payment record is marked with a `DUMMY-*` reference and can later be replaced by a real provider.
- New visitors start on the full sign-in or registration page. After authentication, Shopel opens directly on the browse page; returning authenticated users skip the sign-in screen.
- Seller Studio uses a separate database-verified seller account. Registration creates a unique `studioId` such as `ST-CRAFTS-4821`; product create, update, and delete operations require that authenticated seller and persist ownership through `seller` and `studioId`.
- Studio products support either an image URL or a manually selected image file preview, and the update form writes edited name, description, category, price, stock, and image data back to MongoDB.

The review route recalculates `rating` and `numReviews` after every successful write and rejects invalid ratings and duplicate reviews. On first database connection, Shopel creates the configured admin account and persists the three starter products under the Shopel Official seller profile. Configure `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` in `server/.env` before first startup; defaults are `admin@shopel.local` and `Admin@12345`.

Administrators see the Admin panel and can update order status to Processing, Shipped, Delivered, or Cancelled. Status changes are persisted through the protected admin order routes.

If MongoDB is not running, the API still starts so the client and `/api/health` remain available. The health endpoint reports `503` with `database: "unavailable"`, and database-backed product routes return a clear `503` response. Start MongoDB or update `server/.env` with a reachable `MONGO_URI` to enable those routes.

An API `404` usually means an older Shopel process is still listening on the configured port. Stop that process, restart the server from this checkout, and confirm `GET /api/health` responds before retrying Seller Studio.
