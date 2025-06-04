import Meeting from '@/models/meeting';
import connectMongoDB from '@/lib/mongodb';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import '@/models/candidate';
import '@/models/jobs';
import '@/models/users';
import '@/models/candidate';
import '@/models/employer';

export const GET = withApiHandler(async request => {
  await connectMongoDB();

  const userDetails = JSON.parse(request.headers.get('x-user') || '{}');

  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const shouldPaginate = pageParam && limitParam;
  const page = shouldPaginate ? parseInt(pageParam) : 1;
  const limit = shouldPaginate ? parseInt(limitParam) : 0;
  const skip = shouldPaginate ? (page - 1) * limit : 0;

  const meetings = Meeting.find({ candidate: userDetails.id, status: 'Scheduled' })
    .populate({
      path: 'job',
      select: 'job_title',
    })
    .populate({
      path: 'candidate',
      select: 'full_name email phone',
    })
    .populate({
      path: 'scheduled_by',
      select: 'full_name email phone profile_url',
      populate: {
        path: 'employer-profile-info',
        select: 'profile_url',
      },
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
