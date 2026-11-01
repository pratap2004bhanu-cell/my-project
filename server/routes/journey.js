import { Router } from 'express';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { currentStatus, scheduledAt } from '../utils/lifecycle.js';

/* ============================================================================
   Kiky Journey — the user's own adventure history.

   There is deliberately NO new model here. Activity already stores every
   thing a "memory" needs:
     - location.coordinates (GeoJSON Point, 2dsphere indexed)
     - participants[].status / joinedAt  ('joined' vs 'pending' vs 'left')
     - status: upcoming | ongoing | completed | cancelled
     - checkIns, photos, category, emoji, date, time
   and utils/lifecycle.js already advances past-due activities to
   'completed'.

   So a memory is simply:
     status === 'completed'  AND  (I created it OR I joined it)

   Deriving it means history can never drift from the activities that
   produced it, and it works retroactively for data that already exists.
   If check-ins are ever promoted to the authoritative attendance
   record, ONE place changes: MEMBER_PREDICATE below.
   ========================================================================== */

const router = Router();

// Participants who actually took part (excludes pending + left).
// Mirrors joinedMembers() in routes/activities.js.
const joinedIds = (activity) =>
  (activity.participants || [])
    .filter((p) => p.status !== 'pending' && p.status !== 'left')
    .map((p) => String(p.user?._id || p.user));

// The single definition of "this activity is part of my journey", expressed
// as a Mongo predicate so the database does the narrowing. Nothing unrelated
// to this user is ever loaded into memory.
const MY_ACTIVITY_QUERY = (myObjectId) => ({
  $or: [
    { creator: myObjectId },
    {
      participants: {
        $elemMatch: { user: myObjectId, status: { $nin: ['pending', 'left'] } },
      },
    },
  ],
});

const tookPart = (activity, myId) =>
  String(activity.creator?._id || activity.creator) === String(myId) ||
  joinedIds(activity).includes(String(myId));

// Coordinates are stored [lng, lat] (GeoJSON). Return [lat, lng] for Leaflet,
// or null when the venue was never geotagged — a memory without coordinates
// still counts, it just cannot appear as a map pin.
const toLatLng = (coords) => {
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const [lng, lat] = coords;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (lat === 0 && lng === 0) return null; // the model's default placeholder
  return [lat, lng];
};

// Group activities that happened at the same venue into one place.
// ~110m buckets, which is roughly a city block: distinct venues stay
// distinct, and GPS jitter on one venue does not split it in two.
const PLACE_KEY = (memory) => {
  if (memory.latlng) {
    return `geo:${memory.latlng[0].toFixed(3)},${memory.latlng[1].toFixed(3)}`;
  }
  const addr = (memory.address || '').trim().toLowerCase();
  return addr ? `addr:${addr}` : `act:${memory.activityId}`;
};

// Category grouping. Activity.category is free-text in the schema
// ("cricket", "gaming", "coffee"...), so map the known values onto the
// filter buckets the UI shows and let anything unrecognised fall to 'other'.
const CATEGORY_BUCKET = {
  cricket: 'sports', sports: 'sports', football: 'sports', volleyball: 'sports',
  basketball: 'sports', badminton: 'sports', tennis: 'sports', running: 'sports',
  cycling: 'sports', hiking: 'sports', swimming: 'sports', yoga: 'sports',
  coffee: 'social', food: 'social', picnic: 'social', party: 'social',
  community: 'social', music: 'social', travel: 'social', trip: 'social',
  gaming: 'gaming', esports: 'gaming', video: 'gaming',
  gym: 'fitness', fitness: 'fitness', walking: 'fitness',
  movies: 'movies', education: 'study', study: 'study',
};
const bucketOf = (category) => CATEGORY_BUCKET[String(category || '').toLowerCase()] || 'other';

const dayKey = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
};

// Rounds coordinates to ~110m and returns null when rounding pushes the
// point to the other side of the world (antimeridian). Prevents the
// "same venue, wildly different marker" artefact.
const jitterCoords = (ll) => {
  const factor = Math.pow(10, 3);
  const lat = Math.round(ll[0] * factor) / factor;
  const lng = Math.round(ll[1] * factor) / factor;
  if (Math.abs(lat - ll[0]) > 90 || Math.abs(lng - ll[1]) > 180) return null;
  return [lat, lng];
};

router.get('/', protect, async (req, res) => {
  try {
    const myId = String(req.user._id);

    // Statuses can be stale if the lifecycle sweep has not run yet, so
    // compute the true status in memory rather than trusting the field.
    // completedAt is stored when we can derive it, but left null if the
    // activity's time string is missing — we never invent a timestamp.
    const activities = await Activity.find({
      status: { $in: ['upcoming', 'ongoing', 'completed'] },
      ...MY_ACTIVITY_QUERY(req.user._id),
    })
      .select('title category emoji date time status location participants creator checkIns photos community createdAt')
      .populate('participants.user', 'name avatar')
      .populate('creator', 'name avatar')
      .lean();

    const memories = [];
    for (const a of activities) {
      if (!tookPart(a, myId)) continue;
      if (currentStatus(a) !== 'completed') continue;

      const start = scheduledAt(a);
      const coIds = joinedIds(a).filter((id) => id !== myId);
      // Participants arrive populated (name + avatar only). Carry just those
      // two public fields into the memory so cards can show faces without a
      // second round trip — never email, phone or anyone's location.
      const coParticipants = coIds.map((id) => {
        const p = (a.participants || []).find((x) => String(x.user?._id || x.user) === id);
        return {
          userId: id,
          name: p?.user?.name || 'Kiky member',
          avatar: p?.user?.avatar || null,
        };
      });

      memories.push({
        activityId: String(a._id),
        title: a.title,
        category: a.category || 'other',
        bucket: bucketOf(a.category),
        emoji: a.emoji || '✨',
        date: a.date,
        time: a.time || '',
        // null rather than a fabricated date when the schedule is unusable
        occurredAt: Number.isNaN(start.getTime()) ? null : start.toISOString(),
        address: a.location?.address || '',
        latlng: toLatLng(a.location?.coordinates),
        photos: (a.photos || []).slice(0, 4),
        hosted: String(a.creator?._id || a.creator) === myId,
        checkedIn: (a.checkIns || []).some((c) => String(c.user) === myId),
        participants: coParticipants,
        participantCount: coIds.length,
      });
    }

    // Newest first: drives both "recent memories" and the trail order.
    memories.sort((a, b) => {
      const ta = a.occurredAt ? Date.parse(a.occurredAt) : Date.parse(a.date) || 0;
      const tb = b.occurredAt ? Date.parse(b.occurredAt) : Date.parse(b.date) || 0;
      return tb - ta;
    });

    // ---- Places: group memories by venue -------------------------------
    // A memory with neither coordinates nor an address is still a memory,
    // but it is not a *place* we can honestly claim to have explored — so it
    // is left out of Places Explored rather than invented as "Unnamed place".
    const placesMap = new Map();
    const unplacedCount = { count: 0 };
    for (const m of memories) {
      const key = PLACE_KEY(m);
      if (!m.latlng && !m.address) {
        unplacedCount.count += 1;
        continue;
      }
      if (!placesMap.has(key)) {
        placesMap.set(key, {
          key,
          label: m.address || (m.latlng ? 'Saved place' : 'Named place'),
          latlng: m.latlng ? jitterCoords(m.latlng) || m.latlng : null,
          hasCoords: Boolean(m.latlng),
          activities: [],
          buckets: {},
        });
      }
      const place = placesMap.get(key);
      // Prefer a real address over the fallback label.
      if (m.address && (place.label === 'Saved place' || place.label === 'Named place')) {
        place.label = m.address;
      }
      if (!place.hasCoords && m.latlng) {
        place.latlng = jitterCoords(m.latlng) || m.latlng;
        place.hasCoords = true;
      }
      place.activities.push(m.activityId);
      place.buckets[m.bucket] = (place.buckets[m.bucket] || 0) + 1;
    }

    const places = [...placesMap.values()]
      .map((p) => ({
        ...p,
        momentCount: p.activities.length,
        // Category breakdown for the bottom sheet, ordered by frequency.
        breakdown: Object.entries(p.buckets)
          .map(([bucket, count]) => ({ bucket, count }))
          .sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => b.momentCount - a.momentCount);

    // ---- People actually shared an activity with ----------------------
    const peopleMap = new Map();
    for (const m of memories) {
      for (const person of m.participants) {
        if (!person?.userId) continue;
        if (!peopleMap.has(person.userId)) {
          peopleMap.set(person.userId, {
            userId: person.userId,
            name: person.name,
            avatar: person.avatar,
            sharedCount: 0,
            lastSeen: null,
          });
        }
        const p = peopleMap.get(person.userId);
        p.sharedCount += 1;
        const ts = m.occurredAt || m.date;
        if (ts && (!p.lastSeen || new Date(ts) > new Date(p.lastSeen))) p.lastSeen = ts;
      }
    }

    // Identity for the avatar row is already resolved by the populate above.
    // One extra query only fills in the rare case where a populated user
    // document was missing, and it still selects name + avatar only.
    const missing = [...peopleMap.values()].filter((p) => !p.name);
    if (missing.length) {
      const resolved = await User.find({ _id: { $in: missing.map((p) => p.userId) } })
        .select('name avatar')
        .lean();
      const byId = new Map(resolved.map((u) => [String(u._id), u]));
      for (const p of missing) {
        const u = byId.get(p.userId);
        p.name = u?.name || 'Kiky member';
        p.avatar = u?.avatar || null;
      }
    }
    const people = [...peopleMap.values()];
    people.sort((a, b) => b.sharedCount - a.sharedCount);

    // ---- Same-day trails ("Your Saturday Trail") -----------------------
    // Only real multi-activity days; a single activity is not a trail.
    const dayMap = new Map();
    for (const m of memories) {
      const ts = m.occurredAt || m.date;
      if (!ts) continue;
      const key = dayKey(ts);
      if (!dayMap.has(key)) {
        dayMap.set(key, { key, date: new Date(ts).toISOString(), memories: [], people: new Set() });
      }
      const day = dayMap.get(key);
      day.memories.push(m);
      for (const person of m.participants) if (person?.userId) day.people.add(person.userId);
    }

    const trails = [...dayMap.values()]
      .filter((d) => d.memories.length >= 2)
      .map((d) => {
        const ordered = [...d.memories].sort((a, b) => {
          const ta = a.occurredAt ? Date.parse(a.occurredAt) : 0;
          const tb = b.occurredAt ? Date.parse(b.occurredAt) : 0;
          return ta - tb; // oldest first: the route the user actually walked
        });
        return {
          key: d.key,
          date: d.date,
          weekday: new Date(d.date).toLocaleDateString('en-IN', { weekday: 'long' }),
          activityCount: ordered.length,
          peopleCount: d.people.size,
          stops: ordered.map((m) => ({
            activityId: m.activityId,
            title: m.title,
            emoji: m.emoji,
            bucket: m.bucket,
            time: m.time || '',
            latlng: jitterCoords(m.latlng) || m.latlng || null,
          })),
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // ---- Stats, all derived from the above -----------------------------
    const buckets = {};
    for (const m of memories) buckets[m.bucket] = (buckets[m.bucket] || 0) + 1;

    res.json({
      success: true,
      stats: {
        places: places.length,
        activities: memories.length,
        hosted: memories.filter((m) => m.hosted).length,
        people: people.length,
        trails: trails.length,
        byCategory: buckets,
        // Activities with no venue we can point at — excluded from the
        // Places Explored number so the stat stays truthful.
        unplacedActivities: unplacedCount.count,
      },
      places,
      memories,
      people: people.slice(0, 60), // cap the payload; the UI is an avatar row
      trails,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;