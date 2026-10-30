import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Sparkles } from "lucide-react";
import { apiFetch } from "../lib/api.js";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { sender: "bot", text: "👋 Namaste! I am AgriSense AI Assistant. How can I help your farm today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, { sender: "bot", text: data.data.reply }]);
      } else {
        setMessages((prev) => [...prev, { sender: "bot", text: "Sorry, I am having trouble answering right now." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { sender: "bot", text: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full btn-gradient shadow-[var(--shadow-glow)] transition hover:scale-105"
        aria-label="AI Assistant Chat"
      >
        {open ? <X className="h-6 w-6 text-white" /> : <Bot className="h-6 w-6 text-white" />}
        {!open && (
          <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            1
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[380px] h-[520px] glass flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-white/60 backdrop-blur-2xl">
          {/* Header */}
          <div className="btn-gradient p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/20">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  AgriSense AI <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="text-[11px] text-white/80">Online · Smart Farming Advisor</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white p-1">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white/40">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    m.sender === "user"
                      ? "btn-gradient text-white rounded-br-none"
                      : "bg-white text-foreground shadow-sm rounded-bl-none border border-primary/10"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-2 rounded-2xl text-xs text-muted-foreground animate-pulse border">
                  AgriSense AI is thinking…
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-white/80 border-t border-primary/10 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about weather, crops, disease..."
              className="flex-1 rounded-full border border-primary/20 bg-white px-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="grid h-9 w-9 place-items-center rounded-full btn-gradient disabled:opacity-50"
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
