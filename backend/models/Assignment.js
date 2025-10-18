import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: String,
  submittedAt: {
    type: Date,
    default: Date.now
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', null],
    default: null
  },
  feedback: {
    type: String,
    default: ''
  },
  gradedAt: Date,
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['submitted', 'graded'],
    default: 'submitted'
  }
});

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide assignment title'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please provide assignment description']
    },
    subject: {
      type: String,
      required: [true, 'Please provide subject'],
      trim: true
    },
    department: {
      type: String,
      required: [true, 'Please provide department']
    },
    semester: {
      type: Number,
      required: [true, 'Please provide semester']
    },
    dueDate: {
      type: Date,
      required: [true, 'Please provide due date']
    },
    maxMarks: {
      type: Number,
      default: 100,
      min: 1
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    submissions: [submissionSchema],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
assignmentSchema.index({ department: 1, semester: 1, dueDate: 1 });
assignmentSchema.index({ createdBy: 1, createdAt: -1 });
assignmentSchema.index({ isActive: 1 });

export default mongoose.model('Assignment', assignmentSchema);