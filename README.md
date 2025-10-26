# Connect Campus

A comprehensive **MERN-based college management platform** designed to streamline academic and administrative workflows.
It enables students, faculty, and administrators to manage courses, assignments, attendance, and notifications through a unified interface.

---

## Features

* **Secure Authentication** – JWT-based login and registration
* **Role-Based Access Control** – Dedicated dashboards for students, faculty, and admins
* **Course Management** – Create, manage, and view courses
* **Assignment Submission** – Submit and track assignments online
* **Grade Management** – Faculty can update and students can view grades
* **Attendance Tracking** – Record and monitor attendance efficiently
* **Real-Time Notifications** – Receive important updates instantly
* **Responsive Design** – Optimized for desktop and mobile devices

---

## Tech Stack

### Frontend

* React 18+
* React Router
* Tailwind CSS
* Lucide React (Icons)
* Axios

### Backend

* Node.js & Express.js
* MongoDB with Mongoose ODM
* JWT Authentication
* bcrypt for password hashing
* CORS for cross-origin requests

---

## Prerequisites

Ensure the following are installed before setup:

* Node.js (v14 or higher)
* MongoDB (local or Atlas)
* Git
* npm or yarn

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/college-digital-portal.git
cd college-digital-portal
```

### 2. Backend Setup

```bash
cd backend
npm install
touch .env
```

**Environment Variables**

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/college-portal
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:3000
```

> For local development:
>
> ```
> MONGODB_URI=mongodb://localhost:27017/college-portal
> ```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
touch .env
```

**Environment Variables**

```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## Running the Application

### Development

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm start
```

* Backend: [http://localhost:5000](http://localhost:5000)
* Frontend: [http://localhost:3000](http://localhost:3000)

### Production

```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd backend
npm start
```

---

## Demo Credentials

| Role    | Email                                             | Password    |
| ------- | ------------------------------------------------- | ----------- |
| Student | [student@college.edu](mailto:student@college.edu) | password123 |
| Faculty | [faculty@college.edu](mailto:faculty@college.edu) | password123 |
| Admin   | [admin@college.edu](mailto:admin@college.edu)     | password123 |

---

## Project Structure

```
college-digital-portal/
├── backend/
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
└── README.md
```

---

## MongoDB Atlas Setup

1. Create a cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Add the connection string to `.env`.
3. Whitelist your IP address or use `0.0.0.0/0` for testing.
4. Create a database user with read/write access.

---

## Common Issues

### MongoDB Connection Error (`querySrv ENOTFOUND`)

* Verify the MongoDB URI and credentials
* Ensure your IP is whitelisted
* Encode special characters in passwords

### Port Already in Use

```bash
# Linux / macOS
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### CORS Error

Enable CORS in `server.js`:

```javascript
import cors from 'cors';
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
```

---

## Scripts

### Backend

| Command       | Description                     |
| ------------- | ------------------------------- |
| `npm start`   | Run production server           |
| `npm run dev` | Run in development with nodemon |
| `npm test`    | Run backend tests               |

### Frontend

| Command         | Description              |
| --------------- | ------------------------ |
| `npm start`     | Start development server |
| `npm run build` | Build production assets  |
| `npm test`      | Run frontend tests       |

---

## Security

* Passwords hashed using **bcrypt**
* JWT-based authentication
* Protected routes via middleware
* Secrets stored in environment variables
* Input validation and sanitization

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/FeatureName`)
3. Commit your changes (`git commit -m "Add FeatureName"`)
4. Push to your branch (`git push origin feature/FeatureName`)
5. Open a pull request

---

## License

This project is licensed under the **MIT License**.
See the [LICENSE](LICENSE) file for details.

---

## Author

**Naseem Shaik**
Email: [naseemshaik2789@gmail.com](mailto:naseemshaik2789@gmail.com)
GitHub: [NaseemShaik-Mic](https://github.com/NaseemShaik-Mic)

---

## References

* [React Documentation](https://react.dev/)
* [Express.js](https://expressjs.com/)
* [MongoDB](https://www.mongodb.com/)
* [Tailwind CSS](https://tailwindcss.com/)
* [Lucide Icons](https://lucide.dev/)



