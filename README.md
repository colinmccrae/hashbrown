# Hash Brown Engineering Website

A website for Hash Brown Engineering, a process engineering consultancy.

## Features

- Responsive design
- User authentication system
- PostgreSQL database integration
- API endpoints for user management

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

## Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Set up the PostgreSQL database:**

Make sure PostgreSQL is installed and running on your system. Then update the database configuration in `server.js` and `db_setup.js` with your PostgreSQL credentials.

Default credentials are:
- Username: postgres
- Password: password
- Database: hashbrown_db
- Host: localhost
- Port: 5432

3. **Initialize the database:**

```bash
node db_setup.js
```

This script will:
- Create the hashbrown_db database if it doesn't exist
- Create the users table
- Add a default user with the following credentials:
  - Email: colin@hashbrowneng.com
  - Password: password123

## Running the Application

1. **Start the server:**

```bash
npm start
```

2. **For development with auto-restart:**

```bash
npm run dev
```

3. **Access the application:**

Open your browser and navigate to:
- Website: http://localhost:3000/index.html
- Account page: http://localhost:3000/account.html

## API Endpoints

- **POST /api/login** - Authenticate a user
- **GET /api/user** - Get current user information
- **POST /api/logout** - Log out the current user

## Project Structure

- `server.js` - Express server and API endpoints
- `db_setup.js` - Database initialization script
- `index.html` - Main website homepage
- `account.html` - User authentication page
- `tools.html`, `wallet.html`, `chat.html` - Additional feature pages

## Security Notes

- For production, update the session secret in `server.js`
- Use environment variables for database credentials
- Enable HTTPS for secure communication