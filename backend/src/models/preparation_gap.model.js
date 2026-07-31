import mongoose from "mongoose";
import { SEVERITY_LEVELS } from "../utils/enums.js";

export const preparationGapSchema = new mongoose.Schema(
  {
    requirementName: {
      type: String,
      required: true,
    },
    gapSeverity: {
      type: String,
      enum: SEVERITY_LEVELS,
      required: true,
    },
  },
  { _id: false }
);
