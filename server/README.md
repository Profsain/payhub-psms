# PayHub Backend Server

A comprehensive backend server for the PayHub payroll management system, built with Node.js, Express, TypeScript, and PostgreSQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Multi-role user system (Staff, Institution Admin, Super Admin)
- **Institution Management**: Complete institution lifecycle management
- **Staff Management**: CRUD operations with bulk CSV upload support
- **Payslip Management**: Upload, process, and manage payslips
- **Subscription Management**: Plan management and billing
- **Payment Processing**: Stripe integration for payments
- **File Upload**: Support for CSV and PDF file uploads
- **Security**: Rate limiting, CORS, input validation, and error handling

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Validation**: Zod schemas
- **File Upload**: Multer
- **Payment**: Stripe integration
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Rate limiting

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd server
npm install
```

### 2. Environment Setup

Copy the environment template and configure your variables:

```bash
cp env.example .env
```

Update the `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/payhub_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="development"

# Stripe (optional for development)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Email (optional for development)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/login`
Login with email and password.

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
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "INSTITUTION_ADMIN",
      "institution": {
        "id": "institution_id",
        "name": "Institution Name"
      }
    },
    "token": "jwt_token_here"
  }
}
```

#### POST `/api/auth/signup`
Register a new institution.

**Request Body:**
```json
{
  "institutionName": "My Institution",
  "email": "admin@institution.com",
  "phoneNumber": "+2348012345678",
  "password": "securepassword123",
  "confirmPassword": "securepassword123"
}
```

#### POST `/api/auth/change-password`
Change user password (requires authentication).

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

### Staff Management Endpoints

#### GET `/api/staff`
Get all staff members for the institution.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term
- `department`: Filter by department
- `status`: Filter by status (active/inactive)

#### POST `/api/staff`
Create a new staff member.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@institution.com",
  "employeeId": "EMP001",
  "department": "Engineering",
  "position": "Software Engineer",
  "salary": 500000,
  "joinedDate": "2024-01-15T00:00:00.000Z"
}
```

#### POST `/api/staff/upload-csv`
Upload staff CSV file for bulk import.

**Request:** Multipart form with CSV file

### Payslip Management Endpoints

#### GET `/api/payslips`
Get payslips for the user/institution.

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `month`: Filter by month
- `year`: Filter by year
- `status`: Filter by status

#### POST `/api/payslips`
Create a new payslip.

**Request Body:**
```json
{
  "month": "January",
  "year": 2024,
  "grossPay": 500000,
  "netPay": 450000,
  "deductions": 50000,
  "allowances": 0,
  "staffId": "staff_id"
}
```

#### POST `/api/payslips/upload-pdf`
Upload bulk payslip PDF.

**Request:** Multipart form with PDF file

### Subscription Endpoints

#### GET `/api/subscriptions/plans`
Get available subscription plans.

#### POST `/api/subscriptions`
Create a new subscription.

**Request Body:**
```json
{
  "planName": "Professional",
  "planPrice": 79000,
  "billingCycle": "monthly"
}
```

### Payment Endpoints

#### GET `/api/payments`
Get payment history.

#### POST `/api/payments`
Create a payment record.

**Request Body:**
```json
{
  "amount": 79000,
  "currency": "NGN",
  "description": "Professional Plan - Monthly",
  "subscriptionId": "subscription_id"
}
```

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## 🏗️ Project Structure

```
src/
├── index.ts              # Main server entry point
├── middleware/           # Express middleware
│   ├── auth.ts          # Authentication middleware
│   ├── errorHandler.ts  # Error handling middleware
│   └── notFound.ts      # 404 middleware
├── routes/              # API routes
│   ├── auth.ts          # Authentication routes
│   ├── institutions.ts  # Institution management
│   ├── staff.ts         # Staff management
│   ├── payslips.ts      # Payslip management
│   ├── subscriptions.ts # Subscription management
│   └── payments.ts      # Payment management
├── utils/               # Utility functions
│   └── validateEnv.ts   # Environment validation
└── prisma/              # Database schema
    └── schema.prisma    # Prisma schema
```

## 🗄️ Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: Authentication and role management
- **Institutions**: Organization details
- **Staff**: Employee information
- **Payslips**: Salary records
- **Subscriptions**: Billing and plans
- **Payments**: Transaction history
- **PasswordResets**: Password reset tokens
- **AuditLogs**: System audit trail

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run test             # Run tests
```

### Environment Variables

See `env.example` for all required environment variables.

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Zod schemas for request validation
- **Rate Limiting**: Prevent abuse with request limits
- **CORS Protection**: Configured CORS for security
- **Helmet**: Security headers middleware
- **Error Handling**: Comprehensive error management

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please contact the development team. 