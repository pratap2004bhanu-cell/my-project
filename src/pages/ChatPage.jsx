import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FiSend, FiSmile,
  FiMoreVertical, FiArrowLeft, FiX
} from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { RoundAvatar } from '../components/common';
import { MessageBubble, EmojiPicker, AttachmentButton } from '../components/chat';
import { normalizeMessage, messagePreview } from '../utils/normalize';

const gradients = [
  'from-lime-500 to-emerald-500',
  'from-pink-500 to-rose-500',
  'from-violet-500 to-purple-500',
  'from-electric-500 to-cyan-500',
  'from-sunset-500 to-orange-500',
];

const ChatPage = () => {
  const { userId } = useParams();
  const { user: me } = useAuth();
  const socket = useSocket();
  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState(userId || null);
  const [conversations, setConversations] = useState([]);
  const [messagesByChat, setMessagesByChat] = useState({});
  const [loading, setLoading] = useState(true);
  const [overrides, setOverrides] = useState({});
  const [typing, setTyping] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimer = useRef(null);
  const typingSent = useRef(false);
  const activeChatRef = useRef(activeChat);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  // Load conversations
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/messages/conversations');
        const convs = (res.data.conversations || []).map((c, i) => {
          const u = c.user || {};
          return {
            id: c._id,
            name: u.name || 'Unknown',
            avatar: u.avatar || (u.name || 'U')[0],
            gradient: gradients[i % gradients.length],
            lastMessage: messagePreview(c.lastMessage),
            time: c.lastMessage?.createdAt
              ? new Date(c.lastMessage.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
              : '',
            unread: c.unread || 0,
            online: false,
          };
        });
        setConversations(convs);
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load messages for a conversation
  useEffect(() => {
    if (!activeChat) return;
    if (messagesByChat[activeChat]) {
      scrollToBottom();
      return;
    }
    const load = async () => {
      try {
        const res = await api.get(`/api/messages/${activeChat}`);
        const mapped = (res.data.messages || []).map((m) => {
          const nm = normalizeMessage(m);
          return {
            id: nm.id,
            sender: nm.senderId === me?.id ? 'me' : 'them',
            text: nm.text,
            image: nm.image,
            attachment: nm.attachment,
            time: nm.time,
            status: nm.read ? 'read' : 'delivered',
          };
        });
        setMessagesByChat((prev) => ({ ...prev, [activeChat]: mapped }));
      } catch (err) {
        console.error('Failed to load messages:', err);
        setMessagesByChat((prev) => ({ ...prev, [activeChat]: [] }));
      } finally {
        scrollToBottom();
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat]);

  // Fetch profile for a brand-new conversation (no messages yet)
  useEffect(() => {
    if (!activeChat) return;
    if (conversations.some((c) => c.id === activeChat)) return;
    if (overrides[activeChat]) return;
    api.get(`/api/users/${activeChat}`)
      .then((res) => {
        const u = res.data.user;
        setOverrides((prev) => ({
          ...prev,
          [activeChat]: {
            name: u.name,
            avatar: u.avatar || u.name[0],
            gradient: gradients[Math.abs(u.name.length) % gradients.length],
            online: u.status?.current === 'online',
          },
        }));
      })
      .catch(() => {});
  }, [activeChat, conversations, overrides]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    const onSent = (m) => {
      if (!m.receiver) return;
      const { receiver } = m;
      const nm = normalizeMessage(m);
      appendMessage(receiver, { id: nm.id, sender: 'me', text: nm.text, image: nm.image, attachment: nm.attachment, time: nm.time, status: 'sent' });
      bumpConversation(receiver, messagePreview(nm));
    };
    const onReceive = (m) => {
      const fromId = m.sender?._id || m.sender;
      const nm = normalizeMessage(m);
      appendMessage(fromId, { id: nm.id, sender: 'them', text: nm.text, image: nm.image, attachment: nm.attachment, time: nm.time, status: 'delivered' });
      bumpConversation(fromId, messagePreview(nm));
      if (socket?.connected && activeChatRef.current === fromId) {
        socket.emit('message:read', { receiver: fromId });
      }
    };
    const onRead = (data) => {
      if (!data?.sender) return;
      const byId = data.sender._id || data.sender;
      setMessagesByChat((prev) => {
        const chat = prev[byId] || [];
        return {
          ...prev,
          [byId]: chat.map((m) => (m.sender === 'me' && m.status !== 'read' ? { ...m, status: 'read' } : m)),
        };
      });
    };
    const onTypingStart = (data) => {
      if (data?.userId && String(data.userId) === String(activeChatRef.current)) setTyping(true);
    };
    const onTypingStop = (data) => {
      if (data?.userId && String(data.userId) === String(activeChatRef.current)) setTyping(false);
    };
    socket.on('message:sent', onSent);
    socket.on('message:receive', onReceive);
    socket.on('message:read', onRead);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    return () => {
      socket.off('message:sent', onSent);
      socket.off('message:receive', onReceive);
      socket.off('message:read', onRead);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const appendMessage = (chatId, msg) => {
    setMessagesByChat((prev) => {
      const existing = prev[chatId] || [];
      if (existing.some((e) => e.id === msg.id)) return prev;
      return { ...prev, [chatId]: [...existing, msg] };
    });
    scrollToBottom();
  };

  const bumpConversation = (chatId, lastMessage) => {
    setConversations((prev) => {
      const existing = prev.find((c) => c.id === chatId);
      const time = new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
      if (existing) {
        return prev.map((c) => (c.id === chatId ? { ...c, lastMessage, time } : c));
      }
      return [...prev, { id: chatId, name: 'New chat', avatar: '?', gradient: gradients[0], lastMessage, time, unread: 0, online: false }];
    });
  };

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  useEffect(() => {
    if (!socket?.connected || !activeChat) return;
    socket.emit('message:read', { receiver: activeChat });
  }, [activeChat, socket]);

  const handleTyping = (value) => {
    setMessage(value);
    if (!socket?.connected || !activeChat) return;
    if (!typingSent.current) {
      socket.emit('typing:start', { receiver: activeChat });
      typingSent.current = true;
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      typingSent.current = false;
      if (socket?.connected) socket.emit('typing:stop', { receiver: activeChat });
    }, 1500);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const content = message.trim();
    if ((!content && !pendingAttachment) || !activeChat) return;
    clearTimeout(typingTimer.current);
    typingSent.current = false;
    const attachment = pendingAttachment || undefined;
    if (socket?.connected) {
      socket.emit('typing:stop', { receiver: activeChat });
      socket.emit('message:send', { receiver: activeChat, content, attachment });
    } else {
      api.post('/api/messages', { receiver: activeChat, content, attachment })
        .then((res) => {
          const nm = normalizeMessage(res.data.message);
          appendMessage(activeChat, { id: nm.id, sender: 'me', text: nm.text, image: nm.image, attachment: nm.attachment, time: nm.time, status: 'sent' });
          bumpConversation(nm.senderId, messagePreview(nm));
        })
        .catch((err) => alert(err?.response?.data?.error || 'Message failed to send'));
    }
    setMessage('');
    setPendingAttachment(null);
    setEmojiOpen(false);
  };

  const handleEmoji = (emoji) => {
    setMessage((prev) => prev + emoji);
    if (socket?.connected && activeChat && !typingSent.current) {
      socket.emit('typing:start', { receiver: activeChat });
      typingSent.current = true;
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeChat) || (activeChat ? overrides[activeChat] : null);

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-screen">
      {/* Conversations List */}
      <div className={`${activeChat ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-96 border-r border-dark-800`}>
        {/* Header */}
        <div className="p-4 border-b border-dark-800">
          <h1 className="text-xl font-display font-bold text-white mb-4">Messages</h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2.5 bg-dark-800/50 border border-dark-700/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-lime-500/50"
            />
            <FiSend className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-dark-400">
              <div className="w-6 h-6 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-center text-dark-400 text-sm py-12 px-6">
              No conversations yet. Start by messaging someone from People.
            </p>
          ) : conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveChat(conv.id)}
              className={`w-full flex items-center gap-3 p-4 hover:bg-dark-800/50 transition-colors ${
                activeChat === conv.id ? 'bg-dark-800/50 border-r-2 border-lime-500' : ''
              }`}
            >
              <RoundAvatar
                src={conv.avatar}
                name={conv.name}
                gradient={conv.gradient}
                online={conv.online}
                className="w-12 h-12"
              />
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white truncate">{conv.name}</h3>
                  <span className="text-xs text-dark-400">{conv.time}</span>
                </div>
                <p className="text-sm text-dark-400 truncate">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <span className="w-5 h-5 bg-lime-500 text-dark-900 rounded-full text-xs font-bold flex items-center justify-center">
                  {conv.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${activeChat ? 'flex' : 'hidden lg:flex'} flex-col flex-1`}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b border-dark-800">
              <button 
                onClick={() => setActiveChat(null)}
                className="lg:hidden btn-icon"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <RoundAvatar
                src={activeConversation?.avatar}
                name={activeConversation?.name}
                gradient={activeConversation?.gradient || 'from-lime-500 to-electric-500'}
                online={activeConversation?.online}
                className="w-10 h-10"
              />
              <div className="flex-1">
                <h2 className="font-semibold text-white">{activeConversation?.name || 'Chat'}</h2>
                <p className="text-xs text-dark-400">
                  {typing
                    ? <span className="text-lime-400">typing...</span>
                    : (activeConversation?.online ? 'Online' : 'Offline')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-icon">
                  <FiMoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-900/30">
              <div className="flex items-center justify-center">
                <span className="px-3 py-1 bg-dark-800 rounded-full text-xs text-dark-400">
                  {(messagesByChat[activeChat] || []).length === 0 ? 'Say hello 👋' : 'Today'}
                </span>
              </div>

              {(messagesByChat[activeChat] || []).map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <MessageBubble
                    text={msg.text}
                    image={msg.image}
                    attachment={msg.attachment}
                    time={msg.time}
                    status={msg.status}
                    isMe={msg.sender === 'me'}
                  />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-dark-800">
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <AttachmentButton
                  onAttach={setPendingAttachment}
                  buttonClass="btn-icon"
                  iconClass="w-5 h-5"
                />
                {pendingAttachment && (
                  <span className="flex items-center gap-2 max-w-[160px] bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-sm text-white flex-shrink-0">
                    <span className="truncate">
                      {pendingAttachment.type?.startsWith('image/') ? '📷 ' : '📎 '}
                      {pendingAttachment.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPendingAttachment(null)}
                      className="text-dark-400 hover:text-white flex-shrink-0"
                      aria-label="Remove attachment"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </span>
                )}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => handleTyping(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 pr-10 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-lime-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setEmojiOpen((prev) => !prev)}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors ${emojiOpen ? 'text-lime-400' : 'text-dark-400 hover:text-white'}`}
                    aria-label="Emoji picker"
                  >
                    <FiSmile className="w-5 h-5" />
                  </button>
                  {emojiOpen && (
                    <EmojiPicker
                      onSelect={(emoji) => { handleEmoji(emoji); setEmojiOpen(false); }}
                    />
                  )}
                </div>
                <button 
                  type="submit"
                  disabled={!message.trim() && !pendingAttachment}
                  className="btn-primary px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSend className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="text-6xl mb-4 block">💬</span>
              <h3 className="text-xl font-bold text-white mb-2">Select a conversation</h3>
              <p className="text-dark-400">Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;