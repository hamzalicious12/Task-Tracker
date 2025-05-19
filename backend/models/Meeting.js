import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'],
    default: 'SCHEDULED'
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },  department: {
    type: String,
    required: true,
    default: 'General'
  }
}, {
  timestamps: true
});

// Add validation for meeting time
meetingSchema.pre('save', function(next) {
  const now = new Date();
  if (this.startTime < now) {
    const error = new Error('Meeting start time cannot be in the past');
    return next(error);
  }
  if (this.endTime <= this.startTime) {
    const error = new Error('Meeting end time must be after start time');
    return next(error);
  }
  next();
});

export default mongoose.model('Meeting', meetingSchema);
