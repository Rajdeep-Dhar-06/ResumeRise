import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: [true, 'Username already taken'],
  },
  email: {
    type: String,
    required: true,
    unique: [true, 'Account already exists with this email address'],
  },
  password: {
    type: String,
    required: true,
  },
});

const userModel = mongoose.model('users', userSchema);

export default userModel;
