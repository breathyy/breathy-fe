"use client";

import React, { useState } from "react";
import Image from "next/image";
import logo from "../../assets/logo/logo.png";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  status: 'active' | 'completed';
  preview: string;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: "1",
      title: "Dalam Investigasi",
      timestamp: new Date("2025-09-25"),
      status: "active",
      preview: "Gejala sesak napas..."
    },
    {
      id: "2", 
      title: "Kasus Ringan",
      timestamp: new Date("2025-09-19"),
      status: "completed",
      preview: "Batuk ringan..."
    },
    {
      id: "3",
      title: "Kasus Ringan", 
      timestamp: new Date("2025-08-15"),
      status: "completed",
      preview: "Hidung tersumbat..."
    }
  ]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText,
        sender: 'user',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newMessage]);
      
      // Jika ini adalah pesan pertama dalam chat, buat chat session baru
      if (messages.length === 0 && !currentChatId) {
        const newChatSession: ChatSession = {
          id: Date.now().toString(),
          title: "Dalam Investigasi",
          timestamp: new Date(),
          status: "active",
          preview: inputText.substring(0, 30) + (inputText.length > 30 ? "..." : "")
        };
        
        setChatSessions(prev => [newChatSession, ...prev]);
        setCurrentChatId(newChatSession.id);
      }
      
      setInputText("");

      // Simulate bot response
      setTimeout(() => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: "Terima kasih atas pertanyaanmu. Saya akan membantu menganalisis kondisi kesehatan pernapasanmu. Bisakah kamu ceritakan lebih detail tentang gejala yang kamu rasakan?",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInputText("");
    setCurrentChatId(null);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-[calc(110vh-80px)]">
        {/* Sidebar */}
        <aside className={`${isSidebarOpen ? 'w-80' : 'w-0'} bg-gray-100 flex flex-col transition-all duration-300 ease-in-out overflow-hidden`}>
          {/* Header with Back and New Chat buttons */}
          <div className="p-4 border-b border-gray-200 min-w-80">
            {/* Back button */}
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Kembali</span>
              </button>
              
              {/* Close sidebar button */}
              <button 
                onClick={toggleSidebar}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Chat title and menu */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                <span className="inline-block w-4 h-4 bg-pink-500 rounded mr-2"></span>
                Chat baru
              </h2>
              <button className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* New Chat button */}
            <button 
              onClick={handleNewChat}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Chat Baru
            </button>
          </div>

          {/* Chat history */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Riwayat Investigasi</h3>
              <div className="space-y-1">
                {chatSessions.map((chat) => (
                  <div 
                    key={chat.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      chat.status === 'active' && chat.id === currentChatId
                        ? 'bg-pink-50 border-l-4 border-pink-500' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      if (chat.id !== currentChatId) {
                        setCurrentChatId(chat.id);
                        // Di sini bisa load messages untuk chat yang dipilih
                        setMessages([]); // Reset untuk sementara
                      }
                    }}
                  >
                    <div className={`text-sm ${
                      chat.status === 'active' && chat.id === currentChatId
                        ? 'font-medium text-gray-900' 
                        : 'text-gray-700'
                    }`}>
                      {chat.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {chat.timestamp.toLocaleDateString('id-ID', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </div>
                    {chat.preview && (
                      <div className="text-xs text-gray-400 mt-1 truncate">
                        {chat.preview}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main chat area */}
        <main className="flex-1 flex flex-col bg-white relative">
          {/* Toggle sidebar button (when sidebar is closed) */}
          {!isSidebarOpen && (
            <button 
              onClick={toggleSidebar}
              className="absolute top-4 left-4 z-10 bg-pink-500 hover:bg-pink-600 text-white rounded-lg p-2 shadow-lg transition-colors"
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          {/* Messages area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {messages.length === 0 ? (
              // Welcome message when no chat
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent mb-2">
                    Halo, Budi Santoso
                  </h1>
                  <p className="text-gray-600 flex items-center justify-center gap-2">
                    Bagaimana <Image src={logo} alt="Breathy Logo" width={80} height={20} className="inline-block" /> bisa membantumu hari ini?
                  </p>
                </div>
              </div>
            ) : (
              // Chat messages
              <div className="max-w-4xl mx-auto space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.sender === 'user' 
                        ? 'bg-pink-500 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-pink-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString('id-ID', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="p-6 bg-white border-t border-gray-100">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4">
                <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </button>
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tulis pertanyaanmu disini..." 
                  className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className="bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white rounded-full p-2 transition-colors"
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}