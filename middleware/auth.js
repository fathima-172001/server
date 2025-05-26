import jwt from "jsonwebtoken";
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch full user details from database
    const user = await User.findById(decoded._id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Set the user object on the request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
