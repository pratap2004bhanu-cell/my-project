import { FiUsers, FiLock, FiShield, FiPlus } from 'react-icons/fi';
import { RoundAvatar } from '../common';

const SquadCard = ({ squad, meId, onJoin, onLeave, onDelete, onMemberClick, onChatClick }) => {
  const members = squad.members || [];
  const isMember = members.some((m) => String(m.user._id || m.user) === String(meId));
  const isCreator = String(squad.createdBy._id || squad.createdBy) === String(meId);
  const openSlots = Math.max(0, (squad.maxSize || 5) - members.length);
  const count = members.length;

  return (
    <div className="rounded-2xl border border-dark-700/50 bg-dark-800/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-semibold text-white flex items-center gap-2">
            {squad.name}
            {isCreator && <FiShield className="w-3.5 h-3.5 text-lime-400" />}
          </h4>
          <p className="text-xs text-dark-400 mt-0.5">
            by <span className="text-dark-300">{squad.createdBy.name || 'Host'}</span>
            {' · '}{count}/{squad.maxSize || 5} joined
            {' · '}
            {openSlots > 0 ? (
              <span className="text-lime-400">{openSlots} slot{openSlots > 1 ? 's' : ''} open</span>
            ) : (
              <span className="text-hotpink-400">Full</span>
            )}
          </p>
        </div>
        {squad.preferences?.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-electric-500/10 text-electric-300 shrink-0">
            <FiLock className="w-3 h-3" />
            {squad.preferences.join(', ')}
          </span>
        )}
      </div>

      <div className="flex items-center mt-3">
        {members.slice(0, 6).map((m) => (
          <div key={m._id} className="-ml-1.5 first:ml-0 cursor-pointer" onClick={() => onMemberClick?.(m.user)}>
            <RoundAvatar
              src={m.user?.avatar}
              name={m.user?.name}
              className="w-8 h-8 text-xs border-2 border-dark-800"
            />
          </div>
        ))}
        {members.length > 6 && (
          <span className="ml-1.5 w-8 h-8 rounded-full bg-dark-700 text-dark-300 flex items-center justify-center text-[10px] font-bold">
            +{members.length - 6}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {isMember ? (
          <button
            onClick={() => onLeave?.(squad)}
            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-dark-800 text-dark-300 border border-dark-700 hover:bg-dark-700 transition-colors"
          >
            Leave squad
          </button>
        ) : (
          <button
            onClick={() => onJoin?.(squad)}
            disabled={openSlots === 0}
            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-lime-500 text-dark-900 hover:bg-lime-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center gap-1.5">
              <FiPlus className="w-4 h-4" /> Join squad
            </span>
          </button>
        )}
        {onChatClick && (
          <button
            onClick={() => onChatClick?.(squad)}
            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-electric-500/10 text-electric-300 border border-electric-500/20 hover:bg-electric-500/20 transition-colors"
          >
            <span className="flex items-center justify-center gap-1.5">
              <FiUsers className="w-4 h-4" /> Chat
            </span>
          </button>
        )}
        {isCreator && onDelete && (
          <button
            onClick={() => onDelete?.(squad)}
            className="py-2 px-3 rounded-xl text-sm text-hotpink-400 border border-hotpink-500/20 bg-hotpink-500/5 hover:bg-hotpink-500/15 transition-colors"
            title="Delete squad"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

const SquadList = ({ squads, meId, onJoin, onLeave, onDelete, onChat, onCreate, onMemberClick }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <FiUsers className="text-electric-400" />
        Event squads
      </h3>
      {onCreate && (
        <button
          onClick={onCreate}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-lime-500 text-dark-900 hover:bg-lime-400 transition-colors"
        >
          <FiPlus className="w-3.5 h-3.5" /> Start a squad
        </button>
      )}
    </div>
    {squads.length === 0 ? (
      <p className="text-sm text-dark-400 text-center py-6">
        No squads yet. Start one to invite friends, or join someone's crew to show up together.
      </p>
    ) : (
      squads.map((squad) => (
        <SquadCard
          key={squad._id}
          squad={squad}
          meId={meId}
          onJoin={onJoin}
          onLeave={onLeave}
          onDelete={onDelete}
          onChat={onChat}
          onMemberClick={(u) => (u?._id ? onMemberClick?.(u._id) : null)}
        />
      ))
    )}
  </div>
);

export default SquadList;
export { SquadCard };