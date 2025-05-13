import mongoose from 'mongoose';

const JobCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const JobCategory = mongoose.models.JobCategory || mongoose.model('JobCategory', JobCategorySchema);
