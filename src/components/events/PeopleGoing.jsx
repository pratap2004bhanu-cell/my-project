import { Link } from 'react-router-dom';
import { FiUsers, FiHeart, FiCheckCircle } from 'react-icons/fi';
import { RoundAvatar } from '../common';

const PeopleGoing = ({ people = [], meInterests = [] }) => {
  if (!people.length) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <FiUsers className="text-lime-400" />
          People going/Interested
        </h3>
        <span className="text-xs text-dark-400">{people.length}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {people.slice(0, 12).map((p) => {
          const shared = (p.interests || []).filter((i) => meInterests.includes(i));
          const shown = shared.length ? shared.slice(0, 3) : (p.interests || []).slice(0, 2);
          return (
            <div key={p.id} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-dark-700/50 bg-dark-800/40">
              <Link to={`/users/${p.id}`} className="flex-shrink-0">
                <RoundAvatar
                  src={p.avatar}
                  name={p.name}
                  className="w-9 h-9 text-sm"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/users/${p.id}`} className="text-sm font-medium text-white truncate block hover:text-lime-300 transition-colors">
                  {p.name}
                </Link>
                <div className="flex flex-wrap gap-1 mt-1">
                  {shown.map((s) => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-electric-500/10 text-electric-300">
                      {s}
                    </span>
                  ))}
                </div>
                {p.status === 'going' && (
                  <p className="text-[10px] text-lime-400 flex items-center gap-0.5 mt-1">
                    <FiCheckCircle className="w-3 h-3" /> Going
                  </p>
                )}
                {shared.length >= 2 && (
                  <p className="text-[10px] text-hotpink-400 flex items-center gap-0.5 mt-1">
                    <FiHeart className="w-3 h-3" /> {shared.length} shared interests
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PeopleGoing;