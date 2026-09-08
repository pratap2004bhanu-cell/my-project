import { Link } from 'react-router-dom';
import { FiUsers, FiHeart, FiCheckCircle } from 'react-icons/fi';
import { RoundAvatar } from '../common';

const PeopleGoing = ({ people = [], meInterests = [] }) => {
  if (!people.length) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <FiUsers className="text-lime-400" />
          People going/Interested
        </h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-dark-800/70 border border-dark-700 text-dark-400">
          {people.length}
        </span>
      </div>
      <ul className="divide-y divide-dark-700/50">
        {people.slice(0, 12).map((p) => {
          const shared = (p.interests || []).filter((i) => meInterests.includes(i));
          const shown = shared.length ? shared.slice(0, 3) : (p.interests || []).slice(0, 2);
          return (
            <li key={p.id} className="flex items-center gap-3 py-3">
              <Link to={`/users/${p.id}`} className="flex-shrink-0">
                <RoundAvatar
                  src={p.avatar}
                  name={p.name}
                  className="w-11 h-11 text-sm"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to={`/users/${p.id}`}
                  className="block text-sm font-medium text-white hover:text-lime-300 transition-colors truncate"
                >
                  {p.name}
                </Link>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {shown.map((s) => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-electric-500/10 text-electric-300">
                      {s}
                    </span>
                  ))}
                  {p.status === 'going' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-lime-400">
                      <FiCheckCircle className="w-3 h-3" /> Going
                    </span>
                  )}
                </div>
              </div>
              {shared.length >= 2 && (
                <span className="flex-shrink-0 hidden md:inline-flex items-center gap-1 text-[11px] text-hotpink-400">
                  <FiHeart className="w-3.5 h-3.5" /> {shared.length}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PeopleGoing;