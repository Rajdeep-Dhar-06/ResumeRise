import mongoose from 'mongoose';

const blackListTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: [true, 'Token is required to be added in blacklist'],
    },
  },
  { timestamps: true }
);

const blackListTokenModel = mongoose.model(
  'blackListToken',
  blackListTokenSchema
);

export default blackListTokenModel;
