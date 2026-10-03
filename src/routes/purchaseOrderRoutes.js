import express from 'express';
import PurchaseOrder from '../models/PurchaseOrder.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    if (req.query.page) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 25;
      const skip = (page - 1) * limit;

      const purchaseOrders = await PurchaseOrder.find().populate('vendorId', 'name code').populate('items.itemId', 'name sku unitPrice').skip(skip).limit(limit);
      const total = await PurchaseOrder.countDocuments();

      return res.sendSuccess({
        purchaseOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    }

    const purchaseOrders = await PurchaseOrder.find().populate('vendorId', 'name code').populate('items.itemId', 'name sku unitPrice');
    res.sendSuccess(purchaseOrders);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id).populate('vendorId', 'name code').populate('items.itemId', 'name sku unitPrice');
    if (!purchaseOrder) {
      const err = new Error('Purchase Order not found');
      err.statusCode = 404;
      return next(err);
    }
    res.sendSuccess(purchaseOrder);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = { ...req.body };
    
    if (!data.poNumber) {
      data.poNumber = `PO-${Date.now()}`;
    }

    let totalAmount = 0;
    if (data.items && Array.isArray(data.items)) {
      data.items = data.items.map(item => {
        const totalPrice = (item.quantity || 0) * (item.unitPrice || 0);
        totalAmount += totalPrice;
        return { ...item, totalPrice };
      });
    }
    data.totalAmount = totalAmount;

    const po = new PurchaseOrder(data);
    await po.save();
    res.sendSuccess(po, 201);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const data = { ...req.body };
    
    if (data.items && Array.isArray(data.items)) {
      let totalAmount = 0;
      data.items = data.items.map(item => {
        const totalPrice = (item.quantity || 0) * (item.unitPrice || 0);
        totalAmount += totalPrice;
        return { ...item, totalPrice };
      });
      data.totalAmount = totalAmount;
    }

    // If updating items array or other complex fields
    const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!po) {
      const err = new Error('Purchase Order not found');
      err.statusCode = 404;
      return next(err);
    }
    res.sendSuccess(po);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findByIdAndDelete(req.params.id);
    if (!po) {
      const err = new Error('Purchase Order not found');
      err.statusCode = 404;
      return next(err);
    }
    res.sendSuccess({ message: 'Purchase Order deleted successfully' });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.sendSuccess(po);
  } catch (err) {
    next(err);
  }
});

export default router;
