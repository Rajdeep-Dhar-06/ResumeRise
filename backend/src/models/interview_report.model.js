import mongoose from 'mongoose';
import { MATCH_STATUS, DAYS_LIMITS, GAP_SEVERITY } from '../utils/enums.js';
import { questionSchema } from './question.model.js';
import { learningResourceMongooseSchema } from './learning_resource.model.js';

import { preparationPlanSchema } from './preparation_plan.model.js';

const evaluatedRequirementSchema = new mongoose.Schema(
  {
    requirementName: { type: String, default: '' },
    matchTier: { type: String, enum: MATCH_STATUS, default: 'NO_MATCH' },
    reasoning: { type: String, default: '' },
    evidence: { type: String, default: '' },
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

    profileHash: {
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
      enum: DAYS_LIMITS,
      required: true,
    },
    reportTitle: {
      type: String,
      required: true,
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    technicalEvaluations: [evaluatedRequirementSchema],
    nonTechnicalEvaluations: [evaluatedRequirementSchema],
    technicalQuestions: [questionSchema],
    nonTechnicalQuestions: [questionSchema],
    preparationPlan: [preparationPlanSchema],
    learningResources: [learningResourceMongooseSchema],
    preparationGaps: [{
      requirementName: String,
      gapSeverity: { type: String, enum: GAP_SEVERITY }
    }],
  },
  { timestamps: true }
);

interviewReportSchema.index({ userId: 1, createdAt: -1 });
interviewReportSchema.index({ userId: 1, profileHash: 1, jobDescriptionUrl: 1, daysLimit: 1 });

const InterviewReportModel = mongoose.model('InterviewReport', interviewReportSchema);

export default InterviewReportModel;