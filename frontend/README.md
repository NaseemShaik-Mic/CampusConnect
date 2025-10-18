# 🎓 College Digital Portal

A comprehensive digital portal for college management, built with the MERN stack (MongoDB, Express.js, React, Node.js). This platform enables students, faculty, and administrators to manage academic activities efficiently.

## ✨ Features

- 🔐 **User Authentication**: Secure login and registration with JWT
- 👥 **Role-Based Access Control**: Separate dashboards for Students, Faculty, and Admins
- 📚 **Course Management**: Create, view, and manage courses
- 📝 **Assignment Submission**: Students can submit assignments online
- 📊 **Grade Tracking**: View and manage student grades
- 📅 **Attendance System**: Track and manage attendance records
- 🔔 **Notifications**: Real-time updates and announcements
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

## 🚀 Tech Stack

### Frontend
- **React** 18.x
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API calls

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcrypt** for password hashing
- **CORS** enabled

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas account)
- [Git](https://git-scm.com/)
- npm or yarn package manager

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/college-digital-portal.git
cd college-digital-portal
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
touch .env
```

Add the following to your `.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/college-portal?retryWrites=true&w=majority

# JWT Secret (change this to a random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Frontend URL
CLIENT_URL=http://localhost:3000
```

**Important**: Replace the MongoDB URI with your actual connection string from MongoDB Atlas or use local MongoDB:
```env
MONGODB_URI=mongodb://localhost:27017/college-portal
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from root)
cd frontend

# Install dependencies
npm install

# Create .env file
touch .env
```

Add the following to your frontend `.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🚦 Running the Application

### Development Mode

#### Start Backend Server

```bash
cd backend
npm run dev
```

The backend server will start on `http://localhost:5000`

#### Start Frontend Development Server

```bash
cd frontend
npm start
```

The frontend will open automatically at `http://localhost:3000`

### Production Mode

#### Build Frontend

```bash
cd frontend
npm run build
```

#### Start Backend in Production

```bash
cd backend
npm start
```

## 👤 Demo Credentials

Use these credentials to test the application:

| Role | Email | Password |
|------|-------|----------|
| **Student** | student@college.edu | password123 |
| **Faculty** | faculty@college.edu | password123 |
| **Admin** | admin@college.edu | password123 |

## 📁 Project Structure

```
college-digital-portal/
├── backend/
│   ├── config/
│   │   └── db.js              # Database configuration
│   ├── models/
│   │   ├── User.js            # User model
│   │   ├── Course.js          # Course model
│   │   └── Assignment.js      # Assignment model
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── users.js           # User routes
│   │   └── courses.js         # Course routes
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── .env                   # Environment variables
│   ├── server.js              # Express server setup
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx      # Login component
│   │   │   ├── Register.jsx   # Registration component
│   │   │   ├── Dashboard.jsx  # Dashboard component
│   │   │   └── ...
│   │   ├── context/
│   │   │   └── AuthContext.js # Authentication context
│   │   ├── App.js             # Main App component
│   │   └── index.js           # Entry point
│   ├── .env                   # Frontend environment variables
│   └── package.json
│
└── README.md
```

## 🔧 Configuration

### MongoDB Atlas Setup

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Click "Connect" and choose "Connect your application"
4. Copy the connection string
5. Replace `<username>`, `<password>`, and `<dbname>` in the connection string
6. Add the connection string to your `.env` file

### Network Access (MongoDB Atlas)

1. Go to **Network Access** in MongoDB Atlas
2. Click **Add IP Address**
3. Choose **Allow Access from Anywhere** (0.0.0.0/0) for development
4. Click **Confirm**

### Database User (MongoDB Atlas)

1. Go to **Database Access**
2. Click **Add New Database User**
3. Create username and password
4. Select **Read and write to any database**
5. Click **Add User**

## 🐛 Troubleshooting

### MongoDB Connection Issues

If you see `querySrv ENOTFOUND` error:
- Verify your MongoDB URI is correct
- Check that your IP is whitelisted in MongoDB Atlas
- Ensure database user credentials are correct
- URL encode special characters in password

### Port Already in Use

If port 5000 or 3000 is already in use:

```bash
# Kill process on port 5000 (Backend)
# On Linux/Mac:
lsof -ti:5000 | xargs kill -9

# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change the port in .env file
PORT=5001
```

### CORS Issues

Make sure your backend has CORS enabled:

```javascript
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

## 📦 Available Scripts

### Backend

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

### Frontend

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Protected routes with middleware
- Environment variables for sensitive data
- Input validation and sanitization

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Your Name
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## 🙏 Acknowledgments

- [React Documentation](https://react.dev/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

## 📞 Support

For support, email your.email@example.com or open an issue in the repository.

---

Made with ❤️ by Your Name