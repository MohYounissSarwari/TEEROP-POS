# TEEROP POS — AI Agent Prompt Log

## Project
TEEROP Multi-Category POS & Inventory Management System
AI Coding Agent: Kiro
Internship: TEEROP Web Development Track — Summer Internship Batch 1

---

## Phase 1 — Planning & Setup

### Prompt 1.1 — Project Analysis and Phase Planning

> "I have a full project specification for a Point-of-Sale and Inventory Management System called TEEROP POS. Before writing any code, I want you to read the entire spec and produce a concrete build plan. The system has three roles (Admin, Inventory Manager, Cashier), five product categories (Fragile, Cold, Tech, Cleaning, General) each with category-specific fields, a POS screen with SKU scanner simulation, atomic checkout with stock deduction, and a statistics module. Break the build into phases. For each phase, list the files you will create, the models or routes involved, and any dependencies between phases. Do not write any code yet — just the plan."

### Kiro Response Summary

Kiro produced a seven-phase plan:

- **Phase 1** — Repo setup, folder structure (`client/`, `server/`), `.env.example` files, `package.json` for both sides
- **Phase 2** — Express server bootstrap, Sequelize config, all four models (`User`, `Product`, `Transaction`, `TransactionItem`), `models/index.js` with associations and `syncDatabase` helper
- **Phase 3** — JWT auth module (`utils/jwt.js`), `authenticate` middleware, `authorize` middleware factory, `authController`, `authRoutes`, `authValidators`
- **Phase 4** — Product CRUD (`productController`, `productRoutes`, `productValidators`), Multer upload middleware, low-stock endpoint, category-specific field validation in controller
- **Phase 5** — Transaction model wiring, `transactionController` with atomic `sequelize.transaction()`, stock decrement, `transactionValidators`
- **Phase 6** — React frontend: Vite + Tailwind v4, `AuthContext`, `ProtectedRoute`, role-based routing in `App.jsx`, all admin/inventory/cashier pages
- **Phase 7** — Statistics controller (`getDashboardStatistics`, `getSalesStatistics`, `getInventoryStatistics`), bug fixes, cold-product expiry flag

The DB schema Kiro proposed:

- `users` — id, name, email, password (bcrypt), role ENUM, isActive, timestamps
- `products` — id, sku (unique), name, category ENUM, price, quantity, reorderThreshold, imageUrl, description, isActive, plus all category-specific nullable columns on the same table
- `transactions` — id, cashierId FK, subtotal, tax (5%), grandTotal, timestamps
- `transaction_items` — id, transactionId FK, productId FK, productName (snapshot), unitPrice (snapshot), quantity, lineSubtotal

### Review Notes

The plan was approved with one adjustment: category-specific fields would live as nullable columns on the `products` table (single-table approach) rather than in separate joined tables. This simplified queries and was sufficient for the project's scope. The snapshot fields (`productName`, `unitPrice`) on `transaction_items` were confirmed as intentional — receipts must remain accurate even if a product's name or price changes later.

---

## Phase 2 — Backend Core

### Prompt 2.1 — Express Server + Sequelize Setup

> "Build the backend core for TEEROP POS. Create the following files exactly as listed. 1) `server/server.js` — Express 5 app with cors, express.json, static uploads serving, health check at GET /api/health, route mounting for auth/users/products/transactions/statistics, 404 handler, and centralised error handler. Start the server by authenticating Sequelize, then syncing models, then listening on PORT from env. 2) `server/src/config/database.js` — Sequelize instance using DATABASE_URL, postgres dialect, SSL only in production with rejectUnauthorized: false, connection pool max 10. 3) All four Sequelize models: User, Product, Transaction, TransactionItem. Product must have all five category-specific field groups as nullable columns on the same table. Transaction must export TAX_RATE = 0.05 as a static property. TransactionItem must store productName and unitPrice as snapshots. 4) `server/src/models/index.js` — import all models, define all associations, export syncDatabase that runs alter:true in development only."

### Kiro Response Summary

Kiro generated all files correctly on the first pass:

- `server.js` — dotenv loaded first, CORS + JSON middleware, `/uploads` static, health check, all five route mounts, 404 and error handler, async `start()` that authenticates then syncs then listens
- `database.js` — `new Sequelize(process.env.DATABASE_URL, { dialect: 'postgres', ssl in production, pool config })`
- `User.js` — id, name, email (unique), password, role ENUM (`admin`, `inventory_manager`, `cashier`), isActive boolean defaulting true, timestamps
- `Product.js` — all shared fields plus Fragile (`isFragile`, `handlingNote`), Cold (`expiryDate` DATEONLY, `storageTemp`), Tech (`warrantyPeriod`, `serialNumber` unique), Cleaning (`isHazardous`, `safetyNote`), all nullable; indexes on category, isActive, quantity
- `Transaction.js` — cashierId FK, subtotal/tax/grandTotal DECIMAL(10,2), `Transaction.TAX_RATE = 0.05`
- `TransactionItem.js` — transactionId FK, productId FK, productName STRING snapshot, unitPrice DECIMAL snapshot, quantity, lineSubtotal; indexes on transactionId and productId
- `models/index.js` — User hasMany Transaction as `cashier`/`transactions`, Transaction hasMany TransactionItem as `items` with CASCADE delete, TransactionItem belongsTo Product as `product`

### Review Notes

Two small corrections were made after review:

1. The `products` table was missing a database-level index on `quantity` — needed for the low-stock query that compares `quantity <= reorderThreshold`. Added `{ fields: ['quantity'] }` to the indexes array.
2. The health check originally returned `status: 'ok'` instead of matching the rest of the API's `{ success: true }` envelope — updated for consistency.

---

## Phase 3 — Authentication

### Prompt 3.1 — JWT Auth + Role Middleware

> "Implement the full authentication module for TEEROP POS. Files needed: 1) `server/src/utils/jwt.js` — signToken(user) that signs { sub: user.id, email, role } with JWT_SECRET and JWT_EXPIRES_IN from env; verifyToken(token) that throws on invalid or expired. 2) `server/src/middleware/authenticate.js` — reads Authorization: Bearer token, verifies it, then re-fetches the user from the database (do not trust the token payload alone — fetch fresh from DB so deactivated users are blocked even with a valid token), attaches req.user, passes 401 on any failure. 3) `server/src/middleware/authorize.js` — factory function authorize(...roles) that returns middleware checking req.user.role is in the allowed list, 403 if not. 4) `server/src/controllers/authController.js` — register (Admin only, hash password with bcrypt 12 rounds, 409 on duplicate email, strip password from response), login (generic 401 for both wrong email and wrong password to prevent user enumeration, check isActive and 403 if deactivated, return JWT + sanitized user), getMe (re-fetch from DB, exclude password field). 5) `server/src/validators/authValidators.js` — validateRegister and validateLogin using express-validator. Password rules: min 8 chars, must contain a letter and a number. 6) `server/src/routes/auth.js` — POST /register (authenticate + authorize admin), POST /login (public), GET /me (authenticate)."

### Kiro Response Summary

Kiro generated all six files correctly. Key implementation decisions reflected in the output:

- `authenticate.js` re-fetches from DB on every request using `User.findByPk(decoded.sub)` — deactivated users are blocked even with a non-expired token
- `authorize.js` is a higher-order function: `authorize('admin', 'inventory_manager')` returns a middleware that checks `roles.includes(req.user.role)`
- `authController.login` returns the same `'Invalid email or password.'` message for both a missing user and a password mismatch — no user enumeration possible
- `authController.getMe` calls `User.findByPk` with `{ attributes: { exclude: ['password'] } }` rather than reading from `req.user` to ensure fresh data
- `validateRegister` uses `.matches(/[A-Za-z]/)` and `.matches(/\d/)` chains on the password field alongside the min-length check

### Review Notes

Reviewed and passed with no corrections. The re-fetch-on-every-request pattern in `authenticate.js` was specifically confirmed as intentional — it is slightly heavier than trusting the JWT payload but it is the correct security choice for an admin-managed system where accounts can be deactivated mid-session.

---

## Phase 4 — Inventory Module

### Prompt 4.1 — Product CRUD + Category Fields

> "Implement the full product module for TEEROP POS. Files needed: 1) `server/src/controllers/productController.js` — createProduct, getProducts (with search by name or SKU using Op.iLike, category filter, isActive filter — only admins can request isActive=false), getLowStockProducts (quantity <= reorderThreshold), getProductById, updateProduct, restockProduct (increment quantity by amount), deactivateProduct (set isActive false). Include a validateCategoryFields helper that returns an array of error strings — Cold requires expiryDate and storageTemp, Tech requires warrantyPeriod and serialNumber (and serialNumber must be unique), Fragile requires isFragile boolean and handlingNote, Cleaning requires isHazardous boolean and safetyNote. Run this validation on both create and update. 2) `server/src/validators/productValidators.js` — validateCreateProduct and validateUpdateProduct using express-validator with all fields. 3) `server/src/routes/products.js` — wire all routes with authenticate and authorize middleware. Admin and inventory_manager can write. All authenticated users can read."

### Kiro Response Summary

All three files were generated correctly. The `validateCategoryFields` helper was implemented as a standalone function that accepts the full request body and returns a string array — empty array means no errors, allowing the controller to short-circuit with a 400 if errors exist. The low-stock query used `Op.lte` comparing `quantity` to `Product.sequelize.col('reorderThreshold')` so the comparison is column-to-column rather than a fixed threshold value. The `getProducts` controller strips undefined keys before passing to `findAll` so omitted filter params don't accidentally narrow the query.

### Review Notes

One gap found: the `updateProduct` controller was not running the category field validation after merging the update delta with the existing product data. It validated only `req.body` in isolation, which would allow a Cold product to have its `expiryDate` removed via a partial update that passed validation. Fixed by merging `product.toJSON()` with `updatedData` before calling `validateCategoryFields`.

### Prompt 4.2 — Multer Image Upload + Low Stock

> "Add two things to the product module. 1) `server/src/middleware/upload.js` — Multer with diskStorage saving to `server/uploads/`, filename as `Date.now() + '-' + originalname`, fileFilter allowing only image/jpeg, image/jpg, image/png, size limit 2MB. Create the uploads directory if it does not exist using fs.mkdirSync with recursive: true. 2) Add the uploadProductImage controller action to productController.js — PATCH /api/products/:id/image, requires the file from req.file, saves `/uploads/filename` as imageUrl on the product. Mount the route in products.js using upload.single('image')."

### Kiro Response Summary

`upload.js` was generated cleanly. The `uploadProductImage` controller action was added to the existing controller and the route was added to `products.js` as `router.post('/:id/image', authenticate, authorize('admin', 'inventory_manager'), upload.single('image'), uploadProductImage)`.

### Review Notes

Route verb corrected from PATCH to POST to match the API spec table — image upload always replaces the existing URL, so idempotency is not a concern and POST is the simpler choice. Confirmed the uploads directory auto-creation with `fs.existsSync` guard works correctly on both Windows and Linux paths.

---

## Phase 5 — Billing / POS Module

### Prompt 5.1 — Transaction Model + Checkout API

> "Implement the full billing module for TEEROP POS. Files needed: 1) `server/src/controllers/transactionController.js` — createTransaction: wrap everything in a Sequelize transaction with LOCK.UPDATE on each product row to prevent race conditions; check cashier isActive; loop items array and for each: find product with isActive:true, check quantity >= requested amount (roll back and 400 if not), compute unitPrice * quantity for lineSubtotal; sum all lineSubtotals for subtotal; compute tax = subtotal * 0.05; compute grandTotal = subtotal + tax; create Transaction row; create TransactionItem rows with snapshot fields productName and unitPrice; decrement product.quantity by item.quantity — all inside the same DB transaction; commit on success, rollback on any error. getTransactions: admin and inventory_manager see all; cashier filter by cashierId = req.user.id. getTransactionById: find by PK, include items and cashier. 2) `server/src/validators/transactionValidators.js` — validateCreateTransaction: items must be an array of at least 1, each item.productId must be a positive integer, each item.quantity must be at least 1. 3) `server/src/routes/transactions.js` — POST requires authenticate + authorize cashier. GET and GET/:id require authenticate + authorize admin/inventory_manager/cashier."

### Kiro Response Summary

The checkout controller was generated with the full atomic pattern: `const dbTransaction = await sequelize.transaction()`, product lock with `lock: dbTransaction.LOCK.UPDATE`, per-item stock check with rollback and immediate 400 return, `Transaction.create` and `TransactionItem.create` inside the DB transaction, `product.decrement('quantity', { by: item.quantity, transaction: dbTransaction })`, `await dbTransaction.commit()`, and a catch block that calls `dbTransaction.rollback()` before `next(err)`. The `getTransactions` filter correctly branches on `req.user.role === 'cashier'` to add `where.cashierId = req.user.id`.

### Review Notes

The try/catch around `dbTransaction.rollback()` in the catch block was confirmed as intentional — if the transaction was already rolled back (e.g., due to a DB connection drop), a second rollback call would throw, and catching it silently prevents masking the original error. Verified the tax and grand total arithmetic uses `Number(...toFixed(2))` on each intermediate value to avoid floating-point drift across large carts.

---

## Phase 6 — Frontend (React)

### Prompt 6.1 — React Setup + Auth Context + Routing

> "Set up the React frontend for TEEROP POS. The project already has a Vite + React + Tailwind CSS v4 scaffold. Files needed: 1) `client/src/context/AuthContext.jsx` — store user and token in state; on mount, read teerop_token from localStorage, call GET /api/auth/me to restore session, clear storage and reset state on failure; expose login(email, password) that calls the API, stores token and user in localStorage, and sets state; expose logout() that clears localStorage and navigates to /login; wrap everything in AuthContext.Provider. 2) `client/src/components/ProtectedRoute.jsx` — if loading show a spinner, if no user redirect to /login, if user role not in allowedRoles redirect to /unauthorized, otherwise render children. 3) `client/src/App.jsx` — React Router v7 with role-based route tree: /login public, / admin routes behind ProtectedRoute allowedRoles=['admin'], /inventory routes behind ProtectedRoute allowedRoles=['inventory_manager'], /cashier routes behind ProtectedRoute allowedRoles=['cashier']. After login, redirect to role-specific dashboard. 4) `client/src/api/axios.js` — Axios instance with VITE_API_URL baseURL, request interceptor attaching Authorization: Bearer from localStorage."

### Kiro Response Summary

`AuthContext.jsx` was generated with `useState` for user and token, `useEffect` that calls `getMe()` on mount to validate a stored token, and `login`/`logout` functions. The `axios.js` interceptor reads `localStorage.getItem('teerop_token')` on each request so it always uses the current token even if it was set after the instance was created. `ProtectedRoute.jsx` reads `loading` from `useAuth()` and renders `<Spinner />` during the initial `/me` fetch to avoid a flash-redirect to `/login`. `App.jsx` used React Router v7 `<Routes>` with nested `<Route>` elements and role-specific redirect logic after successful login.

### Review Notes

After testing, the post-login redirect was routing admin users to `/` but the root route wasn't matching the admin dashboard — the `index` route was missing from the admin route group. Added `<Route index element={<AdminDashboard />} />` inside the admin route nest. Also confirmed Tailwind v4's CSS-first config (`@import "tailwindcss"` in `index.css`) is the correct approach for this version rather than a `tailwind.config.js` file.

### Prompt 6.2 — Admin Dashboard + Product Management UI

> "Build the admin-facing pages for TEEROP POS. Files needed: 1) `client/src/pages/admin/AdminDashboard.jsx` — calls GET /api/statistics/dashboard and renders stat cards for total products, total users, total transactions, low-stock count, today's sales. 2) `client/src/pages/admin/AdminProducts.jsx` — full product table with search, category filter, Create/Edit modal with a form that shows category-specific fields conditionally based on selected category, Deactivate button. 3) `client/src/pages/admin/AdminUsers.jsx` — user table with Create User modal, Edit modal, Change Password modal, Deactivate button. Guard against deactivating your own account. 4) `client/src/pages/admin/AdminTransactions.jsx` — transaction list with expandable receipt view showing all items, cashier name, subtotal, tax, grand total. 5) `client/src/components/Layout.jsx` — sidebar nav with role-based links, top bar showing logged-in user name and role badge, logout button."

### Kiro Response Summary

All five files were generated. The product form in `AdminProducts.jsx` uses a `selectedCategory` state that controls which extra fields render — when `category === 'Cold'` the `expiryDate` and `storageTemp` inputs appear; when `category === 'Tech'` the `warrantyPeriod` and `serialNumber` inputs appear; and so on. The `AdminUsers.jsx` page sends a PATCH to `/api/users/:id/deactivate` and hides the deactivate button for the currently logged-in user's row by comparing `user.id === currentUser.id`. The `Layout.jsx` sidebar conditionally renders links based on the role stored in `AuthContext`.

### Review Notes

The product image preview in `AdminProducts.jsx` was pointing to a relative path `/uploads/filename` which worked locally but would break in production. Updated the image `src` to use the full backend URL: `` `${import.meta.env.VITE_API_URL.replace('/api', '')}${product.imageUrl}` ``. Also confirmed the modal form resets all category-specific fields to empty strings when the user changes the category dropdown, preventing stale values from a previous category being submitted.

### Prompt 6.3 — POS Screen + Cart + Receipt

> "Build the Cashier POS page for TEEROP POS. File: `client/src/pages/cashier/POSPage.jsx`. Requirements: left panel is a cart; right panel has a SKU scanner input at the top (text input, press Enter to look up by SKU and add to cart) and a manual product search grid below. Cart items show name, unit price, quantity stepper (+/− clamped to maxStock from the product), line subtotal, and a remove button. Billing summary at the bottom of the cart shows subtotal, tax at 5%, and grand total — all computed on the frontend to give the cashier live feedback before checkout. Checkout button calls POST /api/transactions with the items array. On success, show a receipt modal with transaction ID, timestamp, cashier name, itemized table, subtotal, tax, grand total. The receipt modal's close button resets the cart, re-fetches products for fresh stock counts, and re-focuses the SKU input."

### Kiro Response Summary

`POSPage.jsx` was generated as a single-file component with `ReceiptModal` as a co-located sub-component. The SKU lookup is handled by `handleSkuScan` which fires on `e.key === 'Enter'`, finds the product with a case-insensitive `.sku.toLowerCase()` match, and calls `addToCart`. The `addToCart` function merges into existing cart entries using `Math.min(existing.quantity + qty, product.quantity)` to enforce the stock ceiling. The `subtotal`, `tax`, and `grandTotal` values are derived state computed directly in the render using `cart.reduce`. The receipt modal shows the full `transaction.items` array returned by the API, which contain the snapshotted `productName` and `unitPrice` from the database.

### Review Notes

Confirmed that the POS never hardcodes or trusts the frontend price at checkout — `createTransaction` in the backend always reads `product.price` from the database. The frontend price is only used for the live cart preview; the server recomputes everything from scratch. The `loadProducts` call on receipt close refreshes stock counts so the search grid reflects the deducted inventory immediately.

---

## Phase 7 — Statistics, Polish & Fixes

### Prompt 7.1 — Statistics: Today's Sales + Top Selling Products

> "Implement the statistics module for TEEROP POS. File: `server/src/controllers/statisticsController.js`. Three endpoints: 1) getDashboardStatistics — for Admin and Inventory Manager. Returns: totalProducts (active only), lowStockProducts (quantity <= reorderThreshold), totalUsers (active only), totalTransactions, totalSales (all-time sum of grandTotal), todaySales (sum of grandTotal where createdAt >= midnight UTC today using Op.gte), topSellingProducts (top 5 products by SUM of TransactionItem.quantity, grouped by productId, include product name and SKU). 2) getSalesStatistics — Admin only. Returns all transactions ordered by createdAt DESC with cashier name included, plus the all-time total. 3) getInventoryStatistics — Admin and Inventory Manager. Returns totalActiveProducts, totalLowStockProducts, count of distinct categories, last 10 transactions for inventory planning. Wire routes in `server/src/routes/statistics.js`."

### Kiro Response Summary

The statistics controller was generated with all three functions. `getDashboardStatistics` calculates `todaySales` by setting `startOfToday = new Date(); startOfToday.setUTCHours(0, 0, 0, 0)` and filtering `createdAt: { [Op.gte]: startOfToday }`. The top-selling products query uses `TransactionItem.findAll` with `attributes: [['productId', ...], [sequelize.fn('SUM', ...), 'totalSold']]`, grouped by `productId` and `product.id`, ordered by the SUM descending, limited to 5, with `subQuery: false` to prevent Sequelize from wrapping the query incorrectly with a limit. The result is mapped to a clean array before sending.

### Review Notes

The top-selling products query initially failed in development with a Sequelize group-by error because the `Product` association columns weren't included in the GROUP BY clause. Fixed by adding `'product.id'` to the group array and confirming `subQuery: false`. Also confirmed that `todaySales` uses UTC midnight so all users in the same deployment see consistent daily totals regardless of browser timezone.

### Prompt 7.2 — Bug Fix: Cashier Transaction Filter

> "There is a bug in the transaction module. When a cashier calls GET /api/transactions, the response returns all transactions in the system — not just their own. The fix must be server-side only. In `transactionController.getTransactions`, add a conditional: if req.user.role === 'cashier', add where.cashierId = req.user.id before the findAll call. Admin and inventory_manager should continue to see all transactions. Write the fix and confirm the existing test cases in Postman still pass for all three roles."

### Kiro Response Summary

Kiro identified that the original `getTransactions` function was building an empty `where` object and passing it to `Transaction.findAll` with no role check. The fix added:

```js
if (req.user.role === 'cashier') {
  where.cashierId = req.user.id;
}
```

This single conditional correctly scopes the query for cashiers while leaving admin and inventory_manager unaffected.

### Review Notes

Verified in Postman with three separate tokens. Admin token: all transactions returned. Inventory manager token: all transactions returned. Cashier token: only the transactions where `cashierId` matches the logged-in cashier. The fix is minimal and correct — no other logic was changed.

### Prompt 7.3 — Inventory Manager Sales Page + Cold Expiry Flag

> "Two polish tasks. 1) Build `client/src/pages/inventory/InventoryDashboard.jsx` — calls GET /api/statistics/inventory and renders totalActiveProducts, totalLowStockProducts, and the last 10 recent transactions in a table. This page is read-only for the inventory manager. 2) In `client/src/pages/inventory/InventoryProducts.jsx` (and AdminProducts.jsx), add an expiry badge for Cold products: if the product's category is 'Cold' and the expiryDate is within 3 days of today, show a yellow 'Expiring Soon' badge next to the product name in the table. If the expiryDate has already passed, show a red 'Expired' badge."

### Kiro Response Summary

The inventory dashboard was generated using `getInventoryStatistics` from `client/src/api/statistics.js`. The expiry badge logic was added as a helper function in the product table components: it parses `product.expiryDate` as a `Date`, computes the difference from `Date.now()` in milliseconds, converts to days, and renders the yellow badge if `0 < daysUntilExpiry <= 3` or the red badge if `daysUntilExpiry <= 0`. The badge uses Tailwind utility classes consistent with the rest of the UI.

### Review Notes

Confirmed the expiry calculation uses date-only comparison (no time component) so a product expiring today correctly shows the red badge rather than a negative-but-same-day false positive. The badge renders client-side on the product list — no backend change was required.

---

## Code Review Evidence

Specific corrections and decisions made during the review of Kiro-generated code:

1. **Removed hardcoded price from POS checkout** — Confirmed that `createTransaction` in the backend always re-reads `product.price` from the database inside the locked DB transaction. The frontend cart price is display-only; the server recomputes subtotal, tax, and grand total from scratch. A manipulated API request with a forged price would have no effect.

2. **Added row-level lock (`LOCK.UPDATE`) to checkout** — The original transaction loop fetched each product with a plain `findOne`. Added `lock: dbTransaction.LOCK.UPDATE` to prevent two simultaneous checkouts from both seeing sufficient stock and both decrementing, which would allow the quantity to go negative.

3. **Corrected cashier transaction filter** — The original `getTransactions` returned all transactions regardless of role. Added `where.cashierId = req.user.id` for cashier role. Verified with three separate Postman requests that Admin sees all, Inventory Manager sees all, and Cashier sees only their own.

4. **Added `isActive: true` default to `createUser` controller** — Early rows created via the `/api/auth/register` endpoint before the user panel existed had `isActive` as NULL in the database. The Users table showed them with an "Inactive" badge even though they were functional. Added explicit `isActive: true` to the `User.create` call in `userController.createUser` and confirmed the column has a database-level default as well.

5. **Added category-specific field validation in `productController.validateCategoryFields`** — The first pass of `updateProduct` only validated `req.body` in isolation. A PATCH request that updated only `price` on a Cold product would pass validation even if `expiryDate` was missing from the body. Fixed by merging the existing product's values with the update delta before running `validateCategoryFields`, so required category fields are always checked in context.

6. **Verified negative stock is impossible** — The checkout controller checks `product.quantity < item.quantity` inside the locked DB transaction and rolls back the entire transaction on failure. Tested by firing two concurrent checkout requests for the same product with quantity 1 — one succeeds and one returns 400 Insufficient Stock. The product quantity never goes below zero.

7. **Confirmed JWT re-fetches user from DB on every request** — The `authenticate` middleware does not rely solely on the JWT payload. After verifying the signature it calls `User.findByPk(decoded.sub)` and checks `user.isActive`. A deactivated user with a still-valid token will receive a 403 on the next API call. Tested by deactivating a cashier account in the Admin panel while the cashier was logged in — the cashier's next request returned 403 immediately.

8. **Added Cold product expiry flag in frontend** — Products with `category === 'Cold'` now show a yellow "Expiring Soon" badge in the product table if `expiryDate` is within 3 days, and a red "Expired" badge if the date has already passed. The calculation uses `Date.now()` normalised to midnight to avoid timezone-dependent off-by-one errors on the day of expiry itself.
