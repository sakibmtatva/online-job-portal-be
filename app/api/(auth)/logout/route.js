import connectMongoDB from '@/lib/mongodb';
import Users from '@/models/users';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import { ApiError } from '@/utils/commonError';

const UNAUTHORIZED_ERROR = 'Unauthorized request';
const LOGOUT_SUCCESS_MESSAGE = 'Logged out successfully';

await connectMongoDB();

export const POST = withApiHandler(async request => {
  const userHeader = request.headers.get('x-user');
  const user = userHeader ? JSON.parse(userHeader) : null;
  const { fcmToken } = await request.json();

  if (!user?.id) {
    throw new ApiError(UNAUTHORIZED_ERROR, 401);
  }

  const userId = user.id;

  if (fcmToken && typeof fcmToken === 'string') {
    const tokenIndex = user.fcmTokens?.indexOf(fcmToken);
    if (tokenIndex !== -1) {
      try {
        await Users.findByIdAndUpdate(userId, { $pull: { fcmTokens: fcmToken } }, { new: true });
      } catch (error) {
        throw new ApiError(`Firebase operation failed: ${error.message}`, 500);
      }
    }
  }

  return successResponse(null, LOGOUT_SUCCESS_MESSAGE, 200);
});
