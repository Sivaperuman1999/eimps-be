import express from 'express';
import GoodsReceipt from '../models/GoodsReceipt.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const receipts = await GoodsReceipt.find().populate({
      path: 'purchaseOrderId',
      select: 'poNumber vendorId',
      populate: {
        path: 'vendorId',
        select: 'name code'
      }
    }).populate('items.itemId', 'name sku');
    res.sendSuccess(receipts);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const receipt = await GoodsReceipt.findById(req.params.id).populate({
      path: 'purchaseOrderId',
      select: 'poNumber vendorId',
      populate: {
        path: 'vendorId',
        select: 'name code'
      }
    }).populate('items.itemId', 'name sku');
    if (!receipt) {
      const err = new Error('Goods Receipt not found');
      err.statusCode = 404;
      return next(err);
    }
    res.sendSuccess(receipt);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (!data.grnNumber) {
      data.grnNumber = `GRN-${Date.now()}`;
    }
    
    // Map quantity to receivedQuantity
    if (data.items && Array.isArray(data.items)) {
      data.items = data.items.map(item => ({
        ...item,
        receivedQuantity: item.quantity !== undefined ? item.quantity : item.receivedQuantity
      }));
    }

    const receipt = new GoodsReceipt(data);
    await receipt.save();
    res.sendSuccess(receipt, 201);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const data = { ...req.body };
    
    // Map quantity to receivedQuantity
    if (data.items && Array.isArray(data.items)) {
      data.items = data.items.map(item => ({
        ...item,
        receivedQuantity: item.quantity !== undefined ? item.quantity : item.receivedQuantity
      }));
    }

    const receipt = await GoodsReceipt.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!receipt) {
      const err = new Error('Goods Receipt not found');
      err.statusCode = 404;
      return next(err);
    }
    res.sendSuccess(receipt);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const receipt = await GoodsReceipt.findByIdAndDelete(req.params.id);
    if (!receipt) {
      const err = new Error('Goods Receipt not found');
      err.statusCode = 404;
      return next(err);
    }
    res.sendSuccess({ message: 'Goods Receipt deleted successfully' });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const receipt = await GoodsReceipt.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.sendSuccess(receipt);
  } catch (err) {
    next(err);
  }
});

export default router;
