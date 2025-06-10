
import { stripe } from '@/lib/strip';
import { ApiError } from '@/utils/commonError';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';

export const GET = withApiHandler(async (request, { params }) => {
  const { sessionId } = await params;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return successResponse(session, 'Session fetched successfully', 200);
  } catch (error) {
    console.error('Failed to fetch session:', error);
    throw new ApiError('Session id is invalid', 500);
  }
})
