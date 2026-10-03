import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    roleCode: { type: String, required: true, unique: true }, // e.g., 'ADMIN', 'MANAGER', 'USER'
    roleName: { type: String, required: true },
    description: { type: String, default: null },
    permissions: [{ type: String }], // e.g., ['CREATE_USER', 'APPROVE_PO', 'VIEW_INVENTORY']
    allowedModules: [{ type: String }], // e.g., ['INVENTORY', 'PURCHASE', 'USERS']
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

roleSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Role', roleSchema);
