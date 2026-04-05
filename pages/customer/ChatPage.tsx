import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { vendorChatService, ChatSession, ChatMessage } from '../../services/vendorChatService';
import { vendorService } from '../../services/vendorService';
import { userService } from '../../services/userService';
import { getCurrentUser } from '../../services/auth';
import toast from '../../services/toast';

const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialSessionId = searchParams.get('sessionId');
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentUser = getCurrentUser();
  const isVendor = location.pathname.startsWith('/vendor');
  const role: 'customer' | 'vendor' = isVendor ? 'vendor' : 'customer';

  const [namesMap, setNamesMap] = useState<Record<string, string>>({});

  // Resolve names
  useEffect(() => {
    const resolveNames = async () => {
      const newNames: Record<string, string> = { ...namesMap };
      let changed = false;

      for (const session of sessions) {
        const targetId = isVendor ? session.customerId : session.vendorId;
        if (targetId && !newNames[targetId]) {
          try {
            if (isVendor) {
              const customerData = await userService.getUserById(targetId);
              if (customerData?.fullName) {
                newNames[targetId] = customerData.fullName;
              } else {
                newNames[targetId] = `Khách hàng #${targetId.slice(-4)}`;
              }
            } else {
              const vendorData = await vendorService.getVendorCached(targetId);
              if (vendorData?.shopName) {
                newNames[targetId] = vendorData.shopName;
              }
            }
            changed = true;
          } catch (e) {
            console.warn('Could not resolve name for', targetId);
          }
        }
      }
      if (changed) setNamesMap(newNames);
    };

    if (sessions.length > 0) resolveNames();
  }, [sessions, isVendor]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const data = await vendorChatService.getSessions(role);
        setSessions(data);

        if (initialSessionId) {
          const session = data.find(s => s.sessionId === initialSessionId);
          if (session) {
            handleSelectSession(session);
          } else {
            // Try fetching specific session if not in list
            const details = await vendorChatService.getSessionDetails(initialSessionId);
            setActiveSession(details);
            setMessages(details.messages || []);
          }
        } else if (data.length > 0) {
          handleSelectSession(data[0]);
        }
      } catch (error: any) {
        console.error('Failed to load chat data:', error);
        // Silently fail for empty list to avoid annoying toats but log it
        if (error.message.includes('405')) {
          console.warn('Backend list endpoint still not confirmed.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [role, initialSessionId]);

  // Polling for new messages
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(async () => {
      try {
        const details = await vendorChatService.getSessionDetails(activeSession.sessionId);
        if (details.messages?.length !== messages.length) {
          setMessages(details.messages || []);
        }
      } catch (err) {
        console.warn('Poll skip...');
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeSession, messages.length]);

  const handleSelectSession = async (session: ChatSession) => {
    setActiveSession(session);
    setMessages(session.messages || []);
    try {
      const details = await vendorChatService.getSessionDetails(session.sessionId);
      setMessages(details.messages || []);
    } catch (e) {
      console.warn('Could not refresh full message history');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeSession || isSending) return;

    const text = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const sentMsg = await vendorChatService.sendMessage(activeSession.sessionId, text);
      setMessages(prev => [...prev, sentMsg]);
    } catch (error) {
      toast.error('Không thể gửi tin nhắn');
      setNewMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  const getCounterParty = (session: ChatSession | null) => {
    if (!session) return { name: 'Người dùng', avatar: null };
    // Heuristic names based on role
    const isVendorSide = role === 'vendor';
    const cid = session.customerId || '';
    const vid = session.vendorId || '';
    const targetId = isVendorSide ? cid : vid;

    const resolvedName = namesMap[targetId];

    return {
      name: resolvedName || (isVendorSide
        ? `Khách hàng #${cid ? cid.slice(-4) : '...'}`
        : `Cửa hàng #${vid ? vid.slice(-4) : '...'}`),
      avatar: session.counterPartyAvatar
    };
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent shadow-lg shadow-primary/20"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-160px)] min-h-[600px] bg-ritual-bg/30 rounded-[3rem] overflow-hidden border border-gold/10 shadow-2xl backdrop-blur-sm">
      {/* Sidebar */}
      <div className="w-80 md:w-96 bg-white/90 border-r border-gold/10 flex flex-col">
        <div className="p-8 border-b border-gold/10 bg-white">
          <h2 className="text-2xl font-display font-black text-primary tracking-tight">Hội thoại</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Hỗ trợ khách hàng</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-12 px-6">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">chat_bubble_outline</span>
              <p className="text-sm text-slate-400 font-medium">Chưa có cuộc trò chuyện nào</p>
            </div>
          ) : (
            sessions.map((session) => {
              const party = getCounterParty(session);
              const isActive = activeSession?.sessionId === session.sessionId;
              return (
                <button
                  key={session.sessionId}
                  onClick={() => handleSelectSession(session)}
                  className={`w-full flex items-center gap-4 p-4 rounded-[2rem] transition-all duration-300 text-left ${isActive
                      ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]'
                      : 'hover:bg-ritual-bg text-slate-700 hover:text-primary'
                    }`}
                >
                  <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-black border-2 ${isActive ? 'border-white/30 bg-white/20' : 'border-gold/10 bg-ritual-bg text-primary'
                    }`}>
                    {party.avatar ? (
                      <img src={party.avatar} className="w-full h-full rounded-full object-cover" alt="" />
                    ) : (
                      party.name[0]
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className={`font-black text-sm truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>
                        {party.name}
                      </h3>
                    </div>
                    {session.messages && session.messages.length > 0 && (
                      <p className={`text-xs truncate font-medium ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                        {session.messages[session.messages.length - 1].content}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/30">
        {activeSession ? (
          <>
            {/* Header */}
            <div className="px-10 py-6 bg-white border-b border-gold/10 flex items-center gap-6">
              <div className="w-14 h-14 rounded-full flex-shrink-0 bg-ritual-bg border-4 border-white shadow-lg flex items-center justify-center text-2xl font-black text-primary overflow-hidden">
                {getCounterParty(activeSession).avatar ? (
                  <img src={getCounterParty(activeSession).avatar} className="w-full h-full object-cover" alt="" />
                ) : (
                  getCounterParty(activeSession).name[0]
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-primary tracking-tight">
                  {getCounterParty(activeSession).name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang trực tuyến</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-10 py-8 space-y-6 scrollbar-thin">
              {messages.map((msg, idx) => {
                const isMine = msg.role.toLowerCase() === role.toLowerCase();
                return (
                  <div key={msg.messageId || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-5 rounded-[2rem] text-sm md:text-base leading-relaxed shadow-sm transition-all duration-300 ${isMine
                        ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10 hover:shadow-primary/20'
                        : 'bg-white text-slate-700 rounded-tl-none border border-gold/5 hover:border-gold/10'
                      }`}>
                      {msg.content}
                      <div className={`text-[9px] font-black mt-2 uppercase tracking-widest opacity-40 ${isMine ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-8 bg-white border-t border-gold/10">
              <form onSubmit={handleSendMessage} className="flex gap-4 items-center bg-ritual-bg/50 p-2 rounded-[2.5rem] border border-gold/10 focus-within:border-primary/30 transition-all shadow-inner">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-transparent px-6 py-3 border-none focus:ring-0 text-slate-700 font-medium placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:grayscale disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-2xl">send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-32 h-32 rounded-full bg-ritual-bg/50 flex items-center justify-center mb-6 border border-gold/10 shadow-inner">
              <span className="material-symbols-outlined text-5xl text-primary/20">chat_bubble</span>
            </div>
            <h3 className="text-2xl font-black text-primary/30 tracking-tight">Vui lòng chọn một cuộc trò chuyện</h3>
            <p className="text-slate-400/60 max-w-sm mt-2 font-medium">Bắt đầu trao đổi để được tư vấn chính xác nhất về các gói lễ cúng.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
