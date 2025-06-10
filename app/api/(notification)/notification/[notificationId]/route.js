import connectMongoDB from '@/lib/mongodb';
import { notificationController } from '@/controllers/notificationController';
import Notification from '@/models/notification';
import { createApiResponse } from '@/utils/apiResponse';

// Mark a notification as read
export async function PUT(request, { params }) {
  try {
    await connectMongoDB();
    const { notificationId } = params;
    const userDetails = JSON.parse(request.headers.get('x-user'));

    if (!userDetails || !userDetails.id) {
      return createApiResponse('Unauthorized', null, 401).response;
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return createApiResponse('Notification not found', null, 404).response;
    }

    if (notification.userId.toString() !== userDetails.id) {
      return createApiResponse('Unauthorized', null, 403).response;
    }

    const updatedNotification = await notificationController.markAsRead(notificationId);

    return createApiResponse('Notification marked as read successfully', updatedNotification, 200).response;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return createApiResponse('Failed to mark notification as read', null, 500).response;
  }
}

// Delete a notification
export async function DELETE(request, { params }) {
  try {
    await connectMongoDB();
    const { notificationId } = params;
    const userDetails = JSON.parse(request.headers.get('x-user'));

    if (!userDetails || !userDetails.id) {
      return createApiResponse('Unauthorized', null, 401).response;
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return createApiResponse('Notification not found', null, 404).response;
    }

    if (notification.userId.toString() !== userDetails.id) {
      return createApiResponse('Unauthorized', null, 403).response;
    }

    const result = await notificationController.deleteNotification(notificationId);

    return createApiResponse('Notification deleted successfully', result, 200).response;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return createApiResponse('Failed to delete notification', null, 500).response;
  }
}
