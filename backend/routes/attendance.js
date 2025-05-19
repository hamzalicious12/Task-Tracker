import express from 'express';
import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get attendance records with filters
router.get('/', auth, async (req, res) => {
  try {
    const filters = {};
    const { startDate, endDate, department, userId } = req.query;

    if (startDate && endDate) {
      filters.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (department) {
      filters.department = department;
    }

    if (userId) {
      filters.userId = userId;
    }

    // For employees, only show their own attendance
    if (req.user.role === 'EMPLOYEE') {
      filters.userId = req.user.id;
    }

    // For directors, only show their department's attendance
    if (req.user.role === 'DIRECTOR') {
      filters.department = req.user.department;
    }

    const attendance = await Attendance.find(filters)
      .populate('userId', 'name email department')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark attendance (check-in)
router.post('/check-in', auth, async (req, res) => {
  try {
    console.log('Check-in request received from user:', req.user.id);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!req.user || !req.user.id) {
      console.error('Invalid user in check-in request');
      return res.status(400).json({ message: 'Invalid user information' });
    }

    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      userId: req.user.id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance) {
      if (existingAttendance.checkOut) {
        return res.status(400).json({
          message: 'Already checked out for today',
          attendance: existingAttendance
        });
      }
      return res.status(400).json({
        message: 'Already checked in for today',
        attendance: existingAttendance
      });    }
    
    // Get work hours from configuration or default to 9 AM
    const workStartHour = 9;
    const now = new Date();
    const workStart = new Date(today);
    workStart.setHours(workStartHour);

    // Calculate late status
    const isLate = now > workStart;
    console.log(`Check-in time: ${now}, Work start: ${workStart}, Is late: ${isLate}`);
    
    // If user doesn't have a department, fetch the user data from the database
    let userDepartment = req.user.department;
    console.log('User department from token:', userDepartment);
    
    try {
      if (!userDepartment) {
        const user = await User.findById(req.user.id);
        console.log('User data from DB:', user);
        
        if (!user) {
          console.error(`User not found: ${req.user.id}`);
          return res.status(404).json({ message: 'User not found' });
        }
        
        userDepartment = user.department || 'Administration';
        console.log('User department set to:', userDepartment);
      }
    } catch (error) {
      console.error('Error fetching user department:', error);
      return res.status(500).json({ message: 'Failed to fetch user information' });
    }      try {
        // Validate the user ID and department before creating the record
        if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
          console.error('Invalid user ID format:', req.user.id);
          return res.status(400).json({ 
            message: 'Invalid user ID format' 
          });
        }

        if (!userDepartment) {
          console.error('Department is missing for user:', req.user.id);
          userDepartment = 'General'; // Set default department if missing
          console.log('Set default department to "General"');
        }

        // Create the attendance record with proper validation
        console.log('Creating attendance record with data:', {
          userId: req.user.id,
          department: userDepartment,
          date: now.toISOString(),
          checkIn: now.toISOString(),
          status: isLate ? 'LATE' : 'PRESENT'
        });
        
        // Create attendance record
        const attendance = new Attendance({
          userId: req.user.id,
          department: userDepartment,
          date: now,
          checkIn: now,
          status: isLate ? 'LATE' : 'PRESENT'
        });
        
        // Pre-validate the record before saving
        const validationError = attendance.validateSync();
        if (validationError) {
          console.error('Validation failed:', validationError);
          const errors = Object.keys(validationError.errors).map(key => ({
            field: key,
            message: validationError.errors[key].message
          }));
          return res.status(400).json({ 
            message: 'Validation error before save', 
            errors 
          });
        }
        
        // Save the record
        await attendance.save();
        console.log('Attendance record saved with ID:', attendance._id);
        
        // Populate the attendance record with user details
        let populatedAttendance;
        try {
          populatedAttendance = await Attendance.findById(attendance._id)
            .populate('userId', 'name email department');
          console.log('Populated attendance:', populatedAttendance);
        } catch (populateErr) {
          console.error('Error populating attendance:', populateErr);
          // Continue even if population fails
          populatedAttendance = attendance;
        }

        // Return success response
        res.status(201).json({
          message: isLate ? 'Checked in late' : 'Checked in successfully',
          attendance: populatedAttendance
        });
      } catch (saveError) {
        console.error('Error saving attendance record:', saveError);
        
        // Check for specific error types
        if (saveError.name === 'ValidationError') {
          const validationErrors = Object.values(saveError.errors).map(err => err.message);
          return res.status(400).json({ 
            message: 'Validation error', 
            errors: validationErrors 
          });
        }
        
        // Check for duplicate key error
        if (saveError.code === 11000) {
          console.error('Duplicate key error details:', saveError.keyValue);
          return res.status(400).json({ 
            message: 'Duplicate attendance record for today',
            details: saveError.keyValue
          });
        }
        
        // Check for connection errors
        if (saveError.name === 'MongooseServerSelectionError') {
          console.error('Database connection error:', saveError.message);
          return res.status(503).json({
            message: 'Database connection error, please try again later',
            error: 'SERVICE_UNAVAILABLE'
          });
        }
        
        // Generic server error
        console.error('Unhandled error during attendance save:', saveError);
        res.status(500).json({ 
          message: 'Server error during check-in', 
          error: saveError.message,
          stack: process.env.NODE_ENV === 'development' ? saveError.stack : undefined
        });
      }  } catch (err) {
    console.error('Check-in error:', err);
    // Track the error for diagnostics
    trackAttendanceError(err, req.user?.id, 'check-in');
    res.status(500).json({ 
      message: 'Server error during check-in', 
      error: err.message,
      errorId: Date.now().toString(36) // Provide a reference ID for the error
    });
  }
});

// Mark attendance (check-out)
router.post('/check-out', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      userId: req.user.id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!attendance) {
      return res.status(400).json({ message: 'No check-in record found for today' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        message: 'Already checked out for today',
        attendance
      });
    }

    // Get work hours from configuration or default to 5 PM
    const workEndHour = 17;
    const now = new Date();
    const workEnd = new Date(today);
    workEnd.setHours(workEndHour);

    // Calculate early leave status
    const isEarlyLeave = now < workEnd;

    attendance.checkOut = now;
    attendance.status = isEarlyLeave ? 'EARLY_LEAVE' : attendance.status;
    attendance.duration = (now - attendance.checkIn) / (1000 * 60 * 60); // Duration in hours

    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('userId', 'name email department');

    res.json({
      message: isEarlyLeave ? 'Checked out early' : 'Checked out successfully',
      attendance: populatedAttendance
    });
  } catch (err) {
    console.error('Check-out error:', err);
    res.status(500).json({ message: 'Server error during check-out' });
  }
});

// Get attendance statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { userId, department, startDate, endDate } = req.query;
    const filters = { };

    // Default to last 30 days if no date range specified
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end);
    start.setDate(start.getDate() - 30);

    filters.date = {
      $gte: start,
      $lte: end
    };

    if (department) {
      filters.department = department;
    }

    if (userId) {
      filters.userId = userId;
    }

    // For employees, only show their own stats
    if (req.user.role === 'EMPLOYEE') {
      filters.userId = req.user.id;
    }

    // For directors, only show their department's stats
    if (req.user.role === 'DIRECTOR') {
      filters.department = req.user.department;
    }

    const attendanceRecords = await Attendance.find(filters).sort({ date: 1 });
    
    const stats = {
      totalDays: Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
      presentDays: 0,
      lateDays: 0,
      absentDays: 0,
      attendanceByDate: []
    };

    // Process records
    attendanceRecords.forEach(record => {
      if (record.status === 'PRESENT') stats.presentDays++;
      else if (record.status === 'LATE') stats.lateDays++;
      else if (record.status === 'ABSENT') stats.absentDays++;

      stats.attendanceByDate.push({
        date: record.date.toISOString(),
        status: record.status,
        checkIn: record.checkIn?.toISOString(),
        checkOut: record.checkOut?.toISOString()
      });
    });

    stats.attendancePercentage = (stats.presentDays / stats.totalDays) * 100;

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get department attendance statistics
router.get('/departments', auth, authorize(['CEO']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const departments = await Attendance.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(today.getFullYear(), today.getMonth(), 1),
            $lte: today
          }
        }
      },
      {
        $group: {
          _id: '$department',
          present: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'PRESENT'] },
                1,
                0
              ]
            }
          },
          total: { $sum: 1 },
          presentToday: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'PRESENT'] },
                    { $eq: ['$date', today] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          department: '$_id',
          averageAttendance: { $multiply: [{ $divide: ['$present', '$total'] }, 100] },
          presentToday: 1
        }
      }
    ]);

    res.json(departments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Diagnostics endpoint for troubleshooting attendance issues
router.get('/diagnostics', auth, async (req, res) => {
  try {
    // Only allow admins and developers to access this endpoint
    if (!['ADMIN', 'CEO'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized access to diagnostics' });
    }
    
    // Collect system information
    const diagnosticInfo = {
      serverTime: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      mongodbConnectionState: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
    };
    
    // Get attendance statistics
    const attendanceCounts = await Attendance.aggregate([
      { $group: { 
        _id: '$status', 
        count: { $sum: 1 } 
      }},
    ]);
    
    // Get recent errors if any
    const recentErrors = global.attendanceErrors || [];
    
    // Get sample records for each status type
    const sampleRecords = {};
    const statusTypes = ['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT'];
    
    for (const status of statusTypes) {
      const samples = await Attendance.find({ status })
        .sort({ createdAt: -1 })
        .limit(2)
        .populate('userId', 'name email department');
      
      sampleRecords[status] = samples;
    }
    
    // Return all diagnostic information
    res.json({
      diagnosticInfo,
      attendanceCounts,
      recentErrors,
      sampleRecords,
      userInfo: {
        id: req.user.id,
        role: req.user.role,
        department: req.user.department || 'Not set'
      }
    });
  } catch (err) {
    console.error('Diagnostics error:', err);
    res.status(500).json({ message: 'Error fetching diagnostics', error: err.message });
  }
});

// Setup global error tracking for attendance
global.attendanceErrors = [];
const trackAttendanceError = (error, userId, operation) => {
  const errorInfo = {
    timestamp: new Date(),
    userId,
    operation,
    errorMessage: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  };
  
  // Keep only last 20 errors
  global.attendanceErrors.unshift(errorInfo);
  if (global.attendanceErrors.length > 20) {
    global.attendanceErrors.pop();
  }
};

export default router;
