import express from 'express';
import {
  createAssignment,
  getAssignments,
  getAssignment,
  submitAssignment,
  gradeSubmission,
  deleteAssignment
} from '../controllers/assignmentController.js';
import { protect, optionalProtect } from '../middleware/auth.js';
import { isFacultyOrAdmin, isStudent } from '../middleware/roleCheck.js';
import upload from '../config/multer.js';

const router = express.Router();

// GET all assignments - public endpoint (supports optional auth for filtering)
router.get('/', optionalProtect, getAssignments);

// POST create assignment - faculty/admin only
router.post('/', protect, isFacultyOrAdmin, createAssignment);

// GET single assignment - protected
router.get('/:id', protect, getAssignment);

// POST submit assignment - student only
router.post(
  '/:id/submit',
  protect,
  isStudent,
  upload.single('file'),
  submitAssignment
);

// PUT grade submission - faculty/admin only
router.put(
  '/:id/grade/:submissionId',
  protect,
  isFacultyOrAdmin,
  gradeSubmission
);

// DELETE assignment - faculty/admin only
router.delete('/:id', protect, isFacultyOrAdmin, deleteAssignment);

export default router;