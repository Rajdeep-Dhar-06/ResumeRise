import mongoose from 'mongoose';

/**
 * Reusable schema for interview questions (both technical and non-technical).
 */
export const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    interviewerIntent: {
      type: String,
      required: true,
      trim: true,
    },
    idealAnswer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);