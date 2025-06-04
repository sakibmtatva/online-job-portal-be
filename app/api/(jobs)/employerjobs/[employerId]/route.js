import connectMongoDB from '@/lib/mongodb';
import Jobs from '@/models/jobs';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import { BookmarkJob } from '@/models/jobCandidateBookmark';
import mongoose from 'mongoose';

export const GET = withApiHandler(async (request, { params }) => {
  await connectMongoDB();
  const { employerId } = await params;
  const { searchParams } = new URL(request.url);
  const userDetails = JSON.parse(request.headers.get('x-user'));

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const sortBy = searchParams.get('sortBy');
  const sort = !sortBy ? { createdAt: -1 } : { createdAt: sortBy === 'asc' ? -1 : 1 };
  const skip = (page - 1) * limit;

  let jobs = await Jobs.aggregate([
    {
      $sort: sort,
    },
    {
      $match: {
        user: new mongoose.Types.ObjectId(employerId),
        status: { $ne: 'Expired' },
      },
    },
    {
      $lookup: {
        from: 'employers',
        localField: 'user',
        foreignField: 'user',
        as: 'employerData',
      },
    },
    {
      $unwind: {
        path: '$employerData',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        job_title: 1,
        job_description: 1,
        location: 1,
        category: 1,
        salary_min: 1,
        salary_max: 1,
        education: 1,
        jobType: 1,
        experience_level: 1,
        status: 1,
        applicants: 1,
        skills_required: 1,
        profile_url: '$employerData.profile_url',
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  if (userDetails) {
    const bookmarks = await BookmarkJob.find({
      candidate: userDetails.id,
    }).lean();

    const bookmarkedMap = new Map();
    bookmarks.forEach(b => {
      bookmarkedMap.set(b.job.toString(), b._id.toString());
    });

    jobs = jobs.map(job => {
      const bookmarkId = bookmarkedMap.get(job._id.toString());
      return {
        ...job,
        isBookmarked: !!bookmarkId,
        bookmarkId: bookmarkId || null,
        hasApplied: job.applicants.some(id => id.toString() === userDetails.id.toString()),
      };
    });
  }

  const total = await Jobs.countDocuments({
    user: employerId.toString(),
    status: { $ne: 'Expired' },
  });

  return successResponse(jobs, 'Jobs fetched successfully', 200, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});
