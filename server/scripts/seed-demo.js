import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';

const PASSWORD = process.env.DEMO_PASSWORD || 'Demo@1234';
const DOMAIN = 'kiky.app';
const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const H = (h) => new Date(now + h * 60 * 60 * 1000);

const photo = (id) => `https://images.unsplash.com/photo-${id}?w=800&q=80`;
const U = {
  cricket: photo('1531415074968-036ba1b575da'),
  run: photo('1476480862126-209bfaa8edc8'),
  coffee: photo('1495474472287-4d71bcdd2085'),
  food: photo('1504674900247-0877df9cc836'),
  party: photo('1514525253161-7a46d19cd819'),
  gym: photo('1517836357463-d25dfeac3438'),
};

const people = [
  { name: 'Aarav Shah', email: 'aarav@kiky.app', interests: ['cricket', 'gym', 'food'], bio: 'Leg-spinner and gym rat. Always up for a match on the university ground.', coords: [73.207, 22.3058], avatar: '/uploads/avatar-demo-1.png', model: 'available', streak: 2 },
  { name: 'Diya Patel', email: 'diya@kiky.app', interests: ['coffee', 'reading', 'photography'], bio: 'Coffee hopper. I know every chai stall in Sayaji Baug. Let us capture golden hour.', coords: [73.1812, 22.2937], avatar: '/uploads/avatar-demo-2.png', model: 'available', streak: 4 },
  { name: 'Rohan Mehta', email: 'rohan@kiky.app', interests: ['running', 'gaming', 'cricket'], bio: 'Morning runner, night gamer. Training for the Vadodara half marathon.', coords: [73.234, 22.3215], avatar: '/uploads/avatar-demo-3.png', model: 'online', streak: 3 },
  { name: 'Ananya Iyer', email: 'ananya@kiky.app', interests: ['hiking', 'photography', 'travel'], bio: 'Trail finder and amateur photographer. Pavagadh sunrise is my happy place.', coords: [73.1589, 22.2821], avatar: '/uploads/avatar-demo-4.png', model: 'available', streak: 5 },
  { name: 'Kabir Singh', email: 'kabir@kiky.app', interests: ['football', 'food', 'cricket'], bio: 'Football pundit, food explorer. Chelsea fan, will fight you politely about it.', coords: [73.2157, 22.2989], avatar: '/uploads/avatar-demo-5.png', model: 'online', streak: 1 },
  { name: 'Meera Joshi', email: 'meera@kiky.app', interests: ['yoga', 'art', 'coffee'], bio: 'Yoga teacher-in-training. Sketching in Kamati Baug on weekends.', coords: [73.1795, 22.3128], avatar: '/uploads/avatar-demo-6.png', model: 'available', streak: 6 },
  { name: 'Aditya Rao', email: 'aditya@kiky.app', interests: ['movies', 'music', 'gaming'], bio: 'Sundays are for lazy brunches and first shows. Board game collector.', coords: [73.1923, 22.2876], avatar: '/uploads/avatar-demo-7.png', model: 'online', streak: 2 },
  { name: 'Sara Fernandes', email: 'sara@kiky.app', interests: ['badminton', 'baking', 'coffee'], bio: 'Smash then bake. Looking for regular badminton partners near Alkapuri.', coords: [73.1648, 22.2709], avatar: '/uploads/avatar-demo-8.png', model: 'available', streak: 3 },
  { name: 'Vikram Nair', email: 'vikram@kiky.app', interests: ['cycling', 'tech', 'hiking'], bio: 'Weekend cyclist exploring the outskirts. Also, terrible at losing in chess.', coords: [73.2385, 22.3342], avatar: '/uploads/avatar-demo-9.png', model: 'available', streak: 4 },
  { name: 'Ishita Desai', email: 'ishita@kiky.app', interests: ['dance', 'travel', 'art'], bio: 'Dance teacher. If it moves, I dance to it. Always planning the next trip.', coords: [73.1859, 22.2591], avatar: '/uploads/avatar-demo-10.png', model: 'available', streak: 2 },
  { name: 'Nisha Kulkarni', email: 'nisha@kiky.app', interests: ['yoga', 'badminton', 'food'], bio: 'Namaste on the mat, smashes on court. Open to food trails any evening.', coords: [73.1747, 22.3238], avatar: '/uploads/avatar-demo-11.png', model: 'online', streak: 1 },
  { name: 'Arjun Chawla', email: 'arjun@kiky.app', interests: ['gym', 'cricket', 'music'], bio: 'Pull-ups and my playlist are my whole personality. Gym buddies welcome.', coords: [73.2031, 22.2765], avatar: '/uploads/avatar-demo-12.png', model: 'available', streak: 2 },
];

// Simple round number formatting
const r1 = (n) => Math.round(n * 10) / 10;

await mongoose.connect(process.env.MONGODB_URI);
console.log('DB connected');

// ---- Idempotent cleanup (previous demo seed) ----
const demoDocs = await User.find({ email: new RegExp(`@${DOMAIN}$`) }).select('_id').lean();
const demoIds = demoDocs.map((d) => d._id);
if (demoIds.length) {
  await User.deleteMany({ _id: { $in: demoIds } });
  await Activity.deleteMany({ creator: { $in: demoIds } });
  await Message.deleteMany({ $or: [{ sender: { $in: demoIds } }, { receiver: { $in: demoIds } }] });
  await Notification.deleteMany({ $or: [{ user: { $in: demoIds } }, { actor: { $in: demoIds } }] });
  console.log(`cleaned previous seed (${demoIds.length} users)`);
}

// Wire in the developer/admin account (optional). Set DEMO_ADMIN_EMAIL to
// connect the seed's demo graph to a real account. Never hard-coded.
const ADMIN_EMAIL = (process.env.DEMO_ADMIN_EMAIL || '').trim().toLowerCase();
const bhanu = ADMIN_EMAIL ? await User.findOne({ email: ADMIN_EMAIL }).lean() : null;
if (ADMIN_EMAIL && !bhanu) console.warn(`NOTE: ${ADMIN_EMAIL} not found - skipping real-user wiring`);

// ---- Create demo users ----
const users = {};
for (const p of people) {
  const u = await User.create({
    name: p.name,
    email: p.email,
    password: PASSWORD,
    bio: p.bio,
    interests: p.interests,
    avatar: p.avatar,
    location: { type: 'Point', coordinates: p.coords, address: 'Vadodara, Gujarat' },
    status: { current: p.model, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], start: '09:00', end: '19:00', spontaneous: true },
    stats: { activitiesJoined: 0, connections: 0, streak: p.streak, rating: r1(4.2 + (p.name.length % 7) / 10) },
    gallery: p.interests.includes('photography') || p.interests.includes('travel') ? [U.run, U.party] : [],
  });
  users[p.name.split(' ')[0].toLowerCase()] = u;
}
console.log(`created ${people.length} demo users`);

// ---- Relationships ----
const link = async (a, b) => {
  await User.updateOne({ _id: a._id }, { $addToSet: { friends: b._id }, $inc: { 'stats.connections': 1 } });
  await User.updateOne({ _id: b._id }, { $addToSet: { friends: a._id }, $inc: { 'stats.connections': 1 } });
};
const like = async (from, to) => {
  await User.updateOne({ _id: from._id }, { $addToSet: { likes: to._id } });
  await User.updateOne({ _id: to._id }, { $addToSet: { likedBy: from._id } });
};
const match = async (a, b) => {
  await like(a, b);
  await like(b, a);
  await link(a, b);
};

const { aarav, diya, rohan, ananya, kabir, meera, aditya, sara, vikram, ishita, nisha, arjun } = users;

// Matches (mutual like => friends)
await match(kabir, nisha);
await match(vikram, ananya);
await match(ishita, diya);
// Pending likes (for the Matching page)
await like(diya, aarav);
await like(sara, aarav);
await like(arjun, rohan);
await like(meera, aditya);
// Friend pairs
await link(aarav, kabir);
await link(rohan, vikram);
await link(meera, sara);
await link(arjun, ananya);

// ---- Wire in the real user (bhanu) ----
if (bhanu) {
  const realId = bhanu._id;
  await User.updateOne({ _id: realId }, { $addToSet: { friends: diya._id, likes: diya._id } });
  await User.updateOne({ _id: diya._id }, { $addToSet: { friends: realId, likedBy: realId }, $inc: { 'stats.connections': 1 } });
  await User.updateOne({ _id: realId }, { $addToSet: { friends: aarav._id } });
  await User.updateOne({ _id: aarav._id }, { $addToSet: { friends: realId }, $inc: { 'stats.connections': 1 } });
  await User.updateOne({ _id: realId }, { $addToSet: { friends: rohan._id }, $inc: { 'stats.connections': 2 } });
  await User.updateOne({ _id: rohan._id }, { $addToSet: { friends: realId }, $inc: { 'stats.connections': 1 } });
  // bhanu saves a couple of upcoming activities (refs set after activities created)
}

// ---- Activities ----
const upcoming = [
  { title: 'Cricket Night at University Ground', desc: 'Evening T20 friendly. Bring your bat if you have one, we can share. All levels welcome!', category: 'cricket', emoji: '🏏', creator: aarav, date: H(26 * 24 + 5 * 24 + 2), time: '19:00', coords: [73.2157, 22.2989], addr: 'MS University Cricket Ground', max: 11, joins: [bhanu, kabir, rohan], photo: U.cricket },
  { title: 'Sunrise Run – Kotambi Track', desc: '6 km easy pace followed by chai. Perfect for beginners. We run rain or shine.', category: 'running', emoji: '🏃', creator: rohan, date: H(3 * 24 + 5), time: '06:00', coords: [73.234, 22.3215], addr: 'Kotambi Stadium Track', max: 8, joins: [bhanu, vikram, ananya], photo: U.run },
  { title: 'Coffee & Chai Meetup', desc: 'Casual hangout to meet new people. I will bring a book of people-watching spots.', category: 'coffee', emoji: '☕', creator: diya, date: H(2 * 24 + 9), time: '17:30', coords: [73.1812, 22.2937], addr: 'Cafe Coffee Day, Sayaji Baug', max: 6, joins: [bhanu, meera, sara, arjun], photo: U.coffee },
  { title: 'Weekend Hike – Pavagadh', desc: 'Sunrise hike up Pavagadh hill. Moderate difficulty, ~2.5 hrs to the top. Carry water and good shoes.', category: 'hiking', emoji: '🥾', creator: ananya, date: H(6 * 24 + 22), time: '05:00', coords: [73.1589, 22.2821], addr: 'Pavagadh Hill', max: 7, joins: [vikram, ishita, arjun], photo: U.run },
  { title: 'Board Games Night', desc: 'Catan, Uno, Monopoly and whatever you bring. Pizzas ordered by vote (vegetarian wins).', category: 'esports', emoji: '🎮', creator: aditya, date: H(4 * 24 + 12), time: '20:00', coords: [73.1923, 22.2876], addr: 'Aditya residence, Alkapuri', max: 6, joins: [rohan, kabir, meera], photo: U.party },
  { title: 'Badminton Knockout', desc: 'Round-robin singles & doubles. Court fee split evenly. Rackets available to borrow.', category: 'sports', emoji: '🏸', creator: sara, date: H(27 * 24 + 30), time: '18:00', coords: [73.1648, 22.2709], addr: 'Sunrise Badminton Club, Alkapuri', max: 8, joins: [nisha, diya, kabir] },
];

const completed = [
  { title: 'Cricket at Parade Ground', desc: 'Friendly afternoon match with the usual crowd.', category: 'cricket', emoji: '🏏', creator: aarav, date: H(-6 * 24 + 3), time: '16:00', coords: [73.1839, 22.3044], addr: 'Parade Ground', max: 11, joins: [bhanu, kabir], feedback: [{ u: kabir, r: 5, c: 'Great match! Host arranged everything.' }, { u: bhanu, r: 4, c: 'Nice evening, good people.' }], photo: U.cricket },
  { title: 'Evening Cycle Ride', desc: '40 km loop through the outskirts. Concluded at a pani-puri stall.', category: 'cycling', emoji: '🚴', creator: vikram, date: H(-9 * 24 + 3), time: '17:00', coords: [73.2385, 22.3342], addr: 'Ajwa Road outbound', max: 6, joins: [rohan, bhanu], expense: { desc: 'Chai + pani puri stop', amount: 180, paidBy: vikram, among: [vikram, rohan, bhanu] }, photo: U.run },
  { title: 'Movie Night at INOX', desc: 'Blockbuster weekend show followed by dinner.', category: 'movies', emoji: '🎬', creator: aditya, date: H(-3 * 24 + 5), time: '19:30', coords: [73.1842, 22.3081], addr: 'INOX, Nazarbaug', max: 4, joins: [meera], feedback: [{ u: meera, r: 4, c: 'Such a fun pick! The film was forgettable, the company was not.' }], photo: U.party },
  { title: 'Yoga in Kamati Baug', desc: 'Morning session under the trees. Beginners practiced crow pose for the first time!', category: 'fitness', emoji: '🧘', creator: meera, date: H(-1 * 24 + 3), time: '06:30', coords: [73.1859, 22.3081], addr: 'Kamati Baug', max: 8, joins: [diya, nisha], feedback: [{ u: diya, r: 5, c: 'Best way to start the weekend.' }], photo: U.gym },
];

const ongoing = [
  { title: 'Evening Badminton – Sunrise Club', desc: 'Casual doubles right now! Two spots available if you can make it.', category: 'sports', emoji: '🏸', creator: sara, date: H(-0.7), time: '18:00', coords: [73.1648, 22.2709], addr: 'Sunrise Badminton Club', max: 8, joins: [nisha], status: 'ongoing' },
];

const all = [...upcoming, ...completed, ...ongoing];
const createdIds = {};
for (const a of all) {
  const participants = (a.joins || []).filter(Boolean).map((u) => ({ user: u && u._id ? u._id : u, status: 'joined', joinedAt: new Date(now - 2 * DAY) }));
  const doc = {
    title: a.title,
    description: a.desc,
    category: a.category,
    emoji: a.emoji,
    creator: a.creator._id,
    status: a.status || (a.date < now ? 'completed' : 'upcoming'),
    date: a.date,
    time: a.time,
    maxParticipants: a.max,
    location: { type: 'Point', coordinates: a.coords, address: a.addr },
    participants,
    photos: a.photo ? [a.photo] : [],
    checkIns: (a.joins || []).filter(Boolean).map((u) => ({ user: u && u._id ? u._id : u, checkedInAt: new Date(a.date.getTime() + DAY) })),
    feedback: (a.feedback || []).map((f) => ({ user: f.u._id, rating: f.r, comment: f.c, createdAt: new Date(now - 4 * DAY) })),
  };
  if (a.expense) {
    doc.expenses = [{
      description: a.expense.desc,
      amount: a.expense.amount,
      paidBy: a.expense.paidBy._id,
      splitAmong: a.expense.among.map((u) => u._id),
      createdAt: new Date(now - 3 * DAY),
    }];
  }
  const act = await Activity.create(doc);
  const slug = a.creator.name.split(' ')[0];
  createdIds[slug] = createdIds[slug] || [];
  createdIds[slug].push(act);
  // Bump host/joiner stats
  await User.updateOne({ _id: a.creator._id }, { $inc: { 'stats.activitiesJoined': 1 } });
  for (const u of (a.joins || [])) {
    if (u && u._id) await User.updateOne({ _id: u._id }, { $inc: { 'stats.activitiesJoined': 1 } });
  }
}
console.log(`created ${all.length} activities`);

// Save two upcoming activities for bhanu
if (bhanu) {
  const up = await Activity.find({ title: { $in: ['Cricket Night at University Ground', 'Coffee & Chai Meetup', 'Sunrise Run – Kotambi Track'] } }).select('_id').lean();
  await User.updateOne({ _id: bhanu._id }, { $addToSet: { savedActivities: up.map((a) => ({ activity: a._id, savedAt: now })) } });
}

// ---- Messages ----
const msg = async (from, to, content, read, at) => {
  await Message.create({ sender: from._id, receiver: to._id, content, read, createdAt: new Date(at) });
};
const conv = async (from, to, lines, lastUnreadForTo = false) => {
  let i = 0;
  for (const [senderKey, content] of lines) {
    const sender = senderKey === 'a' ? from : to;
    const receiver = senderKey === 'a' ? to : from;
    const isLast = i === lines.length - 1;
    await msg(sender, receiver, content, isLast && lastUnreadForTo ? false : true, now - (lines.length - i) * 7 * 60000);
    i++;
  }
};
if (bhanu) {
  await conv(bhanu, diya, [
    ['a', 'Hey Diya! Saw you host the coffee meetup — looks fun.'],
    ['b', 'Hey! Yeah it should be chill, soft launch of my people-watching spots 😄'],
    ['a', 'Haha, I am in. Do you need anything for it?'],
    ['b', 'Just good vibes. Maybe bring your camera?'],
    ['a', 'Done. Also there is a sunrise run Saturday if you are a morning person?'],
    ['b', 'Sleep is sacred, but ... fine. I will take penalty laps.'],
    ['a', 'Deal. See you at Kotambi at 6 🏃'],
  ], true);
  await conv(bhanu, aarav, [
    ['a', 'Cricket night this Friday? You open?'],
    ['b', 'Yeah man, already added you to the list. Bring your leather ball bat.'],
    ['a', 'Need a ride? I can pick you up from university gate.'],
    ['b', 'Perfect. That saves me the auto chaos.'],
  ], false);
}
await conv(diya, meera, [
  ['a', 'Yoga in the park was actually life-changing.'],
  ['b', 'Told you! The trees make all the difference.'],
  ['a', 'Next Sunday again? I will bring chai.'],
]);
await conv(aarav, kabir, [
  ['a', 'Bro, that sweep shot on Saturday 😂'],
  ['b', 'Green turner though. My defense was not ready.'],
  ['a', 'Rematch this week. Serve revenge hot.'],
]);
await conv(rohan, vikram, [
  ['a', 'Cycle ride route map for Sunday sent. 40 km, gentle hills.'],
  ['b', 'Got it. Starting earlier so we catch the sunrise?'],
  ['a', '5:30 at Ajwa gate.'],
]);

// ---- Notifications (unread, for the demo experience) ----
const note = (user, actor, type, text) => Notification.create({ user: user._id, actor: actor._id, type, text, read: false, createdAt: new Date(now - 40 * 60000) });
if (bhanu) {
  await note(bhanu, diya, 'like', 'liked your profile');
  await note(bhanu, aarav, 'invite', 'invited you to "Cricket Night at University Ground"');
  await note(bhanu, rohan, 'connection', 'accepted your connection request');
  await Notification.create({ user: bhanu._id, type: 'achievement', text: 'You unlocked the "Weekend Warrior" badge!', read: true, createdAt: new Date(now - 2 * DAY) });
}
await note(users['kabir'], users['nisha'], 'like', 'liked your profile');
if (bhanu) await note(users['diya'], bhanu, 'message', 'sent you a message');

// Final connection counts for demo users (recompute explicitly)
for (const key of Object.keys(users)) {
  const u = users[key];
  const cnt = await User.countDocuments({ friends: u._id });
  await User.updateOne({ _id: u._id }, { $set: { 'stats.connections': cnt } });
}

const summary = {
  users: people.length,
  activities: all.length,
  messages: await Message.countDocuments({}),
};
console.log('Seeded:', summary);
await mongoose.disconnect();
console.log('Done');