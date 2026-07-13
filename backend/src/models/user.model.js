import mongoose from 'mongoose';

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