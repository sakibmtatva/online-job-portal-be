import connectMongoDB from '@/lib/mongodb';
import Meeting from '@/models/meeting';
import { transporter } from '../../../../../utils/email-service';
import { notificationController } from '@/controllers/notificationController';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import { ApiError } from '@/utils/commonError';

export const DELETE = withApiHandler(async (_, { params }) => {
  await connectMongoDB();

  const { meetingId } = params;
  const meeting = await Meeting.findByIdAndUpdate(meetingId, { status: 'Cancelled' }, { new: true }).populate([
    'candidate',
    'job',
  ]);

  if (!meeting) {
    throw new ApiError('Meeting not found', 404);
  }

  const candidate = meeting.candidate;
  const job = meeting.job;

  if (!candidate || !job) {
    throw new ApiError('Associated candidate or job not found', 404);
  }

  await notificationController.createNotification(
    candidate._id,
    `Your meeting for the job '${job.job_title}' on ${meeting.date} has been cancelled.`,
    'info',
    {
      type: 'Employer',
      id: meeting._id,
    }
  );

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: candidate.email,
    subject: `Your meeting for the ${job.job_title} position has been cancelled`,
    html: `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #D14343; margin-bottom: 20px;">Meeting Cancelled</h2>
        <p style="font-size: 16px; color: #333;">Hello <strong>${candidate.full_name}</strong>,</p>
        <p style="font-size: 16px; color: #333;">
          We regret to inform you that your meeting for the <strong>${job.job_title}</strong> position has been <span style="color: #D14343;">cancelled</span>.
        </p>

        <table style="width: 100%; margin-top: 20px; font-size: 16px; color: #333;">
          <tr>
            <td style="padding: 8px 0;"><strong>Original Date:</strong></td>
            <td style="padding: 8px 0;">${meeting.date}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Start Time:</strong></td>
            <td style="padding: 8px 0;">${meeting.start_time}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>End Time:</strong></td>
            <td style="padding: 8px 0;">${meeting.end_time}</td>
          </tr>
        </table>

        <p style="font-size: 16px; color: #333; margin-top: 30px;">
          If you have any questions, please feel free to contact us.
        </p>

        <hr style="margin: 30px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">
          This is an automated email. Please do not reply directly.
        </p>
      </div>
    </div>
    `,
  });

  return successResponse(meeting, 'Meeting cancelled and candidate notified', 200);
});

export const PUT = withApiHandler(async (request, { params }) => {
  await connectMongoDB();

  const { meetingId } = params;
  const formData = await request.formData();

  const userDetails = JSON.parse(request.headers.get('x-user') || '{}');

  if (userDetails.user_type !== 'Employer') {
    throw new ApiError('Only employers can edit meetings', 401);
  }

  const date = formData.get('date');
  const start_time = formData.get('start_time');
  const end_time = formData.get('end_time');

  if (!date || !start_time || !end_time) {
    throw new ApiError('All fields (date, start_time, end_time) are required', 400);
  }

  if (start_time >= end_time) {
    throw new ApiError('End time must be after start time', 400);
  }

  const meeting = await Meeting.findById(meetingId).populate(['candidate', 'job']);

  if (!meeting) {
    throw new ApiError('Meeting not found', 404);
  }

  const employerOverlappingMeeting = await Meeting.findOne({
    _id: { $ne: meetingId },
    scheduled_by: userDetails.id,
    date,
    status: 'Scheduled',
    $or: [
      {
        start_time: { $lt: end_time },
        end_time: { $gt: start_time },
      },
    ],
  });

  if (employerOverlappingMeeting) {
    throw new ApiError('You already have a meeting scheduled during this time range', 409);
  }

  const candidateOverlappingMeeting = await Meeting.findOne({
    candidate: meeting.candidate,
    scheduled_by: { $ne: userDetails.id },
    date,
    status: 'Scheduled',
    start_time: { $lt: end_time },
    end_time: { $gt: start_time },
  });

  if (candidateOverlappingMeeting) {
    throw new ApiError('The candidate is already scheduled for another meeting during this time range', 409);
  }

  meeting.date = date;
  meeting.start_time = start_time;
  meeting.end_time = end_time;
  await meeting.save();

  const candidate = meeting.candidate;
  const job = meeting.job;

  await notificationController.createNotification(
    candidate._id,
    `Your meeting for '${job.job_title}' has been rescheduled to ${date} from ${start_time} to ${end_time}.`,
    'info',
    {
      type: 'Meeting',
      id: meeting._id,
    }
  );

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: candidate.email,
    subject: `Your meeting for the ${job.job_title} position has been rescheduled`,
    html: `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #0A65CC; margin-bottom: 20px;">Meeting Rescheduled</h2>
        <p style="font-size: 16px; color: #333;">Hello <strong>${candidate.full_name}</strong>,</p>
        <p style="font-size: 16px; color: #333;">
          Your meeting for the <strong>${job.job_title}</strong> position has been rescheduled.
        </p>

        <table style="width: 100%; margin-top: 20px; font-size: 16px; color: #333;">
          <tr>
            <td style="padding: 8px 0;"><strong>New Date:</strong></td>
            <td style="padding: 8px 0;">${date}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Start Time:</strong></td>
            <td style="padding: 8px 0;">${start_time}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>End Time:</strong></td>
            <td style="padding: 8px 0;">${end_time}</td>
          </tr>
          <tr>
          <td style="padding: 8px 0;"><strong>Meeting Link:</strong></td>
          <td style="padding: 8px 0;"><a href="${meeting.meeting_url}" style="color: #0A65CC;">Join Meeting</a></td>
        </tr>
        </table>

        <p style="font-size: 16px; color: #333; margin-top: 30px;">
          Please contact us if you have any questions or need further assistance.
        </p>

        <hr style="margin: 30px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">
          This is an automated email. Please do not reply directly.
        </p>
      </div>
    </div>
    `,
  });

  return successResponse(meeting, 'Meeting updated and candidate notified', 200);
});

export const GET = withApiHandler(async (_, { params }) => {
  await connectMongoDB();

  const { meetingId } = params;
  const meeting = await Meeting.findById(meetingId)
    .populate({
      path: 'job',
      select: 'job_title',
    })
    .populate({
      path: 'candidate',
      select: 'full_name email phone',
    });

  if (!meeting) {
    throw new ApiError('Meeting not found', 404);
  }

  return successResponse(meeting, 'Meeting fetched successfully', 200);
});
