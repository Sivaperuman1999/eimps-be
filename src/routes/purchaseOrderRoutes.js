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

router.patch('/:id/submit', async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return next(Object.assign(new Error('PO not found'), { statusCode: 404 }));

    if (po.status !== 'DRAFT') {
      return next(Object.assign(new Error('Only DRAFT POs can be submitted'), { statusCode: 400 }));
    }

    po.previousStatus = po.status;
    po.status = 'SUBMITTED';
    await po.save();
    
    res.sendSuccess(po);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/approve', async (req, res, next) => {
  try {
    const { comments } = req.body;
    const role = req.user.roleCode || req.user.role;
    const userId = req.user.id;

    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return next(Object.assign(new Error('PO not found'), { statusCode: 404 }));

    const previousStatus = po.status;
    let newStatus = po.status;

    if (po.status === 'SUBMITTED' && (role === 'MANAGER' || role === 'ADMIN')) {
      newStatus = 'PENDING_REVIEW';
    } else if (po.status === 'PENDING_REVIEW' && (role === 'MANAGER' || role === 'ADMIN')) {
      newStatus = 'APPROVED';
      po.approvedBy = userId;
      po.approvedAt = new Date();
    } else {
      return next(Object.assign(new Error('Invalid status transition or permission denied'), { statusCode: 403 }));
    }

    po.status = newStatus;
    po.previousStatus = previousStatus;
    if (comments) po.comments = comments;
    
    await po.save();
    res.sendSuccess(po);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/reject', async (req, res, next) => {
  try {
    const { rejectionReason, comments } = req.body;
    const role = req.user.roleCode || req.user.role;
    const userId = req.user.id;

    if (role === 'USER') {
      return next(Object.assign(new Error('Permission denied'), { statusCode: 403 }));
    }

    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return next(Object.assign(new Error('PO not found'), { statusCode: 404 }));

    if (!['SUBMITTED', 'PENDING_REVIEW'].includes(po.status)) {
       return next(Object.assign(new Error('Cannot reject a PO in this status'), { statusCode: 400 }));
    }

    po.previousStatus = po.status;
    po.status = 'REJECTED';
    po.rejectedBy = userId;
    po.rejectedAt = new Date();
    po.rejectionReason = rejectionReason;
    if (comments) po.comments = comments;

    await po.save();
    res.sendSuccess(po);
  } catch (err) {
    next(err);
  }
});

export default router;
