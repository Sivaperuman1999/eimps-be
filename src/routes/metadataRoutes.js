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

import Role from '../models/Role.js';

router.get('/roles', async (req, res, next) => {
  try {
    let roles = await Role.find();
    if (roles.length === 0) {
      // Seed default roles if none exist
      roles = await Role.insertMany([
        { roleCode: 'ADMIN', roleName: 'Admin', permissions: ['ALL'] },
        { roleCode: 'MANAGER', roleName: 'Manager', permissions: ['APPROVE_PO', 'VIEW_INVENTORY'] },
        { roleCode: 'USER', roleName: 'User', permissions: ['VIEW_INVENTORY'] }
      ]);
    }
    res.sendSuccess({ data: roles });
  } catch (err) {
    next(err);
  }
});

export default router;
