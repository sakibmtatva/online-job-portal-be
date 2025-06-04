const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Column = mongoose.models.Column || mongoose.model('Column', columnSchema);

export default Column;
