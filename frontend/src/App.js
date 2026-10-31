import React, { useState, useRef, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import ReactMarkdown from "react-markdown";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import Privacy from "./Privacy";
import { API_URL } from "./config";


function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const chatEndRef = useRef(null);

  const name = localStorage.getItem("name") || "Friend";
  const token = localStorage.getItem("token");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sessions`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setSessions(data);

      // If no sessions show welcome message
      if (!data || data.length === 0) {
        showWelcome();
      }
    } catch (err) {
      showWelcome();
    }
  };

  const showWelcome = () => {
    const fullText = `Hello ${name}! I'm Sera, your personal wellness companion 🌿 I'm here to listen and support you. How are you feeling today?`;
    let index = 0;
    let current = "";

    setIsTyping(true);
    const startTimer = setTimeout(() => {
      setIsTyping(false);
      setMessages([{ sender: "bot", text: "" }]);

      const typingInterval = setInterval(() => {
        current += fullText[index];
        index++;
        setMessages([{ sender: "bot", text: current }]);
        if (index >= fullText.length) clearInterval(typingInterval);
      }, 7);
    }, 1000);

    return () => clearTimeout(startTimer);
  };

  // Load a specific session when clicked
  const loadSession = async (sessionId) => {
    try {
      const res = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();

      // Convert message pairs to flat messages array
      const loadedMessages = [];
      data.messages.forEach(pair => {
        loadedMessages.push({ sender: "user", text: pair.userMessage });
        loadedMessages.push({ sender: "bot", text: pair.botReply });
      });

      setMessages(loadedMessages);
      setActiveSessionId(sessionId);
    } catch (err) {
      console.error("Error loading session", err);
    }
  };

  // Start new chat
  const newChat = () => {
    setMessages([]);
    setActiveSessionId(null);
    showWelcome();
  };

  // Delete one session
  const deleteSession = async (e, sessionId) => {
    e.stopPropagation();
    await fetch(`${API_URL}/api/sessions/${sessionId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    setSessions(prev => prev.filter(s => s.id !== sessionId));

    if (activeSessionId === sessionId) {
      newChat();
    }
  };

  // Delete all sessions
  const deleteAllSessions = async () => {
    await fetch(`${API_URL}/api/sessions`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    setSessions([]);
    newChat();
  };

  const sendMessage = async () => {
    if (message.trim() === "") return;

    const userMsg = message;
    setMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setMessage("");
    setIsTyping(true);

    try {
      const url = activeSessionId
        ? `${API_URL}/api/chat?sessionId=${activeSessionId}`
        : `${API_URL}/api/chat`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          "Authorization": `Bearer ${token}`
        },
        body: userMsg
      });

      const rawData = await response.text();

      // Split reply and sessionId
      const parts = rawData.split("|||");
      const reply = parts[0];
      const sessionId = parts[1];

      setIsTyping(false);
      setMessages(prev => [...prev, { sender: "bot", text: reply }]);

      // Update active session
      if (sessionId) {
        setActiveSessionId(sessionId);
        loadSessions();
      }

    } catch (error) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        sender: "bot",
        text: "I'm having trouble connecting right now. Please try again in a moment. 💙"
      }]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const moodOptions = ["😌 Calm", "😔 Sad", "😰 Anxious", "😠 Angry", "😊 Happy"];

  const sendMood = (mood) => {
  setMessage(mood);
  setTimeout(() => {
    document.querySelector('.chat-input').focus();
  }, 50);

  // Extract clean mood word and log it
  const moodMap = {
    "Calm": "Calm",
    "Sad": "Sad",
    "Anxious": "Anxious",
    "Angry": "Angry",
    "Happy": "Happy"
  };

  const matchedMood = Object.keys(moodMap).find(m => mood.includes(m));
  if (matchedMood) {
    fetch(`${API_URL}/api/mood/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ mood: matchedMood })
    }).catch(err => console.error("Mood log failed:", err));
  }
};
const sendQuickSupport = (message, mood) => {
  setMessage(message);
  setTimeout(() => {
    document.querySelector('.chat-input').focus();
  }, 50);

  fetch(`${API_URL}/api/mood/log`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ mood: mood })
  }).catch(err => console.error("Mood log failed:", err));
};

  // Format date for sidebar
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="app-wrapper">

      {/* Sidebar */}
      <div className="sidebar">

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-circle-leaf">
            <svg viewBox="0 0 100 120" width="65" height="75">
              <path
                d="M50 5 C55 5, 63 10, 70 18 C76 25, 80 30, 82 38 C85 48, 83 57, 79 64 C75 71, 68 77, 62 82 C57 86, 53 89, 50 90 C47 89, 43 86, 38 82 C32 77, 25 71, 21 64 C17 57, 15 48, 18 38 C20 30, 24 25, 30 18 C37 10, 45 5, 50 5 Z"
                fill="url(#leafGrad)" stroke="#3a9a2a" strokeWidth="1"
              />
              <path d="M30 18 C27 22, 24 26, 22 32 C20 36, 19 40, 18 38" fill="#5dc93a" stroke="none" opacity="0.4"/>
              <path d="M21 52 C19 55, 17 58, 17 57 C16 54, 16 51, 18 48" fill="#5dc93a" stroke="none" opacity="0.3"/>
              <path d="M35 12 C30 20, 26 32, 27 48 C28 55, 30 60, 33 65 C28 58, 22 48, 22 38 C22 28, 27 18, 35 12 Z" fill="#7de84a" opacity="0.5"/>
              <path d="M50 8 C50 25, 50 55, 50 88" fill="none" stroke="#2d7a1e" strokeWidth="2" strokeLinecap="round"/>
              <path d="M49 22 C44 25, 37 27, 28 29" fill="none" stroke="#2d7a1e" strokeWidth="1.1" strokeLinecap="round"/>
              <path d="M49 32 C43 35, 36 37, 26 39" fill="none" stroke="#2d7a1e" strokeWidth="1.1" strokeLinecap="round"/>
              <path d="M49 42 C43 45, 36 47, 25 48" fill="none" stroke="#2d7a1e" strokeWidth="1.1" strokeLinecap="round"/>
              <path d="M49 52 C44 55, 37 57, 27 58" fill="none" stroke="#2d7a1e" strokeWidth="1" strokeLinecap="round"/>
              <path d="M49 62 C45 65, 39 67, 31 68" fill="none" stroke="#2d7a1e" strokeWidth="1" strokeLinecap="round"/>
              <path d="M49 72 C46 74, 41 76, 35 77" fill="none" stroke="#2d7a1e" strokeWidth="0.9" strokeLinecap="round"/>
              <path d="M51 22 C56 25, 63 27, 72 29" fill="none" stroke="#2d7a1e" strokeWidth="1.1" strokeLinecap="round"/>
              <path d="M51 32 C57 35, 64 37, 74 39" fill="none" stroke="#2d7a1e" strokeWidth="1.1" strokeLinecap="round"/>
              <path d="M51 42 C57 45, 64 47, 75 48" fill="none" stroke="#2d7a1e" strokeWidth="1.1" strokeLinecap="round"/>
              <path d="M51 52 C56 55, 63 57, 73 58" fill="none" stroke="#2d7a1e" strokeWidth="1" strokeLinecap="round"/>
              <path d="M51 62 C55 65, 61 67, 69 68" fill="none" stroke="#2d7a1e" strokeWidth="1" strokeLinecap="round"/>
              <path d="M51 72 C54 74, 59 76, 65 77" fill="none" stroke="#2d7a1e" strokeWidth="0.9" strokeLinecap="round"/>
              <path d="M40 28 C37 31, 34 34, 31 37" fill="none" stroke="#2d7a1e" strokeWidth="0.6" strokeLinecap="round" opacity="0.7"/>
              <path d="M38 38 C35 41, 32 44, 29 46" fill="none" stroke="#2d7a1e" strokeWidth="0.6" strokeLinecap="round" opacity="0.7"/>
              <path d="M37 48 C34 51, 31 53, 28 55" fill="none" stroke="#2d7a1e" strokeWidth="0.6" strokeLinecap="round" opacity="0.7"/>
              <path d="M60 28 C63 31, 66 34, 68 37" fill="none" stroke="#2d7a1e" strokeWidth="0.6" strokeLinecap="round" opacity="0.7"/>
              <path d="M62 38 C65 41, 67 44, 70 46" fill="none" stroke="#2d7a1e" strokeWidth="0.6" strokeLinecap="round" opacity="0.7"/>
              <path d="M62 48 C65 51, 67 53, 70 55" fill="none" stroke="#2d7a1e" strokeWidth="0.6" strokeLinecap="round" opacity="0.7"/>
              <path d="M50 88 C50 92, 48 97, 45 103 C43 107, 41 110, 40 113" fill="none" stroke="#2d7a1e" strokeWidth="2.5" strokeLinecap="round"/>
              <defs>
                <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8fe840"/>
                  <stop offset="40%" stopColor="#5dc93a"/>
                  <stop offset="100%" stopColor="#3a9a2a"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <span className="logo-text">Sera</span>
            <p className="logo-tagline">Your wellness companion</p>
          </div>
        </div>

        {/* New Chat Button */}
        <button className="new-chat-btn" onClick={newChat}>
          + New Chat
        </button>

        {/* Past Conversations */}
        {sessions.length > 0 && (
          <div className="sidebar-section">
            <div className="sessions-header">
              <p className="sidebar-label">Past Conversations</p>
              <button className="clear-all-btn" onClick={deleteAllSessions}>
                Clear all
              </button>
            </div>
            <div className="sessions-list">
              {sessions.map(session => (
                <div
                  key={session.id}
                  className={`session-item ${activeSessionId === session.id ? "active" : ""}`}
                  onClick={() => loadSession(session.id)}
                >
                  <div className="session-info">
                    <p className="session-title">{session.title}</p>
                    <p className="session-date">{formatDate(session.updatedAt)}</p>
                  </div>
                  <button
                    className="delete-session-btn"
                    onClick={(e) => deleteSession(e, session.id)}
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mood Buttons */}
        <div className="sidebar-section">
          <p className="sidebar-label">How are you feeling?</p>
          <div className="mood-grid">
            {moodOptions.map((mood, i) => (
              <button key={i} className="mood-btn" onClick={() => sendMood(`I'm feeling ${mood}`)}>
                {mood}
              </button>
            ))}
          </div>
        </div>

      {/* Quick Support */}
<div className="sidebar-section">
  <p className="sidebar-label">Quick support</p>
  <button className="quick-btn" onClick={() => sendQuickSupport("I need help with breathing exercises", "Anxious")}>
    🌬️ Breathing exercise
  </button>
  <button className="quick-btn" onClick={() => sendQuickSupport("I need some motivation right now", "Sad")}>
    ✨ Get motivated
  </button>
  <button className="quick-btn" onClick={() => sendQuickSupport("I'm having trouble sleeping", "Anxious")}>
    🌙 Sleep tips
  </button>
  <button className="quick-btn" onClick={() => sendQuickSupport("I need help managing stress", "Stressed")}>
    🧘 Manage stress
  </button>
</div>

        {/* Crisis Box */}
        <div className="crisis-box">
          <p className="crisis-title">🆘 Need urgent help?</p>
          <p className="crisis-text">Tele-MANAS (Govt) — 24/7 Free</p>
          <p className="crisis-number">14416</p>
          <p className="crisis-text" style={{marginTop: '10px'}}>iCALL (TISS) — Mon-Sat 10am-8pm</p>
          <p className="crisis-number">9152987821</p>
        </div>

        {/* Logout */}
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>

      </div>

      {/* Main Chat */}
      <div className="chat-wrapper">

        {/* Header */}
        <div className="chat-header">
          <div className="header-left">
            <div className="bot-avatar">S</div>
            <div>
              <p className="bot-name">Sera</p>
              <p className="bot-status">
                <span className="status-dot"></span> Always here for you
              </p>
            </div>
          </div>
          <div className="header-right">
            <span className="header-tag">Mental Health Support</span>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message-row ${msg.sender}`}>
              {msg.sender === "bot" && (
                <div className="avatar-small">S</div>
              )}
              <div className={`bubble ${msg.sender}`}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="message-row bot">
              <div className="avatar-small">S</div>
              <div className="bubble bot typing-bubble">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share what's on your mind..."
            className="chat-input"
          />
          <button
            onClick={sendMessage}
            className={`send-btn ${message.trim() ? "active" : ""}`}
            disabled={!message.trim()}
          >
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <p className="disclaimer">
          Sera is an AI companion, not a substitute for professional mental health care.
        </p>
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = React.useState(localStorage.getItem("token"));

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={token ? <Chat /> : <Navigate to="/login" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
