import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FiSend, FiSmile,
  FiArrowLeft, FiMapPin, FiX,
  FiUsers, FiInfo,
  FiCalendar, FiSettings
} from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { RoundAvatar } from '../components/common';
import { MessageBubble, EmojiPicker, AttachmentButton } from '../components/chat';
import { normalizeActivity, normalizeMessage, categoryColor, messagePreview } from '../utils/normalize';

const GroupChatPage = () => {
  const { activityId } = useParams();
  const { user: me } = useAuth();
  const socket = useSocket();
  const [message, setMessage] = useState('');
  const [activeGroup, setActiveGroup] = useState(activityId || null);
  const [showInfo, setShowInfo] = useState(false);
  const [groups, setGroups] = useState([]);
  const [activityMap, setActivityMap] = useState({});
  const [messagesByGroup, setMessagesByGroup] = useState({});
  const [loading, setLoading] = useState(true);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const messagesEndRef = useRef(null);

  // Load my activities as group chats
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/activities');
        const mine = (res.data.activities || [])
          .filter((a) => a.status !== 'cancelled' && (a.isCreator || (a.participants || []).some((p) => p.user && String(p.user._id || p.user) === String(me?.id))))
          .map((a) => normalizeActivity(a));
        const map = {};
        mine.forEach((a) => { map[a.id] = a; });
        setActivityMap(map);
        setGroups(mine.map((a) => ({
          id: a.id,
          name: a.title,
          emoji: a.emoji,
          activity: a.time,
          members: a.participants,
          lastMessage: `Chat with the ${a.title} group`,
          time: '',
          unread: 0,
          gradient: a.color,
        })));
      } catch (err) {
        console.error('Failed to load groups:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load messages for a group + join socket room
  useEffect(() => {
    if (!activeGroup) return;
    const load = async () => {
      try {
        const res = await api.get(`/api/messages/activity/${activeGroup}`);
        const mapped = (res.data.messages || []).map(mappedMessage);
        setMessagesByGroup((prev) => ({ ...prev, [activeGroup]: mapped }));
      } catch (err) {
        console.error('Failed to load group messages:', err);
        setMessagesByGroup((prev) => ({ ...prev, [activeGroup]: [] }));
      } finally {
        scrollToBottom();
      }
    };
    load();
    if (socket?.connected) {
      socket.emit('activity:join', activeGroup);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup]);

  // Leave previous room + socket listener for activity messages
  useEffect(() => {
    if (!socket) return;
    if (socket?.connected && activityId && activeGroup && activeGroup !== activityId) {
      socket.emit('activity:leave', activityId);
    }
    const onActivityMessage = (m) => {
      if (m.activity && m.activity !== activeGroup) return;
      const msg = mappedMessage(m);
      setMessagesByGroup((prev) => {
        const id = m.activity || activeGroup;
        const existing = prev[id] || [];
        if (existing.some((e) => e.id === msg.id)) return prev;
        return { ...prev, [id]: [...existing, msg] };
      });
      scrollToBottom();
    };
    socket.on('activity:message', onActivityMessage);
    return () => socket.off('activity:message', onActivityMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, activeGroup]);

  const mappedMessage = (m) => {
    const nm = normalizeMessage(m);
    const sender = {
      name: nm.senderName || 'You',
      avatar: nm.senderAvatar || (nm.senderName || 'Y')[0],
      gradient: m.sender?.gradient || categoryColor(activityMap[nm.senderId]?.category),
    };
    return { id: nm.id, sender, text: nm.text, image: nm.image, attachment: nm.attachment, time: nm.time, isMe: nm.senderId === me?.id };
  };

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const content = message.trim();
    if ((!content && !pendingAttachment) || !activeGroup) return;
    if (socket?.connected) {
      socket.emit('activity:message', { activityId: activeGroup, content, attachment: pendingAttachment || undefined });
    }
    setMessage('');
    setPendingAttachment(null);
    setEmojiOpen(false);
  };

  const activeGroupData = groups.find(g => g.id === activeGroup);
  const activeActivity = activeGroup ? activityMap[activeGroup] : null;

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-screen">
      {/* Groups List */}
      <div className={`${activeGroup ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 border-r border-dark-800`}>
        {/* Header */}
        <div className="p-4 border-b border-dark-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-display font-bold text-white">Group Chats</h1>
            <button className="btn-icon w-8 h-8">
              <FiInfo className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search groups..."
              className="w-full pl-10 pr-4 py-2.5 bg-dark-800/50 border border-dark-700/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-lime-500/50 text-sm"
            />
            <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          </div>
        </div>

        {/* Groups */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-dark-400">
              <div className="w-6 h-6 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : groups.length === 0 ? (
            <p className="text-center text-dark-400 text-sm py-12 px-6">
              No activity groups yet. Join or create an activity to start chatting.
            </p>
          ) : groups.map((group) => (
            <button
              key={group.id}
              onClick={() => setActiveGroup(group.id)}
              className={`w-full flex items-center gap-3 p-4 hover:bg-dark-800/50 transition-colors ${
                activeGroup === group.id ? 'bg-dark-800/50 border-r-2 border-lime-500' : ''
              }`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${group.gradient} flex items-center justify-center text-xl flex-shrink-0`}>
                {group.emoji}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white truncate">{group.name}</h3>
                  <span className="text-xs text-dark-400">{group.time}</span>
                </div>
                <p className="text-xs text-dark-400 flex items-center gap-1">
                  <FiCalendar className="w-3 h-3" />
                  {group.activity}
                </p>
                <p className="text-sm text-dark-400 truncate">{group.lastMessage}</p>
              </div>
              {group.unread > 0 && (
                <span className="w-5 h-5 bg-lime-500 text-dark-900 rounded-full text-xs font-bold flex items-center justify-center">
                  {group.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${activeGroup ? 'flex' : 'hidden lg:flex'} flex-col flex-1`}>
        {activeGroup ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b border-dark-800">
              <button 
                onClick={() => setActiveGroup(null)}
                className="lg:hidden btn-icon w-8 h-8"
              >
                <FiArrowLeft className="w-4 h-4" />
              </button>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeGroupData?.gradient || 'from-lime-500 to-electric-500'} flex items-center justify-center text-lg`}>
                {activeGroupData?.emoji}
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-white">{activeGroupData?.name}</h2>
                <p className="text-xs text-dark-400 flex items-center gap-1">
                  <FiUsers className="w-3 h-3" />
                  {activeGroupData?.members} members • {activeGroupData?.activity}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowInfo(!showInfo)}
                  className="btn-icon w-8 h-8"
                >
                  <FiInfo className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Messages */}
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-900/30">
                  {/* Date Divider */}
                  <div className="flex items-center justify-center">
                    <span className="px-3 py-1 bg-dark-800 rounded-full text-xs text-dark-400">Today</span>
                  </div>

                  {(messagesByGroup[activeGroup] || []).map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      {!msg.isMe && (
                        <RoundAvatar
                          src={msg.sender.avatar}
                          name={msg.sender.name}
                          gradient={msg.sender.gradient}
                          className="w-8 h-8 text-xs mr-2 flex-shrink-0"
                        />
                      )}
                      <MessageBubble
                        text={msg.text}
                        image={msg.image}
                        attachment={msg.attachment}
                        time={msg.time}
                        isMe={msg.isMe}
                        showName={msg.isMe ? undefined : msg.sender.name}
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
                      buttonClass="btn-icon w-8 h-8"
                      iconClass="w-4 h-4"
                    />
                    {pendingAttachment && (
                      <span className="flex items-center gap-2 max-w-[150px] bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-sm text-white flex-shrink-0">
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
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full px-4 py-2.5 pr-10 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-lime-500/50 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setEmojiOpen((prev) => !prev)}
                        className={`absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors ${emojiOpen ? 'text-lime-400' : 'text-dark-400 hover:text-white'}`}
                        aria-label="Emoji picker"
                      >
                        <FiSmile className="w-4 h-4" />
                      </button>
                      {emojiOpen && (
                        <EmojiPicker
                          onSelect={(emoji) => { setMessage((prev) => prev + emoji); setEmojiOpen(false); }}
                        />
                      )}
                    </div>
                    <button 
                      type="submit"
                      disabled={!message.trim() && !pendingAttachment}
                      className="btn-primary px-3 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiSend className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Info Panel */}
              {showInfo && (
                <div className="w-72 border-l border-dark-800 overflow-y-auto hidden lg:block">
                  <div className="p-4">
                    <div className="text-center mb-6">
                      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${activeGroupData?.gradient} flex items-center justify-center text-4xl mx-auto mb-3`}>
                        {activeGroupData?.emoji}
                      </div>
                      <h3 className="font-bold text-white text-lg">{activeGroupData?.name}</h3>
                      <p className="text-sm text-dark-400">{activeGroupData?.activity}</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-dark-300 mb-2">Members ({activeGroupData?.members})</h4>
                        <div className="space-y-2">
                          {(activeActivity?.attendees || []).map((member, idx) => (
                            <div key={member.id} className="flex items-center gap-2 p-2 bg-dark-800/50 rounded-lg">
                              <RoundAvatar
                                src={member.avatar}
                                name={member.name}
                                gradient="from-lime-500 to-electric-500"
                                className="w-8 h-8 text-xs"
                              />
                              <span className="text-sm text-white">{member.name}</span>
                              {member.id === activeActivity?.creatorId && <span className="text-xs text-lime-400 ml-auto">Host</span>}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-dark-300 mb-2">Activity Details</h4>
                        <div className="p-3 bg-dark-800/50 rounded-lg space-y-2">
                          <div className="flex items-center gap-2 text-sm text-dark-300">
                            <FiCalendar className="w-4 h-4 text-lime-400" />
                            {activeGroupData?.activity}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-dark-300">
                            <FiMapPin className="w-4 h-4 text-lime-400" />
                            {activeActivity?.address || 'Location TBA'}
                          </div>
                        </div>
                      </div>

                      <button className="w-full btn-outline text-sm">
                        <FiSettings className="w-4 h-4 mr-2" />
                        Group Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="text-6xl mb-4 block">💬</span>
              <h3 className="text-xl font-bold text-white mb-2">Select a group chat</h3>
              <p className="text-dark-400">Chat with activity participants</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupChatPage;