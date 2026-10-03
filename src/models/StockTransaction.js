import mongoose from 'mongoose';

const stockTransactionSchema = new mongoose.Schema(
  {
    itemId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Item', 
      required: true 
    },
    transactionType: { 
      type: String, 
      enum: ['ENTRY', 'ALLOCATION', 'ISSUE', 'ADJUSTMENT', 'RECEIPT'], 
      required: true 
    },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    referenceType: { type: String, enum: ['PURCHASE_ORDER', 'GOODS_RECEIPT', 'MANUAL_ADJUSTMENT'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    notes: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

stockTransactionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('StockTransaction', stockTransactionSchema);
