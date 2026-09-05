import Activity from '../models/Activity.js';
import User from '../models/User.js';
import { notify } from './notify.js';

const ONGOING_WINDOW_MS = 3 * 60 * 60 * 1000;

export const scheduledAt = (a) => {
  const d = new Date(a.date);
  const t = a.time || '';
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (m) {
    d.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0);
  }
  return d;
};

// Computes the status an activity should have right now: upcoming -> ongoing -> completed
export const currentStatus = (a) => {
  const now = new Date();
  const start = scheduledAt(a);
  const diff = now - start;
  if (diff < -ONGOING_WINDOW_MS) return 'upcoming';
  if (diff <= ONGOING_WINDOW_MS) return 'ongoing';
  return 'completed';
};

// Advance past-due future activities and fire completion rewards/notifications once
export const refreshActivityStatuses = async (io) => {
  try {
    const due = await Activity.find({ status: { $in: ['upcoming', 'ongoing'] } });
    let changed = 0;

    for (const a of due) {
      const next = currentStatus(a);
      if (next === a.status) continue;

      const previous = a.status;
      a.status = next;
      await a.save();
      changed++;

      if (next === 'completed' && previous !== 'completed') {
        // Bump streak for host + joined participants (one bump per completion)
        const userIds = [a.creator, ...a.participants.filter((p) => p.status === 'joined').map((p) => p.user)];
        for (const uid of new Set(userIds.map(String))) {
          await User.findByIdAndUpdate(uid, { $inc: { 'stats.streak': 1 } });
        }

        const text = previous === 'ongoing' ? `wrapped up "${a.title}" — rate it!` : `you completed "${a.title}" — don't forget to rate your experience!`;
        const actor = a.creator;
        for (const uid of new Set(userIds.map(String))) {
          await notify(io, {
            recipient: uid,
            actor,
            type: 'activity',
            text,
            activity: a._id,
            link: `/feedback`,
          });
        }
      }
    }

    if (changed > 0) console.log(`[lifecycle] advanced ${changed} activity(ies)`);
    return changed;
  } catch (error) {
    console.error('[lifecycle] refresh error:', error.message);
    return 0;
  }
};

export default refreshActivityStatuses;