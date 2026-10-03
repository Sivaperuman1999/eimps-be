import express from 'express';
import Category from '../models/Category.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    if (req.query.page) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 25;
      const skip = (page - 1) * limit;

      const categories = await Category.find().skip(skip).limit(limit);
      const total = await Category.countDocuments();

      return res.sendSuccess({
        categories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    }

    const categories = await Category.find();
    res.sendSuccess(categories);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      const err = new Error('Category not found');
      err.statusCode = 404;
      return next(err);
    }
    res.sendSuccess(category);
  } catch (err) {
    next(err);
  }
});

router.post('/', authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.sendSuccess(category, 201);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) {
      const err = new Error('Category not found');
      err.statusCode = 404;
      return next(err);
    }
    res.sendSuccess(category);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      const err = new Error('Category not found');
      err.statusCode = 404;
      return next(err);
    }
    res.sendSuccess({ message: 'Category deleted successfully' });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const category = await Category.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    res.sendSuccess(category);
  } catch (err) {
    next(err);
  }
});

export default router;
