# Milk Procurement System

A web application for managing milk procurement in villages, allowing farmers to register and view their milk records, and buyers to record milk quality measurements.

## Features

- Farmer registration and login
- Buyer login
- Milk quality recording (fat content)
- Farmer dashboard to view their milk records
- Buyer dashboard to record milk measurements

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

## Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm run init-db  # Initialize the database with default buyer account
   npm start        # Start the server
   ```
   Default buyer credentials:
   - Username: admin
   - Password: admin123

2. Start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Farmers can register and login to view their milk records
2. Buyers can login to record milk quality measurements
3. The system automatically updates farmer records when buyers enter new measurements

## API Endpoints

### Farmers
- POST /api/farmers/register - Register a new farmer
- POST /api/farmers/login - Farmer login
- GET /api/farmers/:id/milk-records - Get farmer's milk records

### Buyers
- POST /api/buyers/login - Buyer login

### Milk Records
- POST /api/milk-records - Add a new milk record
- GET /api/farmers - Get list of all farmers

## Technologies Used

- Frontend: React, Material-UI
- Backend: Node.js, Express
- Database: SQLite 