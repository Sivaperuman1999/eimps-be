import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0 },
    availableStock: { type: Number, default: 0 },
    allocatedStock: { type: Number, default: 0 },
    minimumStockLevel: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true },
    categoryId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Category', 
      required: true 
    },
  },
  {
    timestamps: true,
  }
);

itemSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    if (ret.categoryId && typeof ret.categoryId === 'object' && ret.categoryId.name) {
      ret.category = ret.categoryId;
      ret.categoryId = ret.category.id || ret.category._id.toString();
    } else if (ret.categoryId && typeof ret.categoryId === 'object' && ret.categoryId.id instanceof Buffer) {
      // It's an unpopulated ObjectId, leave it as is so it serializes properly
      ret.categoryId = ret.categoryId.toString();
    }
    return ret;
  },
});

export default mongoose.model('Item', itemSchema);
