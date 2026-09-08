import { FiCheck, FiFile, FiDownload } from 'react-icons/fi';

const formatSize = (bytes) => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const MessageBubble = ({ text, image, attachment, time, status, isMe, showName }) => {
  const mediaOnly = (image || attachment) && !text;

  return (
    <div className="max-w-[70%] min-w-0">
      {showName && (
        <p className="text-xs text-dark-400 mb-1 ml-1 truncate">{showName}</p>
      )}
      <div className={`rounded-2xl ${image ? 'p-1.5' : 'px-4 py-2.5'} ${
        isMe
          ? 'bg-lime-500 text-dark-900 rounded-br-md'
          : 'bg-dark-800 text-white rounded-bl-md'
      }`}>
        {image && (
          <a href={image} target="_blank" rel="noreferrer" className="block">
            <img
              src={image}
              alt="photo"
              loading="lazy"
              className="max-w-full max-h-72 rounded-xl object-cover"
            />
          </a>
        )}
        {attachment && !image && (
          <a
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            download={attachment.name}
            className="flex items-center gap-3 group"
          >
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-dark-900/20' : 'bg-white/10'}`}>
              <FiFile className="w-5 h-5" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium truncate max-w-[180px]">{attachment.name}</span>
              <span className={`block text-xs ${isMe ? 'text-dark-700' : 'text-dark-400'}`}>
                {formatSize(attachment.size)}
              </span>
            </span>
            <FiDownload className={`w-4 h-4 flex-shrink-0 ${isMe ? 'text-dark-700' : 'text-dark-400'} group-hover:opacity-100 opacity-60`} />
          </a>
        )}
        {text && (
          <p className={`break-words whitespace-pre-wrap ${mediaOnly ? 'mt-1.5 px-2 pb-1' : ''}`}>{text}</p>
        )}
        <div className={`flex items-center justify-end gap-1 ${image ? 'px-1.5 pt-1' : 'mt-1'} ${
          isMe ? 'text-dark-700' : 'text-dark-400'
        }`}>
          <span className="text-[10px]">{time}</span>
          {isMe && status && (
            <span className={`flex items-center ${status === 'read' ? 'text-lime-600' : ''}`}>
              {status === 'read' ? (
                <>
                  <FiCheck className="w-3 h-3 -mr-1" />
                  <FiCheck className="w-3 h-3" />
                </>
              ) : (
                <FiCheck className="w-3 h-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;