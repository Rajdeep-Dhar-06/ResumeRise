import mongoose from "mongoose";

const jdTermSchema = new mongoose.Schema(
    {
        requirementName: {
            type: String,
            required: true
        },
        priority: {
            type: String,
            enum: ["REQUIRED", "PREFERRED", "NICE_TO_HAVE"],
            default: "REQUIRED",
        },
        sourceContext: {
            type: String,
            required: true
        },
    },
    { _id: false }
);

/**
 * Mongoose schema representing scraped Job Description data.
 * Includes URL, company details, role metadata, and technical/non-technical parsed requirements.
 * Re-scrapes are cached based on the 24-hour TTL index.
 */
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
        technicalRequirements: [jdTermSchema],
        nonTechnicalRequirements: [jdTermSchema],
    },
    { timestamps: true }
);

jobDescriptionSchema.index({ url: 1 }, { unique: true });
jobDescriptionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hrs
const JobDescriptionModel = mongoose.model('JobDescription', jobDescriptionSchema);

export default JobDescriptionModel;