import mongoose, { Schema } from 'mongoose';

const meetingSchema = new Schema(
  {
    candidate: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    job: { type: Schema.Types.ObjectId, ref: 'Jobs', required: true },
    scheduled_by: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    date: { type: String, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled', 'Expired'],
      default: 'Scheduled',
    },
    meeting_url: { type: String },
  },
  { timestamps: true }
);

const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', meetingSchema);

export default Meeting;
