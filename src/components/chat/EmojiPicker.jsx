const EMOJIS = [
  '😀','😄','😁','😆','😂','🤣','😊','😇',
  '🙂','😉','😍','🥰','😘','😋','😎','🤩',
  '🥳','😢','😭','😤','😡','😱','😴','🤔',
  '👍','👎','👏','🙌','🤝','🙏','💪','✌️',
  '❤️','🧡','💛','💚','💙','💜','🖤','💯',
  '🔥','✨','⭐','🎉','🎊','🎯','🏆','⚽',
  '🏏','🎮','🏋️','🎬','🍕','🍔','🍺','☕',
  '🌍','✈️','🏖️','🎵','🎨','💻','📸','🎁',
];

const EmojiPicker = ({ onSelect }) => (
  <div className="absolute bottom-full left-0 mb-2 w-72 max-w-[calc(100vw-7rem)] bg-dark-900/95 backdrop-blur border border-dark-700/50 rounded-2xl shadow-2xl p-3 z-50">
    <div className="grid grid-cols-8 gap-1">
      {EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onSelect(e)}
          className="text-xl hover:bg-dark-700/50 rounded-lg p-1 transition-colors"
        >
          {e}
        </button>
      ))}
    </div>
  </div>
);

export default EmojiPicker;