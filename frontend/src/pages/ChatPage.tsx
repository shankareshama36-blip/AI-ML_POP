import { useState, useEffect, useRef, type FormEvent } from "react";
import { chatWithExplorer, type User, type ChatMessageInput } from "../api";
import {
  AILogo,
  IconLogout,
  IconMic,
  IconSend,
  IconUser,
} from "../components/Icons";
import { useToast, formatUserFriendlyError } from "../components/Toast";

interface ChatPageProps {
  user: User;
  onBack: () => void;
  onLogout: () => void;
}

interface SavedChatContext {
  title?: string;
  recommendedChoice?: string;
  expectedCost?: string;
  constraints?: string;
  options?: string[];
  analysis?: string;
}

// Global declaration for browser native SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

const SUGGESTED_PROMPTS = [
  "Why was this chosen?",
  "Compare top 2 options",
  "What if budget was higher?",
];

function loadSavedChatContext(): SavedChatContext | null {
  try {
    const raw = localStorage.getItem("praxis-chat-context");
    if (raw) {
      return JSON.parse(raw) as SavedChatContext;
    }
  } catch {
    // Ignore storage or parse errors
  }
  return null;
}

export function ChatPage({ user, onBack, onLogout }: ChatPageProps) {
  const { showToast } = useToast();
  const [decisionContext] = useState<SavedChatContext | null>(() => loadSavedChatContext());
  const [messages, setMessages] = useState<ChatMessageInput[]>(() => {
    const ctx = loadSavedChatContext();
    const greeting = ctx?.title
      ? `Hello! I am Praxis, your AI decision assistant. I have your context ready for "${ctx.title}". How can I help you explore or refine this decision?`
      : "Hello! I am Praxis, your AI decision assistant. How can I help you today?";
    return [{ role: "assistant", content: greeting }];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Voice Input via Browser's Native Web Speech API
  function handleToggleVoice() {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast(
        "Voice dictation is not supported in this browser. Please use Chrome, Edge, or Safari.",
        "error"
      );
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        showToast("Listening... Speak now.", "info");
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setInput((prev) => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()));
        }
      };

      recognition.onerror = (event: { error: string }) => {
        setIsListening(false);
        if (event.error !== "no-speech") {
          showToast(`Voice input error: ${event.error}`, "error");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: unknown) {
      setIsListening(false);
      showToast(err instanceof Error ? err.message : "Failed to initialize voice input.", "error");
    }
  }

  async function sendMessage(textToSend: string) {
    const clean = textToSend.trim();
    if (!clean || loading) return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }

    const newMessages: ChatMessageInput[] = [...messages, { role: "user", content: clean }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const contextStr = decisionContext
      ? `Decision: ${decisionContext.title}. Recommended: ${decisionContext.recommendedChoice}. Constraints: ${decisionContext.constraints}. Options: ${decisionContext.options?.join(", ")}.`
      : undefined;

    const details = decisionContext
      ? {
          title: decisionContext.title,
          options: decisionContext.options,
          constraints: decisionContext.constraints,
          recommended_option: decisionContext.recommendedChoice,
        }
      : undefined;

    try {
      const res = await chatWithExplorer(newMessages, contextStr, details);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err: unknown) {
      showToast(`Action failed: ${formatUserFriendlyError(err)}`, "error");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I encountered a temporary connection issue. Please ensure your query is direct and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSend(e?: FormEvent) {
    if (e) e.preventDefault();
    sendMessage(input);
  }

  function handlePromptClick(promptText: string) {
    setInput(promptText);
    sendMessage(promptText);
  }

  return (
    <div
      className="chat-page-shell animate-fade"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg-base)",
        color: "var(--text-primary)",
      }}
    >
      {/* Top Header Bar */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 24px",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Back to Playground button */}
          <button
            type="button"
            className="btn-ghost"
            onClick={onBack}
            style={{
              padding: "7px 14px",
              fontSize: "13px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              borderRadius: "var(--radius-md, 8px)",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              cursor: "pointer",
            }}
          >
            ← Back to Playground
          </button>
          <div style={{ height: "18px", width: "1px", background: "var(--border-subtle)" }} />
          {/* Spark Logo + Praxis AI */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AILogo size={22} />
            <span
              style={{
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "-0.01em",
                color: "var(--text-primary)",
              }}
            >
              Praxis AI
            </span>
          </div>
          {decisionContext?.title && (
            <span
              style={{
                fontSize: "12px",
                background: "rgba(91, 141, 239, 0.08)",
                border: "1px solid rgba(91, 141, 239, 0.25)",
                padding: "3px 10px",
                borderRadius: "12px",
                color: "var(--brand)",
                fontWeight: 500,
                maxWidth: "280px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={decisionContext.title}
            >
              Context: {decisionContext.title}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="user-chip">
            <div className="user-avatar">{user.email.slice(0, 1).toUpperCase()}</div>
            <span style={{ fontSize: "12px" }}>{user.email}</span>
          </div>
          <button type="button" className="logout-btn" onClick={onLogout} title="Sign out">
            <IconLogout size={14} /> Logout
          </button>
        </div>
      </header>

      {/* Chat Messages Body */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "800px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: isUser ? "flex-end" : "flex-start",
                  gap: "10px",
                  alignItems: "flex-start",
                  width: "100%",
                }}
              >
                {!isUser && (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "rgba(91, 141, 239, 0.12)",
                      border: "1px solid rgba(91, 141, 239, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <AILogo size={18} />
                  </div>
                )}

                <div
                  style={{
                    maxWidth: "78%",
                    padding: isUser ? "12px 18px" : "14px 18px",
                    borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: isUser ? "var(--brand)" : "var(--bg-elevated)",
                    color: isUser ? "#ffffff" : "var(--text-primary)",
                    border: isUser ? "none" : "1px solid var(--border-subtle)",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    boxShadow: isUser
                      ? "0 2px 10px rgba(37,99,235,0.22)"
                      : "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  {m.content}
                </div>

                {isUser && (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <IconUser size={16} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Suggested Prompts under AI's latest message */}
          {!loading &&
            messages.length > 0 &&
            messages[messages.length - 1].role === "assistant" && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  alignSelf: "flex-start",
                  marginLeft: "42px",
                  marginTop: "2px",
                }}
              >
                {SUGGESTED_PROMPTS.map((promptText) => (
                  <button
                    key={promptText}
                    type="button"
                    className="chip-prompt"
                    onClick={() => handlePromptClick(promptText)}
                    title={`Ask: "${promptText}"`}
                  >
                    <span style={{ fontSize: "11px" }}>✨</span> {promptText}
                  </button>
                ))}
              </div>
            )}

          {/* Typing Indicator */}
          {loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                alignSelf: "flex-start",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "rgba(91, 141, 239, 0.12)",
                  border: "1px solid rgba(91, 141, 239, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AILogo size={18} />
              </div>
              <div
                style={{
                  padding: "12px 18px",
                  borderRadius: "18px 18px 18px 4px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div className="chat-typing-dots">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                  Praxis is thinking…
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Bar with Voice Support */}
      <footer
        style={{
          padding: "16px 24px",
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <form
          onSubmit={handleSend}
          style={{
            width: "100%",
            maxWidth: "800px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--bg-elevated)",
            border: `1.5px solid ${isListening ? "#ef4444" : "var(--border-subtle)"}`,
            borderRadius: "var(--radius-lg, 14px)",
            padding: "6px 8px 6px 16px",
            boxShadow: isListening
              ? "0 0 0 3px rgba(239, 68, 68, 0.2)"
              : "0 2px 10px rgba(0,0,0,0.04)",
            transition: "border 0.2s ease, box-shadow 0.2s ease",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening
                ? "Listening to voice input... Speak now..."
                : "Ask Praxis (e.g., 'Why not MacBook Pro M5?')..."
            }
            disabled={loading}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--text-primary)",
              fontSize: "14px",
              padding: "8px 0",
            }}
          />

          {/* Voice Input Microphone Button */}
          <button
            type="button"
            onClick={handleToggleVoice}
            disabled={loading}
            className={isListening ? "mic-btn-active" : ""}
            style={{
              background: isListening ? "#ef4444" : "var(--bg-surface)",
              color: isListening ? "#ffffff" : "var(--text-secondary)",
              border: `1px solid ${isListening ? "#ef4444" : "var(--border-subtle)"}`,
              borderRadius: "50%",
              width: "38px",
              height: "38px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
            title={isListening ? "Stop listening" : "Click to speak (Voice Input)"}
            aria-label="Voice input dictation"
          >
            <IconMic size={18} />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              background: input.trim() ? "var(--brand)" : "var(--bg-surface)",
              color: input.trim() ? "#ffffff" : "var(--text-muted)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "50%",
              width: "38px",
              height: "38px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: input.trim() ? "pointer" : "default",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
            title="Send message"
            aria-label="Send message"
          >
            <IconSend size={16} />
          </button>
        </form>

        <p className="text-muted" style={{ margin: 0, fontSize: "11px", textAlign: "center" }}>
          {isListening ? (
            <span style={{ color: "#ef4444", fontWeight: 600 }}>
              🔴 Microphone active — browser native speech recognition running. Click mic to finish.
            </span>
          ) : (
            "Voice input uses browser-native Web Speech API. Audio is processed locally and never recorded."
          )}
        </p>
      </footer>
    </div>
  );
}
