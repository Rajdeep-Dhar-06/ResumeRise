import mongoose from 'mongoose';
import { MATCH_STATUS, COMPLEXITY_LEVELS, PRIORITY_LEVELS, DAYS_LIMITS } from '../utils/enums.js';
import { questionSchema } from './question.model.js';
import { learningResourceMongooseSchema } from './learning_resource.model.js';
import { preparationGapSchema } from './preparation_gap.model.js';
import { preparationPlanSchema } from './preparation_plan.model.js';

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