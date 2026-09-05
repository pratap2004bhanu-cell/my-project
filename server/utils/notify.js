import Notification from '../models/Notification.js';
import User from '../models/User.js';
import sendPush from './push.js';

// Create a notification document and emit it live to the recipient via socket.io
export const notify = async (io, { recipient, actor, type, text, activity, community, link }) => {
  try {
    if (!recipient || recipient.toString() === actor?.toString()) return;
    let notification;
    if (actor) {
      notification = await Notification.create({ user: recipient, actor, type, text, activity, community, link });
      notification = await notification.populate('actor', 'name avatar');
    } else {
      notification = await Notification.create({ user: recipient, type, text, activity, community, link });
    }
    io?.to(recipient.toString()).emit('notification:new', notification);

    // Fire a web push notification (needs the user's pushSubscriptions + push toggle)
    const recipientUser = await User.findById(recipient).select('pushSubscriptions notifications').lean();
    if (recipientUser) {
      sendPush(recipientUser, {
        type,
        title: type === 'activity' ? 'Activity update' : type === 'message' ? 'New message' : 'LetsGo',
        body: text,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { path: link || '/notifications', activity, actor: actor?.toString?.() },
      });
    }
    return notification;
  } catch (error) {
    console.error('notify error:', error.message);
    return null;
  }
};

export default notify;