import mongoose from 'mongoose';

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
  {
    _id: false,
  }
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
  {
    _id: false,
  }
);

const skillGapSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      required: [true, 'Skill is required'],
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: [true, 'Severity is required'],
    },
  },
  {
    _id: false,
  }
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
  {
    _id: false,
  }
);

const scrapedTermSchema = new mongoose.Schema(
  {
    term: {
      type: String,
      required: true,
    },
    matched: {
      type: Boolean,
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
    matchStrength: {
      type: Number,
      min: 0,
      max: 1,
    },
  },
  {
    _id: false,
  }
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
    selfDescription: {
      type: String,
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    technicalQuestions: [technicalQuestionSchema],
    behavioralQuestions: [behavioralQuestionSchema],
    skillGaps: [skillGapSchema],
    preparationPlan: [preparationPlanSchema],
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

const InterviewReportModel = mongoose.model('InterviewReport', interviewReportSchema);

export default InterviewReportModel;
