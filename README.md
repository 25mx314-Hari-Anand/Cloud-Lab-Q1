# Online Book Store Web Application (Cloud Lab Assignment)

A complete, fully functional, responsive full-stack **Online Book Store Web Application** built with Node.js, Express.js, MongoDB Atlas (Mongoose ODM), and vanilla HTML/CSS/JavaScript.

---

## Table of Contents
1. [Project Aim and Objectives](#project-aim-and-objectives)
2. [Problem Statement](#problem-statement)
3. [Technology Stack](#technology-stack)
4. [Features](#features)
5. [Project Structure](#project-structure)
6. [MongoDB Database Schema](#mongodb-database-schema)
7. [REST API Documentation](#rest-api-documentation)
8. [Environment Variable Configuration](#environment-variable-configuration)
9. [Local Installation and Execution](#local-installation-and-execution)
10. [Database Seeding](#database-seeding)
11. [Automated Testing](#automated-testing)
12. [Expected Results](#expected-results)
13. [Common Errors and Troubleshooting](#common-errors-and-troubleshooting)

---

## Project Aim and Objectives

### Aim
To develop a scalable, maintainable, and cloud-ready web application for an online bookstore that simulates real-world inventory management and e-commerce order workflows.

### Objectives
- **Frontend**: Deliver an intuitive, responsive user interface using pure HTML, modern CSS, and vanilla JavaScript (Fetch API) without external frameworks.
- **Backend**: Implement a modular Express.js REST API with proper controllers, route handlers, error handling, and parameter validation.
- **Database**: Integrate MongoDB Atlas via Mongoose ODM for reliable document storage, schema enforcement, and atomic inventory updates.
- **Business Logic**: Enforce strict stock checks, prevent overselling, and handle automatic inventory restoration when orders are cancelled.
- **Security & Best Practices**: Secure HTTP headers with Helmet, enable CORS, sanitize inputs, validate MongoDB ObjectIds, and isolate secrets in environment variables.
- **Verification**: Provide automated test coverage for CRUD operations and order processing.

---

## Problem Statement

Traditional bookstore inventory and order management systems frequently suffer from data inconsistencies, race conditions resulting in stock overdrafts, disjointed client-server communication, and hardcoded in-memory state that fails to persist across server restarts.

This project addresses these challenges by building an end-to-end cloud database-backed web application where:
1. All inventory records and customer orders are permanently persisted in MongoDB Atlas.
2. Orders cannot exceed available inventory stock.
3. Order cancellations safely return reserved units back to available stock.
4. Client and server communicate strictly through standard RESTful endpoints using JSON.

---

## Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Native DOM manipulation, CSS Grid/Flexbox, Fetch API |
| **Icons** | Font Awesome 6 | Visual feedback and icons |
| **Backend** | Node.js (v22+) & Express.js (v5) | High-performance asynchronous HTTP server and REST API |
| **Database** | MongoDB Atlas | Cloud-hosted NoSQL document database |
| **ODM** | Mongoose (v9) | Object Data Modeling with strict schema validation |
| **Security** | Helmet, CORS, dotenv | HTTP header protection, cross-origin security, env variables |
| **Testing** | Jest, Supertest | Automated integration testing for HTTP endpoints & business logic |

---

## Features

### 1. Book Catalogue & Inventory Management
- **View Books**: Displays book title, author, price, category, stock level, and unique ISBN.
- **Stock Badges**: Real-time visual status tags:
  - `In Stock` (Green)
  - `Low Stock (< 5)` (Amber)
  - `Out of Stock (0)` (Red, with disabled purchase button)
- **Live Search**: Debounced search by book title or author name.
- **Category Filter**: Instant category filtering based on existing catalogue entries.
- **Add New Book**: Dedicated modal with client- and server-side validation.
- **Edit Book Details**: Update price, stock count, title, author, or description.
- **Delete Book**: Confirmation modal to prevent accidental record removal.

### 2. Customer Order Processing
- **Order Placement**: Customer order modal capturing name, email address, shipping address, book selection, and quantity.
- **Stock Guard**: Orders exceeding available stock are strictly blocked on both frontend and backend.
- **Real-Time Total**: Dynamic calculation of order amount (`unitPrice * quantity`).
- **Inventory Synchronization**: Available stock is decremented immediately upon placing an order.

### 3. Order Management & Business Rules
- **Order Tracking**: Comprehensive table listing Order ID, customer details, ordered books, line totals, and timestamps.
- **Status Updates**: Dropdown selector to update order lifecycle:
  `Pending` $\rightarrow$ `Processing` $\rightarrow$ `Shipped` $\rightarrow$ `Delivered` $\rightarrow$ `Cancelled`
- **Cancellation & Inventory Restoration**:
  - Orders in `Pending` or `Processing` status can be cancelled.
  - When cancelled, the ordered quantities are automatically restored to the book's stock.
  - Orders that are already `Shipped` or `Delivered` cannot be cancelled.

### 4. User Experience & Feedback
- Non-blocking toast notifications (Success, Error, Info).
- Loading spinners during asynchronous requests.
- Clean empty states when no records match filter criteria.

---

## Project Structure

```text
online-book-store/
├── public/                     # Static frontend files (served by Express)
│   ├── index.html              # Bookstore UI and modal forms
│   ├── style.css               # Modern CSS styling (responsive, variables)
│   └── script.js               # Vanilla JavaScript client (Fetch API)
├── models/                     # Mongoose schemas & data models
│   ├── Book.js                 # Book schema with ISBN uniqueness & validations
│   └── Order.js                # Order schema with customer & item snapshots
├── routes/                     # Express REST API route definitions
│   ├── bookRoutes.js           # Routes for /api/books
│   └── orderRoutes.js          # Routes for /api/orders
├── controllers/                # Business logic & database operations
│   ├── bookController.js       # Book CRUD handlers
│   └── orderController.js      # Order placement, status, and stock handlers
├── middleware/                 # Express middleware
│   ├── errorHandler.js         # Centralized error handler & status mapper
│   └── validateObjectId.js     # MongoDB ObjectId validation
├── scripts/                    # Database management scripts
│   └── seed.js                 # Idempotent database seeder (upsert on ISBN)
├── tests/                      # Automated Jest & Supertest test suite
│   ├── setup.js                # Test lifecycle hooks
│   ├── mockDb.js               # In-memory test store
│   ├── mockBook.js             # Test model mapper
│   ├── mockOrder.js            # Test model mapper
│   ├── books.test.js           # Book CRUD endpoint tests
│   └── orders.test.js          # Order placement, stock & status tests
├── app.js                      # Express application setup & middleware
├── server.js                   # Application entry point & MongoDB Atlas connection
├── package.json                # Dependencies, npm scripts & metadata
├── .env.example                # Example environment variables template
├── .gitignore                  # Git ignore rules (node_modules, .env)
└── README.md                   # Complete assignment documentation
```

---

## MongoDB Database Schema

### 1. `Book` Model (`models/Book.js`)
| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `title` | `String` | Yes | Max 200 chars, trimmed | Title of the book |
| `author` | `String` | Yes | Max 150 chars, trimmed | Name of the author(s) |
| `description` | `String` | No | Max 2000 chars | Synopsis of the book |
| `category` | `String` | Yes | Trimmed | Category (e.g. Software Engineering) |
| `price` | `Number` | Yes | Min: 0 | Unit price in USD |
| `stock` | `Number` | Yes | Min: 0, Integer | Units currently available in inventory |
| `isbn` | `String` | Yes | Unique index, trimmed | Standard Book Identifier |
| `createdAt` | `Date` | Auto | Timestamp | Automatically managed |
| `updatedAt` | `Date` | Auto | Timestamp | Automatically managed |

### 2. `Order` Model (`models/Order.js`)
| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `customer.name` | `String` | Yes | Max 100 chars | Customer full name |
| `customer.email`| `String` | Yes | Regex validation | Customer contact email |
| `customer.address` | `String` | Yes | Max 300 chars | Physical delivery address |
| `items` | `Array` | Yes | Non-empty | List of ordered items |
| `items[].book` | `ObjectId` | Yes | Ref: 'Book' | Foreign key to Book document |
| `items[].title` | `String` | Yes | Trimmed | Snapshot of book title at time of order |
| `items[].quantity` | `Number` | Yes | Min: 1, Integer | Quantity ordered |
| `items[].unitPrice`| `Number` | Yes | Min: 0 | Snapshot of unit price at purchase |
| `totalAmount` | `Number` | Yes | Min: 0 | Calculated sum: $\sum (\text{unitPrice} \times \text{quantity})$ |
| `status` | `String` | Yes | Enum | `Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled` |
| `createdAt` | `Date` | Auto | Timestamp | Date and time order was placed |
| `updatedAt` | `Date` | Auto | Timestamp | Date and time order was last modified |

---

## REST API Documentation

### Book Endpoints

| Method | Endpoint | Description | Request Body | Response Codes |
|---|---|---|---|---|
| `GET` | `/api/books` | List all books (with search & category filter) | Query: `?search=...&category=...` | `200 OK` |
| `GET` | `/api/books/:id` | Get single book by ID | None | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `POST` | `/api/books` | Add a new book to inventory | `{ title, author, category, price, stock, isbn, description }` | `201 Created`, `400 Bad Request`, `409 Conflict` |
| `PUT` | `/api/books/:id` | Update an existing book's details | Fields to update | `200 OK`, `400 Bad Request`, `404 Not Found`, `409 Conflict` |
| `DELETE`| `/api/books/:id` | Remove a book from catalogue | None | `200 OK`, `400 Bad Request`, `404 Not Found` |

### Order Endpoints

| Method | Endpoint | Description | Request Body | Response Codes |
|---|---|---|---|---|
| `GET` | `/api/orders` | List all customer orders | None | `200 OK` |
| `GET` | `/api/orders/:id` | Get single order by ID | None | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `POST` | `/api/orders` | Place a new customer order | `{ customer: { name, email, address }, items: [{ book, quantity }] }` | `201 Created`, `400 Bad Request`, `404 Not Found` |
| `PATCH` | `/api/orders/:id/status` | Update status (`Pending`, `Processing`, `Shipped`, etc.) | `{ status: "Shipped" }` | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE`| `/api/orders/:id` | Cancel order & restore inventory stock | None | `200 OK`, `400 Bad Request`, `404 Not Found` |

---

## Environment Variable Configuration

Create a `.env` file in the project root by copying `.env.example`:

```bash
cp .env.example .env
```

Configure your environment settings inside `.env`:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/bookstore?retryWrites=true&w=majority
```

> [!IMPORTANT]
> - Never commit your `.env` file to version control. It is listed in `.gitignore`.
> - Replace `<username>`, `<password>`, and `<cluster-url>` with your actual MongoDB Atlas database credentials.

---

## Local Installation and Execution

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended, e.g. v22)
- **npm** (v9.0.0 or higher)
- A **MongoDB Atlas** cluster account (Free M0 Sandbox cluster is sufficient)

### 2. Installation
Clone or navigate to your project directory and install all dependencies:

```bash
npm install
```

### 3. Database Seeding
Populate your MongoDB Atlas database with realistic sample computer science and software engineering books:

```bash
npm run seed
```
*(The seed script is idempotent; running it multiple times safely updates records without creating duplicates).*

### 4. Running the Application
Start the production server:
```bash
npm start
```

Or start the server in development mode with automatic reload:
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## Automated Testing

Automated tests are written with **Jest** and **Supertest** to test all API routes, controller logic, data validations, stock constraints, and order state transitions.

Run the test suite:
```bash
npm test
```

### Test Coverage Highlights:
- **Book Tests (`tests/books.test.js`)**:
  - List books with empty database and populated database.
  - Search books by title and author.
  - Create book with valid payload (201).
  - Reject creation when fields are missing or price/stock is negative (400).
  - Prevent duplicate ISBN entries (409).
  - Validate MongoDB ObjectId parameter format (400).
  - Read single book and return 404 for non-existent IDs.
  - Update book details and delete books with verification.
- **Order Tests (`tests/orders.test.js`)**:
  - Place order successfully and automatically decrement book stock (201).
  - Reject order if requested quantity exceeds available stock (400) and preserve stock count.
  - Validate customer email format and reject invalid emails (400).
  - Fetch all orders and fetch specific order by ID.
  - Update order status to `Processing` and `Shipped`.
  - Cancel order via `PATCH` or `DELETE`, ensuring inventory stock is immediately restored.
  - Block cancellation of orders that have already been `Shipped` or `Delivered` (400).
  - Block repeated cancellation of already cancelled orders (400).

---

## Expected Results

| Action | UI Input / Endpoint | Expected System Behavior |
|---|---|---|
| **View Catalogue** | Open `http://localhost:3000` | Books render as cards showing title, author, category, price, and stock badge. |
| **Search Filter** | Type "Clean" in search bar | Cards instantly filter to matching titles ("Clean Code"). |
| **Add Book** | Click "+ Add New Book", submit form | Modal closes, success toast appears, new book card appears in grid. |
| **Place Order** | Select book with 10 stock, order 3 | Order is created with status `Pending`, total amount calculated ($3 \times \text{unitPrice}$), book stock drops to 7. |
| **Over-order Attempt** | Request 15 units when stock is 7 | Order fails with 400 Bad Request error toast: "Insufficient stock...". Stock remains 7. |
| **Cancel Order** | Click "Cancel" on pending order in Orders tab | Order status updates to `Cancelled`, toast notifies user, book stock increases back from 7 to 10. |
| **Ship Order** | Select "Shipped" from status dropdown | Order status updates to `Shipped`. Cancel button is disabled. |

---

## Common Errors and Troubleshooting

### 1. `MongooseServerSelectionError: connect ECONNREFUSED` or `bad auth`
- **Cause**: Incorrect MongoDB connection string or IP address not whitelisted in MongoDB Atlas.
- **Solution**:
  1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
  2. Navigate to **Network Access** $\rightarrow$ Click **Add IP Address** $\rightarrow$ Select **Allow Access from Anywhere (`0.0.0.0/0`)** for lab testing.
  3. Verify your database username and password in `.env`. Ensure special characters in passwords are URL-encoded.

### 2. `git pull origin main: fatal: refusing to merge unrelated histories`
- **Cause**: The local Git repository and the remote GitHub repository were initialized independently with no shared commit history.
- **Solution**:
  Run:
  ```bash
  git pull origin main --allow-unrelated-histories
  ```
  Or to cleanly align local and remote branches:
  ```bash
  git pull origin main --rebase
  ```

### 3. Port `3000` already in use (`EADDRINUSE`)
- **Cause**: Another service or Node instance is running on port 3000.
- **Solution**: Change `PORT=3001` or another port in your `.env` file, or stop the conflicting process.

### 4. Tests timeout or fail to connect
- **Cause**: Tests require an isolated environment.
- **Solution**: The automated test suite uses an in-memory database mock designed for fast, isolated execution (`npm test`), completing 26 test assertions in under 2 seconds without external network dependencies.

