import mongoose, { Schema } from 'mongoose';

const bookmarkSchema = new Schema(
  {
    candidate: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    job: { type: Schema.Types.ObjectId, ref: 'Jobs', required: true },
  },
  {
    timestamps: true,
  }
);

export const BookmarkJob = mongoose.models.BookmarkJob || mongoose.model('BookmarkJob', bookmarkSchema);
