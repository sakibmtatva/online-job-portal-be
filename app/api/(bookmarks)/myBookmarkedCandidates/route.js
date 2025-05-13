import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import connectMongoDB from '@/lib/mongodb';
import EmployerCandidateBookmark from '@/models/employerCandidateBookmark';
import { ApiError } from '@/utils/commonError';
import Users from '@/models/users';
import mongoose from 'mongoose';

export const GET = withApiHandler(async request => {
  await connectMongoDB();
  const userDetails = JSON.parse(request.headers.get('x-user'));
  if (userDetails.user_type !== 'Employer') {
    throw new ApiError('Unauthorized request', 401);
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  const rawList = await EmployerCandidateBookmark.aggregate([
    {
      $match: { employer: new mongoose.Types.ObjectId(userDetails.id) },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'candidate',
        foreignField: '_id',
        as: 'candidateUser',
      },
    },
    { $unwind: '$candidateUser' },
    {
      $lookup: {
        from: 'candidates',
        localField: 'candidate',
        foreignField: 'user',
        as: 'candidateProfile',
      },
    },
    { $unwind: { path: '$candidateProfile', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        candidate: 1,
        'candidateUser.full_name': 1,
        'candidateUser.email': 1,
        'candidateProfile.profile_url': 1,
        'candidateProfile.resume_url': 1,
        'candidateProfile.position': 1,
        'candidateProfile.total_experience': 1,
      },
    },
    { $skip: skip },
    { $limit: limit },
  ]);

  const bookMarkedCandidateList = rawList.map(item => {
    const candidateUser = item.candidateUser || {};
    const candidateProfile = item.candidateProfile || {};

    return {
      id: item.candidate,
      full_name: candidateUser.full_name,
      email: candidateUser.email,
      profile_url: candidateProfile.profile_url || '',
      resume_url: candidateProfile.resume_url || '',
      position: candidateProfile.position || '',
      total_experience: candidateProfile.total_experience || 0,
      bookmarkId: item._id?.toString() || null,
      isBookmarked: true,
    };
  });

  const totalAggregation = await EmployerCandidateBookmark.aggregate([
    { $match: { employer: new mongoose.Types.ObjectId(userDetails.id) } },
    { $count: 'total' },
  ]);

  const total = totalAggregation[0]?.total || 0;

  return successResponse(bookMarkedCandidateList, 'candidate list fetched successfully', 200, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});
