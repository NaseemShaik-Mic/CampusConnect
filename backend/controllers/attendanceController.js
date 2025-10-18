import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

// @desc    Mark attendance
// @route   POST /api/attendance
// @access  Private (Faculty/Admin)
export const markAttendance = async (req, res) => {
  try {
    const { date, subject, department, semester, session, records } = req.body;

    // Validate required fields
    if (!date || !subject || !department || !semester || !session || !records) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if attendance already marked
    const existingAttendance = await Attendance.findOne({
      date: new Date(date),
      subject,
      department,
      semester,
      session
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this session'
      });
    }

    // Mark attendance with proper records structure
    const attendance = await Attendance.create({
      date: new Date(date),
      subject,
      department,
      semester,
      session,
      faculty: req.user?.id || null,
      records: records.map(r => ({
        student: r.student,
        status: r.status,
        markedBy: req.user?.id || null
      }))
    });

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Private
export const getAttendance = async (req, res) => {
  try {
    let query = {};
    let attendance = [];

    const userRole = req.user?.role?.toLowerCase();
    const isStudent = userRole === 'student';
    const isFaculty = userRole === 'faculty' || userRole === 'admin';

    // If student, show their own attendance
    if (isStudent && req.user) {
      const allAttendance = await Attendance.find({
        department: req.user.department,
        semester: req.user.semester
      })
        .populate('faculty', 'name')
        .populate('records.student', 'name email studentId')
        .sort('-date');

      // Filter records for this student
      attendance = allAttendance
        .map(att => {
          const studentRecords = att.records.filter(r => 
            r.student._id.toString() === req.user.id || r.student.toString() === req.user.id
          );
          
          if (studentRecords.length > 0) {
            return {
              ...att.toObject(),
              records: studentRecords
            };
          }
          return null;
        })
        .filter(att => att !== null);

      return res.status(200).json({
        success: true,
        count: attendance.length,
        attendance: attendance.map(att => ({
          date: att.date,
          subject: att.subject,
          status: att.records[0]?.status || 'absent'
        }))
      });
    }

    // If faculty, show attendance they marked
    if (isFaculty && req.user) {
      query = { faculty: req.user.id };
      attendance = await Attendance.find(query)
        .populate('faculty', 'name')
        .populate('records.student', 'name email studentId')
        .sort('-date');
    } else {
      // Demo mode: return sample attendance
      attendance = await Attendance.find()
        .populate('faculty', 'name')
        .populate('records.student', 'name email studentId')
        .sort('-date')
        .limit(10);
    }

    res.status(200).json({
      success: true,
      count: attendance.length,
      attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
// @access  Private (Student)
export const getAttendanceStats = async (req, res) => {
  try {
    if (!req.user) {
      // Demo mode with mock stats
      return res.status(200).json({
        success: true,
        stats: {
          totalClasses: 100,
          presentCount: 85,
          absentCount: 15,
          overallPercentage: '85.00',
          subjectWise: [
            { subject: 'Math', present: 27, total: 30, percentage: '90.00' },
            { subject: 'Physics', present: 25, total: 30, percentage: '83.33' },
            { subject: 'Chemistry', present: 24, total: 30, percentage: '80.00' }
          ]
        }
      });
    }

    const attendance = await Attendance.find({
      department: req.user.department,
      semester: req.user.semester,
      'records.student': req.user.id
    });

    let totalClasses = 0;
    let presentCount = 0;
    const subjectWise = {};

    attendance.forEach(att => {
      const record = att.records.find(r => 
        r.student.toString() === req.user.id
      );
      
      if (record) {
        totalClasses++;
        if (record.status === 'present') {
          presentCount++;
        }

        if (!subjectWise[att.subject]) {
          subjectWise[att.subject] = { total: 0, present: 0 };
        }
        subjectWise[att.subject].total++;
        if (record.status === 'present') {
          subjectWise[att.subject].present++;
        }
      }
    });

    const overallPercentage = totalClasses > 0 
      ? ((presentCount / totalClasses) * 100).toFixed(2) 
      : '0.00';

    const subjectStats = Object.keys(subjectWise).map(subject => ({
      subject,
      total: subjectWise[subject].total,
      present: subjectWise[subject].present,
      percentage: ((subjectWise[subject].present / subjectWise[subject].total) * 100).toFixed(2)
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalClasses,
        presentCount,
        absentCount: totalClasses - presentCount,
        overallPercentage,
        subjectWise: subjectStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get students for attendance marking
// @route   GET /api/attendance/students
// @access  Private (Faculty/Admin)
export const getStudentsForAttendance = async (req, res) => {
  try {
    const { department, semester, section } = req.query;

    let query = {};
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);

    const students = await User.find({
      role: 'student',
      ...query
    }).select('_id name studentId email department semester');

    res.status(200).json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};