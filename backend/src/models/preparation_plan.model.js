import mongoose from "mongoose";

export const preparationPlanSchema = new mongoose.Schema(
  {
    dayNumber: {
      type: Number,
      required: true,
    },
    dailyFocus: {
      type: String,
      required: true,
    },
    dailyTasks: [
      {
        type: String,
        required: true,
      },
    ],
  },
  { _id: false }
);
