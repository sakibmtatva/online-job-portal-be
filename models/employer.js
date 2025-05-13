import mongoose from 'mongoose';

const employerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
    },
    phone_number: {
      type: String,
      validate: {
        validator: function (v) {
          return /^\+?[0-9]{7,15}$/.test(v);
        },
        message: 'Invalid phone number format',
      },
    },
    location: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Invalid URL format',
      },
    },
    profile_url: {
      type: String,
      validate: {
        validator: function (v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Invalid URL format',
      },
    },
    about_us: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    est_year: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear(),
    },
    industry_type: {
      type: String,
      trim: true,
    },
    total_working_employees: {
      type: Number,
      min: 1,
    },
    vision: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

const Employer = mongoose.models.Employer || mongoose.model('Employer', employerSchema);

export default Employer;
