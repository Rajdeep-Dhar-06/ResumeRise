import mongoose from 'mongoose';

const resourceItemSchema = new mongoose.Schema(
  {
    resourceTitle: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
    },
    resourceUrl: {
      type: String,
      required: [true, 'Resource URL is required'],
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
    required: [true, 'Requirement name is required'],
    trim: true,
    lowercase: true, // Normalize casing (e.g., 'react' vs 'React') to optimize caching
  },
  resources: [resourceItemSchema],
});

learningResourceSchema.index({ requirementName: 1 }, { unique: true });

const LearningResourceModel = mongoose.model('LearningResource', learningResourceSchema);

export default LearningResourceModel;
