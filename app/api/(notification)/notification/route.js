import connectMongoDB from '@/lib/mongodb';
import { notificationController } from '@/controllers/notificationController';
import { createApiResponse } from '@/utils/apiResponse';

export async function GET(request) {
  try {
    await connectMongoDB();
    const userDetails = JSON.parse(request.headers.get('x-user'));

    if (!userDetails || !userDetails.id) {
      return createApiResponse('Unauthorized', null, 401).response;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '10');

    const notifications = await notificationController.getUserNotifications(userDetails.id, page, perPage);

    return createApiResponse(null, notifications, 200).response;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return createApiResponse('Failed to fetch notifications', null, 500).response;
  }
}

// Mark all notifications as read
export async function PUT(request) {
  try {
    await connectMongoDB();
    const userDetails = JSON.parse(request.headers.get('x-user'));

    if (!userDetails || !userDetails.id) {
      return createApiResponse('Unauthorized', null, 401).response;
    }

    const result = await notificationController.markAllAsRead(userDetails.id);

    return createApiResponse('All notifications marked as read', result, 200).response;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return createApiResponse('Failed to mark all notifications as read', null, 500).response;
  }
}

// Delete all notifications
export async function DELETE(request) {
  try {
    await connectMongoDB();
    const userDetails = JSON.parse(request.headers.get('x-user'));

    if (!userDetails || !userDetails.id) {
      return createApiResponse('Unauthorized', null, 401).response;
    }

    const result = await notificationController.deleteAllNotifications(userDetails.id);

    return createApiResponse('All notifications deleted successfully', result, 200).response;
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    return createApiResponse('Failed to delete all notifications', null, 500).response;
  }
}
