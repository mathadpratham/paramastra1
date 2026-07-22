import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Lock, Loader2 } from "lucide-react";
import { getApiUrl } from "../config";

type Message = {
  sender: "user" | "ai";
  text: string;
  isDemo?: boolean;
};

const syllabusSuggestions = [
  "Explain Sushruta vs Charaka Asthi count clearly",
  "Quiz me on first-year Rachana Sharir (5 MCQs)",
  "What are the 5 classes of bones in Ayurveda?",
  "Recommend high-yield Kriya Sharir viva focus areas",
];

export function TutorView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "नमस्ते! I am your Paramastra AI Tutor. I have studied every chapter, Shloka and slide in the Ayurveda BAMS 1st Year syllabus. Pick one of the questions below or ask me any question about your curriculum!",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg = text.trim();
    setInputVal("");
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch(getApiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!response.ok) {
        throw new Error("Tutor failed to respond.");
      }

      const result = await response.json();
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: result.text, isDemo: result.isDemo },
      ]);
    } catch (e: any) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I met with a temporary network error. Please try asking again in a second!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-screen-sm flex-col px-4 py-5 relative">
      {/* Upper header */}
      <div className="text-center shrink-0">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-amber-500 text-primary-foreground shadow-md">
          <Sparkles className="h-6 w-6 text-background" />
        </div>
        <h1 className="mt-3 font-display text-xl font-extrabold tracking-tight">
          Ayurveda BAMS AI Scholar
        </h1>
        <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
          Syllabus-trained intelligence on your lectures, shlokas, and exams.
        </p>
      </div>

      {/* Messages Canvas */}
      <div className="flex-1 overflow-y-auto my-4 space-y-3.5 pr-1 scrollbar-thin scrollbar-thumb-border">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={
              "flex flex-col max-w-[85%] rounded-3xl p-4 text-xs font-semibold leading-relaxed " +
              (m.sender === "user"
                ? "bg-primary text-primary-foreground ml-auto rounded-tr-none"
                : "bg-card text-foreground mr-auto rounded-tl-none border border-border shadow-sm")
            }
          >
            {m.sender === "ai" && (
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-primary mb-1 block">
                {m.isDemo ? "✨ Local Scholar Engine" : "⚡ Live Gemini AI"}
              </span>
            )}
            
            {/* Direct newlines support */}
            <p className="whitespace-pre-line leading-normal font-medium">{m.text}</p>
          </div>
        ))}

        {loading && (
          <div className="bg-card text-foreground mr-auto rounded-3xl rounded-tl-none border border-border p-4 max-w-[85%] flex items-center gap-2 text-xs font-medium scale-95 duration-200">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-muted-foreground animate-pulse">Sutra scholar is thinking...</span>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggestion tags if they only have the welcome note */}
      {messages.length === 1 && (
        <div className="grid grid-cols-2 gap-2 mt-auto pb-4 shrink-0">
          {syllabusSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => void handleSend(s)}
              className="rounded-2xl border border-border bg-card/40 px-3.5 py-2.5 text-left text-[11px] font-bold leading-snug hover:bg-card hover:border-primary/40 active:scale-98 transition-all text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Lower Input Controls */}
      <div className="pt-2 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputVal);
          }}
          className="flex items-center gap-2 rounded-full border border-border bg-card p-1.5 pl-4 shadow-sm"
        >
          <input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask anything about Sushruta, Prakriti, Dhatus..."
            className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none py-1 placeholder:text-muted-foreground/70 text-foreground"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || loading}
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-40 transition-transform cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
