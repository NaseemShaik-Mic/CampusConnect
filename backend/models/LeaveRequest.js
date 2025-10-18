import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide end date']
  },
  reason: {
    type: String,
    required: [true, 'Please provide reason for leave']
  },
  leaveType: {
    type: String,
    enum: ['sick', 'casual', 'emergency', 'other'],
    default: 'casual'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  attachments: [String],
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  comments: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
leaveRequestSchema.index({ student: 1, status: 1, startDate: -1 });

export default mongoose.model('LeaveRequest', leaveRequestSchema);