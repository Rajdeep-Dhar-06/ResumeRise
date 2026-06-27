import mongoose from "mongoose";

const jobDescriptionSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        unique: true,
    },
    rawText: {
        type: String,
        required: true,
    },
    role: {
        type: String,
    },
    experienceRequired: {
        type: Number,
    },
    publishedAt: {
        type: Date,
    },
    skills: [{
        term: { type: String, required: true },
        priority: { type: String, enum: ["REQUIRED", "PREFERRED", "NICE_TO_HAVE"], default: "REQUIRED" }
    }],
    requirements: [{
        term: { type: String, required: true },
        priority: { type: String, enum: ["REQUIRED", "PREFERRED", "NICE_TO_HAVE"], default: "REQUIRED" }
    }],
}, { timestamps: true }
);

const JobDescriptionModel = mongoose.model('JobDescription', jobDescriptionSchema);

export default JobDescriptionModel;