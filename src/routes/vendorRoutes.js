import express from 'express';
import Vendor from '../models/Vendor.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    if (req.query.page) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 25;
      const skip = (page - 1) * limit;

      const vendors = await Vendor.find().skip(skip).limit(limit);
      const total = await Vendor.countDocuments();

      return res.sendSuccess({
        vendors,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    }

    const vendors = await Vendor.find();
    res.sendSuccess(vendors);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      const err = new Error('Vendor not found');
      err.statusCode = 404;
      return next(err);
    }
    res.sendSuccess(vendor);
  } catch (err) {
    next(err);
  }
});

router.post('/', authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const vendorData = { ...req.body };
    if (!vendorData.code) {
      vendorData.code = `VND-${Date.now()}`;
    }
    const vendor = new Vendor(vendorData);
    await vendor.save();
    res.sendSuccess(vendor, 201);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!vendor) {
      const err = new Error('Vendor not found');
      err.statusCode = 404;
      return next(err);
    }
    res.sendSuccess(vendor);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) {
      const err = new Error('Vendor not found');
      err.statusCode = 404;
      return next(err);
    }
    res.sendSuccess({ message: 'Vendor deleted successfully' });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    res.sendSuccess(vendor);
  } catch (err) {
    next(err);
  }
});

export default router;
