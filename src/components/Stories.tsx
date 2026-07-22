import React, { useState, useEffect, useRef } from "react";
import { weeklySchedule, SUBJECT_COVERS, getDynamicClassStatus, getIndianDate } from "../data/lectures";
import { BookOpen, GraduationCap, X, ChevronLeft, ChevronRight, Play, Pause, Calendar, Award, Sparkles, MessageCircle, ArrowRight } from "lucide-react";
import type { Lecture } from "../types";
import { isSubjectMatching, matchLecturesToClasses } from "../types";

type StoriesProps = {
  onClassClick?: (subjectsName: string) => void;
  activeDay: string;
  setActiveDay: (day: string) => void;
  lecturesByDay?: Record<string, Lecture[]>;
  globalAudio?: {
    lectureId: string | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
  };
  onToggleAudio?: (lecture: Lecture) => void;
  userRole?: "student" | "cr" | null;
};

const SUBJECT_IMAGES: Record<string, string> = {
  "Rachana Sharir": "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?q=80&w=400&auto=format&fit=crop",
  "Kriya Sharir": "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=400&auto=format&fit=crop",
  "Samhita Adyayan-1": "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=400&auto=format&fit=crop",
  "Sanskritam Evum Ayurveda Ithihasa": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=400&auto=format&fit=crop",
  "Padartha Vijnana": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop",
  "NLHP/ECE": "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?q=80&w=400&auto=format&fit=crop",
  "Library": "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=400&auto=format&fit=crop",
  "Club Activities / Mentorship": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=400&auto=format&fit=crop",
};

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getDateOfWeekday(targetDayName: string): string {
  const current = getIndianDate();
  const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday, etc.
  
  // Find offset from today to the current week's Monday (academic cycle start)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  // Target offset from Monday
  const weekdayOffsets: Record<string, number> = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6
  };
  
  const targetOffsetFromMonday = weekdayOffsets[targetDayName];
  if (targetOffsetFromMonday === undefined) return "";
  
  const totalDiffFromToday = diffToMonday + targetOffsetFromMonday;
  const targetDate = new Date(current.getTime() + totalDiffFromToday * 24 * 60 * 60 * 1000);
  
  return targetDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function Stories({ onClassClick, activeDay, setActiveDay, lecturesByDay, globalAudio, onToggleAudio, userRole }: StoriesProps) {
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Active classes for the chosen weekday schedule mapped dynamically to their real time state
  const storyLecturesMap = matchLecturesToClasses(weeklySchedule[activeDay] || [], lecturesByDay?.[activeDay] || []);

  const activeDayClasses = (weeklySchedule[activeDay] || [])
    .map(c => {
      const matchingLec = storyLecturesMap[c.id];

      return {
        ...c,
        status: getDynamicClassStatus(c.time, activeDay),
        topic: matchingLec ? matchingLec.topic : "Topic will update live once recorded",
        professor: matchingLec ? (matchingLec.professor || c.professor) : c.professor,
        instructions: matchingLec 
          ? (matchingLec.whatsappContext || (matchingLec.keyConcepts && matchingLec.keyConcepts[0]) || "Class summary is ready. Revise concepts.") 
          : c.instructions,
        lecture: matchingLec || null
      };
    })
    .filter(c => userRole !== "student" || c.lecture !== null);

  // Active class from schedule
  const activeClass = selectedStoryIndex !== null ? activeDayClasses[selectedStoryIndex] : null;

  // Audio playback state inside the story viewer matching student phone logic
  const [localIsPlayingAudio, setLocalIsPlayingAudio] = useState(false);
  const [localAudioCurrentTime, setLocalAudioCurrentTime] = useState(0);
  const [localAudioDuration, setLocalAudioDuration] = useState(0);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);

  const isPlayingAudio = globalAudio && activeClass?.lecture
    ? (globalAudio.lectureId === activeClass.lecture.id && globalAudio.isPlaying)
    : localIsPlayingAudio;

  const audioCurrentTime = globalAudio && activeClass?.lecture
    ? (globalAudio.lectureId === activeClass.lecture.id ? globalAudio.currentTime : 0)
    : localAudioCurrentTime;

  const audioDuration = globalAudio && activeClass?.lecture
    ? (globalAudio.lectureId === activeClass.lecture.id ? globalAudio.duration : 0)
    : localAudioDuration;

  // Automatically pause/resume story slide autoplay when audio is playing
  useEffect(() => {
    if (isPlayingAudio) {
      setIsPaused(true);
    } else {
      setIsPaused(false);
    }
  }, [isPlayingAudio]);

  const durationPerStory = 5000; // 5 seconds per story slide

  const pressStartTimeRef = useRef<number>(0);
  const pressStartXRef = useRef<number>(0);
  const isPressingRef = useRef<boolean>(false);

  const handlePressStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") || 
      target.closest("a") || 
      target.closest("audio") ||
      target.id === "story-close-btn" ||
      target.closest("#story-close-btn")
    ) {
      return; // Do not intercept clickable widgets
    }

    // Determine coordinate
    let clientX = 0;
    if ("touches" in e) {
      clientX = e.touches[0]?.clientX || 0;
    } else {
      clientX = e.clientX;
    }

    pressStartTimeRef.current = Date.now();
    pressStartXRef.current = clientX;
    isPressingRef.current = true;
    setIsPaused(true);
  };

  const handlePressEnd = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isPressingRef.current) return;
    isPressingRef.current = false;

    // Resume standard autoplay if the audio player is NOT playing
    setIsPaused(isPlayingAudio ? true : false);

    const holdDuration = Date.now() - pressStartTimeRef.current;
    if (holdDuration < 250) {
      // Treat as quick tap/click
      const width = window.innerWidth;
      const x = pressStartXRef.current;
      if (x < width * 0.33) {
        handlePrevStory();
      } else {
        handleNextStory();
      }
    }
  };

  // Stop/reset audio whenever slide changes or modal closes to prevent overlay bleeding
  useEffect(() => {
    if (localAudioRef.current) {
      localAudioRef.current.pause();
      localAudioRef.current = null;
    }
    setLocalIsPlayingAudio(false);
    setLocalAudioCurrentTime(0);
    setLocalAudioDuration(0);
  }, [selectedStoryIndex]);

  useEffect(() => {
    return () => {
      if (localAudioRef.current) {
        localAudioRef.current.pause();
      }
    };
  }, []);

  const parseDuration = (dur: string): number => {
    try {
      if (dur.includes(":")) {
        const parts = dur.split(":");
        if (parts.length === 2) {
          return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        } else if (parts.length === 3) {
          return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
        }
      }
      return parseInt(dur, 10) * 60 || 180;
    } catch {
      return 180;
    }
  };

  const handleToggleAudio = () => {
    if (!activeClass || !activeClass.lecture || !activeClass.lecture.audioUrl) return;

    if (onToggleAudio) {
      onToggleAudio(activeClass.lecture);
      return;
    }

    if (!localAudioRef.current) {
      const audio = new Audio(activeClass.lecture.audioUrl);
      localAudioRef.current = audio;

      audio.addEventListener("timeupdate", () => {
        setLocalAudioCurrentTime(audio.currentTime || 0);
      });
      audio.addEventListener("loadedmetadata", () => {
        setLocalAudioDuration(audio.duration || 0);
      });
      audio.addEventListener("ended", () => {
        setLocalIsPlayingAudio(false);
        setLocalAudioCurrentTime(0);
        setIsPaused(false); // resume autoplay slide
      });

      audio.play().catch(e => console.warn("Failed to play audio:", e));
      setLocalIsPlayingAudio(true);
      setIsPaused(true); // pause slide autoplay
      return;
    }

    if (localIsPlayingAudio) {
      localAudioRef.current.pause();
      setLocalIsPlayingAudio(false);
      setIsPaused(false); // resume slide autoplay
    } else {
      localAudioRef.current.play().catch(e => console.warn("Failed to play audio:", e));
      setLocalIsPlayingAudio(true);
      setIsPaused(true); // pause slide autoplay
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Handle story automatic transitions
  useEffect(() => {
    if (selectedStoryIndex === null) {
      setProgress(0);
      return;
    }

    if (isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const intervalStep = 60; // Upwards ticks every 60ms
    const increment = (intervalStep / durationPerStory) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Time to move to the next slide
          handleNextStory();
          return 0;
        }
        return prev + increment;
      });
    }, intervalStep);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [selectedStoryIndex, isPaused, activeDayClasses.length]);

  // Navigate to next story card
  const handleNextStory = () => {
    setProgress(0);
    setSelectedStoryIndex((prev) => {
      if (prev === null) return null;
      if (prev < activeDayClasses.length - 1) {
        return prev + 1;
      } else {
        // Loop back to close or reset
        return null;
      }
    });
  };

  // Navigate to previous story card
  const handlePrevStory = () => {
    setProgress(0);
    setSelectedStoryIndex((prev) => {
      if (prev === null) return null;
      if (prev > 0) {
        return prev - 1;
      }
      return 0; // stay at first story
    });
  };

  const handleOpenStory = (index: number) => {
    setSelectedStoryIndex(index);
    setProgress(0);
    setIsPaused(false);
  };

  return (
    <>
      <section aria-label="Today's classes" className="border-b border-border bg-card/70 backdrop-blur-md mb-2">
        <div className="mx-auto max-w-screen-sm px-4 py-4 space-y-3">
          
          {/* Section title & Header */}
          <div className="flex items-center justify-between animate-fade-in flex-wrap gap-2">
            <h2 id="today-bams-title" className="font-display text-xs font-bold text-foreground flex items-center gap-2 flex-wrap">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />
              <span className="text-[10px] font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded-full font-bold shrink-0">
                {activeDay.toUpperCase()} SCHEDULE • {getDateOfWeekday(activeDay)}
              </span>
            </h2>
          </div>

          {/* Weekday navigation tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide" id="timetable-weekday-tabs">
            {WEEKDAYS.map((day) => {
              const isSelected = activeDay === day;
              // Real-world dynamic "Today" calculation
              const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
              const todayName = daysOfWeek[getIndianDate().getDay()];
              const isToday = day === todayName;

              const dayLecturesCount = lecturesByDay?.[day]?.length || 0;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setActiveDay(day);
                    setSelectedStoryIndex(null);
                    setProgress(0);
                  }}
                  className={`flex-shrink-0 px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 flex items-center gap-1.5 border outline-none ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-[0_3px_12px_rgba(var(--color-primary),0.2)] scale-[1.02]"
                      : "bg-background/80 hover:bg-background text-muted-foreground border-border/70"
                  }`}
                >
                  <span>{day.substring(0, 3)}</span>

                  {dayLecturesCount > 0 && (
                    <span className={`inline-flex items-center justify-center rounded-full text-[9px] font-black h-4 min-w-4 px-1 ${
                      isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
                    }`}>
                      {dayLecturesCount}
                    </span>
                  )}

                  {isToday && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-exam opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-exam"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Slots list of circles representing scheduled classes */}
          {activeDay === "Sunday" ? null : activeDayClasses.length === 0 ? (
            <div className="py-6 text-center text-xs text-stone-500 bg-card hover:bg-[#f6f5f0] rounded-2xl border border-border flex flex-col items-center justify-center gap-1.5 p-4 transition-all duration-300 shadow-sm">
              <span className="text-lg filter grayscale select-none opacity-40 animate-pulse">📭</span>
              <p className="font-bold text-stone-700">First recording starts tomorrow!</p>
              <p className="text-[10px] text-stone-500 leading-normal max-w-xs mx-auto">
                Stories pop up automatically once class recordings are published for today's syllabus slots.
              </p>
            </div>
          ) : (
            <ul className="scrollbar-hide flex gap-5 overflow-x-auto pb-2 pt-2" id="stories-list">
              {activeDayClasses.map((c, idx) => {
                const hueCover = SUBJECT_COVERS[c.subject] || "oklch(0.45 0.12 35)";
                return (
                  <li
                    key={c.id}
                    id={`story-item-${c.id}`}
                    onClick={() => handleOpenStory(idx)}
                    className="flex w-16 flex-shrink-0 flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform animate-fade-in relative"
                  >
                    <div
                      className={
                        "rounded-full p-[2.5px] transition-all duration-300 group-hover:scale-105 " +
                        (c.lecture
                          ? "story-ring shadow-[0_0_12px_rgba(var(--color-primary),0.15)]"
                          : c.status === "live"
                            ? "bg-gradient-to-r from-rose-500 to-amber-500 animate-pulse ring-1 ring-rose-500/30 shadow-[0_0_10px_rgba(239,68,68,0.25)]"
                            : "border border-border/80 bg-muted/50")
                      }
                    >
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-full text-foreground ring-2 ring-background relative overflow-hidden group-hover:scale-105 transition-all shadow-md"
                      >
                        <img 
                          src={SUBJECT_IMAGES[c.subject] || "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=200"} 
                          alt={c.subject}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        {c.status === "live" && (
                          <span className="absolute bottom-0 right-0 flex h-3 w-3 z-10">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                        )}
                        {/* Play overlay badge on recorded logs */}
                        {c.lecture && (
                          <div className="absolute inset-0 bg-primary/25 opacity-20 group-hover:opacity-45 transition-opacity duration-300 flex items-center justify-center">
                            <div className="bg-white/95 rounded-full p-1 shadow-sm scale-90 group-hover:scale-100 transition-transform">
                              <Play className="h-2 w-2 text-primary fill-primary" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="w-full text-center leading-none">
                      <span className="line-clamp-1 text-center text-[10px] font-extrabold text-foreground w-full leading-tight select-none">
                        {c.subject}
                      </span>
                      <span className="text-[9px] text-muted-foreground select-none font-bold mt-0.5 block">
                        {c.status === "live" ? "🔴 LIVE" : c.lecture ? "📚 READ" : c.time}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Modern High-Fidelity fullscreen stories viewer */}
      {selectedStoryIndex !== null && activeClass && (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/98 backdrop-blur-md text-foreground select-none transition-all animate-fade-in touch-none cursor-pointer"
          id="story-modal-overlay"
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
        >
          {/* Bleeding Background Image */}
          <div className="absolute inset-0 z-0 overflow-hidden opacity-30 select-none pointer-events-none">
            <img 
              src={SUBJECT_IMAGES[activeClass.subject] || "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=800"} 
              alt="Story Background"
              className="h-full w-full object-cover scale-105 blur-[3px]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-[#fafaf9]/80 to-white" />
          </div>

          {/* Constrain layout to typical smartphone width for that cozy story vibe */}
          <div className="relative z-10 flex h-full w-full max-w-md flex-col justify-between p-4 px-5">
            
            {/* Top Header: story segment bars & details */}
            <div className="space-y-4">
              
              {/* Chronological bar segmented indicators */}
              <div className="flex gap-1.5 w-full pt-1" id="story-segment-bars">
                {activeDayClasses.map((item, idx) => {
                  let barWidth = "0%";
                  if (idx < selectedStoryIndex) {
                    barWidth = "100%";
                  } else if (idx === selectedStoryIndex) {
                    barWidth = `${progress}%`;
                  }
                  
                  return (
                    <div key={item.id} className="h-[3px] flex-1 rounded-full bg-border overflow-hidden">
                      <div 
                        className="h-full bg-primary/95 transition-all duration-75 origin-left"
                        style={{ width: barWidth }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Class Info segment header: Lecturer profile, subject, dynamic badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={(activeClass.lecture ? "story-ring" : "border border-border") + " rounded-full p-[2px]"}>
                    <div 
                      className="flex h-10 w-10 items-center justify-center rounded-full text-white ring-2 ring-background relative overflow-hidden"
                    >
                      <img 
                        src={SUBJECT_IMAGES[activeClass.subject] || "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=200"} 
                        alt={activeClass.subject}
                        className="absolute inset-0 h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 leading-none">
                      <h3 className="text-xs font-black tracking-tight text-foreground">
                        {activeClass.lecture ? activeClass.lecture.professorHandle : `dr_${activeClass.professor.toLowerCase().split(".")[1]?.trim().split(" ")[0]?.replace(/[^a-z0-9_]/g, "") || "professor"}`}
                      </h3>
                      <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8.5px] font-black text-white select-none">
                        ✓
                      </span>
                      <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[8px] font-extrabold tracking-widest text-primary animate-pulse ml-0.5 uppercase border border-primary/25">
                        {activeClass.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-1">
                      {activeClass.subject} • {activeClass.lecture ? activeClass.lecture.timeAgo : `${activeClass.time} today`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedStoryIndex(null)}
                    className="p-2 rounded-full hover:bg-muted text-foreground active:scale-95 transition-transform z-35"
                    id="story-close-btn"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Middle Main: High impact visual information (Tutor, Time, Topic, Subject) */}
            <div 
              className="my-auto flex flex-col justify-center space-y-6 text-center py-4 px-1 z-10"
              id="story-middle-clickzone"
            >
              {/* Subject Tag */}
              <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-[10px] font-bold text-primary tracking-wide shadow-sm backdrop-blur-md">
                <Calendar className="h-3 w-3 text-primary" />
                {activeClass.subject}
              </div>

              {/* Topic Cover */}
              <div className="space-y-2.5 px-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#cca43b]">
                  {activeClass.lecture ? "🔴 LIVE LECTURE SUMMARY" : "Class Schedule Status"}
                </span>
                <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-foreground leading-snug drop-shadow-sm px-1">
                  {activeClass.lecture ? `"${activeClass.topic}"` : "Topic updates dynamically once recorded"}
                </h1>
              </div>

              {/* Tutor Badge */}
              <div className="mx-auto flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-600">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" />
                  {activeClass.lecture ? "Audiotaped by Representative" : "Conducted by Professor"}
                </div>
                <p className="text-xs font-extrabold text-foreground">
                  {activeClass.professor}
                </p>
              </div>
            </div>

            {/* Bottom Section: Emphasized Class Important Instructions */}
            <div className="space-y-3 pb-3">
              
              {/* Conditional summaries and key concepts */}
              {activeClass.lecture ? (
                <div className="space-y-2 text-left" id="story-instruction-card">
                  {/* Key Concepts glass card */}
                  {activeClass.lecture.keyConcepts && activeClass.lecture.keyConcepts.length > 0 && (
                    <div className="rounded-xl bg-card border border-border p-3 space-y-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                        <Award className="h-3 w-3 text-primary shrink-0" />
                        ✨ Core Lessons & Key Concepts
                      </span>
                      <ul className="space-y-1 text-[11px] text-stone-600">
                        {activeClass.lecture.keyConcepts.slice(0, 2).map((concept, index) => (
                          <li key={index} className="flex gap-1.5 items-start">
                            <span className="text-primary font-bold shrink-0 pt-0.5">•</span>
                            <span className="line-clamp-2 leading-tight">{concept}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* NCISM Exam Highlights */}
                  {activeClass.lecture.examAlert && (
                    <div className="flex gap-2.5 rounded-2xl border border-exam/20 bg-exam/10 p-3 text-left">
                      <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-exam shrink-0" />
                      <div className="text-[11px] leading-relaxed text-stone-900">
                        <span className="font-extrabold text-exam uppercase tracking-wider text-[10px] block mb-0.5">
                          viva / Exam Alert:
                        </span>
                        {activeClass.lecture.examAlert}
                      </div>
                    </div>
                  )}

                  {/* Lecturer Task block (same as it is in lecturer task of feed) */}
                  {activeClass.lecture.whatsappContext && (
                    <div className="flex gap-2.5 rounded-2xl border border-success/20 bg-success/10 p-3 text-left">
                      <MessageCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success shrink-0" />
                      <div className="text-[11px] leading-relaxed text-stone-950">
                        <span className="font-extrabold text-success uppercase tracking-wider text-[10px] block mb-0.5">
                          Given Assignment / Task:
                        </span>
                        "{activeClass.lecture.whatsappContext}"
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Important Instruction Card for scheduled class with neat styling and high contrast */
                <div 
                  className="rounded-2xl bg-card border border-primary/25 p-4 space-y-2 relative overflow-hidden shadow-md"
                  id="story-instruction-card"
                >
                  <div className="absolute top-0 right-0 h-16 w-16 bg-primary/5 rounded-full blur-xl animate-pulse" />
                  
                  <h4 className="text-[11px] font-extrabold text-primary tracking-wider uppercase flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary animate-bounce" />
                    IMPORTANT CLASS INSTRUCTIONS
                  </h4>
                  <p className="text-xs text-stone-800 font-medium leading-relaxed">
                    {activeClass.instructions}
                  </p>
                </div>
              )}

              {/* Quick links to navigate or browse classes */}
              <div className="flex gap-2.5 pt-1 z-35">
                <button
                  type="button"
                  onClick={() => {
                    // Filter the feed to this class subject and close
                    onClassClick?.(activeClass.subject);
                    setSelectedStoryIndex(null);
                  }}
                  className="w-full py-3 text-xs font-bold tracking-wide rounded-xl bg-primary hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-md text-primary-foreground"
                  id="story-view-lectures-btn"
                >
                  Browse Lectures <ArrowRight className="h-3.5 w-3.5 animate-pulse" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
