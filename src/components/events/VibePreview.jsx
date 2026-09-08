import { EVENT_VIBES } from '../../data/eventCategories';

const VibePreview = ({ vibes = [], onChange, readOnly = false }) => {
  const selected = vibes.length ? vibes : ['lively'];
  return (
    <div>
      {!readOnly && (
        <label className="block text-sm font-medium text-dark-400 mb-2">Vibe <span className="text-dark-500">(how will it feel?)</span></label>
      )}
      <div className={`flex flex-wrap gap-2 ${readOnly ? '' : 'mt-1'}`}>
        {EVENT_VIBES.map((v) => {
          const active = selected.includes(v.id);
          if (readOnly && !active) return null;
          return (
            <button
              key={v.id}
              type="button"
              disabled={readOnly}
              onClick={() => {
                if (readOnly) return;
                const next = active ? selected.filter((x) => x !== v.id) : [...selected, v.id];
                onChange?.(next.length ? next : ['lively']);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-lime-500 text-dark-900'
                  : readOnly
                    ? 'bg-dark-800 text-dark-400'
                    : 'bg-dark-800 text-dark-400 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <span>{v.emoji}</span>
              {v.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VibePreview;