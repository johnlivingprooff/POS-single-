# Habicore POS API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication

All API endpoints (except auth) require Bearer token authentication.

### Headers
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

## Authentication Endpoints

### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "manager@habicore.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "1",
    "email": "manager@habicore.com",
    "name": "Store Manager",
    "role": "manager",
    "permissions": ["pos", "inventory", "reports", "customers"]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/register
Register a new user (admin only).

**Request Body:**
```json
{
  "email": "newuser@habicore.com",
  "password": "securepassword",
  "name": "New Employee",
  "role": "employee"
}
```

## Product Management

### GET /products
Get all products with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search term
- `category` (optional): Category filter

**Response:**
```json
{
  "products": [
    {
      "id": "1",
      "name": "Coffee Beans 1kg",
      "sku": "CB001",
      "price": 24.99,
      "stock": 45,
      "category": "Coffee",
      "supplier": "Bean Co",
      "reorderLevel": 10,
      "description": "Premium coffee beans",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

### GET /products/:id
Get a specific product by ID.

**Response:**
```json
{
  "id": "1",
  "name": "Coffee Beans 1kg",
  "sku": "CB001",
  "price": 24.99,
  "stock": 45,
  "category": "Coffee",
  "supplier": "Bean Co",
  "reorderLevel": 10,
  "description": "Premium coffee beans",
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z"
}
```

### POST /products
Create a new product.

**Request Body:**
```json
{
  "name": "New Product",
  "sku": "NP001",
  "price": 19.99,
  "costPrice": 10.00,
  "stock": 100,
  "reorderLevel": 20,
  "category": "General",
  "supplier": "Supplier Co",
  "description": "Product description"
}
```

### PUT /products/:id
Update an existing product.

**Request Body:** Same as POST /products

### DELETE /products/:id
Delete a product.

**Response:** `204 No Content`

## Sales Management

### GET /sales
Get all sales transactions.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `customerId` (optional): Filter by customer

**Response:**
```json
{
  "sales": [
    {
      "id": "1",
      "saleNumber": "SALE-2023-001",
      "customerId": "1",
      "customer": {
        "id": "1",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "userId": "1",
      "user": {
        "id": "1",
        "name": "Store Manager"
      },
      "subtotal": 49.98,
      "tax": 4.50,
      "discount": 0.00,
      "total": 54.48,
      "paymentMethod": "credit_card",
      "status": "completed",
      "items": [
        {
          "id": "1",
          "productId": "1",
          "product": {
            "id": "1",
            "name": "Coffee Beans 1kg",
            "sku": "CB001"
          },
          "quantity": 2,
          "unitPrice": 24.99,
          "total": 49.98
        }
      ],
      "createdAt": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

### POST /sales
Create a new sale.

**Request Body:**
```json
{
  "customerId": "1",
  "items": [
    {
      "productId": "1",
      "quantity": 2,
      "unitPrice": 24.99
    }
  ],
  "paymentMethod": "credit_card",
  "tax": 4.50,
  "discount": 0.00,
  "notes": "Customer paid with Visa"
}
```

### GET /sales/:id
Get a specific sale by ID.

### PUT /sales/:id/void
Void a sale transaction.

### PUT /sales/:id/refund
Process a refund for a sale.

## Customer Management

### GET /customers
Get all customers.

**Response:**
```json
{
  "customers": [
    {
      "id": "1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "address": "123 Main St, City, State",
      "loyaltyPoints": 150,
      "totalPurchases": 1250.00,
      "lastVisit": "2023-01-01T00:00:00Z",
      "createdAt": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

### POST /customers
Create a new customer.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "address": "456 Oak Ave, City, State"
}
```

### GET /customers/:id
Get a specific customer by ID.

### PUT /customers/:id
Update customer information.

### DELETE /customers/:id
Delete a customer.

## Inventory Management

### GET /inventory/low-stock
Get products with low stock levels.

**Response:**
```json
{
  "products": [
    {
      "id": "2",
      "name": "Espresso Machine",
      "sku": "EM001",
      "stock": 3,
      "reorderLevel": 5,
      "status": "low"
    }
  ],
  "total": 1
}
```

### POST /inventory/adjustment
Adjust inventory levels.

**Request Body:**
```json
{
  "productId": "1",
  "quantity": 10,
  "type": "stock_in",
  "reason": "New shipment received",
  "reference": "PO-2023-001"
}
```

### GET /inventory/movements
Get inventory movement history.

**Response:**
```json
{
  "movements": [
    {
      "id": "1",
      "productId": "1",
      "product": {
        "name": "Coffee Beans 1kg",
        "sku": "CB001"
      },
      "type": "stock_in",
      "quantity": 50,
      "previousStock": 0,
      "newStock": 50,
      "reason": "Initial stock",
      "createdAt": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

## Reports

### GET /reports/sales-summary
Get sales summary report.

**Query Parameters:**
- `startDate`: Start date (required)
- `endDate`: End date (required)
- `groupBy`: Group by 'day', 'week', 'month' (optional)

**Response:**
```json
{
  "summary": {
    "totalSales": 1250.00,
    "totalTransactions": 25,
    "averageTransactionValue": 50.00,
    "taxCollected": 112.50,
    "discountsGiven": 25.00
  },
  "dailyBreakdown": [
    {
      "date": "2023-01-01",
      "sales": 250.00,
      "transactions": 5
    }
  ]
}
```

### GET /reports/inventory-report
Get inventory status report.

**Response:**
```json
{
  "summary": {
    "totalProducts": 100,
    "totalValue": 12500.00,
    "lowStockItems": 8,
    "outOfStockItems": 2
  },
  "categories": [
    {
      "name": "Coffee",
      "productCount": 25,
      "totalValue": 5000.00
    }
  ]
}
```

### GET /reports/financial-report
Get financial report (P&L).

**Query Parameters:**
- `startDate`: Start date (required)
- `endDate`: End date (required)

**Response:**
```json
{
  "period": {
    "startDate": "2023-01-01",
    "endDate": "2023-01-31"
  },
  "revenue": {
    "totalSales": 12500.00,
    "returnsRefunds": -250.00,
    "netRevenue": 12250.00
  },
  "expenses": {
    "costOfGoodsSold": 6000.00,
    "operatingExpenses": 2000.00,
    "totalExpenses": 8000.00
  },
  "profit": {
    "grossProfit": 6250.00,
    "netProfit": 4250.00,
    "grossMargin": 51.02,
    "netMargin": 34.69
  }
}
```

## User Management

### GET /users
Get all users (admin only).

**Response:**
```json
{
  "users": [
    {
      "id": "1",
      "email": "admin@habicore.com",
      "name": "System Administrator",
      "role": "admin",
      "permissions": ["all"],
      "isActive": true,
      "createdAt": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

### POST /users
Create a new user (admin only).

### PUT /users/:id
Update user information.

### DELETE /users/:id
Deactivate a user.

## Manufacturing

### GET /manufacturing/orders
Get manufacturing orders.

### POST /manufacturing/orders
Create a new manufacturing order.

### GET /manufacturing/orders/:id
Get manufacturing order details.

### PUT /manufacturing/orders/:id/start
Start a manufacturing order.

### PUT /manufacturing/orders/:id/complete
Complete a manufacturing order.

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": ["Email is required", "Password must be at least 6 characters"]
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Something went wrong"
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Pagination

List endpoints support pagination:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Response includes:
- `total`: Total number of items
- `page`: Current page
- `totalPages`: Total number of pages

## WebSocket Events (Future Implementation)

For real-time features:
- `inventory.updated`: Inventory level changes
- `sale.created`: New sale transaction
- `user.activity`: User activity updates

## Testing

Use the provided Postman collection or curl commands:

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@habicore.com","password":"password123"}'

# Get products (with token)
curl -X GET http://localhost:3001/api/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
