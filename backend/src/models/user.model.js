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
  },
  { timestamps: true }
);

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

// FIX: renamed 'users' -> 'User' to match PascalCase singular convention used by
// every other model (JobDescription, Resume, InterviewReport). Mongoose will
// derive the lowercase plural collection name ('users') automatically.
const userModel = mongoose.model('User', userSchema);

export default userModel;