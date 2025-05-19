import express from 'express';
import Department from '../models/Department.js';
import User from '../models/User.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all departments
router.get('/', auth, async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('director', 'name email')
      .lean();

    // For each department, get the count of employees
    const departmentsWithCounts = await Promise.all(departments.map(async (dept) => {
      const employeeCount = await User.countDocuments({ department: dept.name });
      return { ...dept, employeeCount };
    }));

    res.json(departmentsWithCounts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new department
router.post('/', auth, authorize(['ADMIN']), async (req, res) => {
  try {
    const { name, description, directorId } = req.body;

    // Check if department already exists
    const existingDept = await Department.findOne({ name });
    if (existingDept) {
      return res.status(400).json({ message: 'Department already exists' });
    }

    const department = new Department({
      name,
      description,
      director: directorId
    });

    await department.save();

    const populatedDepartment = await Department.findById(department._id)
      .populate('director', 'name email');

    res.status(201).json(populatedDepartment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update department
router.patch('/:id', auth, authorize(['ADMIN']), async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('director', 'name email');

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json(department);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete department
router.delete('/:id', auth, authorize(['ADMIN']), async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if there are any users in this department
    const userCount = await User.countDocuments({ department: department.name });
    if (userCount > 0) {
      return res.status(400).json({ message: 'Cannot delete department with active users' });
    }

    await department.remove();
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
