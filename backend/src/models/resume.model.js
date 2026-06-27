import mongoose, { mongo } from "mongoose"

const resumeSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    fileName: { type: String, required: true , index: true},
    rawText: { type: String, required: true },
}, { timestamps: true });

const resumeModel = mongoose.model('Resume', resumeSchema);

export default resumeModel;
