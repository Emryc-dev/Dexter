import { useEffect, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import {
  BookOpen,
  Bookmark,
  Loader2,
  Menu,
  Plus,
  Search,
  SendHorizontal,
  Settings,
  SquarePen,
  TriangleAlert,
  User,
  Wrench,
  X,
} from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

const isHttpUrl = (value) => {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

const navItems = [
  { label: "Nouvelle recherche", icon: SquarePen },
  { label: "Rechercher", icon: Search },
  { label: "Recherches enregistrées", icon: Bookmark },
];

function Sidebar({ onNewChat }) {
  return (
    <aside className="sidebar" aria-label="Navigation principale">
      <button className="brand-mark" onClick={onNewChat} aria-label="Accueil Dexter">
        <img src="/dexter.png" alt="" />
      </button>
      <nav className="sidebar-nav">
        {navItems.map(({ label, icon: Icon }, index) => (
          <button
            key={label}
            className="icon-button"
            type="button"
            aria-label={label}
            title={label}
            onClick={index === 0 ? onNewChat : undefined}
          >
            <Icon size={21} strokeWidth={1.8} />
          </button>
        ))}
      </nav>
      <button className="icon-button sidebar-settings" type="button" aria-label="Paramètres" title="Paramètres">
        <Settings size={20} strokeWidth={1.8} />
      </button>
      <div className="avatar" aria-label="Profil utilisateur">AC</div>
    </aside>
  );
}

function ConnectionStatus({ status }) {
  const labels = { online: "En ligne", offline: "Hors ligne", checking: "Non testé" };
  return (
    <div className="connection-status" title={`Service : ${labels[status]}`}>
      <span className={`status-dot status-${status}`} />
      <span>{labels[status]}</span>
    </div>
  );
}

function SourcesBlock({ sources }) {
  if (!sources) return null;
  const list = Array.isArray(sources) ? sources : [sources];

  return (
    <div className="sources-block">
      <div className="meta-label"><BookOpen size={14} /> Sources</div>
      <ul>
        {list.map((source, index) => (
          <li key={`${source}-${index}`}>
            {isHttpUrl(source) ? (
              <a href={source} target="_blank" rel="noreferrer">{source}</a>
            ) : source}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ToolsBlock({ tools }) {
  if (!tools?.length) return null;
  return (
    <div className="tools-list">
      {tools.map((tool) => (
        <span key={tool}><Wrench size={12} />{tool}</span>
      ))}
    </div>
  );
}

function Message({ message }) {
  const isUser = message.role === "user";
  return (
    <article className={`message ${isUser ? "message-user" : "message-assistant"}`}>
      <div className="message-avatar" aria-hidden="true">
        {isUser ? <User size={17} /> : <img src="/dexter.png" alt="" />}
      </div>
      <div className="message-content">
        {message.topic && <p className="message-topic">{message.topic}</p>}
        {isUser ? <p>{message.text}</p> : (
          <div className="markdown"><ReactMarkdown>{message.text}</ReactMarkdown></div>
        )}
        <ToolsBlock tools={message.tools_used} />
        <SourcesBlock sources={message.sources} />
      </div>
    </article>
  );
}

function TypingIndicator() {
  return (
    <div className="message message-assistant" aria-label="Dexter réfléchit">
      <div className="message-avatar"><img src="/dexter.png" alt="" /></div>
      <div className="thinking"><span /><span /><span /></div>
    </div>
  );
}

function Composer({ input, setInput, loading, onSend, compact = false }) {
  const textareaRef = useRef(null);

  const handleChange = (event) => {
    setInput(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 144)}px`;
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div className={`composer ${compact ? "composer-compact" : ""}`}>
      <button className="composer-action" type="button" aria-label="Ajouter une pièce jointe" title="Ajouter">
        <Plus size={25} strokeWidth={1.7} />
      </button>
      <textarea
        ref={textareaRef}
        rows={1}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Demandez ce que vous voulez"
        aria-label="Votre question pour Dexter"
      />
      <button
        className="send-button"
        type="button"
        onClick={onSend}
        disabled={loading || !input.trim()}
        aria-label="Envoyer"
      >
        {loading ? <Loader2 size={20} className="spin" /> : <SendHorizontal size={20} />}
      </button>
    </div>
  );
}

function ErrorBanner({ message, onDismiss }) {
  return (
    <div className="error-banner" role="alert">
      <TriangleAlert size={17} />
      <span>{message}</span>
      <button onClick={onDismiss} aria-label="Fermer l’erreur"><X size={16} /></button>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("checking");
  const bottomRef = useRef(null);

  const hasConversation = messages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const startNewChat = () => {
    setMessages([]);
    setInput("");
    setError(null);
  };

  const sendMessage = async () => {
    const query = input.trim();
    if (!query || loading) return;

    setMessages((current) => [...current, { role: "user", text: query }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/research`, { query }, { timeout: 130000 });
      const data = response.data;
      setConnectionStatus("online");
      setMessages((current) => [...current, {
        role: "assistant",
        text: data.summary || data.raw || "Je n’ai reçu aucune réponse.",
        topic: data.topic,
        sources: data.sources,
        tools_used: data.tools_used,
      }]);
    } catch {
      setConnectionStatus("offline");
      setError("Dexter ne parvient pas à joindre le service. Vérifiez que le backend est démarré.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar onNewChat={startNewChat} />
      <main className={`workspace ${hasConversation ? "workspace-chat" : "workspace-empty"}`}>
        <header className="mobile-header">
          <button className="brand-mark" onClick={startNewChat} aria-label="Accueil Dexter">
            <img src="/dexter.png" alt="" />
          </button>
          <span>Dexter</span>
          <button className="icon-button" aria-label="Menu"><Menu size={21} /></button>
        </header>
        <ConnectionStatus status={connectionStatus} />

        {!hasConversation ? (
          <section className="welcome" aria-labelledby="welcome-title">
            <p className="eyebrow">DEXTER</p>
            <h1 id="welcome-title">Qu’allons-nous explorer aujourd’hui&nbsp;?</h1>
            <Composer input={input} setInput={setInput} loading={loading} onSend={sendMessage} />
            <p className="composer-hint">Entrée pour envoyer, Maj + Entrée pour une nouvelle ligne</p>
          </section>
        ) : (
          <>
            <section className="conversation" aria-live="polite">
              {messages.map((message, index) => <Message key={index} message={message} />)}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </section>
            <footer className="chat-footer">
              {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
              <Composer compact input={input} setInput={setInput} loading={loading} onSend={sendMessage} />
              <p className="composer-hint">Dexter peut faire des erreurs. Vérifiez les informations importantes.</p>
            </footer>
          </>
        )}

        {!hasConversation && error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      </main>
    </div>
  );
}
