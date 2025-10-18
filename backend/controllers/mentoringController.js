import MentoringSession from '../models/MentoringSession.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/emailService.js';

// @desc    Create mentoring session
// @route   POST /api/mentoring
// @access  Private (Faculty)
export const createMentoringSession = async (req, res) => {
  try {
    const { title, description, students, scheduledDate, duration, meetingLink, location, topic } = req.body;

    const session = await MentoringSession.create({
      title,
      description,
      faculty: req.user.id,
      students,
      scheduledDate,
      duration,
      meetingLink,
      location,
      topic,
      attendees: students.map(studentId => ({ student: studentId, attended: false }))
    });

    // Populate session for notifications
    const populatedSession = await MentoringSession.findById(session._id)
      .populate('students', 'name email');

    // Create notifications for all students
    for (const student of populatedSession.students) {
      await Notification.create({
        recipient: student._id,
        sender: req.user.id,
        type: 'mentoring',
        title: 'New Mentoring Session Scheduled',
        message: `A mentoring session on "${topic}" has been scheduled for ${new Date(scheduledDate).toLocaleString()}`,
        relatedId: session._id,
        relatedModel: 'MentoringSession',
        priority: 'high'
      });

      // Send email notification
      await sendEmail({
        to: student.email,
        subject: 'Mentoring Session Scheduled - College Digital Portal',
        html: `
          <h2>New Mentoring Session Scheduled</h2>
          <p>Dear ${student.name},</p>
          <p>A mentoring session has been scheduled with the following details:</p>
          <ul>
            <li><strong>Topic:</strong> ${topic}</li>
            <li><strong>Title:</strong> ${title}</li>
            <li><strong>Date & Time:</strong> ${new Date(scheduledDate).toLocaleString()}</li>
            <li><strong>Duration:</strong> ${duration} minutes</li>
            ${meetingLink ? `<li><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></li>` : ''}
            ${location ? `<li><strong>Location:</strong> ${location}</li>` : ''}
          </ul>
          <p>${description || ''}</p>
          <p>Faculty: ${req.user.name}</p>
          <p>Login to view more details and join the session.</p>
        `
      });
    }

    // Emit socket events
    const io = req.app.get('io');
    students.forEach(studentId => {
      io.to(studentId.toString()).emit('notification', {
        type: 'mentoring_scheduled',
        message: `New mentoring session scheduled: ${topic}`
      });
    });

    res.status(201).json({
      success: true,
      session: populatedSession
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get mentoring sessions
// @route   GET /api/mentoring
// @access  Private
export const getMentoringSessions = async (req, res) => {
  try {
    let query = {};

    // Faculty sees sessions they created
    if (req.user.role === 'faculty') {
      query = { faculty: req.user.id };
    }

    // Students see sessions they're invited to
    if (req.user.role === 'student') {
      query = { students: req.user.id };
    }

    const sessions = await MentoringSession.find(query)
      .populate('faculty', 'name email')
      .populate('students', 'name email studentId')
      .populate('attendees.student', 'name email studentId')
      .sort('scheduledDate');

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single mentoring session
// @route   GET /api/mentoring/:id
// @access  Private
export const getMentoringSession = async (req, res) => {
  try {
    const session = await MentoringSession.findById(req.params.id)
      .populate('faculty', 'name email')
      .populate('students', 'name email studentId')
      .populate('attendees.student', 'name email studentId');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Mentoring session not found'
      });
    }

    // Check authorization
    const isAuthorized = 
      session.faculty._id.toString() === req.user.id ||
      session.students.some(s => s._id.toString() === req.user.id) ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this session'
      });
    }

    res.status(200).json({
      success: true,
      session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update mentoring session
// @route   PUT /api/mentoring/:id
// @access  Private (Faculty)
export const updateMentoringSession = async (req, res) => {
  try {
    let session = await MentoringSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Mentoring session not found'
      });
    }

    // Check if user is the faculty who created the session
    if (session.faculty.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this session'
      });
    }

    session = await MentoringSession.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('students', 'name email');

    // Notify students if session details changed
    if (req.body.scheduledDate || req.body.meetingLink || req.body.location) {
      for (const student of session.students) {
        await Notification.create({
          recipient: student._id,
          sender: req.user.id,
          type: 'mentoring',
          title: 'Mentoring Session Updated',
          message: `The mentoring session "${session.title}" has been updated`,
          relatedId: session._id,
          relatedModel: 'MentoringSession'
        });
      }
    }

    res.status(200).json({
      success: true,
      session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark attendance for mentoring session
// @route   PUT /api/mentoring/:id/attendance
// @access  Private (Student)
export const markAttendance = async (req, res) => {
  try {
    const session = await MentoringSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Mentoring session not found'
      });
    }

    const attendee = session.attendees.find(
      a => a.student.toString() === req.user.id
    );

    if (!attendee) {
      return res.status(400).json({
        success: false,
        message: 'You are not invited to this session'
      });
    }

    attendee.attended = true;
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add feedback to mentoring session
// @route   PUT /api/mentoring/:id/feedback
// @access  Private (Student)
export const addFeedback = async (req, res) => {
  try {
    const { feedback } = req.body;
    const session = await MentoringSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Mentoring session not found'
      });
    }

    const attendee = session.attendees.find(
      a => a.student.toString() === req.user.id
    );

    if (!attendee) {
      return res.status(400).json({
        success: false,
        message: 'You are not invited to this session'
      });
    }

    attendee.feedback = feedback;
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Feedback added successfully',
      session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel mentoring session
// @route   DELETE /api/mentoring/:id
// @access  Private (Faculty)
export const cancelMentoringSession = async (req, res) => {
  try {
    const session = await MentoringSession.findById(req.params.id)
      .populate('students', 'name email');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Mentoring session not found'
      });
    }

    if (session.faculty.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this session'
      });
    }

    session.status = 'cancelled';
    await session.save();

    // Notify all students
    for (const student of session.students) {
      await Notification.create({
        recipient: student._id,
        sender: req.user.id,
        type: 'mentoring',
        title: 'Mentoring Session Cancelled',
        message: `The mentoring session "${session.title}" scheduled for ${new Date(session.scheduledDate).toLocaleString()} has been cancelled`,
        relatedId: session._id,
        relatedModel: 'MentoringSession',
        priority: 'high'
      });

      await sendEmail({
        to: student.email,
        subject: 'Mentoring Session Cancelled - College Digital Portal',
        html: `
          <h2>Mentoring Session Cancelled</h2>
          <p>Dear ${student.name},</p>
          <p>The mentoring session with the following details has been cancelled:</p>
          <ul>
            <li><strong>Topic:</strong> ${session.topic}</li>
            <li><strong>Scheduled Date:</strong> ${new Date(session.scheduledDate).toLocaleString()}</li>
          </ul>
          <p>Please check the portal for any rescheduled sessions.</p>
        `
      });
    }

    res.status(200).json({
      success: true,
      message: 'Mentoring session cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};