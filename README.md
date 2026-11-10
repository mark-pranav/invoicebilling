# Invoice & Billing Management System

Simple MERN billing app for small shops and businesses in India.

## Features

- Dashboard with sales / paid / pending summaries
- Shop profile settings (including GSTIN and logo)
- Customer and product management
- Invoice creation with GST (CGST+SGST / IGST) or non-GST bills
- PDF download and print
- Invoice history with search and filters

## Tech Stack

- Frontend: React + Vite + Tailwind CSS + Axios + jsPDF
- Backend: Node.js + Express
- Database: MongoDB + Mongoose

## Prerequisites

- Node.js 18+
- MongoDB running locally (default: `mongodb://127.0.0.1:27017/invoice_billing`)

## Setup

```bash
# Backend
cd backend
copy .env.example .env
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

- API: http://localhost:5000
- App: http://localhost:5173

## Deploy to Render

This repository includes a Render Blueprint (`render.yaml`) that deploys the
frontend and API together as one web service. In Render, create a new Blueprint
from the repository and provide `MONGODB_URI` when prompted. Use a persistent
MongoDB service such as MongoDB Atlas; Render's ephemeral filesystem and the
app's in-memory fallback are not suitable for production data.

The Blueprint sets `NODE_ENV=production` and `USE_MEMORY_DB=false`, and Render
provides `PORT` automatically. The frontend calls `/api` on the same host, so
no `VITE_API_URL` setting is needed. For a manual Web Service setup, use:

- **Build command:** `npm run install:all && npm run build --prefix frontend`
- **Start command:** `npm start --prefix backend`
- **Environment variables:** `MONGODB_URI` (your MongoDB connection string),
  `USE_MEMORY_DB=false`, and `NODE_ENV=production`

## First-time usage

1. Open **Shop Settings** and set business name + state (required for correct GST).
2. Optionally add customers and products.
3. Create an invoice from **Create Invoice**.
4. Download or print the PDF from the invoice view page.

## API Overview

- `GET/POST /api/customers`
- `GET/POST /api/products`
- `GET/POST /api/invoices`
- `GET /api/dashboard/summary`
- `GET/PUT /api/settings`
