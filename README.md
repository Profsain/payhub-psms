# PayHub Fullstack Application

A comprehensive payroll management system built with React, TypeScript, and Node.js.

## Features

- **Multi-role Authentication**: Staff, Institution Admin, and Super Admin roles
- **Institution Management**: Complete institution onboarding and management
- **Payslip Processing**: Automated payslip generation and delivery
- **Payment Integration**: Stripe payment processing
- **Real-time Dashboard**: Role-based dashboards with analytics
- **Secure API**: JWT authentication with role-based access control

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Shadcn/ui components
- React Router for navigation
- React Query for data fetching

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT authentication
- bcrypt for password hashing
- Zod for validation
- Helmet for security

## Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
# Install all dependencies (root, server, and frontend)
npm run install:all
```

### 2. Environment Setup

#### Backend (.env)
Create a `.env` file in the `server/` directory:

```bash
# Database
DATABASE_URL="mongodb://localhost:27017/payhub"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="development"

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173,http://localhost:8080"
```

#### Frontend (.env)
Create a `.env` file in the `pay-flow-automation/` directory:

```bash
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Development Servers

```bash
# Start both server and frontend concurrently
npm run dev
```

Or start them separately:

```bash
# Terminal 1: Start backend server
npm run dev:server

# Terminal 2: Start frontend
npm run dev:frontend
```

### 4. Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## First Time Setup

### Creating a Super Admin

The first super admin account is created through a dedicated setup process. This is a one-time action that can only be performed if no super admin account exists in the system. The application will guide you through this process on first run.

Once created, the super admin can log in using the same login page as all other users.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - Institution registration
- `POST /api/auth/super-admin` - Create super admin
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Institutions
- `GET /api/institutions` - List institutions
- `GET /api/institutions/:id` - Get institution details
- `POST /api/institutions` - Create institution
- `PUT /api/institutions/:id` - Update institution
- `DELETE /api/institutions/:id` - Delete institution

### Staff
- `GET /api/staff` - List staff members
- `GET /api/staff/:id` - Get staff details
- `POST /api/staff` - Create staff member
- `PUT /api/staff/:id` - Update staff member
- `DELETE /api/staff/:id` - Delete staff member

### Payslips
- `GET /api/payslips` - List payslips
- `GET /api/payslips/:id` - Get payslip details
- `POST /api/payslips` - Create payslip
- `PUT /api/payslips/:id` - Update payslip
- `DELETE /api/payslips/:id` - Delete payslip

## Project Structure

```
payhub-fullstack/
├── server/                 # Backend server
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   └── utils/         # Utility functions
│   └── package.json
├── pay-flow-automation/    # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── ui/            # UI components
│   └── package.json
└── package.json           # Root package.json
```

## Development

### Backend Development

```bash
cd server
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run format       # Run Prettier
```

### Frontend Development

```bash
cd pay-flow-automation
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

## Production Deployment

### Build the Application

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please contact the PayHub team.
