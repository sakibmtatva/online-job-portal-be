import connectMongoDB from '@/lib/mongodb';
import { BookmarkJob } from '@/models/jobCandidateBookmark';
import Jobs from '@/models/jobs';
import { ApiError } from '@/utils/commonError';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import mongoose from 'mongoose';

export const GET = withApiHandler(async request => {
  await connectMongoDB();
  const userDetails = JSON.parse(request.headers.get('x-user'));
  if (userDetails.user_type === 'Employer') {
    throw new ApiError('Unauthorized request', 401);
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  let jobList = await BookmarkJob.aggregate([
    {
      $match: { candidate: new mongoose.Types.ObjectId(userDetails.id) },
    },
    {
      $lookup: {
        from: 'jobs',
        localField: 'job',
        foreignField: '_id',
        as: 'job',
      },
    },
    { $unwind: '$job' },
    {
      $lookup: {
        from: 'employers',
        localField: 'job.user',
        foreignField: 'user',
        as: 'employer',
      },
    },
    { $unwind: { path: '$employer', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        jobDetails: '$job',
        profile_url: '$employer.profile_url',
      },
    },
    { $skip: skip },
    { $limit: limit },
  ]);

  if (userDetails) {
    const bookmarks = await BookmarkJob.find({
      candidate: userDetails.id,
    }).lean();

    const bookmarkedMap = new Map();
    bookmarks.forEach(b => {
      bookmarkedMap.set(b.job.toString(), b._id.toString());
    });

    jobList = jobList.map(job => {
      const bookmarkId = bookmarkedMap.get(job.jobDetails._id.toString());
      return {
        ...job,
        isBookmarked: !!bookmarkId,
        bookmarkId: bookmarkId || null,
        hasApplied: job.jobDetails.applicants.some(id => id.toString() === userDetails.id.toString()),
      };
    });
  }

  const totalAggregation = await BookmarkJob.aggregate([
    { $match: { candidate: new mongoose.Types.ObjectId(userDetails.id) } },
    { $count: 'total' },
  ]);

  const total = totalAggregation[0]?.total || 0;

  return successResponse(jobList, 'Jobs fetched successfully', 200, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});
