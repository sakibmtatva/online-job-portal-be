import Meeting from '@/models/meeting';
import connectMongoDB from '@/lib/mongodb';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import { ApiError } from '@/utils/commonError';
import '@/models/candidate';
import '@/models/jobs';
import '@/models/users';

export const GET = withApiHandler(async request => {
  await connectMongoDB();

  const userDetails = JSON.parse(request.headers.get('x-user') || '{}');

  if (userDetails.user_type !== 'Employer') {
    throw new ApiError('Only employers can view scheduled meetings', 401);
  }

  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const shouldPaginate = pageParam && limitParam;
  const page = shouldPaginate ? parseInt(pageParam) : 1;
  const limit = shouldPaginate ? parseInt(limitParam) : 0;
  const skip = shouldPaginate ? (page - 1) * limit : 0;

  const meetings = Meeting.find({ scheduled_by: userDetails.id })
    .populate({
      path: 'job',
      select: 'job_title',
    })
    .populate({
      path: 'candidate',
      select: 'full_name email phone',
    })
    .sort({ createdAt: -1 });

  if (shouldPaginate) {
    meetings.skip(skip).limit(limit);
  }
  const finalMeetings = await meetings;
  const total = await Meeting.countDocuments({ scheduled_by: userDetails.id });

  return successResponse(finalMeetings, 'Meetings fetched successfully', 200, {
    total,
    page: shouldPaginate ? page : 1,
    limit: shouldPaginate ? limit : total,
    totalPages: shouldPaginate ? Math.ceil(total / limit) : 1,
  });
});
