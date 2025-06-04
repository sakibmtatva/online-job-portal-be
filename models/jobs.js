import mongoose, { Schema } from 'mongoose';

const jobSchema = new Schema(
  {
    job_title: {
      type: String,
      required: [true, 'Job title is required'],
      index: true,
    },
    job_description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    user: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    location: {
      type: String,
      required: [true, 'Location is required'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'job category is required'],
      index: true,
    },
    salary_min: {
      type: Number,
      required: [true, 'min salary is required'],
      index: true,
      validate: {
        validator: function (value) {
          return value >= 0;
        },
        message: 'Salary minimum must be a positive number or zero.',
      },
    },
    salary_max: {
      type: Number,
      required: [true, 'max salary is required'],
      index: true,
      validate: {
        validator: function (value) {
          return value >= 0;
        },
        message: 'Salary maximum must be a positive number or zero.',
      },
    },
    posted_date: { type: Date, default: Date.now },
    closing_date: {
      type: Date,
      required: [true, 'Closing date is required'],
      validate: {
        validator: function (value) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return value >= today;
        },
        message: 'Closing date cannot be in the past.',
      },
    },
    jobType: {
      type: String,
      enum: {
        values: ['full-time', 'part-time', 'contract', 'remote', 'hybrid'],
        message: 'Invalid job type',
      },
      default: 'full-time',
      index: true,
    },
    skills_required: {
      type: [String],
      default: [],
      index: true,
    },
    experience_level: {
      type: String,
      enum: {
        values: ['fresher', 'mid-level', 'senior-level'],
        message: 'Invalid experience level',
      },
      default: 'fresher',
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Expired'],
        message: 'Invalid status provided',
      },
      index: true,
    },
    education: {
      type: String,
      index: true,
    },
    applicants: [{ type: Schema.Types.ObjectId, ref: 'Application' }],
    is_remote: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_featured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Jobs = mongoose.models.Jobs || mongoose.model('Jobs', jobSchema);

export default Jobs;
