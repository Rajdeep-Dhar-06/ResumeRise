import mongoose from 'mongoose'; // FIX: removed unused `mongo` named import

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
        resumeContent: { 
            type: String, 
            required: true 
        },
    },
    { timestamps: true }
);

resumeSchema.index({ user: 1, contentHash: 1 }, { unique: true });
const resumeModel = mongoose.model('Resume', resumeSchema);

export default resumeModel;