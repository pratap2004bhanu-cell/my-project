import { Link } from 'react-router-dom';
import { FiHeart, FiMessageCircle } from 'react-icons/fi';
import { RoundAvatar } from '../common';

const EventMomentCard = ({ moment, onLike, onOpenComments }) => {
  return (
    <div className="rounded-2xl border border-dark-700/50 bg-dark-800/40 overflow-hidden">
      {moment.photos?.length > 0 && (
        <img src={moment.photos[0]} alt={moment.text || 'moment'} className="w-full h-40 object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2.5 mb-2.5">
          <Link to={`/users/${moment.authorId}`}>
            <RoundAvatar src={moment.avatar} name={moment.author} className="w-9 h-9 text-sm" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{moment.author}</p>
            <p className="text-[10px] text-dark-400">{moment.time}</p>
          </div>
          {moment.rating > 0 && (
            <span className="text-sm shrink-0">{"⭐".repeat(moment.rating)}</span>
          )}
        </div>
        {moment.text && <p className="text-sm text-dark-200 whitespace-pre-line">{moment.text}</p>}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dark-800">
          <button
            onClick={() => onLike?.(moment)}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
              moment.liked ? 'text-hotpink-400' : 'text-dark-400 hover:text-hotpink-400'
            }`}
          >
            <FiHeart className={`w-4 h-4 ${moment.liked ? 'fill-hotpink-400' : ''}`} />
            {moment.likes.length}
          </button>
          <button
            onClick={() => onOpenComments?.(moment)}
            className="flex items-center gap-1.5 text-xs font-medium text-dark-400 hover:text-electric-300 transition-colors"
          >
            <FiMessageCircle className="w-4 h-4" />
            {moment.comments.length}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventMomentCard;