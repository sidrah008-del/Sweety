# Sweety – Blood Glucose Tracker

Sweety is a full-stack blood glucose tracking application that helps users securely record, manage, and monitor their daily glucose readings. It provides an interactive dashboard, reading history, charts, and reports to help users understand their glucose trends.

Developed as part of the **Junior Full Stack Developer – JavaScript & AI assessment by Kenpath**.

## Features

### 1. Authentication
- User registration and login.
- Password hashing using bcrypt.
- JWT-based authentication.
- Secure, user-specific reading access.

### 2. Blood Glucose Management
- Add, view, edit, and delete glucose readings.
- Four daily reading slots:
  - Morning (fasting)
  - After breakfast
  - After lunch
  - After dinner
- Maximum of four readings per day.
- Prevents duplicate readings for the same slot and date.
- Validates glucose values and dates.

### 3. Dashboard and Reports
- Dashboard summary with total readings, today's readings, and average glucose.
- Glucose charts and reading history.
- Daily reports.
- Month-to-date reports.
- Previous-month reports.
- Pagination for reading history.
- Empty states when no readings are available.

### 4. Additional Features
- Responsive user interface.
- Docker and Docker Compose support.
- PostgreSQL database initialization script.
- Database seed script for demo data.
- Automated end-to-end testing using Playwright.

## Technology Stack

### Frontend
- React 19
- Vite
- JavaScript
- CSS
- Axios
- React Router
- Recharts
- Lucide React

### Backend
- Node.js
- Express.js
- REST APIs

### Database
- PostgreSQL
- pg (Node.js PostgreSQL client)

### Authentication
- bcrypt
- JSON Web Tokens (JWT)

### Testing
- Playwright
- Chromium

### Tools
- Docker
- Docker Compose
- Git and GitHub
- ESLint

## Project Structure

```text
Sweety/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   │
│   ├── tests/
│   │   ├── auth.spec.js
│   │   ├── profile.spec.js
│   │   ├── readings.spec.js
│   │   ├── reports.spec.js
│   │   ├── security.spec.js
│   │   └── setup-env.cjs
│   │
│   ├── playwright.config.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── seed.js
│   ├── server.js
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── database/
│   └── init.sql
│
├── Screenshots/
│   ├── Login.png
│   ├── Register.png
│   ├── Overview.png
│   ├── Reading1.png
│   ├── Reading2.png
│   ├── Report1.png
│   ├── Report2.png
│   ├── Report3.png
│   └── Profile.png
│
├── docker-compose.yml
└── README.md
```

## Installation and Setup

### Prerequisites

Install the following:

- Node.js and npm
- PostgreSQL
- Git

Docker Desktop is optional if you prefer running the application using Docker.

### 1. Clone the Repository

```bash
git clone https://github.com/sidrah008-del/Sweety.git
cd Sweety
```

### 2. Database Setup

Create a PostgreSQL database named `sweety_db`.

```sql
CREATE DATABASE sweety_db;
```

Initialize the database tables using the provided SQL file:

```bash
psql -U postgres -d sweety_db -f database/init.sql
```

Make sure PostgreSQL is running and your database credentials are correct.

### 3. Backend Setup

Navigate to the server directory:

```bash
cd server
npm install
```

Create a `.env` file using `.env.example` as a reference.

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure the environment variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sweety_db
DB_USER=postgres
DB_PASSWORD=your_password

PORT=5000

JWT_SECRET=your_long_random_secret
```

Replace the database password and JWT secret with your own values.

Start the backend:

```bash
npm start
```

The backend runs at:

`http://localhost:5000`

### 4. Frontend Setup

Open another terminal from the project root:

```bash
cd client
npm install
```

Configure the frontend API URL if required by your local configuration:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open the local URL displayed by Vite in your terminal.

## Running with Docker

Docker Compose starts the PostgreSQL database, Node.js backend, and React frontend.

From the project root, make sure `server/.env` exists and contains the required database credentials and JWT secret.

Run:

```bash
docker compose --env-file server/.env up -d --build
```

The Docker configuration uses:

| Service | Address |
|---|---|
| Frontend | http://localhost:8080 |
| Backend | http://localhost:5000 |
| PostgreSQL (host port) | localhost:5433 |

### Useful Docker Commands

**Check running containers**

```bash
docker compose ps
```

**View backend logs**

```bash
docker compose logs server
```

**Stop containers**

```bash
docker compose down
```

The PostgreSQL data is stored in a Docker volume named `postgres_data`.

Avoid using `docker compose down -v` if you want to preserve database data.

## Demo Account and Database Seeding

Sweety includes a database seed script at:

`server/seed.js`

The script creates a demo user if one does not already exist and generates sample glucose readings for the previous seven days.

It uses bcrypt to hash the demo password and avoids inserting duplicate readings.

To execute the seed script with your local PostgreSQL database:

```bash
cd server
node seed.js
```

### Demo Login Credentials

| Field | Value |
|---|---|
| Name | Sweety Demo |
| Email | demo@sweety.com |
| Password | SweetyDemo@123 |

**Note:** The demo password applies when the seed script creates a new account. If the account already exists, the script preserves its existing password.

## Automated Testing

Sweety includes automated end-to-end tests using **Playwright** and Chromium.

The test configuration is located at:

`client/playwright.config.js`

The test files are located in:

`client/tests/`

### Test Coverage

| Test File | Purpose |
|---|---|
| `auth.spec.js` | Authentication workflows |
| `profile.spec.js` | Profile functionality |
| `readings.spec.js` | Glucose reading workflows |
| `reports.spec.js` | Reports functionality |
| `security.spec.js` | Security-related workflows |

### Running the Tests

Navigate to the client directory:

```bash
cd client
npm install
```

Install the Chromium browser:

```bash
npx playwright install chromium
```

Make sure the backend and required test database/environment configuration are available.

Run the automated tests:

```bash
npx playwright test
```

Run tests with the browser visible:

```bash
npx playwright test --headed
```

The Playwright configuration automatically starts the Vite development server when required.

Test screenshots are captured on failure, and execution traces are retained for debugging.

## Screenshots

The following screenshots demonstrate the main features and user interface of Sweety.

### Login

![Login Page](Screenshots/Login.png)

### Registration

![Registration Page](Screenshots/Register.png)

### Dashboard

![Dashboard](Screenshots/Overview.png)

### Glucose Readings

![Readings - View 1](Screenshots/Reading1.png)

![Readings - View 2](Screenshots/Reading2.png)

### Reports and Analytics

![Reports - View 1](Screenshots/Report1.png)

![Reports - View 2](Screenshots/Report2.png)

![Reports - View 3](Screenshots/Report3.png)

### Profile

![Profile Page](Screenshots/Profile.png)

## Environment Variables

The backend environment variable template is provided in:

`server/.env.example`

Create your own `.env` file with the appropriate local database credentials and authentication secret.

The frontend API URL can be configured using `VITE_API_URL` when required by the frontend configuration.

Never commit actual passwords, JWT secrets, or other private credentials to GitHub.

## Future Improvements

Potential improvements include:

- More comprehensive frontend component testing.
- Additional glucose analytics and visualization options.
- Improved accessibility and responsive design.
- Automated reading reminders.
- Expanded test coverage and error handling.

## Author

**Sidrah Izrail**

GitHub: [sidrah008-del](https://github.com/sidrah008-del)

**Project Repository:** [Sweety – Blood Glucose Tracker](https://github.com/sidrah008-del/Sweety)

---

Built with React, Node.js, Express, and PostgreSQL.
