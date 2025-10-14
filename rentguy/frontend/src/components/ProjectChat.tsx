import React, { useState, useEffect, useRef } from 'react';
import { useRealtime } from '../hooks/useRealtime';

interface Message {
  id: number;
  project_id: number;
  user_id: number;
  content: string;
  timestamp: string;
}

interface ProjectChatProps {
  projectId: number;
  token: string;
  currentUserId: number;
}

export const ProjectChat: React.FC<ProjectChatProps> = ({ projectId, token, currentUserId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isConnected, socket } = useRealtime(token);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join the project room
    socket.emit('join_project', { project_id: projectId });

    // Listen for new messages
    socket.on('new_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Fetch message history from REST API
    fetch(`/api/v1/projects/${projectId}/chat`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setMessages(data.reverse()))
      .catch((err) => console.error('Failed to fetch chat history:', err));

    return () => {
      socket.off('new_message');
      socket.emit('leave_project', { project_id: projectId });
    };
  }, [socket, isConnected, projectId, token]);

  useEffect(() => {
    // Auto-scroll to the latest message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !socket || !isConnected) return;

    socket.emit('send_message', {
      project_id: projectId,
      content: inputValue,
    });

    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold">Project Chat</h2>
        <p className="text-sm text-gray-400">
          {isConnected ? (
            <span className="text-green-400">● Connected</span>
          ) : (
            <span className="text-red-400">● Disconnected</span>
          )}
        </p>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.user_id === currentUserId ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.user_id === currentUserId
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-200'
              }`}
            >
              <p className="text-sm font-semibold mb-1">User {message.user_id}</p>
              <p className="text-sm">{message.content}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isConnected}
          />
          <button
            onClick={handleSendMessage}
            disabled={!isConnected || !inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

