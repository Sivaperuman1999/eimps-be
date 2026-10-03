import express from 'express';
import Item from '../models/Item.js';
import Vendor from '../models/Vendor.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import GoodsReceipt from '../models/GoodsReceipt.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const [
      totalInventory,
      activeInventory,
      inactiveInventory,
      lowStockInventory,
      outOfStockInventory,
      totalVendors,
      activeVendors,
      inactiveVendors,
      totalPOs,
      draftPOs,
      submittedPOs,
      approvedPOs,
      completedPOs,
      cancelledPOs,
      totalPOValueResult,
      totalGRNs,
      draftGRNs,
      receivedGRNs,
      cancelledGRNs,
    ] = await Promise.all([
      Item.countDocuments(),
      Item.countDocuments({ isActive: true }),
      Item.countDocuments({ isActive: false }),
      Item.countDocuments({ quantity: { $gt: 0, $lte: 10 } }),
      Item.countDocuments({ quantity: 0 }),
      Vendor.countDocuments(),
      Vendor.countDocuments({ isActive: true }),
      Vendor.countDocuments({ isActive: false }),
      PurchaseOrder.countDocuments(),
      PurchaseOrder.countDocuments({ status: 'DRAFT' }),
      PurchaseOrder.countDocuments({ status: 'SUBMITTED' }),
      PurchaseOrder.countDocuments({ status: 'APPROVED' }),
      PurchaseOrder.countDocuments({ status: 'COMPLETED' }),
      PurchaseOrder.countDocuments({ status: 'CANCELLED' }),
      PurchaseOrder.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
      GoodsReceipt.countDocuments(),
      GoodsReceipt.countDocuments({ status: 'DRAFT' }),
      GoodsReceipt.countDocuments({ status: 'RECEIVED' }),
      GoodsReceipt.countDocuments({ status: 'CANCELLED' })
    ]);

    // Aggregate total stock across all active items
    const totalStockResult = await Item.aggregate([{ $match: { isActive: true } }, { $group: { _id: null, total: { $sum: "$quantity" } } }]);
    const totalStock = totalStockResult.length > 0 ? totalStockResult[0].total : 0;
    const totalPOValue = totalPOValueResult.length > 0 ? totalPOValueResult[0].total : 0;

    res.sendSuccess({
      inventory: {
        total: totalInventory,
        active: activeInventory,
        inactive: inactiveInventory,
        lowStock: lowStockInventory,
        outOfStock: outOfStockInventory,
        totalStock: totalStock
      },
      vendors: {
        total: totalVendors,
        active: activeVendors,
        inactive: inactiveVendors
      },
      purchaseOrders: {
        total: totalPOs,
        draft: draftPOs,
        submitted: submittedPOs,
        approved: approvedPOs,
        completed: completedPOs,
        cancelled: cancelledPOs,
        totalValue: totalPOValue
      },
      goodsReceipts: {
        total: totalGRNs,
        draft: draftGRNs,
        received: receivedGRNs,
        cancelled: cancelledGRNs
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
