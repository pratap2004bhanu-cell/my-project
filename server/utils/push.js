import webpush from 'web-push';
import User from '../models/User.js';

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:kiky@example.com';

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

// Send a web push notification to every stored subscription for a user.
// Removes subscriptions the push service reports as invalid (unsubscribed / 410).
export const sendPush = async (user, payload) => {
  try {
    if (!publicKey || !privateKey) return 0;
    const subs = (user && typeof user.pushSubscriptions === 'object' ? user.pushSubscriptions : []) || [];
    const valid = user?.notifications?.push !== false;

    if (!valid || subs.length === 0) return 0;

    const seen = new Set();
    const active = [];
    for (const s of subs) {
      if (!s || !s.endpoint || seen.has(s.endpoint)) continue;
      seen.add(s.endpoint);
      active.push(s);
    }

    let sent = 0;
    const toPrune = [];
    for (const sub of active) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 }
        );
        sent++;
      } catch (error) {
        const code = error?.statusCode;
        if (code === 404 || code === 410 || (error?.name === 'VapidDetailsException')) {
          toPrune.push(sub.endpoint);
        }
      }
    }

    if (toPrune.length > 0) {
      await User.updateOne(
        { _id: user._id },
        { $pull: { pushSubscriptions: { endpoint: { $in: toPrune } } } }
      );
    }
    return sent;
  } catch (error) {
    console.error('push send error:', error.message);
    return 0;
  }
};

export const getPublicKey = () => publicKey || null;

export default sendPush;