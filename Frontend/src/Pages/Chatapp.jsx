import { useState, useEffect, useRef } from 'react'
import { Search, Send, ArrowLeft, User, ShieldCheck, CheckCheck, Clock, ExternalLink } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import Navbar from '../Components/Navbar'
import { getConversations, getConversationHistory } from '../api/messageApi'
import { getProfileById } from '../api/matchingApi'
import { getMyProfile } from '../api/profileApi'
import { formatMaskedSurname } from '../utils/formatters'

export default function Chatapp() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialTargetProfileId = searchParams.get('profileId') || searchParams.get('userId')

  const [searchQuery, setSearchQuery] = useState('')
  const [conversations, setConversations] = useState([])
  const [activeChat, setActiveChat] = useState(initialTargetProfileId || null)
  const [activeProfile, setActiveProfile] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState(null)
  const [typingProfiles, setTypingProfiles] = useState({})
  const [myProfileId, setMyProfileId] = useState(null)
  const messagesContainerRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const messageInputRef = useRef(null)

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch initial conversations and own profile
  useEffect(() => {
    let cancelled = false
    const fetchInitial = async () => {
      try {
        const [convos, myProfile] = await Promise.all([
          getConversations(),
          getMyProfile(),
        ])
        if (!cancelled) {
          const validConvos = Array.isArray(convos)
            ? convos.filter((c) => c && c._id && (c.partnerName || c.partner))
            : []
          setConversations(validConvos)
          if (myProfile?._id) setMyProfileId(String(myProfile._id))
          setLoading(false)
        }
      } catch (err) {
        console.error('Failed to fetch initial chat data:', err)
        if (!cancelled) setLoading(false)
      }
    }
    fetchInitial()
    return () => { cancelled = true }
  }, [])

  // If initial target profile passed in query param, fetch their profile details
  useEffect(() => {
    if (initialTargetProfileId) {
      setActiveChat(initialTargetProfileId)
      getProfileById(initialTargetProfileId)
        .then(setActiveProfile)
        .catch(() => { })
    }
  }, [initialTargetProfileId])

  // Setup Socket.io
  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
    if (!token) return

    const SOCKET_URL = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')
      : 'http://localhost:5000'

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    s.on('connect', () => console.log('Socket connected'))

    s.on('new_message', (message) => {
      const msgId = String(message._id || message.id)
      setMessages((prev) => {
        if (prev.some((m) => String(m._id || m.id) === msgId)) return prev
        return [...prev, message]
      })
      // Refresh conversations list
      getConversations().then((data) => {
        if (Array.isArray(data)) {
          setConversations(data.filter((c) => c && c._id && (c.partnerName || c.partner)))
        }
      }).catch(() => { })
    })

    s.on('user_typing', (data) => {
      setTypingProfiles((prev) => ({ ...prev, [data.profileId]: data.isTyping }))
    })

    s.on('messages_read', (data) => {
      setMessages((prev) =>
        prev.map((m) => {
          const receiver = typeof m.receiverProfileId === 'object' ? m.receiverProfileId._id : m.receiverProfileId
          return String(receiver) === String(data.readBy) ? { ...m, isRead: true } : m
        })
      )
    })

    setSocket(s)
    return () => {
      s.disconnect()
    }
  }, [myProfileId])

  // Load conversation when active chat changes
  useEffect(() => {
    if (!activeChat) return

    const fetchMessages = async () => {
      try {
        const data = await getConversationHistory(activeChat)
        setMessages(Array.isArray(data) ? [...data].reverse() : [])
      } catch (err) {
        console.error('Failed to fetch messages:', err)
        setMessages([])
      }
    }
    fetchMessages()

    getProfileById(activeChat)
      .then(setActiveProfile)
      .catch((err) => {
        console.warn('Could not load chat partner profile:', err)
        setActiveProfile(null)
      })

    if (socket) {
      socket.emit('join_conversation', activeChat)
      socket.emit('mark_read', { senderProfileId: activeChat })
    }

    return () => {
      if (socket) {
        socket.emit('leave_conversation')
      }
    }
  }, [activeChat, socket])

  const handleSendMessage = (e) => {
    e.preventDefault()
    const content = newMessage.trim()
    if (!content || !socket || !activeChat) return

    socket.emit('send_message', {
      receiverProfileId: activeChat,
      content,
    }, (response) => {
      if (response?.success && response.message) {
        const msgId = String(response.message._id || response.message.id)
        setMessages((prev) => {
          if (prev.some((m) => String(m._id || m.id) === msgId)) return prev
          return [...prev, response.message]
        })
        getConversations().then((data) => {
          if (Array.isArray(data)) {
            setConversations(data.filter((c) => c && c._id && (c.partnerName || c.partner)))
          }
        }).catch(() => { })
      }
    })

    setNewMessage('')
  }

  const handleTyping = (isTyping) => {
    if (!socket || !activeChat) return
    socket.emit('typing', { receiverProfileId: activeChat, isTyping })

    if (isTyping) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { receiverProfileId: activeChat, isTyping: false })
      }, 2000)
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    if (!conv || !conv._id) return false
    const rawName = conv.partnerName || conv.partner?.name || conv.partner?.userId?.name || ''
    const masked = formatMaskedSurname(rawName)
    return rawName.toLowerCase().includes(searchQuery.toLowerCase()) || masked.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const getChatPartnerName = () => {
    const raw = activeProfile?.name || activeProfile?.userId?.name || 'Chat Partner'
    return formatMaskedSurname(raw)
  }

  const getChatPartnerPhoto = () => {
    const p = activeProfile
    if (!p || p.isPhotoHidden) return null
    const photos = p.photos || []
    const primary = photos.find((x) => typeof x === 'object' && x?.isPrimary)?.url
    const first = typeof photos[0] === 'object' ? photos[0]?.url : photos[0]
    return primary || first || p.avatar || p.userId?.avatar || null
  }

  const getConvPartnerPhoto = (conv) => {
    if (!conv || conv.isPhotoHidden || conv.partner?.isPhotoHidden) return null
    const photos = conv.partnerPhotos || conv.partner?.photos || []
    const primary = photos.find((x) => typeof x === 'object' && x?.isPrimary)?.url
    const first = typeof photos[0] === 'object' ? photos[0]?.url : photos[0]
    return primary || first || conv.partnerAvatar || conv.partner?.avatar || null
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#FBF9F9] overflow-hidden font-sans">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 md:p-6 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 w-full h-full rounded-2xl md:rounded-3xl overflow-hidden flex border border-[#FFE4E8] shadow-sm bg-white min-h-0">
          
          {/* Left Sidebar: Conversations List */}
          <aside
            className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-[340px] lg:w-[380px] flex-col border-r border-[#FFE4E8] shrink-0 bg-[#FFF9FA] min-h-0 h-full`}
          >
            <div className="p-4 sm:p-5 border-b border-[#FFE4E8] shrink-0">
              <h1 className="text-lg sm:text-xl font-serif font-bold text-[#640515] mb-2 sm:mb-3">
                Conversations
              </h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search messages"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 min-h-0">
              {loading ? (
                <div className="p-8 text-center text-xs text-gray-400">Loading messages...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">No active conversations found</div>
              ) : (
                filteredConversations.map((conv) => {
                  const partnerId = conv._id
                  const rawName = conv.partnerName || conv.partner?.name || conv.partner?.userId?.name || 'Member'
                  const partnerName = formatMaskedSurname(rawName)
                  const partnerPhoto = getConvPartnerPhoto(conv)
                  const msg = conv.lastMessage
                  const isSelected = String(activeChat) === String(partnerId)

                  return (
                    <div
                      key={partnerId}
                      onClick={() => setActiveChat(partnerId)}
                      className={`flex gap-3 p-3.5 sm:p-4 items-start cursor-pointer transition-colors relative ${isSelected ? 'bg-[#FFF0F2]' : 'hover:bg-gray-50'}`}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#842029]" />
                      )}
                      <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-gray-200 bg-[#FFF0F2] flex items-center justify-center">
                        {partnerPhoto ? (
                          <img src={partnerPhoto} alt={partnerName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-serif font-bold text-sm text-[#842029]">
                            {partnerName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h2 className="text-xs sm:text-sm font-bold text-gray-900 truncate">{partnerName}</h2>
                          <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                            {msg?.createdAt ? new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>
                        <p className="text-xs truncate text-gray-500">
                          {msg?.content || 'No messages yet'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-[#842029] mt-1">
                            {conv.unreadCount} new
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </aside>

          {/* Right Main Area: Active Chat or Figma Screenshot 1 Empty State */}
          <section
            className={`${!activeChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-white min-h-0 h-full overflow-hidden`}
          >
            {!activeChat ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                <div className="max-w-md mx-auto space-y-4">
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#640515] leading-tight">
                    Your Eternal Connections
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
                    Select a conversation from the list to start chatting with your matches and discover the magic of a shared future.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => navigate("/browse-matches")}
                      className="px-8 py-3 rounded-full bg-[#800020] hover:bg-[#6b1b27] text-white font-semibold text-xs sm:text-sm transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
                    >
                      Browse Matches
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
                {/* Fixed Top Chat Header */}
                <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#FFE4E8] bg-[#FFF9FA] shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => setActiveChat(null)}
                      className="md:hidden p-1.5 -ml-1 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
                      title="Back to conversations"
                    >
                      <ArrowLeft className="w-5 h-5 text-[#842029]" />
                    </button>
                    <div
                      onClick={() => navigate(`/match-details/${activeChat}`)}
                      className="w-10 h-10 rounded-full overflow-hidden bg-[#FFF0F2] shrink-0 border border-gray-200 flex items-center justify-center cursor-pointer hover:opacity-90"
                    >
                      {getChatPartnerPhoto() ? (
                        <img src={getChatPartnerPhoto()} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-serif font-bold text-sm text-[#842029]">
                          {getChatPartnerName().charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 cursor-pointer" onClick={() => navigate(`/match-details/${activeChat}`)}>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm sm:text-base text-gray-900 font-serif truncate hover:text-[#842029] transition-colors">
                          {getChatPartnerName()}
                        </h3>
                      </div>
                      {typingProfiles[activeChat] ? (
                        <p className="text-[11px] text-[#842029] font-medium animate-pulse">typing...</p>
                      ) : (
                        <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Online
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions: View Profile */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/match-details/${activeChat}`)}
                      className="px-3.5 py-1.5 rounded-full border border-gray-200 text-gray-700 hover:border-[#842029] hover:text-[#842029] text-xs font-semibold hover:bg-[#FFF0F2] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ExternalLink size={12} />
                      <span className="hidden sm:inline">View Profile</span>
                    </button>
                  </div>
                </header>

                {/* Scrollable Messages Area */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 min-h-0 bg-[#FCFAFA]"
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                      <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-[#842029] mb-2">
                        <Send size={20} />
                      </div>
                      <p className="text-xs font-medium text-gray-500">No messages yet.</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Send a warm greeting to start your conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const senderId = String(typeof msg.senderProfileId === 'object' ? msg.senderProfileId._id : msg.senderProfileId)
                      const myId = String(myProfileId)
                      const isMine = myProfileId ? senderId === myId : false

                      return (
                        <div key={msg._id || msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-2xs ${isMine
                              ? 'bg-[#842029] text-white rounded-br-xs'
                              : 'bg-white text-gray-800 border border-gray-100 rounded-bl-xs'
                            }`}
                          >
                            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                            <div className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${isMine ? 'text-rose-200' : 'text-gray-400'}`}>
                              <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isMine && (
                                msg.isRead ? <CheckCheck size={12} className="text-emerald-300" /> : <Clock size={10} />
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Bottom Chat Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 sm:p-4 border-t border-gray-100 bg-white flex items-center gap-2 sm:gap-3 shrink-0"
                >
                  <input
                    ref={messageInputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value)
                      handleTyping(e.target.value.length > 0)
                    }}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029] focus:bg-white transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="w-10 h-10 rounded-full bg-[#842029] text-white flex items-center justify-center shrink-0 hover:bg-[#6b1b27] disabled:opacity-40 transition-all shadow-xs cursor-pointer"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
