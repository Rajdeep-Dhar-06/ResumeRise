import mongoose from 'mongoose';
import { MATCH_STATUS, COMPLEXITY_LEVELS, PRIORITY_LEVELS, SEVERITY_LEVELS } from '../utils/enums.js';

const technicalQuestionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, 'Technical Question text is required'],
    },
    interviewerIntent: {
      type: String,
      required: [true, 'Interviewer intent is required'],
    },
    idealAnswer: {
      type: String,
      required: [true, 'Ideal answer is required'],
    },
  },
  { _id: false }
);

const nonTechnicalQuestionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, 'Non-Technical Question text is required'],
    },
    interviewerIntent: {
      type: String,
      required: [true, 'Interviewer intent is required'],
    },
    idealAnswer: {
      type: String,
      required: [true, 'Ideal answer is required'],
    },
  },
  { _id: false }
);

const preparationGapSchema = new mongoose.Schema(
  {
    requirementName: {
      type: String,
      required: [true, 'Requirement name is required'],
    },
    gapSeverity: {
      type: String,
      enum: SEVERITY_LEVELS,
      required: [true, 'Gap severity is required'],
    },
  },
  { _id: false }
);

const preparationPlanSchema = new mongoose.Schema(
  {
    dayNumber: {
      type: Number,
      required: [true, 'Day number is required'],
    },
    dailyFocus: {
      type: String,
      required: [true, 'Daily focus is required'],
    },
    dailyTasks: [
      {
        type: String,
        required: [true, 'Daily task is required'],
      },
    ],
  },
  { _id: false }
);

const evaluatedRequirementMongooseSchema = new mongoose.Schema(
  {
    requirementName: {
      type: String,
      required: true,
    },
    matchStatus: {
      type: String,
      enum: MATCH_STATUS,
      required: true,
    },
    resumeEvidence: {
      type: String,
      default: '',
    },
    depthAssessment: {
      type: String,
      default: '',
    },
    complexityLevel: {
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
    resourceTitle: {
      type: String,
      required: true,
    },
    resourceUrl: {
      type: String,
      required: true,
    },
    resourceSnippet: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const learningResourceMongooseSchema = new mongoose.Schema(
  {
    requirementName: {
      type: String,
      required: true,
    },
    resources: [resourceItemSchema],
  },
  { _id: false }
);

const interviewReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    jobDescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobDescription',
      required: [true, 'Job description reference is required'],
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume'
    },
    resumeHash: {
      type: String,
      required: [true, 'Resume hash is required'],
    },
    jobDescriptionUrl: {
      type: String,
      required: [true, 'Job description URL is required'],
    },
    daysLimit: {
      type: Number,
      enum: [3, 5, 7],
      default: 7,
      required: [true, 'Days limit is required'],
    },

    evaluatedTechnicalRequirements: [evaluatedRequirementMongooseSchema],
    evaluatedNonTechnicalRequirements: [evaluatedRequirementMongooseSchema],

    reportTitle: {
      type: String,
      required: [true, 'Report title is required'],
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    technicalQuestions: [technicalQuestionSchema],
    nonTechnicalQuestions: [nonTechnicalQuestionSchema],
    preparationGaps: [preparationGapSchema],
    preparationPlan: [preparationPlanSchema],
    learningResources: [learningResourceMongooseSchema],
  },
  { timestamps: true }
);

interviewReportSchema.index({ userId: 1, createdAt: -1 });
interviewReportSchema.index({ userId: 1, resumeHash: 1, jobDescriptionUrl: 1, daysLimit: 1 });

const InterviewReportModel = mongoose.model('InterviewReport', interviewReportSchema);

export default InterviewReportModel;