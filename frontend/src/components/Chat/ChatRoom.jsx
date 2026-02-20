import { useState, useEffect, useCallback } from 'react';
import { Hash, Users, Loader2, Menu, X } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { getMessages, uploadFile } from '../../services/api';
import Header from '../Layout/Header';
import RoomList from './RoomList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatRoom = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch messages when room changes
  const fetchMessages = useCallback(async (roomId) => {
    setLoadingMessages(true);
    try {
      const res = await getMessages(roomId);
      setMessages(res.data.data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Handle room selection
  const handleSelectRoom = useCallback(
    (room) => {
      if (activeRoom && socket) {
        socket.emit('leave-room', activeRoom._id);
      }
      setActiveRoom(room);
      setMessages([]);
      if (room && socket) {
        socket.emit('join-room', room._id);
        fetchMessages(room._id);
      }
      setSidebarOpen(false);
    },
    [activeRoom, socket, fetchMessages]
  );

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };
    const handleUserTyping = (data) => {
      setTypingUsers((prev) => {
        if (prev.find((u) => u.userId === data.userId)) return prev;
        return [...prev, data];
      });
    };
    const handleUserStopTyping = (data) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    };

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stop-typing', handleUserStopTyping);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stop-typing', handleUserStopTyping);
    };
  }, [socket]);

  // Send message
  const handleSend = useCallback(
    (message) => {
      if (!activeRoom || !socket) return;
      socket.emit('send-message', { roomId: activeRoom._id, message });
      socket.emit('stop-typing', activeRoom._id);
    },
    [activeRoom, socket]
  );

  // Upload file
  const handleFileUpload = useCallback(
    async (file) => {
      if (!activeRoom) return;
      const formData = new FormData();
      formData.append('file', file);
      await uploadFile(activeRoom._id, formData);
    },
    [activeRoom]
  );

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 flex-shrink-0 h-12 sm:h-14">
        <Header />
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-14 left-2 z-50 bg-white shadow-md p-1.5 rounded-lg text-gray-600 border border-gray-200"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/20 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 fixed md:relative z-40 h-[calc(100vh-3rem)] sm:h-[calc(100vh-3.5rem)] md:h-auto w-64 lg:w-72 bg-white border-r border-gray-200 flex-shrink-0 transition-transform duration-200 ease-in-out`}
        >
          <RoomList activeRoom={activeRoom} onSelectRoom={handleSelectRoom} />
        </div>

        {/* Chat Area */}
        <div className="flex flex-col flex-1 bg-gray-50 min-w-0">
          {activeRoom ? (
            <>
              {/* Room Header */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-gray-200 flex-shrink-0">
                <Hash className="w-4 h-4 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activeRoom.name}
                  </p>
                  {activeRoom.description && (
                    <p className="text-xs text-gray-500 truncate">
                      {activeRoom.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-gray-400 text-xs flex-shrink-0">
                  <Users className="w-3.5 h-3.5" />
                  <span>{activeRoom.participants?.length || 0}</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                  </div>
                ) : (
                  <MessageList messages={messages} />
                )}
              </div>

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="px-4 py-1 text-xs text-gray-400">
                  {typingUsers.map((u) => u.username).join(', ')}{' '}
                  {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </div>
              )}

              {/* Input */}
              <div className="bg-white px-4 py-3 border-t border-gray-200 flex-shrink-0">
                <MessageInput onSend={handleSend} onFileUpload={handleFileUpload} disabled={false} />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Hash className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-base font-medium text-gray-500">Select a room</p>
              <p className="text-xs text-gray-400 mt-1">
                Choose from the sidebar or create a new one
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
