# 🛒 Product & Order Management System

Full-stack e-commerce system with **Razorpay payment integration**, **inventory management**, and **automatic refunds** for out-of-stock scenarios.

---

## 📁 Project Structure

```
project/
├── backend/          # Spring Boot 3.2 / Java 17
│   └── src/main/java/com/shopmanager/
│       ├── config/          SecurityConfig, DataInitializer
│       ├── controller/      AuthController, ProductController, CartController, OrderController
│       ├── dto/             Request & Response DTOs
│       ├── entity/          User, Product, Cart, CartItem, Order, OrderItem, Payment
│       ├── exception/       Custom exceptions + GlobalExceptionHandler
│       ├── repository/      Spring Data JPA repositories
│       ├── security/        JWT util, filter, UserDetailsService
│       └── service/impl/    AuthService, ProductService, CartService, PaymentService
└── frontend/         # React 18
    └── src/
        ├── components/   Navbar (PrimeIcons)
        ├── context/      AuthContext
        ├── pages/        ProductsPage, CartPage, OrdersPage, AdminDashboard, Login, Register
        └── services/     Axios API layer
```

---

## ⚙️ Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Backend    | Java 17, Spring Boot 3.2                |
| Security   | Spring Security + JWT                   |
| Persistence| Spring Data JPA / Hibernate / MySQL 8   |
| Payments   | Razorpay Java SDK 1.4.5                 |
| Frontend   | React 18, React Router v6, PrimeIcons   |

---

## 🏦 Razorpay Payment Flow

```
User clicks "Pay Now"
       │
       ▼
POST /api/orders/create          ← Step 1: Create DB order (AWAITING_PAYMENT)
       │                               + Create Razorpay order
       │                               + Save Payment record (CREATED)
       ▼
Razorpay Checkout opens in browser
       │
       ├── Payment SUCCESS ──────────────────────────────────────┐
       │                                                         ▼
       │                                          POST /api/orders/verify-payment
       │                                               │
       │                                               ├── Verify HMAC signature
       │                                               │
       │                                               ├── Check inventory
       │                                               │      │
       │                                               │      ├── Stock OK
       │                                               │      │     └── Deduct inventory
       │                                               │      │         Order → CONFIRMED
       │                                               │      │         Payment → PAID
       │                                               │      │         Cart cleared ✅
       │                                               │      │
       │                                               │      └── Out of stock
       │                                               │             └── Issue Razorpay refund
       │                                               │                 Order → OUT_OF_STOCK
       │                                               │                 Payment → REFUNDED ↩️
       │
       └── Payment FAILED
              └── Webhook: POST /api/webhook/razorpay
                      └── Order → PAYMENT_FAILED
                          Payment → FAILED
```

---

## 🗄️ Database Schema

```sql
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('ROLE_USER','ROLE_ADMIN') NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at DATETIME
);

CREATE TABLE products (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description VARCHAR(1000),
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  category VARCHAR(100),
  image_url VARCHAR(500),
  enabled BOOLEAN DEFAULT TRUE,
  created_at DATETIME,
  updated_at DATETIME
);

CREATE TABLE cart (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  updated_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE cart_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cart_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  price_at_addition DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (cart_id) REFERENCES cart(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('AWAITING_PAYMENT','PAYMENT_FAILED','CONFIRMED','OUT_OF_STOCK',
              'REFUNDED','SHIPPED','DELIVERED','CANCELLED') NOT NULL,
  shipping_address VARCHAR(500),
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  price_at_order DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL UNIQUE,
  razorpay_order_id VARCHAR(255) NOT NULL UNIQUE,
  razorpay_payment_id VARCHAR(255),
  razorpay_refund_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('CREATED','PAID','FAILED','REFUNDED','REFUND_FAILED') NOT NULL,
  failure_reason VARCHAR(500),
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

---

## 🚀 Setup & Run

### Prerequisites
- Java 17+, Maven 3.8+
- MySQL 8
- Node.js 18+, npm
- Razorpay account (get keys at [razorpay.com/dashboard](https://dashboard.razorpay.com))

### 1. Backend

```bash
# Create DB
mysql -u root -p -e "CREATE DATABASE shop_manager_db;"

# Edit src/main/resources/application.properties:
spring.datasource.password=YOUR_MYSQL_PASSWORD
razorpay.key.id=rzp_test_XXXXXXXXXXXXXXXX
razorpay.key.secret=XXXXXXXXXXXXXXXXXXXXXXXX

# Run
cd backend
mvn clean install -DskipTests
mvn spring-boot:run
```

Seeded on startup: **admin/admin123** and **user1/user123** + 8 sample products.

### 2. Frontend

```bash
# Update RAZORPAY_KEY_ID in src/pages/CartPage.js (fallback only)
cd frontend
npm install
npm start
```

Frontend: `http://localhost:3000` | Backend: `http://localhost:8080`

---

## 📡 API Reference

### Auth
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login, get JWT |

### Products (Public)
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/products` | List active products (paginated) |
| GET | `/api/products?search=keyword` | Search products |
| GET | `/api/products/{id}` | Get single product |

### Admin – Products
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/admin/products` | All products incl. disabled |
| POST | `/api/admin/products` | Create product |
| PATCH | `/api/admin/products/{id}/price` | Update price |
| PATCH | `/api/admin/products/{id}/quantity` | Update quantity |
| PATCH | `/api/admin/products/{id}/toggle` | Enable / Disable |

### Cart (USER)
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/cart` | Get cart |
| POST | `/api/cart/items` | Add item |
| PUT | `/api/cart/items/{id}` | Update quantity |
| DELETE | `/api/cart/items/{id}` | Remove item |

### Orders & Payments
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/orders/create` | USER | Step 1 – create order + get Razorpay order ID |
| POST | `/api/orders/verify-payment` | USER | Step 2 – verify + process inventory |
| GET | `/api/orders` | USER | My orders |
| GET | `/api/orders/{id}` | USER | Order detail |
| POST | `/api/webhook/razorpay` | None | Razorpay webhook (payment.failed) |
| GET | `/api/admin/orders` | ADMIN | All orders |
| PATCH | `/api/admin/orders/{id}/status` | ADMIN | Update order status |

---

## 📨 Sample Requests

### Step 1 – Create Order
```http
POST /api/orders/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "shippingAddress": "123 MG Road, Pune, Maharashtra 411001"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": 5,
    "razorpayOrderId": "order_PXxxxxxxxxxxxxxx",
    "amount": 2598.00,
    "currency": "INR",
    "keyId": "rzp_test_xxxxxxxxxxxxxxxx"
  }
}
```

### Step 2 – Verify Payment (called by frontend after Razorpay success)
```http
POST /api/orders/verify-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpayOrderId": "order_PXxxxxxxxxxxxxxx",
  "razorpayPaymentId": "pay_PXxxxxxxxxxxxxxx",
  "razorpaySignature": "hmac_sha256_signature_here"
}
```

---

## 🏗️ Architecture Highlights

- **Layered**: Controller → Service → Repository, fully separated
- **DTO Pattern**: No JPA entities exposed in APIs
- **Transactional**: `@Transactional` on order creation and payment verification
- **HMAC-SHA256**: Razorpay signature verified server-side before inventory is touched
- **Auto-refund**: If any item is out of stock after payment, refund is issued via Razorpay API
- **Webhook**: `/api/webhook/razorpay` handles `payment.failed` events from Razorpay
- **PrimeIcons**: All frontend icons use PrimeIcons (no AI-generated images)
- **Global Exception Handler**: Structured JSON error responses for all error types
