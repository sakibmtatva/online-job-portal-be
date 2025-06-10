import mongoose from 'mongoose';

const currencySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    symbole: { type: String, required: true },
  },
  { _id: false }
);

const planDataSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    description: { type: String, required: true },
    name: { type: String, required: true },
    duration: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: currencySchema, required: true },
    features: { type: [String], default: [] },
    paymentLink: { type: String },
    priceId: { type: String },
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    planData: {
      type: planDataSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'trialing', 'pending'],
      default: 'pending',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    paymentMethod: {
      type: String,
    },
  },
  { timestamps: true }
);

const Subscription =
  mongoose.models.Subscription ||
  mongoose.model('Subscription', subscriptionSchema);


export default Subscription;
