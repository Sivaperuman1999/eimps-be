import mongoose from 'mongoose';

const goodsReceiptItemSchema = new mongoose.Schema(
  {
    itemId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Item', 
      required: true 
    },
    receivedQuantity: { type: Number, required: true },
  },
  { timestamps: true }
);

goodsReceiptItemSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    if (ret.itemId && typeof ret.itemId === 'object' && (ret.itemId.id || ret.itemId._id)) {
      ret.item = ret.itemId;
      ret.itemId = ret.itemId.id || ret.itemId._id.toString();
    }
    return ret;
  },
});

const goodsReceiptSchema = new mongoose.Schema(
  {
    grnNumber: { type: String, required: true, unique: true },
    purchaseOrderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'PurchaseOrder', 
      required: true 
    },
    receivedDate: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['DRAFT', 'SUBMITTED', 'PENDING_REVIEW', 'RECEIVED', 'REJECTED', 'CANCELLED'],
      default: 'DRAFT'
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    comments: { type: String, default: null },
    items: [goodsReceiptItemSchema],
  },
  {
    timestamps: true,
  }
);

goodsReceiptSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    if (ret.purchaseOrderId && typeof ret.purchaseOrderId === 'object' && ret.purchaseOrderId.poNumber) {
      ret.purchaseOrder = ret.purchaseOrderId;
      ret.purchaseOrderId = ret.purchaseOrder.id || ret.purchaseOrder._id.toString();
    } else if (ret.purchaseOrderId && typeof ret.purchaseOrderId === 'object' && ret.purchaseOrderId.id instanceof Buffer) {
      ret.purchaseOrderId = ret.purchaseOrderId.toString();
    }
    return ret;
  },
});

export default mongoose.model('GoodsReceipt', goodsReceiptSchema);
