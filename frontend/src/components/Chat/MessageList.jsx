import { useEffect, useRef } from 'react';
import { FileText, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../services/api';

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const FileContent = ({ file, messageType, isOwn }) => {
  const fileUrl = `${API_BASE.replace('/api', '')}/uploads/${file.filename}`;

  if (messageType === 'image') {
    return (
      <a href={fileUrl} target="_blank" rel="noopener noreferrer">
        <img
          src={fileUrl}
          alt={file.originalName}
          className="max-w-full max-h-52 rounded-lg mt-1 cursor-pointer hover:opacity-90 transition"
          loading="lazy"
        />
      </a>
    );
  }

  return (
    <a
      href={fileUrl}
      download={file.originalName}
      className={`flex items-center gap-2.5 mt-1 p-2.5 rounded-lg transition ${
        isOwn ? 'bg-gray-700/30 hover:bg-gray-700/50' : 'bg-gray-100 hover:bg-gray-200'
      }`}
    >
      <FileText className={`w-6 h-6 flex-shrink-0 ${isOwn ? 'text-gray-300' : 'text-gray-500'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${isOwn ? 'text-white' : 'text-gray-800'}`}>{file.originalName}</p>
        <p className={`text-[10px] ${isOwn ? 'text-gray-300' : 'text-gray-400'}`}>{formatSize(file.size)}</p>
      </div>
      <Download className={`w-4 h-4 ${isOwn ? 'text-gray-300' : 'text-gray-400'}`} />
    </a>
  );
};

const MessageList = ({ messages }) => {
  const { user } = useAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p className="text-sm">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {messages.map((msg, idx) => {
        const isOwn =
          msg.senderId === user?._id ||
          msg.senderId?._id === user?._id;

        const hasFile =
          (msg.messageType === 'file' || msg.messageType === 'image') && msg.file;

        return (
          <div
            key={msg._id || idx}
            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] px-3 py-2 rounded-xl ${
                isOwn
                  ? 'bg-gray-900 text-white rounded-br-sm'
                  : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
              }`}
            >
              {!isOwn && (
                <p className="text-[11px] font-semibold text-gray-500 mb-0.5">
                  {msg.senderNick}
                </p>
              )}

              {hasFile && <FileContent file={msg.file} messageType={msg.messageType} isOwn={isOwn} />}

              {msg.message && (
                <p className="text-sm break-words leading-relaxed">{msg.message}</p>
              )}

              <p className={`text-[10px] mt-1 text-right ${isOwn ? 'text-gray-400' : 'text-gray-400'}`}>
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
