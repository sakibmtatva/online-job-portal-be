import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import { ApiError } from '@/utils/commonError';
import connectMongoDB from '@/lib/mongodb';
import Jobs from '../../../../models/jobs';
import mongoose from 'mongoose';

export const GET = withApiHandler(async request => {
  await connectMongoDB();

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  const userDetails = JSON.parse(request.headers.get('x-user'));
  if (!userDetails || !userDetails.id) {
    throw new ApiError('Unauthorized request', 401);
  }

  const candidateId = new mongoose.Types.ObjectId(userDetails.id);

  const matchQuery = {
    applicants: { $in: [candidateId] },
  };

  const jobs = await Jobs.aggregate([
    { $match: matchQuery },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: 'applications',
        let: { jobId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$job', '$$jobId'] }, { $eq: ['$candidate', candidateId] }],
              },
            },
          },
          {
            $project: {
              _id: 0,
              appliedAt: '$createdAt',
            },
          },
        ],
        as: 'applicationData',
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
      $unwind: {
        path: '$applicationData',
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
        appliedAt: '$applicationData.appliedAt',
      },
    },
    { $skip: skip },
    { $limit: limit },
  ]);

  const jobsWithMeta = jobs.map(job => ({
    ...job,
    applicantCount: job.applicants.length,
    hasApplied: true,
  }));

  const totalAggregation = await Jobs.aggregate([{ $match: matchQuery }, { $count: 'total' }]);

  const total = totalAggregation[0]?.total || 0;

  return successResponse(jobsWithMeta, 'Applied jobs fetched successfully', 200, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});
