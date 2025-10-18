import express from 'express';
import {
  createMentoringSession,
  getMentoringSessions,
  getMentoringSession,
  updateMentoringSession,
  markAttendance,
  addFeedback,
  cancelMentoringSession
} from '../controllers/mentoringController.js';
import { protect } from '../middleware/auth.js';
import { isFaculty, isStudent } from '../middleware/roleCheck.js';

const router = express.Router();

router.route('/')
  .get(protect, getMentoringSessions)
  .post(protect, isFaculty, createMentoringSession);

router.route('/:id')
  .get(protect, getMentoringSession)
  .put(protect, isFaculty, updateMentoringSession)
  .delete(protect, isFaculty, cancelMentoringSession);

router.put('/:id/attendance', protect, isStudent, markAttendance);
router.put('/:id/feedback', protect, isStudent, addFeedback);

export default router;