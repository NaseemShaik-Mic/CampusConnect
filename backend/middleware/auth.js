import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// @desc    Protect routes - require valid JWT token
// @access  Private
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Optional protect - allows request with or without token
// @access  Public (but filters data based on user if authenticated)
export const optionalProtect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from token
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
          // Token invalid but continue without user
          req.user = null;
        }
      } catch (error) {
        // Token invalid but continue without user
        req.user = null;
      }
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    next(error);
  }
};