import mongoose from 'mongoose';
import { resourceItemSchema } from './resource_item.model.js';

/**
 * Mongoose schema representing cached web search learning resources for skill gaps.
 * Uses a unique index on lowercase requirementName for cache lookup.
 */
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
