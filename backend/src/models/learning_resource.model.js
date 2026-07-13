import mongoose from 'mongoose';

const resourceItemSchema = new mongoose.Schema(
  {
    resourceTitle: {
      type: String,
      required: true,
      trim: true,
    },
    resourceUrl: {
      type: String,
      required: true,
      trim: true,
    },
    resourceSnippet: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const learningResourceSchema = new mongoose.Schema({
  requirementName: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  resources: [resourceItemSchema],
});

learningResourceSchema.index({ requirementName: 1 }, { unique: true });
const LearningResourceModel = mongoose.model('LearningResource', learningResourceSchema);

export default LearningResourceModel;
