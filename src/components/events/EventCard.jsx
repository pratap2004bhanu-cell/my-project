import { Link } from 'react-router-dom';
import { FiMapPin, FiUsers, FiHeart, FiClock } from 'react-icons/fi';
import { categoryMeta, EVENT_CATEGORY_GRADIENTS, VIBE_MAP } from '../../data/eventCategories';

const EventCard = ({ event, compact = false }) => {
  const meta = categoryMeta(event.category);
  const gradient = EVENT_CATEGORY_GRADIENTS[event.category] || 'from-lime-500 to-electric-600';
  const vibeEmojis = (event.vibe?.length ? event.vibe : VIBE_MAP[event.category] || ['lively']).map((v) => {
    const found = {
      chill: '🍹', lively: '🔥', party: '🪩', networking: '💼', health: '🧘',
    }[v];
    return found || '✨';
  });

  return (
    <Link
      to={`/events/${event.id}`}
      className="card-glow overflow-hidden block group"
    >
      {/* Cover */}
      <div className={`relative bg-gradient-to-br ${gradient} h-32 flex items-center justify-center`}>
        {event.coverImage ? (
          <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl drop-shadow-lg">{event.emoji || meta.emoji}</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/70 to-transparent"></div>

        {event.isOrganizer && (
          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide bg-lime-500 text-dark-900 px-2 py-0.5 rounded-full">
            You're hosting
          </span>
        )}
        {event.isFull && (
          <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wide bg-hotpink-500 text-white px-2 py-0.5 rounded-full">
            Event full
          </span>
        )}

        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-white text-lg leading-tight truncate group-hover:text-lime-300 transition-colors">
              {event.title}
            </h3>
            <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5">
              <FiClock className="w-3 h-3 flex-shrink-0" />
              {event.dateLabel}
            </p>
          </div>
          <span className="shrink-0 text-xs font-extrabold bg-white/90 text-dark-900 px-2 py-1 rounded-full">
            {event.priceLabel}
          </span>
        </div>
      </div>

      <div className="p-3.5">
        <div className="flex items-center gap-2 text-xs text-dark-400 mb-2 flex-wrap">
          <span className="flex items-center gap-1">
            <FiMapPin className="w-3 h-3 flex-shrink-0" />
            {event.distance ? `${event.distance} · ` : ''}{event.venueName}
          </span>
          <span className="text-dark-600">•</span>
          <span>{meta.emoji} {meta.label}</span>
        </div>

        {!compact && (
          <p className="text-sm text-dark-400 line-clamp-2 mb-3">{event.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-dark-400">
            <span className="flex items-center gap-1">
              <span className="w-6 h-6 rounded-full bg-lime-500/20 border border-lime-500/30 flex items-center justify-center text-[10px] font-bold text-lime-400">
                {event.goingCount}
              </span>
              {event.goingCount > 0 ? 'going' : 'be first!'}
            </span>
            {event.remainingSpots != null && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${event.remainingSpots <= 5 ? 'bg-hotpink-500/15 text-hotpink-400' : 'bg-dark-800 text-dark-400'}`}>
                {event.remainingSpots} spots left
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-lime-500">
            {vibeEmojis.slice(0, 3).join(' ')}
          </div>
        </div>

        {!compact && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dark-800">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-electric-500 to-lime-500 flex items-center justify-center text-[10px] text-white font-bold overflow-hidden">
              {event.organizer?.avatar ? (
                <img src={event.organizer.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                (event.organizerName || '?')[0]
              )}
            </div>
            <span className="text-xs text-dark-400 truncate flex-1">
              by <span className="text-dark-300 font-medium">{event.organizerName}</span>
            </span>
            <span className="text-xs text-dark-400 flex items-center gap-0.5">
              <FiHeart className="w-3 h-3 text-hotpink-400" /> {event.interestedCount}
            </span>
            <span className="text-xs text-dark-400 flex items-center gap-0.5">
              <FiUsers className="w-3 h-3" /> {event.goingCount}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default EventCard;