import express from 'express';
import Meeting from '../models/Meeting.js';
import Notification from '../models/Notification.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get meetings
router.get('/', auth, async (req, res) => {
  try {
    const filters = {};
    
    if (req.query.department) {
      filters.department = req.query.department;
    }
    
    if (req.query.organizer) {
      filters.organizer = req.query.organizer;
    }

    // For employees, only show meetings where they are participants
    if (req.user.role === 'EMPLOYEE') {
      filters.$or = [
        { participants: req.user.id },
        { organizer: req.user.id }
      ];
    }

    // For directors, only show their department's meetings
    if (req.user.role === 'DIRECTOR') {
      filters.department = req.user.department;
    }

    const meetings = await Meeting.find(filters)
      .populate('participants', 'name email department')
      .populate('organizer', 'name email department')
      .sort({ startTime: 1 }); // Sort by start time ascending
      
    res.json(meetings);
  } catch (err) {
    console.error('Get meetings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create meeting
router.post('/', auth, authorize(['CEO', 'DIRECTOR']), async (req, res) => {
  try {
    const now = new Date();
    const startTime = new Date(req.body.startTime);
    const endTime = new Date(req.body.endTime);
    
    // Validate meeting time
    if (startTime < now) {
      return res.status(400).json({ message: 'Meeting cannot be scheduled in the past' });
    }

    if (endTime <= startTime) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Ensure reasonable meeting duration (e.g., not more than 8 hours)
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (durationHours > 8) {
      return res.status(400).json({ message: 'Meeting duration cannot exceed 8 hours' });
    }

    // Validate participants
    if (!req.body.participants || !Array.isArray(req.body.participants) || req.body.participants.length === 0) {
      return res.status(400).json({ message: 'At least one participant is required' });
    }

    // Check for overlapping meetings for participants and organizer
    const overlappingMeetings = await Meeting.find({
      $and: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        },
        {
          $or: [
            { participants: { $in: [...req.body.participants, req.user.id] } },
            { organizer: { $in: [...req.body.participants, req.user.id] } }
          ]
        }
      ]
    }).populate('participants', 'name email');

    if (overlappingMeetings.length > 0) {
      return res.status(409).json({
        message: 'Schedule conflict detected',
        conflicts: overlappingMeetings.map(m => ({
          title: m.title,
          startTime: m.startTime,
          endTime: m.endTime,
          conflictingParticipants: m.participants
            .filter(p => req.body.participants.includes(p._id.toString()))
            .map(p => p.name)
        }))
      });
    }    // Debug log
    console.log(`Creating meeting with user ID: ${req.user.id}, role: ${req.user.role}, department: ${req.user.department}`);
    console.log('Meeting data:', req.body);
    
    // Make sure department is set properly
    const department = req.body.department || req.user.department || 'General';
    
    const meeting = new Meeting({
      ...req.body,
      organizer: req.user.id,
      department: department,
      status: 'SCHEDULED'
    });

    await meeting.save();// Create notifications for participants
    const notifications = req.body.participants.map(participantId => ({
      recipient: participantId,
      type: 'MEETING_SCHEDULED',
      title: 'New Meeting',
      message: `You have been invited to: ${meeting.title}`,
      relatedId: meeting._id,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await Notification.insertMany(notifications);

    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('participants', 'name email department')
      .populate('organizer', 'name email department');

    res.status(201).json(populatedMeeting);
  } catch (err) {
    console.error('Meeting creation error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update meeting
router.put('/:id', auth, authorize(['CEO', 'DIRECTOR']), async (req, res) => {
  try {
    const now = new Date();
    const startTime = new Date(req.body.startTime);
    const endTime = new Date(req.body.endTime);
    
    // Validate meeting time
    if (startTime < now) {
      return res.status(400).json({ message: 'Meeting cannot be scheduled in the past' });
    }

    if (endTime <= startTime) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Check if user has permission to update
    if (meeting.organizer.toString() !== req.user.id && req.user.role !== 'CEO') {
      return res.status(403).json({ message: 'Not authorized to update this meeting' });
    }

    // Check for overlapping meetings for new participants
    if (req.body.participants) {
      const overlappingMeetings = await Meeting.find({
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
          }
        ],
        participants: { $in: req.body.participants },
        _id: { $ne: req.params.id }
      });

      if (overlappingMeetings.length > 0) {
        return res.status(409).json({
          message: 'One or more participants have overlapping meetings',
          conflicts: overlappingMeetings
        });
      }
    }

    // Get removed participants to send cancellation notifications
    const removedParticipants = meeting.participants.filter(p => 
      !req.body.participants.includes(p.toString())
    );

    // Get new participants to send invitation notifications
    const newParticipants = req.body.participants.filter(p => 
      !meeting.participants.includes(p)
    );

    Object.assign(meeting, req.body);
    await meeting.save();

    // Send notifications
    if (newParticipants.length > 0) {    const inviteNotifications = newParticipants.map(participantId => ({
        recipient: participantId,
        type: 'MEETING_SCHEDULED',
        title: 'Meeting Invitation',
        message: `You've been added to meeting: ${meeting.title}`,
        relatedId: meeting._id,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      await Notification.insertMany(inviteNotifications);
    }    if (removedParticipants.length > 0) {
      const cancelNotifications = removedParticipants.map(participantId => ({
        recipient: participantId,
        type: 'MEETING_CANCELLED',
        title: 'Meeting Removal',
        message: `You've been removed from meeting: ${meeting.title}`,
        relatedId: meeting._id,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      await Notification.insertMany(cancelNotifications);
    }

    const updatedMeeting = await Meeting.findById(req.params.id)
      .populate('participants', 'name email')
      .populate('organizer', 'name email');

    res.json(updatedMeeting);
  } catch (err) {
    console.error('Meeting update error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete meeting
router.delete('/:id', auth, authorize(['CEO', 'DIRECTOR']), async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }    // Only organizer or CEO can delete
    if (req.user.role !== 'CEO' && meeting.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Meeting.deleteOne({ _id: meeting._id });
    
    // Create cancellation notifications for all participants
    const notifications = meeting.participants.map(participantId => ({
      recipient: participantId,
      type: 'MEETING_CANCELLED',
      title: 'Meeting Cancelled',
      message: `The meeting "${meeting.title}" has been cancelled`,
      relatedId: meeting._id,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await Notification.insertMany(notifications);

    res.json({ message: 'Meeting deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
