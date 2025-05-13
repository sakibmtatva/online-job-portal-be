import mongoose, { Schema } from 'mongoose';

const contactSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name title is required'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
    },
    message: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const ContactUS = mongoose.models.ContactUs || mongoose.model('ContactUs', contactSchema);

export default ContactUS;
