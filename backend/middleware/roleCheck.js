// Middleware to check if user has required role
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

// Check if user is student
export const isStudent = authorize('student');

// Check if user is faculty
export const isFaculty = authorize('faculty');

// Check if user is admin
export const isAdmin = authorize('admin');

// Check if user is faculty or admin
export const isFacultyOrAdmin = authorize('faculty', 'admin');