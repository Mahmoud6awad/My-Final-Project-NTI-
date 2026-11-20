# Nova Store

Nova Store is a full-stack e-commerce application with an Angular storefront and a Node.js/Express/MongoDB backend.

## Project structure

- `backend/` — Express API, Mongoose models, JWT auth, order validation, and settings.
- `frontend/` — Angular storefront and manager dashboard.

## Quick start

1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
   Update values for your local MongoDB and manager account.
3. Start MongoDB locally or point `MONGODB_URI` to your Mongo instance.
4. Seed the manager account and sample data:
   ```bash
   npm run seed
   ```
5. Start the API:
   ```bash
   npm run dev
   ```
6. In a second terminal, install and run the frontend:
   ```bash
   cd frontend
   npm install
   npm start
   ```

The storefront runs on `http://localhost:4200` and the API on `http://localhost:4000`.

## Required environment variables

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `MANAGER_EMAIL`
- `MANAGER_PASSWORD`
- `STORE_NAME`
- `STORE_PHONE`
- `DEFAULT_DELIVERY_FEE`
- `DELIVERY_TIME`
- `DELIVERY_AREAS`
- `LOW_STOCK_THRESHOLD`
- `CLIENT_ORIGIN`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `ORDER_NOTIFICATION_EMAIL`

Order acceptance email notifications use SMTP. The example configuration uses Gmail; create a Google App Password for the sending account and set it as `SMTP_PASS` in `backend/.env` (do not use or share your regular Gmail password). Set `SMTP_USER` to the sender account and `ORDER_NOTIFICATION_EMAIL` to the inbox that should receive acceptance notifications. Notifications are sent when a manager changes an order to `Confirmed`. If sending fails, the manager dashboard shows an error and offers a retry button.

## Features included

- Public storefront with product browsing, featured sections, favorites, cart, checkout, and delivery information.
- English/Arabic language switch with right-to-left layout for Arabic.
- Order creation with server-side validation and stock checks.
- Manager-triggered order acceptance email notifications.
- Customer order tracking with phone verification and a delivery receipt confirmation shown in the manager dashboard.
- Manager login with JWT and protected admin APIs.
- Product, category, order, and settings management.
- Public store settings and dashboard stats.

## Notes

- This version uses a dev-friendly local image workflow. Production deployments should replace local image URLs with a managed service such as Cloudinary or Azure Blob Storage.
- Customer delivery details are intentionally confirmed by phone and are not treated as guaranteed shipping information.
- Order stock is deducted when an order is created and restored if the order is cancelled.

## Validation performed

- Successful Angular production build: `cd frontend && npm run build`
- Successful backend app import smoke test: `cd backend && node --input-type=module -e "import('./src/app.js')..."`
