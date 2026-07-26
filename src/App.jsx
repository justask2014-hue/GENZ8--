import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Image as ImageIcon, Video, Wand2, Play, Download, X, Clock, Ratio, Palette, Loader2, ChevronDown } from "lucide-react";

const DURATIONS = ["4s", "6s", "8s"];
const RATIOS = ["16:9", "9:16", "1:1"];
const STYLES = ["Cinematic", "Anime", "Realistic", "Claymation", "Noir"];

const SAMPLE_GRADIENTS = [
  "linear-gradient(135deg, #FF5D73 0%, #7C6CFF 100%)",
  "linear-gradient(135deg, #7C6CFF 0%, #2DD4BF 100%)",
  "linear-gradient(135deg, #FFB020 0%, #FF5D73 100%)",
  "linear-gradient(135deg, #2DD4BF 0%, #7C6CFF 100%)",
];

function useEnhancedPrompt() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const enhance = async (rawPrompt, mode) => {
    setLoading(true);
    setError(null);
    try {
      const sys =
        mode === "video"
          ? "You turn a short rough idea into one vivid, concrete, cinematic video-generation prompt. Describe subject, action, camera movement, lighting, and mood in 2-3 sentences. No preamble, no quotes, just the prompt text."
          : "You turn a short rough idea into one vivid, concrete image-generation prompt. Describe subject, composition, lighting, and style in 2-3 sentences. No preamble, no quotes, just the prompt text.";
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: sys,
          messages: [{ role: "user", content: rawPrompt }],
        }),
      });
      const data = await response.json();
      const text = (data.content || [])
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("")
        .trim();
      setLoading(false);
      return text || rawPrompt;
    } catch (e) {
      setError("Couldn't enhance right now.");
      setLoading(false);
      return rawPrompt;
    }
  };

  return { enhance, loading, error };
}

function Segmented({ options, value, onChange, icon: Icon }) {
  return (
    <div className="flex items-center gap-1 bg-[#15151F] border border-white/5 rounded-full p-1">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            value === opt
              ? "bg-[#FF5D73] text-white shadow-[0_0_16px_rgba(255,93,115,0.4)]"
              : "text-[#8B879C] hover:text-[#F2F1F7]"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Dropdown({ label, icon: Icon, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#15151F] border border-white/5 text-xs font-medium text-[#C9C6D6] hover:border-white/15 transition-colors"
      >
        <Icon size={13} strokeWidth={2} />
        {value}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-2 min-w-[120px] bg-[#1B1B27] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`block w-full text-left px-3.5 py-2 text-xs ${
                value === opt ? "text-[#FF5D73] bg-white/5" : "text-[#C9C6D6] hover:bg-white/5"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultCard({ item, onOpen }) {
  return (
    <button
      onClick={() => onOpen(item)}
      className="group relative aspect-[9/16] rounded-2xl overflow-hidden border border-white/5 text-left"
      style={{ background: item.gradient }}
    >
      {item.mediaUrl && item.kind === "image" && (
        <img src={item.mediaUrl} alt={item.prompt} className="absolute inset-0 w-full h-full object-cover" />
      )}
      {item.mediaUrl && item.kind === "video" && (
        <video src={item.mediaUrl} className="absolute inset-0 w-full h-full object-cover" muted loop playsInline />
      )}
      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors" />
      {item.kind === "video" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play size={16} className="text-white ml-0.5" fill="white" />
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
        <p className="text-[11px] text-white/90 line-clamp-2 leading-snug">{item.prompt}</p>
      </div>
      <div className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-[9px] font-mono text-white/80">
        {item.kind === "video" ? item.duration : item.ratio}
      </div>
    </button>
  );
}

function Modal({ item, onClose }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="relative aspect-[9/16] rounded-3xl overflow-hidden border border-white/10" style={{ background: item.gradient }}>
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
            <X size={16} />
          </button>
          {item.mediaUrl && item.kind === "image" && (
            <img src={item.mediaUrl} alt={item.prompt} className="absolute inset-0 w-full h-full object-cover" />
          )}
          {item.mediaUrl && item.kind === "video" && (
            <video src={item.mediaUrl} className="absolute inset-0 w-full h-full object-cover" controls autoPlay loop playsInline />
          )}
          {!item.mediaUrl && item.kind === "video" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <Play size={22} className="text-white ml-1" fill="white" />
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <p className="text-sm text-[#C9C6D6] leading-relaxed">{item.prompt}</p>
          <a
            href={item.mediaUrl || "#"}
            download
            target="_blank"
            rel="noreferrer"
            className="shrink-0 w-9 h-9 rounded-full bg-[#15151F] border border-white/10 flex items-center justify-center text-[#F2F1F7]"
          >
            <Download size={15} />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("video");
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("6s");
  const [ratio, setRatio] = useState("9:16");
  const [style, setStyle] = useState("Cinematic");
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState([]);
  const [openItem, setOpenItem] = useState(null);
  const { enhance, loading: enhancing } = useEnhancedPrompt();
  const [genError, setGenError] = useState(null);

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    const better = await enhance(prompt, mode);
    setPrompt(better);
  };

  const pollStatus = async (statusUrl, responseUrl) => {
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const res = await fetch(
        `/api/status?status_url=${encodeURIComponent(statusUrl)}&response_url=${encodeURIComponent(responseUrl)}`
      );
      const data = await res.json();
      if (data.status === "COMPLETED") return data.url;
      if (data.error) throw new Error(data.error);
    }
    throw new Error("Timed out waiting for generation");
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setGenError(null);
    try {
      const startRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          duration: duration.replace("s", ""),
          aspect_ratio: ratio,
          mode,
        }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) throw new Error(startData.error || "Generation failed to start");

      const mediaUrl = await pollStatus(startData.status_url, startData.response_url);
      if (!mediaUrl) throw new Error("No result returned");

      const newItem = {
        id: Date.now(),
        kind: mode,
        prompt,
        duration,
        ratio,
        style,
        mediaUrl,
        gradient: SAMPLE_GRADIENTS[Math.floor(Math.random() * SAMPLE_GRADIENTS.length)],
      };
      setResults((r) => [newItem, ...r]);
    } catch (err) {
      setGenError(err.message || "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0B14] text-[#F2F1F7]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        .display-font { font-family: 'Space Grotesk', sans-serif; }
        .mono-font { font-family: 'JetBrains Mono', monospace; }
        @keyframes trailGlow {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        .trail-border {
          background: linear-gradient(90deg, #FF5D73, #7C6CFF, #2DD4BF, #FF5D73);
          background-size: 300% 100%;
          animation: trailGlow 3s ease-in-out infinite, slide 6s linear infinite;
        }
        @keyframes slide {
          0% { background-position: 0% 0%; }
          100% { background-position: 300% 0%; }
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #2A2A38; border-radius: 3px; }
      `}</style>

      <header className="flex items-center justify-between px-5 pt-6 pb-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF5D73] to-[#7C6CFF] flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="display-font font-semibold text-[15px] tracking-tight">Reel</span>
        </div>
        <span className="mono-font text-[10px] text-[#8B879C] px-2 py-1 rounded-full border border-white/5">POWERED BY KLING</span>
      </header>

      <main className="max-w-3xl mx-auto px-5 pb-24">
        <div className="pt-6 pb-7">
          <h1 className="display-font text-[26px] leading-[1.15] font-semibold tracking-tight">
            Describe a moment.<br />Watch it move.
          </h1>
        </div>

        <div className="flex mb-4">
          <Segmented
            options={["video", "image"]}
            value={mode}
            onChange={setMode}
          />
        </div>

        <div className="relative rounded-[22px] p-[1.5px] trail-border">
          <div className="rounded-[20px] bg-[#12121C] p-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                mode === "video"
                  ? "A paper boat drifting down a rain-slicked street at night, neon reflections rippling in the water…"
                  : "A lighthouse at dawn, fog rolling off a cold sea, warm light spilling from the lantern room…"
              }
              rows={3}
              className="w-full bg-transparent resize-none outline-none text-[14px] leading-relaxed placeholder:text-[#565265] text-[#F2F1F7]"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <button
                onClick={handleEnhance}
                disabled={!prompt.trim() || enhancing}
                className="flex items-center gap-1.5 text-[11px] font-medium text-[#C9C6D6] disabled:opacity-30 hover:text-white transition-colors"
              >
                {enhancing ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                {enhancing ? "Enhancing…" : "Enhance prompt"}
              </button>
              <span className="mono-font text-[10px] text-[#565265]">{prompt.length}/500</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          {mode === "video" && (
            <Dropdown label="Duration" icon={Clock} options={DURATIONS} value={duration} onChange={setDuration} />
          )}
          <Dropdown label="Ratio" icon={Ratio} options={RATIOS} value={ratio} onChange={setRatio} />
          <Dropdown label="Style" icon={Palette} options={STYLES} value={style} onChange={setStyle} />
        </div>

        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || generating}
          className="w-full mt-5 py-3.5 rounded-2xl bg-[#F2F1F7] text-[#0B0B14] font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-30 active:scale-[0.99] transition-all"
        >
          {generating ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Generating your {mode}…
            </>
          ) : (
            <>
              {mode === "video" ? <Video size={15} /> : <ImageIcon size={15} />}
              Generate {mode}
            </>
          )}
        </button>

        {results.length > 0 && (
          <div className="mt-10">
            <p className="mono-font text-[10px] uppercase tracking-wider text-[#565265] mb-3">Your creations</p>
            <div className="grid grid-cols-2 gap-3">
              {results.map((item) => (
                <ResultCard key={item.id} item={item} onOpen={setOpenItem} />
              ))}
            </div>
          </div>
        )}

        {genError && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-[#3A1420] border border-[#FF5D73]/20 text-[13px] text-[#FF9FAE]">
            {genError}
          </div>
        )}

        {results.length === 0 && !generating && !genError && (
          <div className="mt-14 text-center">
            <p className="text-[13px] text-[#565265]">Nothing generated yet — try a prompt above.</p>
          </div>
        )}
      </main>

      <Modal item={openItem} onClose={() => setOpenItem(null)} />
    </div>
  );
    }
