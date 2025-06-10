import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import Users from '@/models/users';
import { withApiHandler } from '@/utils/commonHandlers';
import { ApiError } from '@/utils/commonError';

export const POST = withApiHandler(async request => {
  const { fcmToken } = await request.json();
  const userHeader = request.headers.get('x-user');
  const user = userHeader ? JSON.parse(userHeader) : null;

  if (!user?.id) {
    throw new ApiError('Unauthorized request', 401);
  }

  if (!fcmToken) {
    throw new ApiError('FCM token is required', 400);
  }

  await connectMongoDB();

  await Users.findByIdAndUpdate(user.id, {
    $addToSet: { fcmTokens: fcmToken },
  });

  return NextResponse.json(
    {
      message: null,
      data: { fcmToken },
    },
    { status: 200 }
  );
});
