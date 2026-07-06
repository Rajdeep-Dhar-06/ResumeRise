import mongoose from 'mongoose';

const resourceItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'Resource URL is required'],
      trim: true,
    },
    snippet: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const learningResourceSchema = new mongoose.Schema({
  skill: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true,
    lowercase: true, // Normalize casing (e.g., 'react' vs 'React') to optimize caching
  },
  resources: [resourceItemSchema],
});

learningResourceSchema.index({ skill: 1 }, { unique: true });

const LearningResourceModel = mongoose.model('LearningResource', learningResourceSchema);

export default LearningResourceModel;
