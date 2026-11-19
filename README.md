# Sweety – Blood Glucose Tracker

Sweety is a full-stack blood glucose tracking application designed to help users record, monitor, and review their daily blood glucose readings through a simple and user-friendly interface.

The application allows users to securely manage their accounts, record glucose readings, and view reports to better understand their tracking history.

## Features

- **User Authentication:** Secure user registration and login using password hashing and JWT authentication.
- **Glucose Tracking:** Record daily blood glucose readings.
- **Four Daily Slots:** Track up to four readings per day.
- **Reading History:** View previously recorded glucose readings.
- **Reports & Analytics:** Review glucose tracking data through reports and visual summaries.
- **User Profile:** View and manage personal account details.
- **Input Validation:** Validate glucose readings and prevent invalid entries.
- **Responsive Design:** Access the application across desktop and mobile devices.

## Technology Stack

### Frontend
- React.js
- Vite
- JavaScript
- HTML5
- CSS3
- Axios

### Backend
- Node.js
- Express.js
- REST API

### Database
- PostgreSQL
- pg (Node.js PostgreSQL client)

### Authentication & Security
- JSON Web Tokens (JWT)
- bcrypt for password hashing

### Testing
- Playwright

### Development Tools
- Visual Studio Code
- Git & GitHub
- Postman


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
│   ├── public/
│   ├── .env.example
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/Sweety.git
cd Sweety
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside the `server` folder using `.env.example` as a reference.

Configure your PostgreSQL database credentials and JWT secret.

Create a PostgreSQL database named `sweety_db` and ensure the required tables are set up.

Start the backend:

```bash
npm start
```

The backend runs on:

```text
http://localhost:5000
```

### 3. Frontend Setup

Open a new terminal:

```bash
cd client
npm install
```

Create a `.env` file inside the `client` folder using `.env.example` as a reference.

Add:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open the local URL displayed in your terminal to access Sweety.



## API Documentation

Base URL: `http://localhost:5000`

Protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your_token>
```

### Authentication APIs

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Log in an existing user | No |

### Profile APIs

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| PUT | `/api/profile` | Update the logged-in user's profile | Yes |

### Glucose Reading APIs

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| POST | `/api/readings` | Add a glucose reading | Yes |
| GET | `/api/readings` | Get the user's readings | Yes |
| PUT | `/api/readings/:id` | Update a glucose reading | Yes |
| DELETE | `/api/readings/:id` | Delete a glucose reading | Yes |

### Reports APIs

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/api/reports` | Get glucose reports | Yes |
| GET | `/api/reports/trend` | Get glucose trends for the last 30 days | Yes |

## Database

Sweety uses PostgreSQL to store user accounts and glucose readings.

### Main Tables

- **users:** Stores user account information, including name, email, and hashed password.
- **readings:** Stores glucose readings associated with users, including date, time slot, and glucose value.

Each reading is linked to its respective user through a foreign key relationship.


## Testing

Sweety uses Playwright for end-to-end testing.

### Run Tests

From the project directory, navigate to the client folder (or the folder containing your Playwright configuration).

Install the required dependencies:

```bash
npm install
```

Install Playwright browsers:

```bash
npx playwright install
```

Run the test suite:

```bash
npx playwright test
```

View the HTML test report:

```bash
npx playwright show-report
```

The test suite covers authentication, glucose reading operations, API validation, and reports functionality.

## Screenshots

Screenshots of the application interface will be added here.

## Future Improvements

- Enhanced glucose analytics and insights.
- Additional visualization options.
- Improved health tracking features.

## Author

Developed as a full-stack web development project.


## Screenshots

### Login
![Login Page](screenshots/Login.png)

### Registration
![Registration Page](screenshots/Register.png)

### Overview
![Overview Dashboard](screenshots/Overview.png)

### Glucose Readings
![Readings - View 1](screenshots/Reading1.png)
![Readings - View 2](screenshots/Reading2.png)

### Reports & Analytics
![Reports - View 1](screenshots/Report1.png)
![Reports - View 2](screenshots/Report2.png)
![Reports - View 3](screenshots/Report3.png)

### Profile
![Profile Page](screenshots/Profile.png)