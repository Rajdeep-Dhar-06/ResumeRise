import mongoose from 'mongoose';

/**
 * Mongoose schema representing a user of the application.
 * Defines structure, indexes, and credentials settings (hashing handled in controllers).
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    refreshToken: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

userSchema.index({ username: 1 }, { unique: true });
const userModel = mongoose.model('User', userSchema);

export default userModel;