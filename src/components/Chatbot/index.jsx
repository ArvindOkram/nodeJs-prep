import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { topics } from '../../data/topics';
import styles from './Chatbot.module.css';

/* ── Helpers ─────────────────────────────────────────────── */

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function findRelevantTopics(query) {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (words.length === 0) return [];

  const scored = topics
    .map((topic) => {
      const text = (topic.title + ' ' + stripHtml(topic.content)).toLowerCase();
      const score = words.reduce((s, w) => s + (text.includes(w) ? 1 : 0), 0);
      return { topic, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 3);
}

function buildBotReply(query) {
  const lower = query.trim().toLowerCase();

  // Greetings
  if (/^(hi|hello|hey|howdy|sup)[\s!?.]*$/i.test(lower)) {
    return {
      text: "Hey! I'm your interview prep assistant. Ask me about any topic -- Node.js, TypeScript, DSA, System Design, and more!",
      links: [],
    };
  }

  // Help
  if (/^(help|commands|what can you do)[\s!?.]*$/i.test(lower)) {
    return {
      text: "You can ask me about any interview topic. Try: 'explain event loop', 'what is SOLID', 'binary search pattern', 'caching strategies'",
      links: [],
    };
  }

  // Topic search
  const results = findRelevantTopics(query);

  if (results.length === 0) {
    return {
      text: "I couldn't find anything related. Try searching for a specific topic like 'event loop', 'SOLID principles', or 'binary search'.",
      links: [],
    };
  }

  const parts = [`Here's what I found about "${query}":\n`];
  const links = [];

  results.forEach(({ topic }) => {
    const excerpt = stripHtml(topic.content).slice(0, 150);
    parts.push(`**${topic.title}** -- ${excerpt}...`);
    links.push({ label: `View: ${topic.title}`, to: `/topic/${topic.id}` });
  });

  return { text: parts.join('\n\n'), links };
}

/* ── SVG Icons ───────────────────────────────────────────── */

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function BotIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

/* ── Quick Action Suggestions ────────────────────────────── */

const SUGGESTIONS = ['Event Loop', 'SOLID Principles', 'Binary Search', 'Caching Strategies'];

const WELCOME_TEXT =
  "Hey! I'm your interview prep assistant. Ask me about any topic -- Node.js, TypeScript, DSA, System Design, AWS, and more!";

/* ── Component ───────────────────────────────────────────── */

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsClosing(false);
    if (!hasOpened) {
      setHasOpened(true);
      setMessages([{ role: 'bot', text: WELCOME_TEXT, links: [], showPills: true }]);
    }
  }, [hasOpened]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  }, []);

  const sendMessage = useCallback(
    (text) => {
      const trimmed = (text ?? input).trim();
      if (!trimmed) return;

      setInput('');
      setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
      setIsTyping(true);

      // Simulate a short thinking delay
      const delay = 400 + Math.random() * 400;
      setTimeout(() => {
        const reply = buildBotReply(trimmed);
        setMessages((prev) => [...prev, { role: 'bot', ...reply }]);
        setIsTyping(false);
      }, delay);
    },
    [input],
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLinkClick = (to) => {
    navigate(to);
    handleClose();
  };

  /* ── Render helpers ── */

  function renderMessage(msg, idx) {
    const isUser = msg.role === 'user';
    return (
      <div key={idx} className={`${styles.msgRow} ${isUser ? styles.msgRowUser : styles.msgRowBot}`}>
        <div className={`${styles.msgBubble} ${isUser ? styles.msgUser : styles.msgBot}`}>
          {msg.text.split('\n').map((line, i) => (
            <span key={i}>
              {renderFormattedLine(line)}
              {i < msg.text.split('\n').length - 1 && <br />}
            </span>
          ))}
          {msg.links && msg.links.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {msg.links.map((link, li) => (
                <div key={li} style={{ marginTop: 4 }}>
                  <a
                    href={link.to}
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick(link.to);
                    }}
                  >
                    {link.label}
                  </a>
                </div>
              ))}
            </div>
          )}
          {msg.showPills && (
            <div className={styles.quickActions}>
              {SUGGESTIONS.map((s) => (
                <button key={s} className={styles.pill} onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /** Render **bold** segments in a line */
  function renderFormattedLine(line) {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  }

  /* ── Markup ── */

  // Closed state: floating bubble
  if (!isOpen) {
    return (
      <button
        className={styles.bubble}
        onClick={handleOpen}
        aria-label="Open chat assistant"
      >
        <span className={styles.pulseRing} />
        <ChatIcon />
      </button>
    );
  }

  // Open state: chat window
  return (
    <div
      className={`${styles.window} ${isClosing ? styles.windowClosing : ''}`}
      role="dialog"
      aria-label="Interview prep chat assistant"
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <BotIcon />
        </div>
        <div className={styles.headerText}>
          <div className={styles.headerTitle}>Interview Assistant</div>
          <div className={styles.headerSub}>Ask me about any topic</div>
        </div>
        <button className={styles.closeBtn} onClick={handleClose} aria-label="Close chat">
          <CloseIcon />
        </button>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map(renderMessage)}

        {isTyping && (
          <div className={`${styles.msgRow} ${styles.msgRowBot}`}>
            <div className={styles.typing}>
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={styles.inputArea}>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="Ask about any topic..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Type your message"
        />
        <button
          className={styles.sendBtn}
          onClick={() => sendMessage()}
          disabled={!input.trim()}
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
