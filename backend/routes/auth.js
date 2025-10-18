import express from 'express';
import { register, login, getMe, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
// router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
// GET current user
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user // This comes from your protect middleware
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

