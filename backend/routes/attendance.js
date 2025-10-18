import express from 'express';
import {
  markAttendance,
  getAttendance,
  getAttendanceStats,
  getStudentsForAttendance
} from '../controllers/attendanceController.js';
import { protect, optionalProtect } from '../middleware/auth.js';
import { isFacultyOrAdmin } from '../middleware/roleCheck.js';

const router = express.Router();

// POST mark attendance - faculty/admin only
router.post('/', protect, isFacultyOrAdmin, markAttendance);

// GET attendance records - protected (student sees their own, faculty sees what they marked)
router.get('/', optionalProtect, getAttendance);

// GET attendance statistics - protected (student only)
router.get('/stats', optionalProtect, getAttendanceStats);

// GET students for attendance marking - faculty/admin only
router.get('/students', protect, isFacultyOrAdmin, getStudentsForAttendance);

export default router;