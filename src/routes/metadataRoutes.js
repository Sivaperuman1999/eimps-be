import express from 'express';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Item from '../models/Item.js';
import Vendor from '../models/Vendor.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import GoodsReceipt from '../models/GoodsReceipt.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const stats = {
      users: await User.countDocuments(),
      categories: await Category.find().select('id name'), // return actual categories array
      items: await Item.countDocuments(),
      vendors: await Vendor.countDocuments(),
      purchaseOrders: await PurchaseOrder.countDocuments(),
      goodsReceipts: await GoodsReceipt.countDocuments(),
    };
    res.sendSuccess({ data: stats });
  } catch (err) {
    next(err);
  }
});

router.get('/roles', (req, res) => {
  const roles = [
    { id: '1', code: 'ADMIN', name: 'Admin' },
    { id: '2', code: 'USER', name: 'User' }
  ];
  res.sendSuccess({ data: roles });
});

export default router;
