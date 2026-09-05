import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiSend, FiPaperclip, FiArrowLeft, FiUsers
} from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { RoundAvatar } from '../components/common';
import { normalizeMessage } from '../utils/normalize';

const CommunityChatPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const socket = useSocket();
  const [message, setMessage] = useState('');
  const [community, setCommunity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  useEffect(() => {
    api.get(`/api/communities/${id}`)
      .then((res) => setCommunity(res.data.community))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get(`/api/messages/community/${id}`);
        const mapped = (res.data.messages || []).map((m) => {
          const nm = normalizeMessage(m);
          return {
            id: nm.id,
            sender: {
              name: nm.senderName || 'You',
              avatar: nm.senderAvatar || (nm.senderName || 'Y')[0],
              id: nm.senderId,
            },
            text: nm.text,
            time: nm.time,
            isMe: nm.senderId === me?.id,
          };
        });
        if (!cancelled) setMessages(mapped);
      } catch (err) {
        console.error('Failed to load community messages:', err);
      } finally {
        if (!cancelled) { setLoading(false); scrollToBottom(); }
      }
    };
    load();
    if (socket?.connected) socket.emit('community:join', id);
    return () => { cancelled = true; if (socket?.connected) socket.emit('community:leave', id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, socket]);

  useEffect(() => {
    if (!socket) return;
    const onMessage = (m) => {
      const nm = normalizeMessage(m);
      const msg = {
        id: nm.id,
        sender: {
          name: nm.senderName || 'You',
          avatar: nm.senderAvatar || (nm.senderName || 'Y')[0],
          id: nm.senderId,
        },
        text: nm.text,
        time: nm.time,
        isMe: nm.senderId === me?.id,
      };
      setMessages((prev) => {
        if (prev.some((e) => e.id === msg.id)) return prev;
        return [...prev, msg];
      });
      scrollToBottom();
    };
    socket.on('community:message', onMessage);
    return () => socket.off('community:message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, me?.id]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || !community) return;
    if (socket?.connected) {
      socket.emit('community:message', { communityId: id, content: text });
    } else {
      api.post(`/api/messages/community/${id}`, { content: text }).then((res) => {
        const nm = normalizeMessage(res.data.message);
        setMessages((prev) => [...prev, {
          id: nm.id,
          sender: { name: nm.senderName || 'You', avatar: nm.senderAvatar || 'Y', id: nm.senderId },
          text: nm.text,
          time: nm.time,
          isMe: true,
        }]);
        scrollToBottom();
      }).catch(() => alert('Could not send message'));
    }
    setMessage('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-dark-800">
        <button onClick={() => navigate(`/communities/${id}`)} className="btn-icon w-8 h-8">
          <FiArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-500 via-electric-500 to-hotpink-500 flex items-center justify-center text-lg">
          {community?.emoji || '👥'}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-white truncate">{community?.name || 'Community Chat'}</h2>
          <p className="text-xs text-dark-400 flex items-center gap-1">
            <FiUsers className="w-3 h-3" />
            {community?.memberCount ?? 0} members
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-900/30">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-dark-400">
            <div className="w-6 h-6 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">💬</span>
            <h3 className="text-lg font-bold text-white mb-2">No messages yet</h3>
            <p className="text-dark-400 text-sm">Say hi to the community!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
              {!msg.isMe && (
                <RoundAvatar
                  src={msg.sender.avatar}
                  name={msg.sender.name}
                  className="w-8 h-8 text-xs mr-2"
                />
              )}
              <div className="max-w-[70%]">
                {!msg.isMe && (
                  <p className="text-xs text-dark-400 mb-1 ml-1">{msg.sender.name}</p>
                )}
                <div className={`rounded-2xl px-4 py-2.5 ${
                  msg.isMe
                    ? 'bg-lime-500 text-dark-900 rounded-br-md'
                    : 'bg-dark-800 text-white rounded-bl-md'
                }`}>
                  <p>{msg.text}</p>
                </div>
                <p className={`text-[10px] text-dark-400 mt-1 ${msg.isMe ? 'text-right mr-1' : 'ml-1'}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-dark-800">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <button type="button" className="btn-icon w-8 h-8">
            <FiPaperclip className="w-4 h-4" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message the community..."
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-lime-500/50 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!message.trim()}
            className="btn-primary px-3 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSend className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommunityChatPage;