# 🌱 Carbon Footprint Calculator (Full-Stack Website)

A full-stack web application designed for tracking personal carbon emissions, featuring user authentication, carbon calculation formulas, dynamic visual charts, and calculation history.

---

## 🚀 Features

- **User Authentication**: Secure registration and login using salted passwords (`bcryptjs`) and JSON Web Tokens (`jsonwebtoken`).
- **Carbon Emission Calculator**: Calculates monthly $CO_2$ equivalent emissions based on:
  - Electricity consumption (kWh)
  - Petrol car transportation (km)
  - Dietary habits (meat-heavy, balanced, vegetarian, vegan)
- **Visual Analytics**: Interactive pie chart breakdown powered by Chart.js.
- **Emission History**: Tracks and displays past carbon calculations for logged-in users.
- **RESTful API**: Clean Express.js backend with JSON data persistence.
- **Automated Tests**: Unit and integration tests using Node.js built-in test runner (`node:test`) and `supertest`.

---

## 📁 Project Structure

```text
mini project/
├── data/
│   └── db.json               # JSON database for users and calculation logs
├── test/
│   └── server.test.js        # Automated backend API tests
├── app.js                    # Client-side JavaScript (auth, API calls, chart rendering)
├── index.html                # Responsive frontend UI
├── package.json              # Project dependencies and run scripts
├── server.js                 # Express server & API endpoints
└── style.css                 # Clean, modern stylesheet
```

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Chart.js (CDN)
- **Backend**: Node.js, Express.js
- **Security & Auth**: bcryptjs, jsonwebtoken (JWT)
- **Database**: Local JSON storage (`data/db.json`)
- **Testing**: Node.js test runner (`node:test`), supertest

---

## 🚦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
Or with auto-reloading during development:
```bash
npm run dev
```

The app will be running at **`http://localhost:3000`**.

### 3. Run Automated Tests
```bash
npm test
```

---

## 📡 API Endpoints

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/health` | No | Server health check status |
| `POST` | `/api/auth/register` | No | Register a new user account |
| `POST` | `/api/auth/login` | No | Authenticate user and receive JWT |
| `POST` | `/api/calculate` | Yes (`Bearer <token>`) | Submit carbon inputs & calculate footprint |
| `GET` | `/api/history` | Yes (`Bearer <token>`) | Fetch user's recent emission history |

