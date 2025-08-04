# Habicore POS System

A comprehensive web-based Point of Sale (POS) system built with modern technologies and modular architecture.

## Architecture Overview

The system follows a modular component architecture where each feature functions as an independent module while seamlessly integrating into the complete ecosystem.

### Technology Stack

**Frontend:**
- React with TypeScript
- Tailwind CSS for styling
- shadcn/ui for UI components
- Recharts for data visualization
- React Query for state management
- React Router for navigation

**Backend:**
- Node.js with Express.js
- PostgreSQL database
- JWT authentication
- RESTful API design
- Docker containerization ready

## Project Structure

```
habicore-pos/
├── frontend/          # React frontend application
├── backend/           # Node.js backend API
├── database/          # Database scripts and migrations
├── docs/             # Documentation
└── docker/           # Docker configuration files
```

## Core Modules

1. **Point of Sale (POS)** - Transaction processing and payment handling
2. **Inventory Management** - Stock control and product catalog
3. **User & Role Management** - Authentication and authorization
4. **Revenue/Sale Records** - Transaction history and analysis
5. **Profit/Loss Records** - Financial reporting and insights
6. **Manufacturing** - Production management
7. **CRM** - Customer relationship management
8. **Sales/Leads Integration** - Third-party system integration

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   npm install
   ```

3. Set up the database:
   ```bash
   cd database
   # Run migration scripts
   ```

4. Configure environment variables:
   ```bash
   # Copy example env files and configure
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

5. Start the development servers:
   ```bash
   # Backend (port 3001)
   cd backend
   npm run dev

   # Frontend (port 3000)
   cd frontend
   npm start
   ```

## Development Principles

- **Modularity**: Each module operates independently
- **Scalability**: Microservices-ready architecture
- **Security**: Robust authentication and authorization
- **Performance**: Optimized for high-transaction environments
- **Integration**: API-first design

## License

Proprietary - Habicore POS System
