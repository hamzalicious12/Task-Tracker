import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },  type: {
    type: String,
    enum: ['TASK_ASSIGNED', 'TASK_UPDATED', 'MEETING_SCHEDULED', 'MEETING_UPDATED', 'TASK_DUE_SOON', 'MEETING_REMINDER', 'MEETING_CANCELLED', 'ATTENDANCE_REMINDER'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, read: 1 });

export default mongoose.model('Notification', notificationSchema);
