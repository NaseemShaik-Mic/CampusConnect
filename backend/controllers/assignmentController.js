import Assignment from '../models/Assignment.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendEmail } from '../utils/emailService.js';

// @desc    Create new assignment
// @route   POST /api/assignments
// @access  Private (Faculty/Admin)
export const createAssignment = async (req, res) => {
  try {
    const { title, description, subject, department, semester, dueDate, maxMarks } = req.body;

    if (!title || !description || !subject || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const assignment = await Assignment.create({
      title,
      description,
      subject,
      department: department || req.user.department,
      semester: semester || req.user.semester,
      dueDate,
      maxMarks,
      createdBy: req.user.id
    });

    // Fetch and notify relevant students
    const students = await User.find({
      role: 'student',
      department: assignment.department,
      semester: assignment.semester
    });

    if (students.length > 0) {
      const notifications = students.map(student => ({
        recipient: student._id,
        sender: req.user.id,
        type: 'new_assignment',
        title: 'New Assignment Posted',
        message: `New assignment "${title}" has been posted for ${subject}`,
        relatedId: assignment._id,
        relatedModel: 'Assignment',
        priority: 'normal'
      }));

      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment: {
        ...assignment.toObject(),
        status: 'pending'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all assignments with filtering
// @route   GET /api/assignments
// @access  Public (with optional auth for filtering)
export const getAssignments = async (req, res) => {
  try {
    let query = {};
    const userRole = req.user?.role?.toLowerCase();

    // If authenticated student, filter by their department/semester
    if (userRole === 'student' && req.user) {
      query = {
        department: req.user.department,
        semester: req.user.semester,
        isActive: true
      };
    }
    // If authenticated faculty, show their assignments
    else if ((userRole === 'faculty' || userRole === 'admin') && req.user) {
      query = { createdBy: req.user.id };
    }
    // Demo mode: return active assignments
    else {
      query = { isActive: true };
    }

    const assignments = await Assignment.find(query)
      .populate('createdBy', 'name email')
      .populate('submissions.student', 'name email studentId')
      .sort('-createdAt')
      .limit(50);

    // Add status to each assignment
    const assignmentsWithStatus = assignments.map(a => ({
      ...a.toObject(),
      status: determineAssignmentStatus(a, req.user?.id),
      submissionCount: a.submissions.length,
      gradedCount: a.submissions.filter(s => s.grade).length
    }));

    res.status(200).json({
      success: true,
      count: assignmentsWithStatus.length,
      assignments: assignmentsWithStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single assignment with submissions
// @route   GET /api/assignments/:id
// @access  Private
export const getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('createdBy', 'name email department')
      .populate('submissions.student', 'name email studentId')
      .populate('submissions.gradedBy', 'name email');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check authorization
    const userRole = req.user?.role?.toLowerCase();
    const isCreator = assignment.createdBy._id.toString() === req.user.id;
    const isStudent = userRole === 'student';

    if (isStudent) {
      // Students can only view if in correct department/semester
      if (
        req.user.department !== assignment.department ||
        req.user.semester !== assignment.semester
      ) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this assignment'
        });
      }
    } else if (!isCreator && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this assignment'
      });
    }

    const assignmentData = {
      ...assignment.toObject(),
      status: determineAssignmentStatus(assignment, req.user.id),
      submissionCount: assignment.submissions.length,
      gradedCount: assignment.submissions.filter(s => s.grade).length
    };

    res.status(200).json({
      success: true,
      assignment: assignmentData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Submit assignment
// @route   POST /api/assignments/:id/submit
// @access  Private (Student)
export const submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if due date has passed
    if (new Date() > new Date(assignment.dueDate)) {
      return res.status(400).json({
        success: false,
        message: 'Assignment submission deadline has passed'
      });
    }

    // Check if already submitted
    const existingSubmission = assignment.submissions.find(
      sub => sub.student.toString() === req.user.id
    );

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this assignment'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    // Add submission
    assignment.submissions.push({
      student: req.user.id,
      fileUrl: req.file.path,
      submittedAt: Date.now(),
      status: 'submitted'
    });

    await assignment.save();

    // Notify faculty
    await Notification.create({
      recipient: assignment.createdBy,
      sender: req.user.id,
      type: 'assignment_submitted',
      title: 'New Assignment Submission',
      message: `${req.user.name} submitted "${assignment.title}"`,
      relatedId: assignment._id,
      relatedModel: 'Assignment',
      priority: 'normal'
    });

    // Emit socket event if available
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(assignment.createdBy.toString()).emit('notification', {
        type: 'assignment_submitted',
        message: `New submission for ${assignment.title}`,
        assignmentId: assignment._id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Assignment submitted successfully',
      assignment: {
        ...assignment.toObject(),
        status: determineAssignmentStatus(assignment, req.user.id)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Grade assignment submission
// @route   PUT /api/assignments/:id/grade/:submissionId
// @access  Private (Faculty/Admin)
export const gradeSubmission = async (req, res) => {
  try {
    const { grade, feedback } = req.body;

    if (!grade) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a grade'
      });
    }

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const submission = assignment.submissions.id(req.params.submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    submission.grade = grade;
    submission.feedback = feedback || '';
    submission.gradedAt = Date.now();
    submission.gradedBy = req.user.id;
    submission.status = 'graded';

    await assignment.save();

    // Get student details for notification
    const populatedAssignment = await Assignment.findById(req.params.id)
      .populate('submissions.student', 'name email');

    const student = populatedAssignment.submissions.id(req.params.submissionId).student;

    // Create notification for student
    await Notification.create({
      recipient: student._id,
      sender: req.user.id,
      type: 'assignment_graded',
      title: 'Assignment Graded',
      message: `Your submission for "${assignment.title}" has been graded: ${grade}`,
      relatedId: assignment._id,
      relatedModel: 'Assignment',
      priority: 'high'
    });

    // Send email notification
    await sendEmail({
      to: student.email,
      subject: `Assignment Graded: ${assignment.title}`,
      html: `
        <h2>Your assignment has been graded!</h2>
        <p><strong>Assignment:</strong> ${assignment.title}</p>
        <p><strong>Grade:</strong> ${grade}</p>
        ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ''}
        <p>Login to view more details.</p>
      `
    });

    // Emit socket event if available
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(student._id.toString()).emit('notification', {
        type: 'assignment_graded',
        message: `Your assignment "${assignment.title}" has been graded`,
        grade,
        assignmentId: assignment._id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Submission graded successfully',
      assignment: {
        ...assignment.toObject(),
        status: determineAssignmentStatus(assignment, req.user.id)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private (Faculty/Admin)
export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if user is creator
    if (assignment.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this assignment'
      });
    }

    await Assignment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to determine assignment status
const determineAssignmentStatus = (assignment, userId) => {
  const now = new Date();
  const dueDate = new Date(assignment.dueDate);

  if (userId) {
    const userSubmission = assignment.submissions.find(
      sub => sub.student.toString() === userId
    );

    if (userSubmission) {
      if (userSubmission.grade) return 'graded';
      return 'submitted';
    }
  }

  if (now > dueDate) return 'overdue';
  return 'pending';
};