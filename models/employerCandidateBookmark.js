import mongoose, { Schema } from 'mongoose';

const employerCandidateBookmarkSchema = new Schema(
  {
    employer: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
    },
    candidate: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

employerCandidateBookmarkSchema.index({ employer: 1, candidate: 1 }, { unique: true });

const EmployerCandidateBookmark =
  mongoose.models.EmployerCandidateBookmark ||
  mongoose.model('EmployerCandidateBookmark', employerCandidateBookmarkSchema);

export default EmployerCandidateBookmark;
