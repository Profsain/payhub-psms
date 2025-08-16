# PayHub PSMS

### PayHub is a SaaS-based web application that automates payslip management for institutions. It enables institutions to manage staff records, upload bulk payslip PDFs, automatically split them per staff member, and provide secure access for staff to view and download their pay history.

The platform is designed to support multiple institutions (multi-tenant architecture) with subscription-based access. Each institution has an admin dashboard while PayHub Super Admins can manage system-wide settings, subscriptions, and analytics.

## 2. Goals and Objectives
Enable institutions to manage staff payroll digitally.

Automate the splitting and assignment of payslips to staff.

Allow staff to access historical payslips securely.

Provide robust search, filter, and notification features.

Provide Super Admin with oversight of the entire SaaS platform.

## 3. Key Features

### A. Institution Admin Portal
Register/Login institution account

Upload staff data using .csv file:

Fields: Staff ID, Full Name, Email, Phone, Department, Password

Upload bulk payslip .pdf file

System auto-splits into individual staff payslips based on Staff ID

View payslip upload history

Manage staff list and access

Reset staff passwords

Subscription billing view and renewal

### B. Staff Portal
Login using Staff ID and password

View list of all payslips

View/download payslip PDF

Filter payslips by date (Month/Year)

Search by date, amount, or type

Notification when a new payslip is uploaded

### C. SaaS Super Admin Dashboard
Dashboard analytics: Total institutions, staff, payslips

Institution management:

Approve, suspend, or delete institutions

View usage data and subscription status

Manage subscription plans (Free, Basic, Premium)

View system activity logs

Monitor failed uploads and split errors

### 4. Functional Requirements

### 4.1 User Roles
Staff User: Views own payslips

Institution Admin: Manages staff and uploads payslips

SaaS Super Admin: Oversees platform-wide operations

### 4.2 User Authentication
JWT-based session authentication

Password hashing using bcrypt

Password reset via email

### 4.3 File Upload Handling
CSV file parsing for staff creation

PDF splitting via Staff ID headers using a PDF processing library (e.g., PyPDF2 or pdf-lib)

Assign split PDFs to matching staff accounts

### 4.4 Storage & Data Management
Staff PDFs stored in {institution}/{staffID}/{month-year}.pdf

Store metadata: staffID, month, gross, net, upload date

Cloud storage (e.g., AWS S3 or Firebase)

### 4.5 Notifications
Email alerts to staff on new payslip upload

In-app notification center

### 5. Non-Functional Requirements
Security:

SSL encryption

Secure file handling

Role-based access control

Scalability:

Multi-tenant support

Efficient file parsing and storage

Performance:

Fast search/filter on payslip data

Background processing for PDF splitting

Usability:

Mobile responsive design

Minimal learning curve for Admins and Staff

### 6. Technology Stack
Layer	Technology
Frontend	React.js, TailwindCSS
Backend API	Node.js (Express) or Django REST
Database	PostgreSQL or MongoDB
File Storage	AWS S3 / Firebase
PDF Processing	pdf-lib / PyPDF2
Auth	JWT + bcrypt
Payment Gateway	Stripe or Flutterwave
DevOps	Docker, GitHub Actions, Railway

### 7. API Endpoints (Sample)
Method	Endpoint	Description
POST	/api/admin/upload-csv	Upload CSV staff list
POST	/api/admin/upload-payslip	Upload bulk PDF and auto-split
GET	/api/staff/payslips	List staff payslips
POST	/api/staff/login	Staff login
POST	/api/institution/subscribe	Handle plan subscription
GET	/api/admin/institutions	View institutions (super admin)


