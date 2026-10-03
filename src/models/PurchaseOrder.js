import mongoose from 'mongoose';

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    itemId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Item', 
      required: true 
    },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },
  { timestamps: true }
);

// Format embedded document IDs
purchaseOrderItemSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    if (ret.itemId && typeof ret.itemId === 'object' && ret.itemId.name) {
      ret.item = ret.itemId;
      ret.itemId = ret.item.id || ret.item._id.toString();
    } else if (ret.itemId && typeof ret.itemId === 'object' && ret.itemId.id instanceof Buffer) {
      ret.itemId = ret.itemId.toString();
    } else if (ret.itemId && typeof ret.itemId === 'object' && (ret.itemId.id || ret.itemId._id)) {
      ret.item = ret.itemId;
      ret.itemId = ret.itemId.id || ret.itemId._id.toString();
    }
    return ret;
  },
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, unique: true },
    vendorId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Vendor', 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['DRAFT', 'SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PROCESSING', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED', 'COMPLETED'],
      default: 'DRAFT' 
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    comments: { type: String, default: null },
    previousStatus: { type: String, default: null },
    orderDate: { type: Date, default: Date.now },
    totalAmount: { type: Number, required: true },
    items: [purchaseOrderItemSchema], // Embedded array replacing PostgreSQL foreign key join
  },
  {
    timestamps: true,
  }
);

purchaseOrderSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    if (ret.vendorId && typeof ret.vendorId === 'object' && ret.vendorId.name) {
      ret.vendor = ret.vendorId;
      ret.vendorId = ret.vendor.id || ret.vendor._id.toString();
    } else if (ret.vendorId && typeof ret.vendorId === 'object' && ret.vendorId.id instanceof Buffer) {
      ret.vendorId = ret.vendorId.toString();
    }
    return ret;
  },
});

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);
