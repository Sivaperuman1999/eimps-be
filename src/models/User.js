import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
    refreshToken: { type: String, default: null },
    resetOtp: { type: String, default: null },
    resetOtpExpiry: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Format JSON response to match Prisma output (swap _id for id)
userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password; // Always exclude password from API responses (standard practice)
    delete ret.refreshToken;
    delete ret.resetOtp;
    delete ret.resetOtpExpiry;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
