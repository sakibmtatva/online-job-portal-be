import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },
  invoiceNumber: String,
  paymentId: String,
  amount: Number,
  currency: { type: String, default: 'USD' },
  status: {
    type: String,
    enum: ['paid', 'failed', 'pending'],
    default: 'pending',
  },
  paidAt: Date,
}, { timestamps: true });

const Invoice =
  mongoose.models.Invoice ||
  mongoose.model('Invoice', invoiceSchema);


export default Invoice
