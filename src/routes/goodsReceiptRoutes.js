import express from 'express';
import GoodsReceipt from '../models/GoodsReceipt.js';
import Item from '../models/Item.js';
import StockTransaction from '../models/StockTransaction.js';
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

      const receipts = await GoodsReceipt.find().populate({
        path: 'purchaseOrderId',
        select: 'poNumber vendorId',
        populate: {
          path: 'vendorId',
          select: 'name code'
        }
      }).populate('items.itemId', 'name sku').skip(skip).limit(limit);
      const total = await GoodsReceipt.countDocuments();

      return res.sendSuccess({
        receipts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    }

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

router.patch('/:id/submit', async (req, res, next) => {
  try {
    const receipt = await GoodsReceipt.findById(req.params.id);
    if (!receipt) return next(Object.assign(new Error('Goods Receipt not found'), { statusCode: 404 }));

    if (receipt.status !== 'DRAFT') {
      return next(Object.assign(new Error('Only DRAFT receipts can be submitted'), { statusCode: 400 }));
    }

    receipt.status = 'SUBMITTED';
    await receipt.save();
    
    res.sendSuccess(receipt);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/approve', async (req, res, next) => {
  try {
    const role = req.user.roleCode || req.user.role;
    const receipt = await GoodsReceipt.findById(req.params.id);
    
    if (!receipt) return next(Object.assign(new Error('Goods Receipt not found'), { statusCode: 404 }));
    if (receipt.status === 'RECEIVED') return next(Object.assign(new Error('Goods receipt is already processed'), { statusCode: 400 }));

    let newStatus = receipt.status;

    if (receipt.status === 'SUBMITTED' && (role === 'MANAGER' || role === 'ADMIN')) {
      newStatus = 'PENDING_REVIEW';
    } else if (receipt.status === 'PENDING_REVIEW' && (role === 'MANAGER' || role === 'ADMIN')) {
      newStatus = 'RECEIVED';
      receipt.approvedBy = req.user.id;
      receipt.approvedAt = new Date();
    } else {
      return next(Object.assign(new Error('Invalid status transition or permission denied'), { statusCode: 403 }));
    }

    receipt.status = newStatus;
    await receipt.save();

    if (newStatus === 'RECEIVED') {
      // Process inventory updates
      for (const item of receipt.items) {
        const inventoryItem = await Item.findById(item.itemId);
        if (inventoryItem) {
          const previousStock = inventoryItem.currentStock || inventoryItem.quantity || 0;
          const newStock = previousStock + item.receivedQuantity;
          
          inventoryItem.currentStock = newStock;
          inventoryItem.quantity = newStock; 
          await inventoryItem.save();

          await StockTransaction.create({
            itemId: item.itemId,
            transactionType: 'RECEIPT',
            quantity: item.receivedQuantity,
            previousStock,
            newStock,
            referenceType: 'GOODS_RECEIPT',
            referenceId: receipt._id,
            notes: `Received from GRN: ${receipt.grnNumber}`,
            createdBy: req.user.id
          });
        }
      }

      // Update PO status and received quantities
      const po = await PurchaseOrder.findById(receipt.purchaseOrderId);
      if (po) {
        let allFullyReceived = true;
        let anyReceived = false;

        po.items.forEach(poItem => {
          const grnItem = receipt.items.find(i => i.itemId.toString() === poItem.itemId.toString());
          if (grnItem) {
            poItem.receivedQuantity = (poItem.receivedQuantity || 0) + grnItem.receivedQuantity;
          }
          if (poItem.receivedQuantity < poItem.quantity) {
            allFullyReceived = false;
          }
          if (poItem.receivedQuantity > 0) {
            anyReceived = true;
          }
        });

        if (allFullyReceived) {
          po.status = 'COMPLETED';
        } else if (anyReceived) {
          po.status = 'PARTIALLY_RECEIVED';
        }
        await po.save();
      }
    }

    res.sendSuccess(receipt);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/reject', async (req, res, next) => {
  try {
    const role = req.user.roleCode || req.user.role;
    if (role === 'USER') {
      return next(Object.assign(new Error('Permission denied'), { statusCode: 403 }));
    }

    const { rejectionReason } = req.body;
    const receipt = await GoodsReceipt.findById(req.params.id);
    if (!receipt) return next(Object.assign(new Error('Goods Receipt not found'), { statusCode: 404 }));

    if (!['SUBMITTED', 'PENDING_REVIEW'].includes(receipt.status)) {
       return next(Object.assign(new Error('Cannot reject a receipt in this status'), { statusCode: 400 }));
    }

    receipt.status = 'REJECTED';
    receipt.rejectedBy = req.user.id;
    receipt.rejectedAt = new Date();
    receipt.rejectionReason = rejectionReason || 'Rejected by Manager/Admin';
    await receipt.save();
    res.sendSuccess(receipt);
  } catch (err) {
    next(err);
  }
});

export default router;
