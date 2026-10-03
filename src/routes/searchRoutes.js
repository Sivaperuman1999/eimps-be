import express from 'express';
import Item from '../models/Item.js';
import Vendor from '../models/Vendor.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);
router.get('/', async (req, res, next) => {
  try {
    const query = req.query.q || '';
    if (!query) {
      return res.sendSuccess({ inventory: [], vendors: [], purchaseOrders: [] });
    }

    const regex = new RegExp(query, 'i');

    const [items, vendors, purchaseOrders] = await Promise.all([
      Item.find({ $or: [{ name: regex }, { sku: regex }] }).limit(5),
      Vendor.find({ $or: [{ name: regex }, { code: regex }] }).limit(5),
      PurchaseOrder.find({ poNumber: regex }).limit(5)
    ]);

    res.sendSuccess({
      inventory: items,
      vendors: vendors,
      purchaseOrders: purchaseOrders
    });
  } catch (err) {
    next(err);
  }
});

export default router;
