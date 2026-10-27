<!--  --># tech-titans
Vaulto - Inventory & Order Management System

A web-based inventory tracking and point-of-sale (POS) platform featuring Role-Based Access Control (RBAC) for Admins and Staff.

Overview

Vaulto simplifies daily business operations by unifying product inventory management, sales tracking, point-of-sale execution, supplier contacts, and system audit logs into a single responsive platform.

System Features & Modules

Admin Features:

1. Admin Dashboard: Real-time metrics tracking Total Sales, Total Orders, Total Products, and Low Stock Alerts. Includes 7-day sales line charts, stock status breakdown, products by category, top-selling products, and recent orders.

2. User Management: Create, search, filter, edit, and delete user accounts across Admin and Staff roles with automated registration metrics.

3. Activity Logs: Audit trail logging user actions (Logins, Logouts, Completed Sales, New Account Creations) with timestamps and user emails for security tracking.

User / Staff Features:

1. All Products Management: Add, edit, delete, search, and filter inventory items by category with visual stock indicators and unit pricing.

2. Category Control: Organize items into custom categories with item count tracking.

3. POS / Sales Terminal: Search items, build cart totals, compute cash transactions, and process live sales.

4. Sold Inventory: Historical record of completed orders with void transaction capabilities.

5. Memos & Tasks: Priority-based task logger (High, Normal, Low) for shop alerts.

6. Contacts Registry: Directory for managing supplier and customer details.

7. Settings & Business Config: Customizable store branding, currency options (Philippine Peso PHP), low stock alert thresholds, and alert preferences.

Tech Stack & Architecture:

1. Frontend: React / Next.js, Tailwind CSS

2. Backend: Node.js / Express

3. Database: PostgreSQL / MySQL (handled via ORM migrations and seeders)

Authentication: Role-Based Access Control (RBAC - Admin vs. Staff)

Database Schema Structure

The system database is structured across the following core tables:

users: Manages user credentials, roles (Admin / Staff), profile information, and notification settings.

products: Stores product details including SKU (#INV-9001), title, category, image path, unit price, and stock levels.

categories: Organizes product listings and descriptions.

orders & order_items: Tracks completed sales transactions, prices, quantities, and timestamps.

contacts: Stores external party information tagged as Supplier or Customer.

memos: Contains operational reminders tagged with priority levels (High, Normal, Low).

activity_logs: Logs system events (Login, Logout, Sale, New account) associated with specific users.

Getting Started & Local Setup

Prerequisites:

Node.js (v18.0 or higher)

Git

Database Instance (PostgreSQL or MySQL)

Step 1: Clone Repository
git clone https://github.com/your-username/vaulto.git
cd vaulto

Step 2: Install Dependencies
npm install

Step 3: Configure Environment Variables
Create a .env file in the root directory:
PORT=5173
DATABASE_URL=postgresql://user:password@localhost:5432/vaulto
JWT_SECRET=your_secret_key

Step 4: Run Migrations & Seeders
npm run db:migrate
npm run db:seed

Step 5: Launch Application
cd frontend
npm run dev
Open http://localhost:5173 in your web browser.
