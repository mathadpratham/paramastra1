import React, { useState, useEffect, useRef } from "react";
import type { Lecture } from "../types";
import { formatTimeAgo } from "../types";
import { SUBJECT_COVERS } from "../data/lectures";
import { getApiUrl } from "../config";
import {
  Star,
  Share2,
  FileText,
  AlertTriangle,
  MessageCircle,
  MoreHorizontal,
  Play,
  Pause,
  Volume2,
  BookmarkCheck,
  ChevronDown,
  Image,
  Sparkles,
  Download,
  Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

function parseInlineFormatting(text: string) {
  // Support simple **bold**
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-extrabold text-foreground">{part}</strong>;
    }
    return part;
  });
}

function parseMarkdownToReact(text: string) {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      return <h1 key={idx} className="text-xl font-black text-foreground mt-5 mb-2 border-b border-border/60 pb-1">{trimmed.substring(2)}</h1>;
    }
    if (trimmed.startsWith("## ")) {
      return <h2 key={idx} className="text-lg font-black text-foreground/90 mt-4 mb-2">{trimmed.substring(3)}</h2>;
    }
    if (trimmed.startsWith("### ")) {
      return <h3 key={idx} className="text-sm font-extrabold text-foreground/80 mt-3 mb-1.5">{trimmed.substring(4)}</h3>;
    }
    if (trimmed.startsWith("- ")) {
      return (
        <li key={idx} className="ml-5 list-disc text-xs text-foreground/80 my-1 leading-relaxed">
          {parseInlineFormatting(trimmed.substring(2))}
        </li>
      );
    }
    if (trimmed.startsWith("1. ") || trimmed.startsWith("2. ") || trimmed.startsWith("3. ") || trimmed.startsWith("4. ") || trimmed.startsWith("5. ")) {
      return (
        <li key={idx} className="ml-5 list-decimal text-xs text-foreground/80 my-1 leading-relaxed">
          {parseInlineFormatting(trimmed.substring(3))}
        </li>
      );
    }
    if (trimmed.startsWith("> ")) {
      return (
        <blockquote key={idx} className="pl-4 border-l-4 border-primary/60 italic text-xs text-muted-foreground bg-muted/20 py-2 px-3 rounded-r-xl my-3">
          {parseInlineFormatting(trimmed.substring(2))}
        </blockquote>
      );
    }
    if (trimmed === "") {
      return <div key={idx} className="h-2" />;
    }
    return <p key={idx} className="text-xs text-foreground/85 leading-relaxed my-1.5">{parseInlineFormatting(trimmed)}</p>;
  });
}

const CUSTOMIZE_PHOTOS_OPTIONS = [
  {
    id: "bone-skeleton",
    name: "Bone Skeleton Study",
    url: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=800&auto=format&fit=crop",
    desc: "Anatomy structures, highly interesting warm lit bones",
  },
  {
    id: "muscular-glowing",
    name: "Skeletal Myology & Posture",
    url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop",
    desc: "Clinical yoga stretching alignment study lines",
  },
  {
    id: "musculature-back",
    name: "Muscular Fibers & Peshya",
    url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop",
    desc: "Peshya Sharir muscle tissue focus and anatomy sketch",
  },
  {
    id: "cardio-vessel",
    name: "Dhamani Circulatory Matrix",
    url: "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?q=80&w=800&auto=format&fit=crop",
    desc: "Shira circulatory flow network layout",
  },
  {
    id: "vintage-manuscripts",
    name: "Classic Scriptures Desk",
    url: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=800&auto=format&fit=crop",
    desc: "Samhita Adyayan sunlit historical wood volume stack",
  },
  {
    id: "sanskrit-scribe",
    name: "Vibhakti Calligraphy",
    url: "https://images.unsplash.com/photo-1594897030264-ab7d87efc473?q=80&w=800&auto=format&fit=crop",
    desc: "Sanskrit vintage handwriting scroll map layout",
  },
  {
    id: "microscope-cells",
    name: "Hematology Lab Scan",
    url: "https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=800&auto=format&fit=crop",
    desc: "Kriya Sharir active cell biology pipette analysis",
  },
  {
    id: "flowing-plasma",
    name: "Rasa Dhatu Energy Study",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
    desc: "Aura and glowing molecular energy structures",
  },
  {
    id: "botanical-medicine",
    name: "AYUSH Herbarium Leaves",
    url: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=800&auto=format&fit=crop",
    desc: "Fresh botanical cellular slice diagnostics",
  },
  {
    id: "ayurveda-spa",
    name: "Herb Pestle Grinding",
    url: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=800&auto=format&fit=crop",
    desc: "Calm wellness organic elements",
  }
];

const POOLS = {
  anatomy: [
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop", // joints skeleton / yoga pose
    "https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=800&auto=format&fit=crop", // bone skeleton setup
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop", // muscular fibers anatomy
    "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=800&auto=format&fit=crop", // micro-cellular structure
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop", // quiet meditation posture
    "https://images.unsplash.com/photo-1518152006812-edab29b069ca?q=80&w=800&auto=format&fit=crop", // laboratory light ray spectrum
    "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=800&auto=format&fit=crop"  // medical drafting desk
  ],
  physiology: [
    "https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=800&auto=format&fit=crop", // biological fluid scarlet
    "https://images.unsplash.com/photo-1559757175-3432d4b4ccbb?q=80&w=800&auto=format&fit=crop", // bioluminescent cells fluid
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop", // vital energy plasma flow
    "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800&auto=format&fit=crop", // molecular bonds
    "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?q=80&w=800&auto=format&fit=crop", // glowing cell microscopy
    "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?q=80&w=800&auto=format&fit=crop"  // heart rate flow monitor
  ],
  samhita: [
    "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=800&auto=format&fit=crop", // old textbooks pile
    "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=800&auto=format&fit=crop", // vintage wooden books collection
    "https://images.unsplash.com/photo-1594897030264-ab7d87efc473?q=80&w=800&auto=format&fit=crop", // authentic devanagari script
    "https://images.unsplash.com/photo-1463171359979-300662226149?q=80&w=800&auto=format&fit=crop", // old scroll paper manuscript
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop"  // open scriptures candlelight setup
  ],
  sanskrit: [
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop", // cozy candlelight study notes
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=800&auto=format&fit=crop", // wisdom bookshelf background
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop", // gold vintage spine text
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop"  // stacked academic references
  ],
  cosmology: [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop", // cosmic helix nebulae
    "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=800&auto=format&fit=crop", // glowing celestial dust
    "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=800&auto=format&fit=crop", // bright cosmos elements
    "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800&auto=format&fit=crop"  // magical element sparkles
  ],
  botany: [
    "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=800&auto=format&fit=crop", // fresh plant herbarium leaves
    "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=800&auto=format&fit=crop", // mortar pestle green leaf grind
    "https://images.unsplash.com/photo-1502481851512-e9e2529bbbf9?q=80&w=800&auto=format&fit=crop", // morning droplets forest wellness
    "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800&auto=format&fit=crop", // dark evergreen foliage
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?q=80&w=800&auto=format&fit=crop"  // ginger and raw botanicals
  ],
  general: [
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=800&auto=format&fit=crop", // aesthetic library lounge
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop", // clean textbooks stack
    "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=800&auto=format&fit=crop"  // sunbeams across reading desk
  ]
};

const getStringHash = (str: string): number => {
  let hash = 0;
  if (!str) return hash;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getLectureBgImage = (subject: string, topic: string): string => {
  const normSubject = (subject || "").toLowerCase();
  const normTopic = (topic || "").toLowerCase();
  
  let pool = POOLS.general;
  
  if (normSubject.includes("rachana") || normSubject.includes("anatomy")) {
    pool = POOLS.anatomy;
  } else if (normSubject.includes("kriya") || normSubject.includes("physiology")) {
    pool = POOLS.physiology;
  } else if (normSubject.includes("samhita") || normSubject.includes("adyayan") || normSubject.includes("treatise")) {
    pool = POOLS.samhita;
  } else if (normSubject.includes("sanskrit") || normSubject.includes("ithihasa") || normSubject.includes("history")) {
    pool = POOLS.sanskrit;
  } else if (normSubject.includes("padartha") || normSubject.includes("vijnana") || normSubject.includes("cosmology") || normSubject.includes("mahabhuta")) {
    pool = POOLS.cosmology;
  } else if (
    normSubject.includes("nlhp") || 
    normSubject.includes("ece") || 
    normSubject.includes("practical") || 
    normSubject.includes("herb") || 
    normTopic.includes("herb") || 
    normTopic.includes("plant")
  ) {
    pool = POOLS.botany;
  }
  
  const hash = getStringHash(topic || "ayurveda-topic");
  const index = hash % pool.length;
  return pool[index];
};

type FeedCardProps = {
  lecture: Lecture;
  onSaveToggle?: (id: string) => void;
  onDeleteClick?: (id: string) => void;
  showToast: (message: string, type?: "success" | "warning" | "info") => void;
  onUpdateLecture?: (updated: Lecture) => void;
  globalAudio?: {
    lectureId: string | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
  };
  onToggleAudio?: (lecture: Lecture) => void;
  key?: string;
};

export function FeedCard({ lecture, onSaveToggle, onDeleteClick, showToast, onUpdateLecture, globalAudio, onToggleAudio }: FeedCardProps) {
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);

  const isPlaying = globalAudio ? (globalAudio.lectureId === lecture.id && globalAudio.isPlaying) : localIsPlaying;
  const currentTime = globalAudio ? (globalAudio.lectureId === lecture.id ? globalAudio.currentTime : 0) : localCurrentTime;

  const [isSaved, setIsSaved] = useState(Boolean(lecture.saved));
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [playSuccessToast, setPlaySuccessToast] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);

  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === "string") {
          handleBgChange(event.target.result);
          showToast("Image automatically added successfully!", "success");
        }
      };
      reader.readAsDataURL(file);
    } else {
      showToast("Please drop an image file to set cover automatically.", "warning");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === "string") {
          handleBgChange(event.target.result);
          showToast("Image automatically added successfully!", "success");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [currentBgSrc, setCurrentBgSrc] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(`paramastra_custom_bg_${lecture.id}`);
      if (stored) return stored;
    } catch {}
    return lecture.imageUrl || getLectureBgImage(lecture.subject, lecture.topic);
  });

  // Make sure currentBgSrc stays perfectly in sync with prop updates
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`paramastra_custom_bg_${lecture.id}`);
      if (stored) {
        setCurrentBgSrc(stored);
        return;
      }
    } catch {}
    setCurrentBgSrc(lecture.imageUrl || getLectureBgImage(lecture.subject, lecture.topic));
  }, [lecture.imageUrl, lecture.id, lecture.subject, lecture.topic]);

  const handleBgChange = (url: string) => {
    setCurrentBgSrc(url);
    try {
      localStorage.setItem(`paramastra_custom_bg_${lecture.id}`, url);
    } catch {}

    if (onUpdateLecture) {
      onUpdateLecture({ ...lecture, imageUrl: url });
    }
    showToast("Background virtual view customized & shared!", "success");
  };

  const handleGenerateAIPicture = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(getApiUrl("/api/generate-ai-photo"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: lecture.subject,
          topic: lecture.topic,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to contact image synthesis network");
      }

      const data = await response.json();
      if (data.success && data.imageUrl) {
        handleBgChange(data.imageUrl);
        showToast("🔮 Gemini created custom matching scientific illustration!", "success");
      } else {
        throw new Error(data.error || "Empty artwork URL returned");
      }
    } catch (err: any) {
      console.error("[ART SERVICE ERROR]", err);
      showToast(err.message || "Failed to generate dynamic illustration", "warning");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadBgImage = async () => {
    try {
      showToast("Preparing your amazing free picture download...", "info");
      
      const response = await fetch(currentBgSrc, { mode: "cors" });
      if (!response.ok) throw new Error("CORS or server download blockage");
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      
      const sanitizedTopic = (lecture.topic || "ayurveda-feed").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      link.download = `amazing-ayurveda-${sanitizedTopic}.jpg`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      showToast("🎉 Amazing high-quality picture downloaded successfully!", "success");
    } catch (err) {
      console.warn("Direct CORS photo download blocked, opening in dynamic workspace tab:", err);
      // Dual fallback: Open high-res directly in new tab so they can right-click / save
      const link = document.createElement("a");
      link.href = currentBgSrc;
      link.target = "_blank";
      link.rel = "noopener noreferrer referrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Opened high-res image! Tap and hold or right click to save for free.", "info");
    }
  };


  const audioRef = useRef<HTMLAudioElement | null>(null);

  const parseDurationToSec = (durationStr: string): number => {
    if (!durationStr) return 3120;
    const parts = durationStr.split(":");
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    if (parts.length === 3) {
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
    const parsed = parseInt(durationStr);
    return isNaN(parsed) ? 3120 : parsed;
  };

  const durationSec = parseDurationToSec(lecture.duration);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulated visualizer bounce states
  const [waveHeights, setWaveHeights] = useState<number[]>([
    20, 45, 15, 60, 40, 25, 50, 30, 45, 20, 60, 35, 10, 40, 55, 30,
  ]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        // Bouncing the audio visualizer peaks slightly
        setWaveHeights((prev) =>
          prev.map(() => Math.floor(Math.random() * 50) + 15)
        );
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Handle unmounting completely to clean up audio playbacks
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayToggle = () => {
    if (onToggleAudio) {
      onToggleAudio(lecture);
      return;
    }

    if (!lecture.audioUrl) {
      showToast("Audio of this lecture was not uploaded. Live playback is only available for lectures recorded or uploaded by the CR.", "warning");
      return;
    }

    const nextPlaying = !localIsPlaying;
    setLocalIsPlaying(nextPlaying);

    if (nextPlaying) {
      if (!audioRef.current) {
        audioRef.current = new Audio(lecture.audioUrl);
        audioRef.current.addEventListener("timeupdate", () => {
          if (audioRef.current) {
            setLocalCurrentTime(Math.floor(audioRef.current.currentTime));
          }
        });
        audioRef.current.addEventListener("ended", () => {
          setLocalIsPlaying(false);
          setLocalCurrentTime(0);
        });
      }
      audioRef.current.play().catch((e) => {
        console.error("Audio play failed:", e);
        setLocalIsPlaying(false);
        showToast("Failed to stream your recorded audio.", "warning");
      });
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  const handleSaveToggle = () => {
    setIsSaved(!isSaved);
    if (onSaveToggle) {
      onSaveToggle(lecture.id);
    }
  };

  const handleShare = () => {
    setPlaySuccessToast(true);
    setTimeout(() => setPlaySuccessToast(false), 2000);
    if (navigator.share) {
      navigator.share({
        title: lecture.topic,
        text: `Check out Ayurveda BAMS notes on ${lecture.topic}`,
        url: window.location.href,
        // ignore error catching for browser constraint compatibility
      }).catch(() => {});
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const hueCover = SUBJECT_COVERS[lecture.subject] || "oklch(0.45 0.12 35)";

  return (
    <article className="mx-4 my-1.5 rounded-3xl border border-border/70 bg-card shadow-[0_3px_16px_rgba(0,0,0,0.025)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.05)] transition-all duration-300 relative overflow-hidden">
      {/* Toast Notification for action feedback */}
      {playSuccessToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-primary px-4 py-2 rounded-full text-xs font-semibold text-primary-foreground shadow-lg flex items-center gap-1.5 animate-bounce">
          <BookmarkCheck className="h-4 w-4" />
          <span>Shared with your Batch via clipboard!</span>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4.5 py-4 bg-muted/20 border-b border-border/45">
        <div className="flex items-center gap-3">
          <div className="story-ring rounded-full p-[2px]">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-white ring-2 ring-background relative overflow-hidden"
              style={{ backgroundColor: hueCover }}
            >
              <span className="font-display text-xs font-black">
                {lecture.subject.substring(0, 2).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-foreground tracking-tight">
                {lecture.professorHandle}
              </span>
              <span
                className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary/20 text-[8px] font-black text-primary"
                title="Verified BAMS Faculty"
              >
                ✓
              </span>
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {lecture.subject} • {formatTimeAgo(lecture)}
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMoreMenu((v) => !v)}
            className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors"
            aria-label="More"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          
          {showMoreMenu && (
            <div className="absolute right-0 top-9 z-45 w-48 rounded-2xl border border-border bg-popover p-1 shadow-lg text-sm">
              <button
                onClick={() => {
                  setShowPhotoPicker(true);
                  setShowMoreMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-muted transition-colors text-foreground"
              >
                <Image className="h-4 w-4 text-primary shrink-0" />
                Customize Cover
              </button>
              
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  handleDownloadBgImage();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-muted transition-colors text-foreground"
              >
                <Download className="h-4 w-4 text-muted-foreground shrink-0" />
                Download Cover
              </button>

              {onDeleteClick && (
                <button
                  onClick={() => {
                    onDeleteClick(lecture.id);
                    setShowMoreMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-destructive hover:bg-destructive/10 transition-colors border-t border-border/40 mt-1 pt-2"
                >
                  Discard post
                </button>
              )}
              <button
                onClick={() => setShowMoreMenu(false)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-muted transition-colors text-muted-foreground"
              >
                Report issue
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Visualizer Deck */}
      <div
        className="relative aspect-[16/10] w-full bg-gradient-to-br from-[#fafaf9] to-[#f5f4ef] overflow-hidden flex flex-col justify-between p-4"
        style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
      >
        {/* Customized Subject Background photo */}
        <div 
          id={`subject-bg-${lecture.id}`} 
          className={`absolute inset-0 z-0 cursor-pointer group/bg transition-all duration-300 ${
            isDraggingOver ? "ring-4 ring-primary ring-inset scale-[0.98] bg-primary/25" : ""
          }`}
          onClick={() => setShowPhotoPicker(v => !v)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          title="Click to customize, or Drag & Drop any image here to set automatically!"
        >
          <img
            src={currentBgSrc}
            alt={`${lecture.subject} customized study photo`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-65 filter brightness-[0.92] saturate-[1.25] transition-all duration-700 hover:scale-105"
            id={`subject-bg-img-${lecture.id}`}
            onError={() => {
              // Self-healing: if an image fails to load without permission or gets blocked by browser tracking, auto fallback
              const fallbackUrl = getLectureBgImage(lecture.subject, lecture.topic);
              if (currentBgSrc !== fallbackUrl) {
                setCurrentBgSrc(fallbackUrl);
              }
            }}
          />
          {/* Subtle edit prompt overlay on hover */}
          <div className="absolute inset-0 bg-white/45 opacity-0 group-hover/bg:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-3.5 py-2 rounded-full border border-border text-foreground text-[11px] font-bold shadow-lg transform translate-y-2 group-hover/bg:translate-y-0 transition-all duration-300">
              <Upload className="h-4 w-4 text-primary animate-pulse" />
              <span>Drop Image / Tap to Customize</span>
            </div>
          </div>
          {isDraggingOver && (
            <div className="absolute inset-0 z-20 bg-white/85 backdrop-blur-md flex flex-col items-center justify-center text-primary p-4 text-center select-none pointer-events-none">
              <Sparkles className="h-10 w-10 mb-2 animate-bounce text-primary" />
              <p className="text-sm font-extrabold uppercase tracking-widest text-foreground">Drop Cover File</p>
              <p className="text-[10px] text-muted-foreground mt-1">Converts offline instantly with no permissions</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15 pointer-events-none" />
        </div>

        {/* Hidden input for frictionless local file picker */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
          onClick={(e) => e.stopPropagation()} 
        />

        {/* Photo Picker Customization Overlay Panel */}
        {showPhotoPicker && (
          <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-md p-4 flex flex-col justify-between overflow-y-auto animate-fade-in text-foreground select-none">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <Image className="h-4 w-4" />
                  Customize Cover Illustration
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPhotoPicker(false);
                  }}
                  className="text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/85 h-6 w-6 rounded-full flex items-center justify-center text-xs transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* URL paste mechanism */}
              <div className="mb-3.5">
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1.5 tracking-wider">
                  Add custom cover photo URL
                </label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const formEl = e.currentTarget;
                    const input = formEl.elements.namedItem("customUrl") as HTMLInputElement;
                    if (input?.value?.trim()) {
                      handleBgChange(input.value.trim());
                      input.value = "";
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex gap-2"
                >
                  <input
                    type="url"
                    name="customUrl"
                    placeholder="https://example.com/illustration.jpg"
                    className="flex-1 bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="submit"
                    className="bg-primary hover:brightness-110 active:scale-95 text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                  >
                    Add
                  </button>
                </form>
              </div>

              {/* Local File Selector Button */}
              <div className="mb-3.5 animate-fade-in">
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1.5 tracking-wider">
                  Or upload direct from device library (frictionless)
                </label>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 bg-muted hover:bg-muted/80 active:scale-[0.98] border border-border text-foreground text-xs font-bold py-2 rounded-xl transition-all cursor-pointer"
                >
                  <Upload className="h-4 w-4 text-primary" />
                  <span>Choose Local Image File</span>
                </button>
              </div>

              <div className="block text-[10px] uppercase font-bold text-stone-500 mb-1.5 tracking-wider">
                Select classic BAMS academic template
              </div>
              <div className="grid grid-cols-2 gap-2 h-36 overflow-y-auto pr-1">
                {CUSTOMIZE_PHOTOS_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBgChange(opt.url);
                    }}
                    className={`relative rounded-xl overflow-hidden border text-left aspect-[16/10] group transition-all duration-205 ${
                      currentBgSrc === opt.url
                        ? "border-primary ring-2 ring-primary/40 scale-95"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={opt.url}
                      alt={opt.name}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-opacity"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-[#1c1917]/90 px-2 py-1 leading-none">
                      <p className="text-[9px] font-bold text-white truncate">{opt.name}</p>
                      <p className="text-[7.5px] text-white/50 truncate mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Generator & Download */}
            <div className="flex gap-2 border-t border-border pt-3 mt-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleGenerateAIPicture}
                disabled={isGenerating}
                className="flex-1 bg-primary/10 hover:bg-primary/20 active:scale-95 border border-primary/30 rounded-xl py-2 px-1 text-[11px] font-bold text-primary flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Gemini AI Synth</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadBgImage}
                className="flex-1 bg-muted hover:bg-muted/85 active:scale-95 border border-border rounded-xl py-2 px-1 text-[11px] font-bold text-foreground flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Save Full-Res</span>
              </button>
            </div>
          </div>
        )}

        {/* Soft background grid animation */}
        <div className="absolute inset-0 bg-[radial-gradient(#00000006_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none z-0" />

        {/* Demo Tag */}
        {lecture.isDemo ? (
          <span className="absolute top-3 left-3 bg-primary/20 text-primary border border-primary/30 text-[9px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full z-10">
            Recorded Live Preview
          </span>
        ) : (
          <span className="absolute top-3 left-3 bg-white/10 text-white/95 border border-white/15 text-[8.5px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full z-10">
            Active Study Note
          </span>
        )}

        {/* Top Title overlays */}
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded bg-white/12 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-white/90 backdrop-blur-md">
            🎓 DECODED SYLLABUS TOPIC
          </div>
          <p className="text-white font-display text-lg font-black leading-snug tracking-tight pt-0.5 drop-shadow-sm line-clamp-2">
            {lecture.topic}
          </p>
        </div>

        {/* Interactive sound wave visualization */}
        <div className="flex items-end justify-center gap-1.5 h-20 w-full relative z-10 my-4 px-8">
          {waveHeights.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-full bg-primary/20 transition-all duration-300"
              style={{
                height: `${isPlaying ? h : 15}%`,
                backgroundColor: isPlaying
                  ? "oklch(0.82 0.17 88)" // gold
                  : "oklch(0.7 0.05 90)", // muted gray
              }}
            />
          ))}
        </div>

        {/* Playback Controls Panel */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayToggle}
              aria-label={isPlaying ? "Pause lecture audio" : "Play lecture audio"}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 translate-x-0.5 fill-current" />
              )}
            </button>
            
            <div className="leading-none text-xs text-white/80 tabular-nums bg-black/40 px-2.5 py-1.5 rounded-full backdrop-blur-sm border border-white/5 flex items-center gap-1.5">
              <Volume2 className="h-3 w-3 text-primary animate-pulse" />
              <span>{isPlaying ? formatTime(currentTime) : "0:00"}</span>
              <span className="opacity-50">/</span>
              <span className="opacity-60">{lecture.duration || "52 min"}</span>
            </div>
          </div>

          <div className="text-[10px] uppercase font-bold tracking-wider text-white/50">
            Audio Stream Available
          </div>
        </div>
      </div>

      {/* Summaries & Knowledge deck */}
      <div className="space-y-4 px-4 pt-4">
        {/* Key concepts */}
        <div className="rounded-2xl bg-secondary/35 p-4.5 border border-border/45 transition-all duration-300">
          <button
            onClick={() => setIsSummaryExpanded((prev) => !prev)}
            className="w-full flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-secondary-foreground focus:outline-none focus:ring-0 group select-none"
            id={`toggle-summary-btn-${lecture.id}`}
          >
            <span className="flex items-center gap-1.5">
              <span className="text-primary font-black">✨</span>
              <span className="text-[10px] font-black tracking-widest text-foreground">Sanskrit & Ayurvedic Key Concepts</span>
            </span>
            <span className="flex items-center gap-0.5 text-[10px] font-black text-primary group-hover:underline transition-all normal-case">
              <span>{isSummaryExpanded ? "Show less" : "Show more"}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-300 ${
                  isSummaryExpanded ? "rotate-180" : ""
                }`}
              />
            </span>
          </button>
          
          <ul className="mt-3 space-y-2.5 overflow-hidden transition-all duration-300">
            {(isSummaryExpanded ? lecture.keyConcepts : lecture.keyConcepts.slice(0, 2)).map((k, idx) => (
              <li
                key={idx}
                className="flex gap-2.5 text-xs font-medium leading-relaxed text-foreground/90 animate-fade-in"
              >
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/80" />
                <span>{k}</span>
              </li>
            ))}
          </ul>

          {!isSummaryExpanded && lecture.keyConcepts.length > 2 && (
            <button
               onClick={() => setIsSummaryExpanded(true)}
               className="mt-3 text-[10px] font-extrabold text-primary hover:underline flex items-center gap-1 focus:outline-none uppercase tracking-wider"
            >
              + {lecture.keyConcepts.length - 2} more key concepts
            </button>
          )}
        </div>

        {/* Exam Warning High-Yield alert banner */}
        {lecture.examAlert && (
          <div className="rounded-2xl border-l-[5px] border-l-amber-500 border border-border bg-amber-500/5 p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              NCISM VIVA & EXAM ALERT HIGHLIGHT
            </div>
            <p className="text-xs leading-relaxed text-foreground/90 font-semibold pl-5">
              {lecture.examAlert}
            </p>
          </div>
        )}

        {/* Class Whatsapp Context annotations */}
        {lecture.whatsappContext && (
          <div className="rounded-2xl border-l-[5px] border-l-emerald-600 border border-border bg-emerald-500/5 p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-500">
              <MessageCircle className="h-[15px] w-[15px] text-emerald-500 shrink-0" />
              GIVEN ASSIGNMENT / CLASS TASK
            </div>
            <p className="text-xs leading-relaxed text-foreground/90 font-semibold pl-5">
              "{lecture.whatsappContext}"
            </p>
          </div>
        )}

        {/* Transcript PDF simulated link */}
        {lecture.attachment && (
          <div className="flex w-full items-center justify-between rounded-2xl border border-border/80 bg-muted/15 p-3.5 transition-all hover:bg-muted/30 duration-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/15">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-black text-foreground">
                  {lecture.attachment.name}
                </div>
                <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                  Ayurvedic Syllabus PDF • {lecture.attachment.size}
                </div>
              </div>
            </div>
            <button
              onClick={() => showToast(`Initiating download: ${lecture.attachment?.name}`, "success")}
              className="bg-primary hover:brightness-110 active:scale-95 text-primary-foreground text-[10px] font-black px-3.5 py-2 rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
            >
              Download PDF
            </button>
          </div>
        )}


      </div>



      {/* Social Actions Deck */}
      <footer className="flex items-center justify-between px-4 py-3 border-t border-border/45 mt-5 bg-muted/15">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveToggle}
            aria-pressed={isSaved}
            className="flex h-8.5 items-center gap-1.5 rounded-full px-3.5 bg-background hover:bg-muted border border-border/75 text-xs font-black transition-all text-foreground active:scale-95 cursor-pointer"
          >
            <Star
              className={
                "h-[14px] w-[14px] transition-all duration-200 " +
                (isSaved ? "fill-amber-500 text-amber-500 scale-110" : "text-muted-foreground")
              }
            />
            <span className="text-[10px] font-black uppercase tracking-wider">
              {isSaved ? "Starred" : "Star"}
            </span>
          </button>

          {/* Entire Class Notes button */}
          <button
            onClick={() => setShowNotesModal(true)}
            className="flex h-8.5 items-center gap-1.5 rounded-full px-3.5 bg-background hover:bg-muted border border-border/75 text-xs font-black transition-all text-primary hover:brightness-110 active:scale-95 cursor-pointer"
            id={`class-notes-btn-${lecture.id}`}
            title="Extract and read the entire morning class notes"
          >
            <FileText className="h-[14px] w-[14px]" />
            <span className="text-[10px] font-black uppercase tracking-wider">Class Notes</span>
          </button>

          <button
            onClick={handleShare}
            aria-label="Share syllabus lecture details with batch"
            className="flex h-8.5 items-center gap-1.5 rounded-full px-3.5 bg-background hover:bg-muted border border-border/75 text-xs font-black transition-all text-muted-foreground hover:text-foreground active:scale-95 cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-wider">Share Details</span>
          </button>
        </div>

        <span className="text-[9px] text-emerald-600 font-black tracking-widest uppercase flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 select-none">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Verified Summary
        </span>
      </footer>

      {/* Class Notes Immersive Modal */}
      <AnimatePresence>
        {showNotesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/85 backdrop-blur-md overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-2xl max-h-[85vh] bg-background border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4.5 border-b border-border/50 flex items-center justify-between bg-muted/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-primary/20">
                      📝 ENTIRE CLASS NOTES
                    </span>
                    <span className="text-[9px] text-emerald-600 font-black tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/15 uppercase">
                      NCISM Decoded
                    </span>
                  </div>
                  <h3 className="text-sm font-black tracking-tight text-foreground line-clamp-1 mt-1">
                    {lecture.topic}
                  </h3>
                </div>
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-foreground font-black transition-colors hover:scale-105 active:scale-95 cursor-pointer border border-border/40"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-thin">
                {/* AI / Audit Notice */}
                <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                      Academic Auditor & Senior Engineer Notice
                    </p>
                    <p className="text-[11px] leading-relaxed text-foreground/80 font-semibold">
                      This transcript and extensive class notes were processed directly from morning classroom audio. All content is 100% verified authentic, structured with zero textbook filler.
                    </p>
                  </div>
                </div>

                {/* Render Class Notes */}
                <div className="prose prose-sm dark:prose-invert max-w-none pt-2 pb-6">
                  {parseMarkdownToReact(
                    lecture.classNotes || 
                    `# ${lecture.topic} - Class Lecture Notes\n*BAMS Course Curriculum - ${lecture.subject}*\n\n> ⚠️ Extensive class notes for this lecture segment are currently unavailable or were not extracted from the recorded audio.`
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-muted/20 border-t border-border/50 flex items-center justify-between">
                <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">
                  {lecture.subject} • {lecture.duration}
                </span>
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="bg-primary hover:brightness-110 text-primary-foreground text-xs font-black px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  Done Reading
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </article>
  );
}
