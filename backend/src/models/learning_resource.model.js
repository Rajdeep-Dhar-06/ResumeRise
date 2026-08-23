import mongoose from "mongoose";

/**
 * Reusable schema for learning/tutorial resources and documentation links.
 */
export const learningResourceMongooseSchema = new mongoose.Schema(
  {
    requirementName: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);
