import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    required: true
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const attendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  session: {
    type: String,
    enum: ['morning', 'afternoon'],
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  records: [attendanceRecordSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate attendance entries
attendanceSchema.index({ date: 1, subject: 1, department: 1, semester: 1, session: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);