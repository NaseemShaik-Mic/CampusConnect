import mongoose from 'mongoose';

const mentoringSessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide session title']
  },
  description: String,
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  scheduledDate: {
    type: Date,
    required: [true, 'Please provide scheduled date']
  },
  duration: {
    type: Number, // in minutes
    default: 60
  },
  meetingLink: String,
  location: String,
  topic: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  attendees: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    attended: {
      type: Boolean,
      default: false
    },
    feedback: String
  }],
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
mentoringSessionSchema.index({ faculty: 1, scheduledDate: 1 });
mentoringSessionSchema.index({ students: 1, scheduledDate: 1 });

export default mongoose.model('MentoringSession', mentoringSessionSchema);