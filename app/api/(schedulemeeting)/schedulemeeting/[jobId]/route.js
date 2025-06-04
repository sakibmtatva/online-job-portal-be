import connectMongoDB from '@/lib/mongodb';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import { ApiError } from '@/utils/commonError';
import Users from '@/models/users';
import Jobs from '@/models/jobs';
import Meeting from '@/models/meeting';
import { transporter } from '../../../../../utils/email-service';
import { notificationController } from '@/controllers/notificationController';

export const POST = withApiHandler(async (request, { params }) => {
  await connectMongoDB();

  const { jobId } = await params;
  const formData = await request.formData();

  const userDetails = JSON.parse(request.headers.get('x-user') || '{}');

  if (userDetails.user_type !== 'Employer') {
    throw new ApiError('Only employers can schedule meetings', 401);
  }

  if (!jobId) {
    throw new ApiError('jobId is required', 400);
  }

  const candidateId = formData.get('candidateId');
  const date = formData.get('date');
  const start_time = formData.get('start_time');
  const end_time = formData.get('end_time');

  if (!candidateId || !date || !start_time || !end_time) {
    throw new ApiError('All fields (candidateId, date, start_time, end_time) are required', 400);
  }

  if (start_time >= end_time) {
    throw new ApiError('End time must be after start time', 400);
  }

  const job = await Jobs.findById(jobId);
  const candidate = await Users.findById(candidateId);

  if (!job || !candidate) {
    throw new ApiError('Invalid job or candidate ID', 404);
  }

  const employerOverlappingMeeting = await Meeting.findOne({
    scheduled_by: userDetails.id,
    date,
    status: 'Scheduled',
    start_time: { $lt: end_time },
    end_time: { $gt: start_time },
  });

  if (employerOverlappingMeeting) {
    throw new ApiError('You already have a meeting scheduled during this time range', 409);
  }

  const candidateOverlappingMeeting = await Meeting.findOne({
    candidate: candidateId,
    scheduled_by: { $ne: userDetails.id },
    date,
    status: 'Scheduled',
    start_time: { $lt: end_time },
    end_time: { $gt: start_time },
  });

  if (candidateOverlappingMeeting) {
    throw new ApiError('The candidate is already scheduled for another meeting during this time range', 409);
  }

  const meeting = await Meeting.create({
    candidate: candidateId,
    job: jobId,
    scheduled_by: userDetails.id,
    date,
    start_time,
    end_time,
  });

  const meetingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/meeting/${meeting._id}`;
  meeting.meeting_url = meetingUrl;
  await meeting.save();

  await notificationController.createNotification(
    candidate._id,
    `A meeting has been scheduled for the job '${job.job_title}' on ${date} from ${start_time} to ${end_time}`,
    'info',
    {
      type: 'Employer',
      id: userDetails.id,
    }
  );

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: candidate.email,
    subject: `Your meeting for the ${job.job_title} position is scheduled`,
    html: `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #0A65CC; margin-bottom: 20px;">Meeting Scheduled</h2>
        <p style="font-size: 16px; color: #333;">Hello <strong>${candidate.full_name}</strong>,</p>
        <p style="font-size: 16px; color: #333;">
          Your meeting for the <strong>${job.job_title}</strong> position has been successfully scheduled.
        </p>

        <table style="width: 100%; margin-top: 20px; font-size: 16px; color: #333;">
          <tr>
            <td style="padding: 8px 0;"><strong>Date:</strong></td>
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
          <td style="padding: 8px 0;"><a href="${meetingUrl}" style="color: #0A65CC;">Join Meeting</a></td>
        </tr>
        </table>

        <p style="font-size: 16px; color: #333; margin-top: 30px;">
          If you have any questions or need to reschedule, feel free to contact us.
        </p>

        <hr style="margin: 30px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">
          This is an automated email. Please do not reply directly.
        </p>
      </div>
    </div>
  `,
  });

  return successResponse(meeting, 'Meeting scheduled successfully', 201);
});
