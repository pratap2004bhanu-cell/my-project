import { useState } from 'react';
import {
  FiShare2, FiCopy, FiCheck,
  FiSend,
} from 'react-icons/fi';
import { Modal } from '../common';

const ShareEvent = ({ isOpen, onClose, eventId }) => {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/events/${eventId}`
    : `/events/${eventId}`;
  const title = typeof document !== 'undefined' ? document.title : 'Check out this KIKY event!';
  const text = `${title}\n${url}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // ignore
      }
      return;
    }
    copy();
  };

  const open = (provider) => {
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    };
    window.open(urls[provider], '_blank', 'noopener');
  };

  const shareButtons = [
    { id: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
    { id: 'twitter', label: 'X', emoji: '𝕏' },
    { id: 'telegram', label: 'Telegram', emoji: '✈️' },
    { id: 'facebook', label: 'Facebook', emoji: '📘' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share this event" size="sm">
      <div className="space-y-4" style={{ color: '#111827' }}>
        <button
          onClick={shareNative}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-lime-500 to-electric-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <FiSend className="w-4 h-4" /> Share with friends
        </button>

        <div className="grid grid-cols-4 gap-2">
          {shareButtons.map((b) => (
            <button
              key={b.id}
              onClick={() => open(b.id)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <span className="text-xl">{b.emoji}</span>
              <span className="text-[10px] text-gray-600">{b.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 truncate">
            {url}
          </div>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors shrink-0"
          >
            {copied ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <p className="text-xs text-gray-400 flex items-center gap-1">
          <FiShare2 className="w-3.5 h-3.5" /> Anyone can open the link — even people not on KIKY yet.
        </p>
      </div>
    </Modal>
  );
};

export default ShareEvent;