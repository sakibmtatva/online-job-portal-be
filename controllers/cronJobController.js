import dotenv from 'dotenv';
dotenv.config();

import cron from 'node-cron';
import connectMongoDB from '../lib/mongodb.js';
import Jobs from '../models/jobs.js';
import Meeting from '../models/meeting.js';

connectMongoDB().then(() => {
  const markExpiredJobs = async () => {
    try {
      console.log('[Cron Job] Checking for expired jobs...');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await Jobs.updateMany(
        {
          closing_date: { $lt: today },
          status: { $ne: 'Expired' },
        },
        { $set: { status: 'Expired' } }
      );

      console.log(`[Cron Job] Marked ${result.modifiedCount} jobs as expired.`);
    } catch (err) {
      console.error('[Cron Job Error]', err);
    }
  };

  const markExpiredMeetings = async () => {
    try {
      console.log('[Cron Job] Checking for expired meetings...');

      const now = new Date();

      // Get meetings that are still scheduled
      const meetings = await Meeting.find({ status: 'Scheduled' });

      const toExpire = meetings.filter(meeting => {
        const endDateTime = new Date(`${meeting.date}T${meeting.end_time}`);
        return endDateTime < now;
      });

      if (toExpire.length > 0) {
        const idsToExpire = toExpire.map(m => m._id);

        const result = await Meeting.updateMany({ _id: { $in: idsToExpire } }, { $set: { status: 'Expired' } });

        console.log(`[Cron Job] Marked ${result.modifiedCount} meetings as expired.`);
      } else {
        console.log('[Cron Job] No meetings to mark as expired.');
      }
    } catch (err) {
      console.error('[Cron Job Error]', err);
    }
  };

  // Run every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    console.log('[Cron Job] Running markCompletedMeetings...');
    markExpiredMeetings();
  });

  // Run every minute
  // cron.schedule('* * * * *', () => {
  //   console.log('[Cron Job] Running markCompletedMeetings...');
  //   markExpiredMeetings();
  // });

  // Run at 9:00 AM and 6:00 PM every day
  cron.schedule('0 9,18 * * *', () => {
    console.log('[Cron Job] Running markExpiredJobs...');
    markExpiredJobs();
  });

  console.log('[Cron Job Service] Started successfully');
});
