import mongoose from 'mongoose';
import UserModel from './user.model.js';

/**
 * Mongoose schema representing parsed candidate resume data.
 * Splits resume details into five key textual segment categories (academicInfo, technicalAchievements, extracurricularAchievements, experiences, technicalProjects).
 * Unique index on user + contentHash prevents redundant ingestion.
 */
const resumeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        contentHash: {
            type: String,
            required: true,
        },
        rawText: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

resumeSchema.index({ user: 1, contentHash: 1 }, { unique: true });
const resumeModel = mongoose.model('Resume', resumeSchema);

export default resumeModel;