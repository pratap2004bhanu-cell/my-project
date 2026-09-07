import Notification from '../models/Notification.js';
import User from '../models/User.js';
import sendPush from './push.js';

// Create a notification document and emit it live to the recipient via socket.io
export const notify = async (io, { recipient, actor, type, text, activity, community, event, link }) => {
  try {
    if (!recipient || recipient.toString() === actor?.toString()) return;
    let notification;
    if (actor) {
      notification = await Notification.create({ user: recipient, actor, type, text, activity, community, event, link });
      notification = await notification.populate('actor', 'name avatar');
    } else {
      notification = await Notification.create({ user: recipient, type, text, activity, community, event, link });
    }
    io?.to(recipient.toString()).emit('notification:new', notification);

    // Fire a web push notification (needs the user's pushSubscriptions + push toggle)
    const recipientUser = await User.findById(recipient).select('pushSubscriptions notifications').lean();
    if (recipientUser) {
      // Respect the per-category notification preference for event-style updates
      if ((type === 'event' || type === 'squad') && recipientUser.notifications?.eventUpdates === false) return notification;
      const pushTitle = type === 'activity' ? 'Activity update'
        : type === 'message' ? 'New message'
          : type === 'event' ? 'KIKY Events'
            : type === 'squad' ? 'Event Squad' : 'LetsGo';
      sendPush(recipientUser, {
        type,
        title: pushTitle,
        body: text,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { path: link || '/notifications', activity, event: event?.toString?.(), actor: actor?.toString?.() },
      });
    }
    return notification;
  } catch (error) {
    console.error('notify error:', error.message);
    return null;
  }
};

export default notify;