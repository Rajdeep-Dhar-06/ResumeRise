import mongoose from "mongoose";

/**
 * Reusable schema for learning/tutorial resources and documentation links.
 */
export const resourceItemSchema = new mongoose.Schema(
    {
        resourceTitle: {
            type: String,
            required: true,
            trim: true,
        },
        resourceUrl: {
            type: String,
            required: true,
            trim: true,
        },
        resourceSnippet: {
            type: String,
            default: '',
            trim: true,
        },
    },
    { _id: false }
);
