import LeaveRequest from '../models/LeaveRequest.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/emailService.js';

// @desc    Create leave request
// @route   POST /api/leaves
// @access  Private (Student)
export const createLeaveRequest = async (req, res) => {
  try {
    const { startDate, endDate, reason, leaveType } = req.body;

    const leaveRequest = await LeaveRequest.create({
      student: req.user.id,
      startDate,
      endDate,
      reason,
      leaveType,
      attachments: req.files ? req.files.map(f => f.path) : []
    });

    // Notify faculty/admin
    const admins = await User.find({ role: { $in: ['faculty', 'admin'] }, department: req.user.department });
    
    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        sender: req.user.id,
        type: 'leave',
        title: 'New Leave Request',
        message: `${req.user.name} has requested leave from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`,
        relatedId: leaveRequest._id,
        relatedModel: 'LeaveRequest'
      });
    }

    res.status(201).json({
      success: true,
      leaveRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get leave requests
// @route   GET /api/leaves
// @access  Private
export const getLeaveRequests = async (req, res) => {
  try {
    let query = {};

    // Students see only their leave requests
    if (req.user.role === 'student') {
      query = { student: req.user.id };
    }

    // Faculty/Admin see all leave requests in their department
    if (req.user.role === 'faculty' || req.user.role === 'admin') {
      const students = await User.find({ 
        role: 'student', 
        department: req.user.department 
      }).select('_id');
      query = { student: { $in: students.map(s => s._id) } };
    }

    const leaveRequests = await LeaveRequest.find(query)
      .populate('student', 'name email studentId department semester')
      .populate('reviewedBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: leaveRequests.length,
      leaveRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single leave request
// @route   GET /api/leaves/:id
// @access  Private
export const getLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id)
      .populate('student', 'name email studentId department')
      .populate('reviewedBy', 'name email');

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check authorization
    if (req.user.role === 'student' && leaveRequest.student._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this leave request'
      });
    }

    res.status(200).json({
      success: true,
      leaveRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update leave request status
// @route   PUT /api/leaves/:id
// @access  Private (Faculty/Admin)
export const updateLeaveStatus = async (req, res) => {
  try {
    const { status, comments } = req.body;

    const leaveRequest = await LeaveRequest.findById(req.params.id)
      .populate('student', 'name email');

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    leaveRequest.status = status;
    leaveRequest.comments = comments;
    leaveRequest.reviewedBy = req.user.id;
    leaveRequest.reviewedAt = Date.now();

    await leaveRequest.save();

    // Create notification for student
    await Notification.create({
      recipient: leaveRequest.student._id,
      sender: req.user.id,
      type: 'leave',
      title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your leave request has been ${status}`,
      relatedId: leaveRequest._id,
      relatedModel: 'LeaveRequest',
      priority: 'high'
    });

    // Send email notification
    await sendEmail({
      to: leaveRequest.student.email,
      subject: `Leave Request ${status.toUpperCase()} - College Digital Portal`,
      html: `
        <h2>Leave Request ${status.toUpperCase()}</h2>
        <p>Dear ${leaveRequest.student.name},</p>
        <p>Your leave request from ${new Date(leaveRequest.startDate).toLocaleDateString()} to ${new Date(leaveRequest.endDate).toLocaleDateString()} has been <strong>${status}</strong>.</p>
        ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
        <p>Reviewed by: ${req.user.name}</p>
        <p>Login to view more details.</p>
      `
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(leaveRequest.student._id.toString()).emit('notification', {
      type: 'leave_' + status,
      message: `Your leave request has been ${status}`
    });

    res.status(200).json({
      success: true,
      message: `Leave request ${status} successfully`,
      leaveRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete leave request
// @route   DELETE /api/leaves/:id
// @access  Private (Student - own requests only)
export const deleteLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check authorization
    if (leaveRequest.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this leave request'
      });
    }

    // Can only delete pending requests
    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a leave request that has been reviewed'
      });
    }

    await leaveRequest.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Leave request deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};