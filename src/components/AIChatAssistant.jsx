import { useEffect, useRef, useState } from "react";
import { MessageSquare, X, Send, Loader2, Settings as SettingsIcon } from "lucide-react";
import { useLanguage } from "../context/languageContext";
import { useAppUI } from "../context/appUI";
import { useSound } from "../context/soundContext";
import { chatOnce } from "../lib/ai";
import { getProvider } from "../lib/aiProviders";
import {
  loadAISettings,
  getActiveModel,
  getActiveApiKey,
  getCustomBaseUrl,
} from "../lib/aiSettings";

const STORAGE_KEY = "azota-ai-chat";
const MAX_MESSAGES = 40;

const loadChat = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      open: saved.open === true,
      messages: Array.isArray(saved.messages) ? saved.messages.slice(-MAX_MESSAGES) : [],
    };
  } catch {
    return { open: false, messages: [] };
  }
};

const saveChat = (open, messages) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ open, messages: messages.slice(-MAX_MESSAGES) }),
    );
  } catch {
    // storage unavailable: chat simply won't persist
  }
};

// Subtle corner assistant using the same provider/key configured in Settings.
// Collapsed to a small icon by default.
const AIChatAssistant = ({ onUsage }) => {
  const { t } = useLanguage();
  const { setCurrentPage } = useAppUI();
  const { playClickSound } = useSound();
  const initial = useRef(loadChat());
  const [open, setOpen] = useState(initial.current.open);
  const [messages, setMessages] = useState(initial.current.messages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const listRef = useRef(null);

  const settings = loadAISettings();
  const apiKey = getActiveApiKey(settings);
  const model = getActiveModel(settings);
  const baseUrl = getCustomBaseUrl(settings);
  const providerName = getProvider(settings.provider).name;

  useEffect(() => {
    saveChat(open, messages);
  }, [open, messages]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, open]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    if (!apiKey) {
      setError(t("apiKeyMissing"));
      return;
    }
    setDraft("");
    setError(null);
    const history = [...messages, { role: "user", text }];
    setMessages(history);
    setSending(true);
    try {
      const reply = await chatOnce({
        providerId: settings.provider,
        model,
        apiKey,
        baseUrl: baseUrl || null,
        messages: history,
        onUsage,
      });
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => {
          playClickSound();
          setOpen(true);
        }}
        title={t("aiAssistant")}
        aria-label={t("aiAssistant")}
        className="fixed bottom-4 right-4 z-40 flex h-9 w-9 items-center justify-center border opacity-40 transition-opacity hover:opacity-100"
        style={{
          borderColor: "var(--border)",
          background: "var(--surface)",
          color: "var(--text-muted)",
        }}
      >
        <MessageSquare className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex w-[320px] max-w-[calc(100vw-2rem)] flex-col border"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div
        className="flex items-center gap-2 border-b px-3 py-2"
        style={{ borderColor: "var(--border)" }}
      >
        <MessageSquare
          className="h-3.5 w-3.5"
          style={{ color: "var(--text-faint)" }}
        />
        <span className="text-xs font-semibold">{t("aiAssistant")}</span>
        <span
          className="ml-1 truncate text-[10px]"
          style={{ color: "var(--text-faint)" }}
        >
          {providerName} · {model || "—"}
        </span>
        <button
          onClick={() => setOpen(false)}
          className="icon-btn icon-btn-sm ml-auto"
          aria-label={t("close")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        ref={listRef}
        className="max-h-64 min-h-24 space-y-2 overflow-y-auto px-3 py-2"
      >
        {messages.length === 0 && (
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            {t("assistantEmpty")}
          </p>
        )}
        {messages.map((message, index) => (
          <p
            key={index}
            className="whitespace-pre-wrap break-words text-xs leading-relaxed"
            style={{
              color:
                message.role === "user" ? "var(--text)" : "var(--text-muted)",
            }}
          >
            <span
              className="mr-1 font-semibold"
              style={{ color: "var(--text-faint)" }}
            >
              {message.role === "user" ? t("you") : t("assistant")}:
            </span>
            {message.text}
          </p>
        ))}
      </div>

      {error && (
        <div
          className="flex items-center gap-2 border-t px-3 py-2 text-xs"
          style={{
            borderColor: "var(--border)",
            color: "var(--danger)",
          }}
        >
          <span className="flex-1">{error}</span>
          {!apiKey && (
            <button
              onClick={() => setCurrentPage("settings")}
              className="btn btn-ghost btn-sm"
            >
              <SettingsIcon className="h-3.5 w-3.5" />
              {t("settings")}
            </button>
          )}
        </div>
      )}

      <div
        className="flex items-center gap-2 border-t px-3 py-2"
        style={{ borderColor: "var(--border)" }}
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={t("assistantPlaceholder")}
          className="input h-8! border-0! bg-transparent! px-0! text-xs focus:shadow-none!"
        />
        <button
          onClick={send}
          disabled={sending || !draft.trim()}
          className="icon-btn icon-btn-sm"
          aria-label={t("send")}
        >
          {sending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default AIChatAssistant;
