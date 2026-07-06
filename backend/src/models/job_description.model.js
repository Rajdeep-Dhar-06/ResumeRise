import mongoose from "mongoose";

// FIX: extracted as its own schema with { _id: false } — previously these were
// inline array objects, which made Mongoose silently give every single skill
// and requirement entry its own ObjectId (pure storage bloat, never referenced).
// Matches the pattern already used correctly in interview_report.model.js.
const jdTermSchema = new mongoose.Schema(
    {
        term: {
            type: String,
            required: true
        },
        priority: {
            type: String,
            enum: ["REQUIRED", "PREFERRED", "NICE_TO_HAVE"],
            default: "REQUIRED",
        },
        context: {
            type: String,
            required: true
        },
    },
    { _id: false }
);

const jobDescriptionSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true,
        },
        companyName: {
            type: String,
        },
        role: {
            type: String,
        },
        // publishedAt: {
        //     type: Date,
        // },
        skills: [jdTermSchema],
        requirements: [jdTermSchema],
    },
    { timestamps: true }
);

jobDescriptionSchema.index({ url: 1 }, { unique: true });
const JobDescriptionModel = mongoose.model('JobDescription', jobDescriptionSchema);

export default JobDescriptionModel;