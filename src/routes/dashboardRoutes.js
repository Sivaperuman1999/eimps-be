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
    const role = req.user.roleCode || req.user.role;
    const userId = req.user.id;
    
    let poQuery = {};
    let grnQuery = {};
    
    // Role-based filtering
    if (role === 'USER') {
      poQuery = { createdBy: userId };
      // Assuming users don't see GRNs or only see GRNs for their POs. 
      // We will leave GRNs open or empty for now depending on business rules.
    }

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
      pendingReviewPOs,
      approvedPOs,
      processingPOs,
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
      Item.countDocuments({ currentStock: { $gt: 0, $lte: 10 } }),
      Item.countDocuments({ currentStock: 0 }),
      Vendor.countDocuments(),
      Vendor.countDocuments({ isActive: true }),
      Vendor.countDocuments({ isActive: false }),
      PurchaseOrder.countDocuments(poQuery),
      PurchaseOrder.countDocuments({ ...poQuery, status: 'DRAFT' }),
      PurchaseOrder.countDocuments({ ...poQuery, status: 'SUBMITTED' }),
      PurchaseOrder.countDocuments({ ...poQuery, status: 'PENDING_REVIEW' }),
      PurchaseOrder.countDocuments({ ...poQuery, status: 'APPROVED' }),
      PurchaseOrder.countDocuments({ ...poQuery, status: 'PROCESSING' }),
      PurchaseOrder.countDocuments({ ...poQuery, status: 'COMPLETED' }),
      PurchaseOrder.countDocuments({ ...poQuery, status: 'CANCELLED' }),
      PurchaseOrder.aggregate([{ $match: poQuery }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
      GoodsReceipt.countDocuments(grnQuery),
      GoodsReceipt.countDocuments({ ...grnQuery, status: 'DRAFT' }),
      GoodsReceipt.countDocuments({ ...grnQuery, status: 'RECEIVED' }),
      GoodsReceipt.countDocuments({ ...grnQuery, status: 'CANCELLED' })
    ]);

    const totalStockResult = await Item.aggregate([{ $match: { isActive: true } }, { $group: { _id: null, total: { $sum: "$currentStock" } } }]);
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
        pendingReview: pendingReviewPOs,
        approved: approvedPOs,
        processing: processingPOs,
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
