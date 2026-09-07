import { EVENT_VIBES } from '../../data/eventCategories';

const VibePreview = ({ vibes = [], onChange, readOnly = false }) => {
  const selected = vibes.length ? vibes : ['lively'];
  return (
    <div>
      {!readOnly && (
        <label className="block text-sm font-medium text-gray-700 mb-2">Vibe <span className="text-gray-400">(how will it feel?)</span></label>
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
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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