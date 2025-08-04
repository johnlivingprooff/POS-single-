# Habicore POS System - Complete API Documentation

## Overview

The Habicore POS API is a RESTful API built with Node.js, Express, and TypeScript, using PostgreSQL with Prisma ORM. It provides comprehensive functionality for point-of-sale operations, inventory management, customer relationship management, and business analytics.

**Base URL**: `http://localhost:3001/api`  
**Authentication**: JWT Bearer tokens  
**Content-Type**: `application/json`

## Authentication

All endpoints except `/auth/login` and `/auth/register` require authentication via JWT tokens.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Auth Endpoints

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "admin|manager|employee",
    "permissions": ["array", "of", "permissions"]
  },
  "token": "jwt_token_string"
}
```

#### POST /auth/register
Register new user (requires existing admin user).

**Request Body:**
```json
{
  "name": "User Name",
  "email": "user@example.com", 
  "password": "password123",
  "role": "admin|manager|employee"
}
```

## Products Management

### GET /products
Retrieve products with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search in name, SKU, description
- `categoryId` (string): Filter by category
- `supplierId` (string): Filter by supplier

**Response:**
```json
{
  "products": [
    {
      "id": "string",
      "name": "string",
      "sku": "string",
      "description": "string",
      "price": "decimal",
      "costPrice": "decimal",
      "unitCost": "decimal",
      "stock": "number",
      "availableQuantities": "number",
      "reorderLevel": "number",
      "stockType": "raw_material|finished_good|other",
      "measurementType": "string",
      "measurementValue": "number",
      "pricingMethod": "markup|margin|fixed",
      "pricingOverride": "boolean",
      "isActive": "boolean",
      "category": {
        "id": "string",
        "name": "string"
      },
      "supplier": {
        "id": "string", 
        "name": "string"
      }
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number", 
    "total": "number",
    "pages": "number"
  }
}
```

### GET /products/:id
Get single product by ID.

### POST /products
Create new product.

**Request Body:**
```json
{
  "name": "Product Name",
  "sku": "PRODUCT-001",
  "description": "Product description", 
  "price": 29.99,
  "costPrice": 15.00,
  "stock": 50,
  "availableQuantities": 0,
  "unitCost": 0,
  "reorderLevel": 10,
  "categoryId": "category_id",
  "supplierId": "supplier_id",
  "stockType": "FINISHED_GOODS",
  "measurementType": null,
  "measurementValue": null,
  "pricingMethod": "MARKUP",
  "pricingOverride": null
}
```

**Notes:**
- `stockType`: "RAW_MATERIAL" or "FINISHED_GOODS"
- `measurementType`/`measurementValue`: Required for raw materials (e.g., "kg", "liters")
- `availableQuantities`: Tracks available units for raw materials
- `unitCost`: Cost per measurement unit for raw materials
- `pricingMethod`: "MARKUP" or "MARGIN" for pricing calculations
- `pricingOverride`: Custom price override if set

### PUT /products/:id
Update existing product.

### DELETE /products/:id
Delete product (if no sales history).

## Sales/POS System

### GET /sales
Retrieve sales with filtering and pagination.

**Query Parameters:**
- `page`, `limit`: Pagination
- `startDate`, `endDate`: Date range filter
- `customerId`: Filter by customer

**Role-Based Filtering:**
- **Employee**: Only sees their own sales records
- **Manager/Admin**: Sees all sales records

**Response:**
```json
{
  "sales": [
    {
      "id": "string",
      "saleNumber": "SALE-000001",
      "customerId": "string|null",
      "userId": "string",
      "subtotal": "decimal",
      "tax": "decimal", 
      "discount": "decimal",
      "total": "decimal",
      "paymentMethod": "cash|card|digital",
      "status": "completed|void|refunded",
      "createdAt": "datetime",
      "customer": { "name": "string" },
      "user": { "name": "string" },
      "items": [
        {
          "productId": "string",
          "quantity": "number",
          "unitPrice": "decimal",
          "total": "decimal",
          "product": {
            "name": "string",
            "category": { "name": "string" }
          }
        }
      ]
    }
  ]
}
```

### POST /sales
Create new sale (POS transaction).

**Request Body:**
```json
{
  "items": [
    {
      "productId": "product_id",
      "quantity": 2,
      "unitPrice": 15.99
    }
  ],
  "paymentMethod": "cash|card|digital",
  "customerId": "customer_id_optional",
  "discount": 5.0,
  "tax": 8.5,
  "notes": "Optional notes"
}
```

**Features:**
- Automatic stock updates
- Sale number generation
- Input validation
- Stock availability checking
- Transaction integrity

### GET /sales/stats/summary
Get sales statistics.

**Query Parameters:**
- `period`: "today|week|month|year"

**Response:**
```json
{
  "period": "today",
  "totalSales": "number",
  "totalRevenue": "decimal", 
  "topProducts": [
    {
      "product": { "name": "string" },
      "quantitySold": "number",
      "revenue": "decimal"
    }
  ]
}
```

## Customer Management

### GET /customers
Retrieve customers with search and pagination.

**Query Parameters:**
- `page`, `limit`: Pagination
- `search`: Search in name, email, phone

### GET /customers/:id
Get customer details with sales history.

### POST /customers
Create new customer.

**Request Body:**
```json
{
  "name": "Customer Name",
  "email": "email@example.com",
  "phone": "+1-555-1234", 
  "address": "123 Main St"
}
```

### PUT /customers/:id
Update customer information.

### DELETE /customers/:id
Delete customer (if no sales history).

## Inventory Management

### GET /inventory
Same as GET /products but with inventory focus.

### GET /inventory/stats
Get inventory statistics.

**Response:**
```json
{
  "totalProducts": "number",
  "lowStockProducts": "number",
  "outOfStockProducts": "number", 
  "totalCategories": "number",
  "totalUnits": "number",
  "totalInventoryValue": "decimal"
}
```

### GET /inventory/alerts/low-stock
Get products below reorder level.

**Query Parameters:**
- `threshold` (number): Stock threshold (default: 10)

### PUT /inventory/:id/stock
Update product stock level.

**Request Body:**
```json
{
  "stock": 25,
  "reason": "Manual adjustment"
}
```

### PUT /inventory/bulk-stock
Update multiple products' stock levels.

**Request Body:**
```json
{
  "updates": [
    {
      "productId": "product_id",
      "stock": 30
    }
  ],
  "reason": "Bulk inventory update"
}
```

### GET /inventory/reports/stock
Generate stock reports.

**Query Parameters:**
- `format`: "summary|detailed"
- `categoryId`: Filter by category

## User Management (Admin Only)

### GET /users
Get all users (admin only).

**Query Parameters:**
- `page`, `limit`: Pagination
- `search`: Search by name or email

**Response:**
```json
{
  "users": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "admin|manager|employee",
      "permissions": ["array", "of", "permissions"],
      "isActive": boolean,
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ],
  "totalPages": number,
  "currentPage": number,
  "total": number
}
```

### GET /users/:id
Get user details.

### POST /users
Create new user (admin only) - Enhanced user onboarding.

**Request Body:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123",
  "role": "admin|manager|employee",
  "permissions": ["array", "of", "permissions"]
}
```

**Default Permissions by Role:**
- **Admin**: `["all"]`
- **Manager**: `["pos", "inventory", "reports", "customers", "manufacturing"]`
- **Employee**: `["pos"]`

**Response:**
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "permissions": ["array"],
    "isActive": true,
    "createdAt": "ISO date"
  }
}
```

### PUT /users/:id
Update user (admin or own profile).

### PUT /users/:id/password
Change user password.

**Request Body:**
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

### DELETE /users/:id
Delete user (admin only, no sales history).

## Reports & Analytics

### GET /reports/sales
Generate sales reports.

**Query Parameters:**
- `period`: "today|week|month|year"
- `startDate`, `endDate`: Custom date range

**Role-Based Filtering:**
- **Employee**: Reports include only their own sales data
- **Manager/Admin**: Reports include all sales data

**Response:**
```json
{
  "period": "month",
  "summary": {
    "totalSales": "number",
    "totalRevenue": "decimal",
    "averageSale": "decimal"
  },
  "topProducts": "array",
  "paymentMethods": "array"
}
```

### GET /reports/inventory
Generate inventory reports.

**Response:**
```json
{
  "summary": {
    "totalProducts": "number", 
    "totalStock": "number",
    "totalValue": "decimal"
  },
  "lowStockProducts": "array",
  "categoryBreakdown": "array"
}
```

### GET /reports/customers
Generate customer analytics.

**Response:**
```json
{
  "summary": {
    "totalCustomers": "number",
    "newCustomersThisMonth": "number"
  },
  "topCustomers": "array",
  "newCustomers": "array"
}
```

### GET /reports/financial
Generate financial reports.

**Query Parameters:**
- `period`: "today|week|month|year"

**Role-Based Filtering:**
- **Employee**: Financial data includes only their own sales
- **Manager/Admin**: Financial data includes all sales

### GET /reports/sales/analytics
Generate detailed sales analytics.

**Query Parameters:**
- `period`: "today|week|month|year"
- `startDate`, `endDate`: Custom date range
- `categoryId`, `customerId`, `paymentMethod`, `productId`: Additional filters

**Role-Based Filtering:**
- **Employee**: Analytics include only their own sales data
- **Manager/Admin**: Analytics include all sales data

### GET /reports/sales/export/excel
Export sales data to Excel format.

**Query Parameters:**
- `period`: "today|week|month|year"
- `startDate`, `endDate`: Custom date range

**Role-Based Filtering:**
- **Employee**: Export includes only their own sales data
- **Manager/Admin**: Export includes all sales data

## Manufacturing Module

### GET /manufacturing
Get manufacturing overview.

### GET /manufacturing/reorder-alerts
Get products needing reorder or production.

### PUT /manufacturing/reorder-levels
Update reorder levels for products.

**Request Body:**
```json
{
  "updates": [
    {
      "productId": "product_id",
      "reorderLevel": 15
    }
  ]
}
```

### GET /manufacturing/production-report
Get production demand analysis.

**Query Parameters:**
- `period`: "week|month|quarter"

### GET /manufacturing/supplier-analysis
Get supplier analysis for manufacturing planning.

### Bill of Materials (BOM) Management

### GET /manufacturing/bom
Get all Bill of Materials.

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "finishedGoodId": "string",
    "finishedGood": {
      "name": "string",
      "sku": "string"
    },
    "outputQuantity": "number",
    "items": [
      {
        "id": "string",
        "rawMaterialId": "string",
        "rawMaterial": {
          "name": "string",
          "sku": "string",
          "measurementType": "string",
          "unitCost": "number"
        },
        "quantity": "number"
      }
    ],
    "totalCost": "number",
    "costPerUnit": "number"
  }
]
```

### POST /manufacturing/bom
Create new Bill of Materials.

**Request Body:**
```json
{
  "name": "BOM Name",
  "finishedGoodId": "product_id",
  "outputQuantity": 1,
  "items": [
    {
      "rawMaterialId": "raw_material_id",
      "quantity": 5.5
    }
  ]
}
```

### GET /manufacturing/bom/:id
Get specific BOM by ID.

### PUT /manufacturing/bom/:id
Update existing BOM.

### DELETE /manufacturing/bom/:id
Delete BOM (if no production orders exist).

### GET /manufacturing/bom/:id/price
Calculate BOM pricing with markup/margin.

**Query Parameters:**
- `markup`: Markup percentage (e.g., 25 for 25%)
- `margin`: Margin percentage (e.g., 20 for 20%)

**Response:**
```json
{
  "totalCost": 15.75,
  "costPerUnit": 15.75,
  "markupPrice": 19.69,
  "marginPrice": 19.69,
  "breakdownByItem": [
    {
      "rawMaterial": "Material Name",
      "quantity": 5.5,
      "unitCost": 2.5,
      "totalCost": 13.75
    }
  ]
}
```

### Production Orders

### GET /manufacturing/orders
Get all production orders.

**Query Parameters:**
- `status`: "pending|in_progress|completed|cancelled"

**Response:**
```json
[
  {
    "id": "string",
    "bomId": "string",
    "bom": {
      "name": "string",
      "finishedGood": {
        "name": "string",
        "sku": "string"
      }
    },
    "quantity": "number",
    "status": "pending|in_progress|completed|cancelled",
    "startDate": "ISO date",
    "completedDate": "ISO date",
    "notes": "string"
  }
]
```

### POST /manufacturing/orders
Create new production order.

**Request Body:**
```json
{
  "bomId": "bom_id",
  "quantity": 10,
  "notes": "Production notes"
}
```

### GET /manufacturing/orders/:id
Get specific production order.

### PUT /manufacturing/orders/:id
Update production order.

### POST /manufacturing/orders/:id/complete
Complete production order and update inventory.

**Request Body:**
```json
{
  "actualQuantity": 10,
  "notes": "Completion notes"
}
```

## Off-Site Inventory Management

### GET /offsite/requisitions
Get all off-site requisitions (filtered by user role).

**Query Parameters:**
- `status`: "pending|approved|rejected|dispatched"
- `requesterId`: User ID (optional)

**Role-Based Filtering:**
- **Employee**: Only sees their own requisitions
- **Manager/Admin**: Sees all requisitions

**Response:**
```json
[
  {
    "id": "string",
    "destination": "string",
    "purpose": "string",
    "status": "pending|approved|rejected|dispatched",
    "requestDate": "ISO date",
    "approvedAt": "ISO date",
    "requester": {
      "id": "string",
      "name": "string",
      "email": "string"
    },
    "items": [
      {
        "id": "string",
        "productId": "string",
        "quantity": number,
        "product": {
          "id": "string",
          "name": "string",
          "sku": "string",
          "stockType": "string"
        }
      }
    ],
    "returns": []
  }
]
```

### POST /offsite/requisitions
Create new off-site requisition.

**Request Body:**
```json
{
  "destination": "string",
  "purpose": "string",
  "items": [
    {
      "productId": "string",
      "quantityOut": number
    }
  ]
}
```

### PUT /offsite/requisitions/:id
Update requisition (only pending requisitions by owner or admin/manager).

**Request Body:**
```json
{
  "destination": "string",
  "purpose": "string"
}
```

### PATCH /offsite/requisitions/:id/approve
Approve requisition (admin/manager only).

**Response:**
```json
{
  "id": "string",
  "status": "approved",
  "approvedBy": "string",
  "approvedAt": "ISO date"
}
```

### PATCH /offsite/requisitions/:id/reject
Reject requisition (admin/manager only).

**Response:**
```json
{
  "id": "string",
  "status": "rejected",
  "approvedBy": "string",
  "approvedAt": "ISO date"
}
```

### POST /offsite/returns
Create return for requisition.

**Request Body:**
```json
{
  "requisitionId": "string",
  "returnDate": "ISO date",
  "items": [
    {
      "productId": "string",
      "quantityReturned": number
    }
  ]
}
```

### GET /offsite/summary
Get off-site inventory summary.

**Response:**
```json
{
  "totalRequisitions": number,
  "pendingRequisitions": number,
  "activeRequisitions": number,
  "totalReturns": number
}
```

## Sudo Administration Module

### POST /sudo/login
Authenticate sudo administrator.

**Request Body:**
```json
{
  "email": "sudo@habicore.com",
  "password": "sudo_password"
}
```

**Response:**
```json
{
  "token": "jwt_token",
  "user": {
    "id": "sudo_user_id",
    "email": "sudo@habicore.com",
    "name": "Sudo Administrator",
    "role": "sudo_admin"
  }
}
```

### GET /sudo/organizations
Get all organizations (sudo only).

**Response:**
```json
[
  {
    "id": "org_id",
    "name": "Organization Name",
    "slug": "org-slug",
    "domain": "custom.domain.com",
    "subscriptionPlan": "premium",
    "isActive": true,
    "maxUsers": 20,
    "userCount": 8,
    "createdAt": "ISO date",
    "lastActive": "ISO date",
    "features": {
      "pos": true,
      "inventory": true,
      "manufacturing": true,
      "offsite": true,
      "crm": true,
      "reports": true,
      "users": true
    }
  }
]
```

### POST /sudo/organizations
Create new organization (sudo only).

**Request Body:**
```json
{
  "name": "Organization Name",
  "slug": "org-slug",
  "domain": "custom.domain.com",
  "subscriptionPlan": "premium",
  "maxUsers": 20
}
```

### PUT /sudo/organizations/:id/features
Update organization features (sudo only).

**Request Body:**
```json
{
  "features": {
    "pos": true,
    "inventory": true,
    "manufacturing": false,
    "offsite": false,
    "crm": true,
    "reports": true,
    "users": true
  }
}
```

### GET /sudo/analytics
Get system analytics (sudo only).

**Response:**
```json
{
  "totalOrganizations": 3,
  "activeOrganizations": 3,
  "totalUsers": 56,
  "activeUsers": 52,
  "subscriptionBreakdown": {
    "trial": 0,
    "basic": 1,
    "premium": 1,
    "enterprise": 1
  },
  "monthlyRevenue": 2850.00,
  "growth": {
    "organizations": 15.2,
    "users": 8.7,
    "revenue": 12.3
  },
  "featureUsage": {
    "pos": 100,
    "inventory": 100,
    "manufacturing": 66.7,
    "offsite": 66.7,
    "crm": 100,
    "reports": 100,
    "users": 100
  }
}
```

### GET /sudo/subscription-plans
Get available subscription plans (sudo only).

**Response:**
```json
[
  {
    "id": "premium",
    "name": "Premium",
    "price": 79.99,
    "currency": "USD",
    "billingCycle": "monthly",
    "maxUsers": 20,
    "features": {
      "pos": true,
      "inventory": true,
      "manufacturing": true,
      "offsite": true,
      "crm": true,
      "reports": true,
      "users": true
    },
    "limitations": {
      "maxProducts": 2000,
      "maxTransactions": 10000
    }
  }
]
```

## Currency Management

### GET /settings/currency
Get current system currency.

**Response:**
```json
{
  "currency": "USD",
  "currencyName": "US Dollar",
  "currencySymbol": "$"
}
```

### PUT /settings/currency
Update system currency.

**Request Body:**
```json
{
  "currency": "NGN"
}
```

**Response:**
```json
{
  "currency": "NGN",
  "currencyName": "Nigerian Naira",
  "currencySymbol": "₦",
  "message": "Currency updated successfully"
}
```

### GET /settings/currencies
Get all supported currencies.

**Response:**
```json
[
  {
    "code": "USD",
    "name": "US Dollar",
    "symbol": "$",
    "country": "United States",
    "region": "global",
    "decimals": 2
  },
  {
    "code": "NGN",
    "name": "Nigerian Naira",
    "symbol": "₦",
    "country": "Nigeria",
    "region": "africa",
    "decimals": 2
  }
]
```

## Error Handling

All endpoints return structured error responses:

**400 Bad Request:**
```json
{
  "errors": [
    {
      "type": "field",
      "msg": "Validation error message",
      "path": "field_name"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "error": "Invalid token or credentials"
}
```

**403 Forbidden:**
```json
{
  "error": "Access denied. Insufficient permissions."
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

## Data Models

### User
- `id`: Unique identifier
- `name`: Full name
- `email`: Unique email address
- `role`: admin|manager|employee
- `permissions`: Array of permission strings
- `isActive`: Boolean status

### Product
- `id`: Unique identifier
- `name`: Product name
- `sku`: Stock keeping unit (unique)
- `description`: Product description (optional)
- `price`: Selling price
- `costPrice`: Cost price for finished goods
- `stock`: Current stock level (pack count for raw materials)
- `availableQuantities`: Available units for raw materials
- `unitCost`: Cost per measurement unit for raw materials
- `reorderLevel`: Minimum stock threshold
- `stockType`: RAW_MATERIAL or FINISHED_GOODS
- `measurementType`: Unit of measurement for raw materials (kg, liters, etc.)
- `measurementValue`: Quantity per pack for raw materials
- `pricingMethod`: MARKUP or MARGIN for pricing calculations
- `pricingOverride`: Custom price override (optional)
- `categoryId`: Foreign key to category
- `supplierId`: Foreign key to supplier
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Sale
- `id`: Unique identifier
- `saleNumber`: Human-readable sale number
- `customerId`: Foreign key to customer (optional)
- `userId`: Foreign key to user
- `subtotal`: Subtotal amount
- `tax`: Tax amount
- `discount`: Discount percentage
- `total`: Final total amount
- `paymentMethod`: Payment method used
- `status`: Transaction status

### Customer
- `id`: Unique identifier
- `name`: Customer name
- `email`: Email address (optional)
- `phone`: Phone number (optional)
- `address`: Physical address (optional)
- `loyaltyPoints`: Loyalty points balance

### OffSiteRequisition
- `id`: Unique identifier
- `destination`: Destination location
- `purpose`: Purpose of requisition (optional)
- `status`: pending|approved|rejected|dispatched
- `requestDate`: Date of request
- `approvedAt`: Date of approval (if approved)
- `requesterId`: Foreign key to requesting user
- `approvedBy`: Foreign key to approving user

### OffSiteRequisitionItem
- `id`: Unique identifier
- `requisitionId`: Foreign key to requisition
- `productId`: Foreign key to product
- `quantity`: Quantity requested

### OffSiteReturn
- `id`: Unique identifier
- `requisitionId`: Foreign key to original requisition
- `returnDate`: Date of return
- `createdAt`: Timestamp of return creation

### OffSiteReturnItem
- `id`: Unique identifier
- `returnId`: Foreign key to return
- `productId`: Foreign key to product
- `quantityReturned`: Quantity returned

### BOM (Bill of Materials)
- `id`: Unique identifier
- `name`: BOM name/description
- `finishedGoodId`: Foreign key to finished product
- `outputQuantity`: Quantity of finished goods produced
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### BOMItem
- `id`: Unique identifier
- `bomId`: Foreign key to BOM
- `rawMaterialId`: Foreign key to raw material product
- `quantity`: Quantity of raw material required
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### ProductionOrder
- `id`: Unique identifier
- `bomId`: Foreign key to BOM
- `quantity`: Quantity to produce
- `status`: pending|in_progress|completed|cancelled
- `startDate`: Production start date
- `completedDate`: Production completion date (if completed)
- `notes`: Production notes
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Organization
- `id`: Unique identifier
- `name`: Organization name
- `slug`: URL-friendly identifier
- `domain`: Custom domain (optional)
- `subscriptionPlan`: trial|basic|premium|enterprise
- `isActive`: Boolean status
- `maxUsers`: Maximum allowed users
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Subscription
- `id`: Unique identifier
- `organizationId`: Foreign key to organization
- `planName`: Subscription plan name
- `status`: active|cancelled|expired|suspended
- `startDate`: Subscription start date
- `endDate`: Subscription end date (if applicable)
- `billingCycle`: monthly|yearly
- `amount`: Subscription price
- `currency`: Billing currency
- `isActive`: Boolean status
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### FeatureToggle
- `id`: Unique identifier
- `organizationId`: Foreign key to organization
- `featureKey`: Feature identifier (pos, inventory, etc.)
- `isEnabled`: Boolean status
- `limitations`: JSON object for feature limits
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### SudoUser
- `id`: Unique identifier
- `email`: Unique email address
- `password`: Hashed password
- `name`: Full name
- `role`: sudo_admin only
- `isActive`: Boolean status
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

## Rate Limiting

- Most endpoints: 100 requests per 15 minutes
- Authentication endpoints: 5 requests per 15 minutes

## Pagination

List endpoints support pagination:
- `page`: Page number (1-based)
- `limit`: Items per page (max 100)
- Response includes pagination metadata

## Data Validation

All input is validated using express-validator:
- Email format validation
- Required field checking
- Data type validation
- Business rule validation

---

**API Version**: 1.0  
**Last Updated**: July 23, 2025  
**Documentation Status**: Complete for Phase 1
