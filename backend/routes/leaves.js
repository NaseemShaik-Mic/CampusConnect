import express from 'express';
import {
  createLeaveRequest,
  getLeaveRequests,
  getLeaveRequest,
  updateLeaveStatus,
  deleteLeaveRequest
} from '../controllers/leaveController.js';
import { protect } from '../middleware/auth.js';
import { isFacultyOrAdmin, isStudent } from '../middleware/roleCheck.js';
import upload from '../config/multer.js';

const router = express.Router();

router.route('/')
  .get(protect, getLeaveRequests)
  .post(protect, isStudent, upload.array('attachments', 5), createLeaveRequest);

router.route('/:id')
  .get(protect, getLeaveRequest)
  .put(protect, isFacultyOrAdmin, updateLeaveStatus)
  .delete(protect, isStudent, deleteLeaveRequest);

export default router;