# TEEROP POS & Inventory Management System
## Final Capstone Project Specification

## 1. Project Overview

Project Name: TEEROP POS & Inventory Management System

The system is a full-stack, role-based Point-of-Sale (POS) and Inventory Management System designed for a retail store.

The application supports three user roles:

- Admin
- Inventory Manager
- Cashier

The system manages products, categories, inventory, stock levels, sales transactions, billing, receipts, users, and store statistics.

The application must use:

- Frontend: React + Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL + Sequelize
- Authentication: JWT + bcrypt
- Image Upload: Multer
- AI Coding Agent: Kiro
- Backend Deployment: Render
- Frontend Deployment: Vercel

---

# 2. User Roles

## 2.1 Admin

The Admin has full system access.

Admin can:

- Create users
- Edit users
- Deactivate users
- Change user roles
- View all users
- View all products
- Create products
- Edit products
- Deactivate products
- Restock products
- View all categories
- View low-stock products
- View store-wide transactions
- View store-wide statistics
- View today's sales
- View all-time sales
- View top-selling products
- Manage store/category settings

Admin cannot be restricted by Inventory Manager or Cashier permissions.

---

## 2.2 Inventory Manager

Inventory Manager can:

- Add products
- Edit products
- Deactivate products
- Restock products
- Assign products to categories
- Set reorder thresholds
- Search products
- Filter products
- View low-stock products
- View product information
- View sales history in read-only mode
- View inventory-related statistics

Inventory Manager cannot:

- Create users
- Delete users
- Change user roles
- Manage authentication accounts
- Access unrestricted administrative functionality

---

## 2.3 Cashier

Cashier can:

- Access POS
- Search products
- Simulate barcode scanning using SKU
- Add products to cart
- Increase quantity
- Decrease quantity
- Remove products
- Complete checkout
- Generate receipts
- View their own transaction history

Cashier cannot:

- Edit products
- Change product prices
- Change categories
- Restock products
- Manage users
- View other cashiers' full transaction history
- Access Admin functionality
- Access Inventory Manager management functionality

---

# 3. Authentication and Authorization

Authentication must use:

- bcrypt for password hashing
- JWT for authentication

Required functionality:

- Login
- User registration/creation through authorized Admin functionality
- Password hashing
- JWT generation
- JWT validation middleware
- Role authorization middleware

Every protected backend route must verify:

1. Valid JWT authentication
2. Correct role authorization

Backend authorization is the primary security boundary.

Frontend route protection must also exist, but frontend hiding alone is not considered security.

---

# 4. Product Model

Every product must contain:

- id
- SKU/barcode
- name
- category
- price
- quantity in stock
- reorder threshold
- image
- description
- active status
- created timestamp
- updated timestamp

SKU must be unique.

Quantity must never be negative.

Price must be valid and non-negative.

Reorder threshold must be non-negative.

---

# 5. Product Categories

Required categories:

1. Fragile
2. Cold
3. Tech
4. Cleaning
5. General

---

# 6. Category-Specific Fields

## 6.1 Fragile

Additional fields:

- handlingNote
- isFragile

isFragile is a boolean.

The UI must display a warning badge when isFragile is true.

---

## 6.2 Cold

Additional fields:

- expiryDate
- storageTemp

expiryDate is required.

Products expiring within 3 days must automatically be flagged.

---

## 6.3 Tech

Additional fields:

- warrantyPeriod
- serialNumber

serialNumber must be unique when provided.

---

## 6.4 Cleaning

Additional fields:

- isHazardous
- safetyNote

isHazardous is a boolean.

The UI must display a warning badge when isHazardous is true.

---

## 6.5 General

No additional category-specific fields are required.

---

# 7. Inventory Management

Inventory Manager and Admin can perform full product CRUD.

Required features:

- Create product
- View products
- Edit product
- Deactivate product
- Restock product
- Search products
- Filter products
- Upload product image
- View low-stock products

Product search must support:

- Product name
- SKU/barcode

Product filtering must support:

- Category

Search results must always use current database information.

---

# 8. Low Stock

A product is considered low-stock when:

quantity <= reorderThreshold

Low-stock products must be visible to:

- Admin
- Inventory Manager

A dedicated Low Stock section/list must exist.

---

# 9. Image Upload

Product images must use Multer.

Allowed formats:

- JPG
- JPEG
- PNG

Maximum file size:

2 MB

Images are initially stored locally.

The upload implementation should be structured so cloud storage can be added later.

Uploaded files must not be committed to GitHub.

---

# 10. POS SKU Scanner Simulation

The Cashier POS screen must contain a focused SKU/barcode input.

Workflow:

Enter SKU
↓
Press Enter
↓
Find Product
↓
Check Stock
↓
Add to Cart
↓
Clear Input
↓
Refocus Scanner Input

The scanner field simulates physical barcode-scanner behavior.

---

# 11. POS Manual Search

Cashiers must also be able to search products by name.

Search results must display:

- Product image
- Product name
- SKU
- Category
- Current price
- Current stock

Prices must always come from the current database.

No hardcoded product prices are allowed.

---

# 12. Cart

The cart must display:

- Product name
- Quantity
- Unit price
- Line subtotal
- Remove button

Cashiers can:

- Increase quantity
- Decrease quantity
- Remove an item

The system must prevent a cart quantity from exceeding available stock.

---

# 13. Billing

The system uses a 5% tax rate.

Formula:

Tax = Subtotal × 0.05

Grand Total = Subtotal + Tax

The values must update dynamically whenever cart contents change.

---

# 14. Checkout

When checkout is completed:

1. Validate the cart.
2. Verify current database stock.
3. Create Transaction.
4. Create TransactionItems.
5. Deduct product stock.
6. Prevent negative stock.
7. Store cashier ID.
8. Store transaction timestamp.
9. Store quantities.
10. Store prices.
11. Store subtotal.
12. Store tax.
13. Store grand total.
14. Generate/display receipt.

Transaction creation and stock deduction must be handled safely using a database transaction so that partial checkout does not corrupt inventory.

---

# 15. Receipt

Receipt must display:

- Store/project name
- Transaction ID
- Date/time
- Cashier
- Products
- Quantity
- Unit price
- Line subtotal
- Subtotal
- Tax
- Grand total

Receipt must be visible on screen.

Printing support may be added.

---

# 16. Transaction History

Cashiers can view:

- Their own transactions
- Transaction date
- Transaction total
- Transaction items

Cashiers must not access other cashiers' full transaction history.

Admins can view store-wide transaction history.

Inventory Managers can view sales history in read-only mode for inventory planning.

---

# 17. Database Models

Minimum required models:

- User
- Product
- Transaction
- TransactionItem

Category-specific information will be included in the Product model/database design.

---

# 18. Database Relationships

User:

- has many Transactions

Transaction:

- belongs to one User
- has many TransactionItems

TransactionItem:

- belongs to one Transaction
- belongs to one Product

Product:

- has many TransactionItems

Relationship:

User
 |
 └──< Transaction
          |
          └──< TransactionItem >── Product

---

# 19. Stock Integrity

The system must never allow negative stock.

Before adding an item to the cart:

requested quantity <= current stock

Before checkout:

cart quantity <= current database stock

Stock must be checked again during checkout because inventory may have changed after the item was added to the cart.

---

# 20. Admin Dashboard

Admin dashboard must provide:

- Total users
- Total products
- Total transactions
- Today's sales
- All-time sales
- Low-stock products
- Top-selling products
- Recent transactions

Admin has store-wide access.

---

# 21. Inventory Manager Dashboard

Inventory Manager dashboard must provide:

- Total products
- Active products
- Low-stock products
- Products requiring attention
- Recent inventory activity
- Read-only sales information

---

# 22. Cashier Dashboard

Cashier dashboard must focus on:

- SKU scanner
- Product search
- Cart
- Subtotal
- Tax
- Grand total
- Checkout
- Receipt
- Recent personal transactions

The POS must work on tablet-sized checkout screens.

---

# 23. Statistics

The system must provide:

- Today's total sales
- All-time total sales
- Number of transactions
- Top-selling products
- Current low-stock products

Charts are optional.

Summary cards and tables are sufficient.

---

# 24. Backend Validation

Backend validation is required for important inputs.

Validation includes:

- Required product name
- Unique SKU
- Valid price
- Non-negative quantity
- Valid reorder threshold
- Valid category
- Required expiry date for Cold products
- Valid image type
- Maximum image size
- Unique Tech serial number
- Valid user email
- Valid password
- Valid transaction quantities

---

# 25. Error Handling

The backend must use centralized error handling.

Expected HTTP statuses:

- 200 OK
- 201 Created
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 500 Internal Server Error

Errors should use consistent JSON responses.

---

# 26. Frontend Routing

React Router must be used.

Protected areas:

/admin/*
/inventory/*
/pos/*

Unauthorized users must be redirected away from protected pages.

Backend middleware remains the primary security boundary.

---

# 27. Responsive Design

Tailwind CSS must be used throughout the application.

The interface must support:

- Desktop
- Laptop
- Tablet

The POS must be optimized for a checkout-counter tablet-sized display.

---

# 28. Deployment

Backend:

Render

Frontend:

Vercel

Environment variables must be documented in README.

Sensitive information must never be committed to GitHub.

---

# 29. AI Agent Development Workflow

The project must be developed using Kiro.

Development workflow:

1. Planning
2. Scoped AI prompt
3. Code generation
4. Code review
5. Correction
6. Testing
7. Documentation
8. Next phase

The complete application must not be generated using one large unreviewed prompt.

---

# 30. Required Submission Evidence

The final submission must contain:

- GitHub repository
- Clear commit history
- client/ folder
- server/ folder
- Working Vercel frontend
- Working Render backend
- README
- Environment variable documentation
- Demo credentials for all three roles
- AI prompt log
- Evidence of code review/corrections
- Demo walkthrough
- Full billing transaction demonstration

---

# 31. Success Criteria

The project is complete when:

- All three roles can log in.
- Role restrictions work on the backend.
- Products can be managed.
- Category-specific fields work.
- Product images can be uploaded.
- Product search works.
- Product filtering works.
- Low-stock alerts work.
- Cashier can scan products.
- Cashier can search products.
- Cart works.
- Tax calculates correctly.
- Totals calculate correctly.
- Checkout creates transactions.
- Stock automatically decreases.
- Negative stock is impossible.
- Receipts are generated.
- Cashier can view personal transactions.
- Admin can view store-wide statistics.
- Inventory Manager can view relevant sales information.
- Application is responsive.
- Backend is deployed to Render.
- Frontend is deployed to Vercel.
- README is complete.
- AI prompt log is complete.
- Final demo covers all three roles.