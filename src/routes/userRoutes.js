import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const loggedInUserId = req.user._id;
    const query = { _id: { $ne: loggedInUserId } };

    const users = await User.find(query).select('-password');
    const total = await User.countDocuments(query);

    res.sendSuccess({
      users,
      pagination: {
        page: 1,
        limit: users.length > 0 ? users.length : 10,
        total: total,
        totalPages: 1
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/admin-test', authorizeRoles('ADMIN'), (req, res) => {
  res.sendSuccess({ message: 'Admin access granted' });
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }
    res.sendSuccess(user);
  } catch (err) {
    next(err);
  }
});

router.post('/', authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    res.sendSuccess(user, 201);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const { name, email, role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { name, email, role }, { new: true, runValidators: true }).select('-password');
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }
    res.sendSuccess(user);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }
    res.sendSuccess({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password');
    res.sendSuccess(user);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/password', async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.params.id);
    
    // Only admins or the user themselves can change the password
    if (req.user.role !== 'ADMIN' && req.user.id !== req.params.id) {
      const err = new Error('Forbidden');
      err.statusCode = 403;
      return next(err);
    }

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }

    const passwordValid = await bcrypt.compare(oldPassword, user.password);
    if (!passwordValid && req.user.role !== 'ADMIN') { // Admin can override old password check if needed, but usually we require it. For safety, let's require it unless implemented otherwise.
      const err = new Error('Invalid old password');
      err.statusCode = 400;
      return next(err);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.sendSuccess({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
