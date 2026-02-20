import { useState, useRef } from 'react';
import { Send, Paperclip, X, FileText } from 'lucide-react';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const MessageInput = ({ onSend, onFileUpload, disabled }) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled) return;

    if (selectedFile) {
      setUploading(true);
      try {
        await onFileUpload(selectedFile);
        clearFile();
      } catch (err) {
        console.error('Upload failed:', err);
      } finally {
        setUploading(false);
      }
      return;
    }

    if (message.trim() === '') return;
    onSend(message.trim());
    setMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !selectedFile) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert('File too large. Maximum size is 50 MB.');
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full">
      {/* File preview bar */}
      {selectedFile && (
        <div className="flex items-center gap-2.5 mb-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
          {filePreview ? (
            <img src={filePreview} alt="preview" className="w-10 h-10 object-cover rounded" />
          ) : (
            <FileText className="w-8 h-8 text-gray-400 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 text-sm truncate">{selectedFile.name}</p>
            <p className="text-gray-400 text-xs">{formatSize(selectedFile.size)}</p>
          </div>
          <button onClick={clearFile} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar,.mp3,.mp4,.wav"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
          title="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <input
          type="text"
          placeholder={
            disabled
              ? 'Select a room to chat...'
              : selectedFile
              ? 'File ready — click Send'
              : 'Type a message...'
          }
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || !!selectedFile || uploading}
          className="flex-1 px-3.5 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition disabled:opacity-50 disabled:bg-gray-50"
          maxLength={2000}
        />

        <button
          type="submit"
          disabled={disabled || uploading || (!message.trim() && !selectedFile)}
          className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
          title={selectedFile ? 'Upload file' : 'Send message'}
        >
          {uploading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
