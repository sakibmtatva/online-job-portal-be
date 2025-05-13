import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
    },
    resume_url: {
      type: String,
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
    position: {
      type: String,
      trim: true,
    },
    previous_experience: {
      type: String,
      trim: true,
    },
    total_experience: {
      type: Number,
      min: [0, 'Experience must be positive'],
    },
    certifications: {
      type: [String],
      default: [],
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
    current_sal: {
      type: Number,
      min: 0,
    },
    expected_sal: {
      type: Number,
      min: 0,
    },
    location: {
      type: String,
      trim: true,
    },
    education: {
      type: String,
      trim: true,
    },
    nationality: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    headline: {
      type: String,
      trim: true,
      maxlength: 100,
    },
  },
  {
    timestamps: true,
  }
);

const Candidate = mongoose.models.Candidate || mongoose.model('Candidate', candidateSchema);
export default Candidate;
