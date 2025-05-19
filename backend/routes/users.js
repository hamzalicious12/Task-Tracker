import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get users
router.get('/', auth, async (req, res) => {
  try {
    const filters = {};
    
    if (req.query.department) {
      filters.department = req.query.department;
    }
    
    const users = await User.find(filters).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create user (Admin only)
router.post('/', auth, authorize(['ADMIN']), async (req, res) => {
  try {
    const { email } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User(req.body);
    await user.save();

    const { password, ...userWithoutPassword } = user.toObject();
    res.status(201).json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user
router.patch('/:id', auth, authorize(['ADMIN']), async (req, res) => {
  try {
    const updates = { ...req.body };
    
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/:id', auth, authorize(['ADMIN']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;