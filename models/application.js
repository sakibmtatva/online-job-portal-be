import mongoose, { Schema } from 'mongoose';

const applicationSchema = new Schema(
  {
    candidate: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    job: { type: Schema.Types.ObjectId, ref: 'Jobs', required: true },
    resume_url: { type: String, required: true },
    cover_letter: {
      type: String,
      required: true,
      minlength: 100,
      maxlength: 2000,
    },
    trello_name: { type: String, default: 'All Applications' },
    applied_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

export default Application;
