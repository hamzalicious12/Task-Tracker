import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date
  },
  status: {
    type: String,
    enum: ['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT'],
    default: 'PRESENT'
  },  
  workHours: {
    type: Number,
    default: 0
  },  
  department: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries - only unique for the calendar date part (not time)
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

// Make sure date field only contains the date part (without time)
attendanceSchema.pre('validate', function(next) {
  if (this.date) {
    // Strip time component from the date field to store only the calendar date
    const dateOnly = new Date(this.date);
    dateOnly.setHours(0, 0, 0, 0);
    this.date = dateOnly;
  }
  next();
});

// Calculate work hours when checking out
attendanceSchema.pre('save', function(next) {
  if (this.checkOut && this.checkIn) {
    this.workHours = (this.checkOut.getTime() - this.checkIn.getTime()) / (1000 * 60 * 60); // Convert to hours
    
    // Update status based on work hours and check-in time
    const checkInHour = this.checkIn.getHours();
    if (checkInHour >= 10) { // If checked in after 10 AM
      this.status = 'LATE';
    }
    if (this.workHours < 4) {
      this.status = 'ABSENT';
    } else if (this.workHours < 8) {
      this.status = 'HALF_DAY';
    }
  }
  next();
});

export default mongoose.model('Attendance', attendanceSchema);
