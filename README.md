# Stock Management API - Neon PostgreSQL

Node.js + Express + Neon PostgreSQL backend for inventory, sales, purchases,
expenses and profit/loss.

## Setup

### 1. Get Neon connection string

Neon Dashboard -> Project -> Connect -> Connection string.

It looks like:

postgresql://username:password@ep-example.region.aws.neon.tech/neondb?sslmode=require

### 2. Edit .env

Replace the placeholder DATABASE_URL with your real Neon connection string.

Do not commit .env to GitHub.

### 3. Install

npm install

### 4. Run database migration

npm run migrate

Do NOT run CREATE DATABASE because Neon already provides the database.

### 5. Start

npm run dev

### 6. Test

Open:

http://localhost:5000/api/v1/health

## Main API

POST /api/v1/auth/register
POST /api/v1/auth/login

GET  /api/v1/products
POST /api/v1/products
GET  /api/v1/products/:id

POST /api/v1/purchases

POST /api/v1/sales
GET  /api/v1/sales

POST /api/v1/expenses
GET  /api/v1/expenses

GET /api/v1/reports/dashboard
GET /api/v1/reports/profit-loss

Protected routes use:

Authorization: Bearer YOUR_TOKEN

## Example registration

{
  "name": "Alex",
  "email": "alex@example.com",
  "password": "password123",
  "businessName": "Alex Store"
}

## Example product

{
  "name": "Coca Cola 500ml",
  "sku": "CC500",
  "buyingPrice": 500,
  "sellingPrice": 700,
  "minimumStock": 10,
  "unit": "piece"
}

## Example purchase

{
  "supplierName": "Supplier A",
  "reference": "INV-001",
  "items": [
    {
      "productId": 1,
      "quantity": 100,
      "buyingPrice": 500
    }
  ]
}

## Example sale

{
  "customerName": "Customer",
  "items": [
    {
      "productId": 1,
      "quantity": 10
    }
  ]
}

A sale checks stock, reduces inventory, records stock movement, and calculates
revenue, cost and gross profit inside one PostgreSQL transaction.

## Example expense

{
  "category": "Transport",
  "description": "Delivery",
  "amount": 5000
}

## Calculations

Gross profit = Revenue - Cost of Goods Sold

Net profit = Gross Profit - Expenses

The buying price is stored in each sale item at the time of sale so historical
profit remains correct even when the current product buying price changes.

## Tables

users
businesses
categories
products
purchases
purchase_items
sales
sale_items
stock_movements
expenses
