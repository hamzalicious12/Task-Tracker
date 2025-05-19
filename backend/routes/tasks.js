import express from 'express';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get tasks with filters
router.get('/', auth, async (req, res) => {
  try {
    const filters = {};
    
    if (req.query.department) {
      filters.department = req.query.department;
    }
    
    if (req.query.assignedTo) {
      filters.assignedTo = req.query.assignedTo;
    }

    const tasks = await Task.find(filters)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
      
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task
router.post('/', auth, authorize(['CEO', 'DIRECTOR']), async (req, res) => {
  try {
    const task = new Task({
      ...req.body,
      assignedBy: req.user.id,
      department: req.user.department // Ensure department is set
    });
    
    await task.save();

    // Create notification for assigned user
    const notification = new Notification({
      recipient: task.assignedTo,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${task.title}`,
      relatedId: task._id,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await notification.save();
    
    // Populate the notification
    await notification.populate('recipient', 'name email');

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    
    res.status(201).json(populatedTask);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.patch('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only assigned user, assigner, or CEO can update
    if (
      req.user.role !== 'CEO' &&
      task.assignedTo.toString() !== req.user.id &&
      task.assignedBy.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const previousStatus = task.status;
    Object.assign(task, req.body);
    await task.save();
    
    // Create notification if task is completed
    if (previousStatus !== 'COMPLETED' && task.status === 'COMPLETED') {
      try {
        // Find the assigner to notify them
        const notification = new Notification({
          recipient: task.assignedBy,
          type: 'TASK_UPDATED',
          title: 'Task Completed',
          message: `Task "${task.title}" has been completed`,
          relatedId: task._id,
          read: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await notification.save();
        
        // If task was assigned by someone other than CEO, also notify the CEO
        const departmentDirector = task.assignedBy;
        
        // Find CEO to notify of completion if not already the assignedBy
        if (departmentDirector && departmentDirector !== task.assignedBy) {
          const ceoNotification = new Notification({
            recipient: departmentDirector,
            type: 'TASK_UPDATED',
            title: 'Task Completed in Department',
            message: `Task "${task.title}" in the ${task.department} department has been completed`,
            relatedId: task._id,
            read: false,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          await ceoNotification.save();
        }
      } catch (notificationErr) {
        console.error('Error creating task completion notification:', notificationErr);
        // Continue anyway, don't fail the update
      }
    }
    
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', auth, authorize(['CEO', 'DIRECTOR']), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;