import express from 'express';
import Item from '../models/Item.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    if (req.query.page) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 25;
      const skip = (page - 1) * limit;

      const items = await Item.find().populate('categoryId', 'name description').skip(skip).limit(limit);
      const total = await Item.countDocuments();

      return res.sendSuccess({
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    }

    const items = await Item.find().populate('categoryId', 'name description');
    res.sendSuccess(items);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate('categoryId', 'name description');
    if (!item) {
      const err = new Error('Item not found');
      err.statusCode = 404;
      return next(err);
    }
    res.sendSuccess(item);
  } catch (err) {
    next(err);
  }
});

router.post('/', authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const item = new Item(req.body);
    await item.save();
    res.sendSuccess(item, 201);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) {
      const err = new Error('Item not found');
      err.statusCode = 404;
      return next(err);
    }
    res.sendSuccess(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) {
      const err = new Error('Item not found');
      err.statusCode = 404;
      return next(err);
    }
    res.sendSuccess({ message: 'Item deleted successfully' });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const item = await Item.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    res.sendSuccess(item);
  } catch (err) {
    next(err);
  }
});

export default router;
