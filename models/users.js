import mongoose, { Schema } from 'mongoose';

const userSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: [true, 'Full name is required'],
  },
  user_name: {
    type: String,
    required: [true, 'User name is required'],
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  user_type: {
    type: String,
    enum: {
      values: ['Candidate', 'Employer'],
      message: "User type must be either 'Candidate' or 'Employer'",
    },
    required: [true, 'User type is required'],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  resetPasswordOTP: String,
  resetPasswordOTPExpiry: Date,
  fcmTokens: {
    type: [String],
    default: [],
  },
  // subscription: {
  //   plan: String,
  //   active: Boolean,
  //   paymentId: String,
  //   purchasedAt: Date,
  // },
  currentSubscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null,
  },
});

userSchema.virtual('candidate-profile-info', {
  ref: 'Candidate',
  localField: '_id',
  foreignField: 'user',
  justOne: true,
});

userSchema.virtual('employer-profile-info', {
  ref: 'Employer',
  localField: '_id',
  foreignField: 'user',
  justOne: true,
});

userSchema.set('toObject', { virtuals: true });
userSchema.set('toJSON', { virtuals: true });

const Users = mongoose.models.Users || mongoose.model('Users', userSchema);

export default Users;
