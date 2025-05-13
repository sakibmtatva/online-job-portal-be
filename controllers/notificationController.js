import { firebaseAdmin } from "../lib/firebase.js";
import Notification from "../models/notification.js";
import Users from "@/models/users.js";

export const notificationController = {
  async createNotification(userId, message, type = "info", data = null) {
    if (!userId || !message) {
      throw new Error('userId and message are required parameters');
    }
    try {
      const notification = await Notification.create({
        userId,
        message,
        type,
        data,
      });

      // Send Firebase push notification to all tokens
      try {
        const user = await Users.findById(userId)
        if (user?.fcmTokens?.length > 0) {
          const validTokens = user.fcmTokens.filter(token => typeof token === 'string' && token.length > 0);
          
          if (validTokens.length > 0) {
            const payload = {
              notification: {
                title: type.charAt(0).toUpperCase() + type.slice(1),
                body: message,
              },
              data: {
                notificationId: notification._id.toString(),
                type: notification.type,
                message: notification.message,
                createdAt: notification.createdAt.toISOString(),
                isRead: notification.isRead.toString(),
              },
            };

            if (firebaseAdmin.messaging().sendEachForMulticast) {
              console.log('Sending Firebase multicast notification...');
              const response = await firebaseAdmin.messaging().sendEachForMulticast({
                tokens: validTokens,
                ...payload
              });
              console.log('Firebase multicast response:', response);
            } else {
              const responses = await Promise.all(
                validTokens.map(token => 
                  firebaseAdmin.messaging().send({
                    token,
                    ...payload
                  })
                )
              );
              console.log('Firebase individual responses:', responses);
            }
          }
        }
      } catch (firebaseError) {
        console.error("Firebase notification error:", firebaseError);
      }

      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  },

  async getUserNotifications(userId, page = 1, perPage = 10) {
    try {
      const skip = Math.max(0, (page - 1) * perPage);
      const [notifications, total] = await Promise.all([
        Notification.find({ userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(perPage)
          .lean(),
        Notification.countDocuments({ userId })
      ]);

      if (!notifications || notifications.length === 0) {
        return {
          notifications: [],
          pagination: {
            total: 0,
            page,
            perPage,
            totalPages: 0,
          },
        };
      }

      return {
        notifications: notifications,
        pagination: {
          total,
          page,
          perPage,
          totalPages: Math.ceil(total / perPage),
        },
      };
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  async markAsRead(notificationId) {
    try {
      return await Notification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },

  async markAllAsRead(userId) {
    try {
      const { modifiedCount } = await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );
      return { success: true, modifiedCount };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  },

  async deleteNotification(notificationId) {
    try {
      return await Notification.findByIdAndDelete(notificationId);
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  },

  async deleteAllNotifications(userId) {
    try {
      return await Notification.deleteMany({ userId });
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      throw error;
    }
  },
};

export default notificationController;
