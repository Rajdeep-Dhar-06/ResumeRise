import mongoose from 'mongoose';
import { MATCH_STATUS, COMPLEXITY_LEVELS, PRIORITY_LEVELS, SEVERITY_LEVELS } from '../utils/enums.js';

const technicalQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Technical Question is required'],
    },
    intention: {
      type: String,
      required: [true, 'Intention is required'],
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
    },
  },
  { _id: false }
);

const behavioralQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Behavioral Question is required'],
    },
    intention: {
      type: String,
      required: [true, 'Intention is required'],
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
    },
  },
  { _id: false }
);

const skillGapSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      required: [true, 'Skill is required'],
    },
    severity: {
      type: String,
      enum: SEVERITY_LEVELS,
      required: [true, 'Severity is required'],
    },
  },
  { _id: false }
);

const preparationPlanSchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: [true, 'Day is required'],
    },
    focus: {
      type: String,
      required: [true, 'Focus is required'],
    },
    tasks: [
      {
        type: String,
        required: [true, 'Task is required'],
      },
    ],
  },
  { _id: false }
);

const scrapedTermSchema = new mongoose.Schema(
  {
    term: {
      type: String,
      required: true,
    },
    // FIX: removed `matched: { type: Boolean, required: true }`.
    // matched_term.schema.js (the Zod schema the LLM actually outputs against)
    // no longer produces this field — it was replaced by `status` during the
    // anti-inflation prompt-engineering pass. Leaving it `required: true` here
    // meant any AI-generated result saved to this model would fail Mongoose
    // validation, since `matched` would always be undefined.
    status: {
      type: String,
      enum: MATCH_STATUS,
      required: true,
    },
    evidence: {
      type: String,
      default: '',
    },
    verdict: {
      type: String,
      default: '',
    },
    complexity: {
      type: String,
      enum: COMPLEXITY_LEVELS,
      default: 'N/A',
    },
    priority: {
      type: String,
      enum: PRIORITY_LEVELS,
      default: 'REQUIRED',
    },
    matchStrength: {
      type: Number,
      min: 0,
      max: 1,
    },
  },
  { _id: false }
);

const resourceItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    snippet: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const learningResourceMongooseSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      required: true,
    },
    resources: [resourceItemSchema],
  },
  { _id: false }
);

const interviewReportSchema = new mongoose.Schema(
  {
    jobDescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobDescription',
      required: [true, 'Job description reference is required'],
    },
    scrapedSkills: [scrapedTermSchema],
    scrapedRequirements: [scrapedTermSchema],
    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    technicalQuestions: [technicalQuestionSchema],
    behavioralQuestions: [behavioralQuestionSchema],
    skillGaps: [skillGapSchema],
    preparationPlan: [preparationPlanSchema],
    learningResources: [learningResourceMongooseSchema],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
  },
  { timestamps: true }
);

// FIX: added compound index — "list this user's reports, newest first" is the
// obvious dashboard query pattern and was previously unindexed.
interviewReportSchema.index({ user: 1, createdAt: -1 });

const InterviewReportModel = mongoose.model('InterviewReport', interviewReportSchema);

export default InterviewReportModel;