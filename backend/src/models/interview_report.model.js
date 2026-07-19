import mongoose from 'mongoose';
import { MATCH_STATUS, COMPLEXITY_LEVELS, PRIORITY_LEVELS, SEVERITY_LEVELS } from '../utils/enums.js';
import { questionSchema } from './question.model.js';
import { resourceItemSchema } from './resource_item.model.js';

const preparationGapSchema = new mongoose.Schema(
  {
    requirementName: {
      type: String,
      required: true,
    },
    gapSeverity: {
      type: String,
      enum: SEVERITY_LEVELS,
      required: true,
    },
  },
  { _id: false }
);

const preparationPlanSchema = new mongoose.Schema(
  {
    dayNumber: {
      type: Number,
      required: true,
    },
    dailyFocus: {
      type: String,
      required: true,
    },
    dailyTasks: [
      {
        type: String,
        required: true,
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

/**
 * Mongoose schema representing the final generated Interview/Preparation Report.
 * Contains user/document references, aggregated match metrics, generated evaluation requirements (technical/non-technical),
 * customized interview prep questions, skill gaps, customized daily study planner, and associated learning resources.
 */
const interviewReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobDescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobDescription',
      required: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume'
    },
    resumeHash: {
      type: String,
      required: true,
    },
    jobDescriptionUrl: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      default: 'Company',
      required: true,
    },
    role: {
      type: String,
      default: 'Role',
      required: true,
    },
    daysLimit: {
      type: Number,
      enum: [3, 5, 7],
      default: 7,
      required: true,
    },

    evaluatedTechnicalRequirements: [evaluatedRequirementMongooseSchema],
    evaluatedNonTechnicalRequirements: [evaluatedRequirementMongooseSchema],

    reportTitle: {
      type: String,
      required: true,
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    technicalQuestions: [questionSchema],
    nonTechnicalQuestions: [questionSchema],
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