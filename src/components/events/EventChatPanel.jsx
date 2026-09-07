import { useState, useRef, useEffect } from 'react';
import { FiSend, FiImage, FiClock } from 'react-icons/fi';
import { RoundAvatar } from '../common';
import { normalizeMessage } from '../../utils/normalize';

const EventChatPanel = ({ eventId, me, socket, sendEnabled = true }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const populated = useRef(false);

  useEffect(() => {
    if (populated.current) return;
    populated.current = true;
    const load = async () => {
      setLoading(true);
      try {
        const { default: api } = await import('../../api');
        const res = await api.get(`/api/events/${eventId}/messages`);
        setMessages((res.data.messages || []).map(normalizeMessage));
      } catch (err) {
        setError(err?.response?.data?.error || 'Could not load event chat');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  useEffect(() => {
    if (!socket || !eventId) return;
    const handler = (msg) => {
      const m = normalizeMessage(msg);
      if (String(m.senderId) === String(me?.id)) return;
      setMessages((prev) => [...prev, m]);
    };
    socket.emit('event:join', eventId);
    socket.on('event:message', handler);
    return () => {
      socket.emit('event:leave', eventId);
      socket.off('event:message', handler);
    };
  }, [socket, eventId, me?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    try {
      const { default: api } = await import('../../api');
      const res = await api.post(`/api/events/${eventId}/messages`, { content });
      setMessages((prev) => [...prev, normalizeMessage(res.data.message)]);
      setText('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[420px] rounded-2xl border border-dark-700/50 bg-dark-800/40 overflow-hidden">
      <div className="px-4 py-3 border-b border-dark-700/50 flex items-center gap-2">
        <FiClock className="w-4 h-4 text-lime-400" />
        <h3 className="text-sm font-semibold text-white">Event chat</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime-500/10 text-lime-400 ml-auto">live</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="text-center text-xs text-dark-500 py-8">Loading messages...</div>
        ) : error && messages.length === 0 ? (
          <div className="text-center text-xs text-hotpink-400 py-8">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-xs text-dark-500 py-8">
            Be the first to say hi. Attending together makes it more fun! 💬
          </div>
        ) : (
          messages.map((m) => {
            const mine = String(m.senderId) === String(me?.id);
            return (
              <div key={m.id} className={`flex gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
                <RoundAvatar
                  src={m.senderAvatar}
                  name={m.senderName}
                  className="w-8 h-8 text-xs"
                />
                <div className={`max-w-[75%] ${mine ? 'items-end text-right' : ''}`}>
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-sm leading-snug break-words ${
                      mine
                        ? 'bg-lime-500 text-dark-900 rounded-br-md'
                        : 'bg-dark-700 text-dark-200 rounded-bl-md'
                    }`}
                  >
                    {m.image ? (
                      <img src={m.image} alt={m.text || 'photo'} className="rounded-lg max-h-48 mb-1" />
                    ) : null}
                    {m.text}
                  </div>
                  <p className="text-[10px] text-dark-500 mt-1">
                    {mine ? '' : `${m.senderName} · `}{m.time}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && messages.length > 0 && (
        <p className="px-4 py-1.5 text-[11px] text-hotpink-400">{error}</p>
      )}

      {sendEnabled ? (
        <div className="px-3 py-2.5 border-t border-dark-700/50 flex items-center gap-2">
          <button
            onClick={() => setError(null)}
            className="w-9 h-9 rounded-full bg-dark-800 hover:bg-dark-700 flex items-center justify-center text-dark-400 transition-colors shrink-0"
            title="Photos coming soon"
          >
            <FiImage className="w-4 h-4" />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Message the crew..."
            className="flex-1 min-w-0 bg-dark-800 border border-dark-700/50 rounded-full px-4 py-2 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-lime-500/40"
            maxLength={500}
          />
          <button
            onClick={send}
            disabled={sending || !text.trim()}
            className="w-9 h-9 rounded-full bg-lime-500 hover:bg-lime-400 flex items-center justify-center text-dark-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <FiSend className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-dark-700/50 text-center text-xs text-dark-400">
          Join or mark yourself interested to chat with attendees.
        </div>
      )}
    </div>
  );
};

export default EventChatPanel;