import React, { useMemo, useState, useEffect } from "react";
import { 
  Search, 
  Folder, 
  ChevronRight, 
  Inbox, 
  Calendar, 
  Play, 
  Pause, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Sparkles, 
  MessageSquare, 
  MessageCircle,
  FileText, 
  Download, 
  Volume2,
  Clock,
  User,
  GraduationCap
} from "lucide-react";
import { subjects, SUBJECT_COVERS } from "../data/lectures";
import type { AppState, Lecture } from "../types";
import { isSubjectMatching } from "../types";

type LibraryViewProps = {
  onChangeRoute: (route: AppState["route"]) => void;
  onFilterSubject: (subjectName: string) => void;
  recentLectures: Lecture[];
  showToast: (message: string, type?: "success" | "warning" | "info") => void;
};

export function LibraryView({ onChangeRoute, onFilterSubject, recentLectures, showToast }: LibraryViewProps) {
  const [query, setQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [expandedLecId, setExpandedLecId] = useState<string | null>(null);
  const [showTranscriptId, setShowTranscriptId] = useState<string | null>(null);
  
  // Audio playback state
  const [playingLecId, setPlayingLecId] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);

  // Stop dynamic audio playback when leaving/destroying route
  useEffect(() => {
    return () => {
      if (playingAudio) {
        playingAudio.pause();
      }
    };
  }, [playingAudio]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()));
  }, [query]);

  // Recalculate dynamic files/lecture count based on real published lectures
  const subjectsMap = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sub of subjects) {
      counts[sub.name] = sub.lectures;
    }
    for (const lec of recentLectures) {
      const matchedSub = subjects.find(s => isSubjectMatching(lec.subject, s.name));
      const key = matchedSub ? matchedSub.name : lec.subject;
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [recentLectures]);

  // Group all recorded lectures/feeds by date
  const groupedLectures = useMemo(() => {
    const groups: Record<string, Lecture[]> = {};
    
    // Filter by selectedSubject if chosen
    const listToFilter = selectedSubject 
      ? recentLectures.filter(l => isSubjectMatching(l.subject, selectedSubject))
      : recentLectures;

    for (const lec of listToFilter) {
      // Prioritize explicit dateStr, default to scheduled weekday dayName, or fellback
      const key = lec.dateStr || "General Study Archive";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(lec);
    }
    
    // Sort keys descending
    const sortedDates = Object.keys(groups).sort((a, b) => {
      const timeA = Date.parse(a) || 0;
      const timeB = Date.parse(b) || 0;
      return timeB - timeA;
    });

    return sortedDates.map(date => ({
      date,
      lectures: groups[date]
    }));
  }, [recentLectures, selectedSubject]);

  // Filter grouped lectures by active search query
  const searchedGroupedLectures = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return groupedLectures;

    return groupedLectures.map(group => {
      const filtered = group.lectures.filter(l => 
        l.topic.toLowerCase().includes(trimmed) || 
        l.subject.toLowerCase().includes(trimmed) || 
        l.professor.toLowerCase().includes(trimmed) || 
        (l.whatsappContext || "").toLowerCase().includes(trimmed) ||
        (l.examAlert || "").toLowerCase().includes(trimmed) ||
        (l.transcript || "").toLowerCase().includes(trimmed)
      );
      return {
        ...group,
        lectures: filtered
      };
    }).filter(group => group.lectures.length > 0);
  }, [groupedLectures, query]);

  const handleSubjectClick = (subName: string) => {
    if (selectedSubject?.toLowerCase() === subName.toLowerCase()) {
      setSelectedSubject(null);
      showToast("Cleared syllabus filter", "info");
    } else {
      setSelectedSubject(subName);
      showToast(`Show records for ${subName}`, "info");
    }
  };

  const handleTogglePlay = (e: React.MouseEvent, lec: Lecture) => {
    e.stopPropagation();
    
    if (playingLecId === lec.id) {
      if (playingAudio) {
        playingAudio.pause();
        setPlayingLecId(null);
      }
    } else {
      if (playingAudio) {
        playingAudio.pause();
      }
      
      const url = lec.audioUrl || (lec.audioBase64 ? `data:audio/wav;base64,${lec.audioBase64}` : null);
      if (url) {
        const audio = new Audio(url);
        audio.play().catch(() => {
          showToast("Audio playback interrupted. Check device settings.", "warning");
        });
        setPlayingAudio(audio);
        setPlayingLecId(lec.id);
        
        audio.onended = () => {
          setPlayingLecId(null);
        };
      } else {
        showToast("Audio simulation: Core recitals are ready for this lecture topic.", "info");
      }
    }
  };

  const toggleExpandLecture = (id: string) => {
    setExpandedLecId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="mx-auto max-w-screen-sm px-4 py-5 space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          Ayurveda BAMS Library
        </h1>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Comprehensive study records, peer transcripts, and dynamic voice recording archives organized cleanly by date and syllabus topic.
        </p>
      </div>

      {/* Dynamic Search Filter */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search topics, dates, guidelines, or subjects..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl border border-border bg-card/50 py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-primary/50 focus:bg-card placeholder:text-muted-foreground/75"
        />
      </div>

      {/* Section A: Subjects Grid Folder Directory */}
      <section className="space-y-3">
        <h2 className="font-display text-xs font-bold uppercase tracking-widest text-primary/80">
          Syllabus Directories
        </h2>
        
        <div className="grid grid-cols-2 gap-3">
          {filteredSubjects.map((s) => {
            const count = subjectsMap[s.name] ?? s.lectures;
            const isSelected = selectedSubject?.toLowerCase() === s.name.toLowerCase();
            return (
              <button
                key={s.name}
                id={`folder-${s.name.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => handleSubjectClick(s.name)}
                className={`group flex flex-col justify-between gap-3 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-card active:scale-98 ${
                  isSelected 
                    ? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-sm" 
                    : "border-border bg-card/50"
                }`}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
                  style={{ backgroundColor: s.color }}
                >
                  <Folder className="h-5 w-5" />
                </div>
                
                <div>
                  <div className="font-display text-sm font-bold leading-tight text-foreground line-clamp-2">
                    {s.name}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                    <span>{count === 0 ? "No records" : `${count} lectures`}</span>
                    <ChevronRight className={`h-3 w-3 transition-transform ${isSelected ? "translate-x-1" : "group-hover:translate-x-0.5"}`} />
                  </div>
                </div>
              </button>
            );
          })}

          {filteredSubjects.length === 0 && query.trim() !== "" && (
            <div className="col-span-2 py-4 text-center text-xs text-muted-foreground font-medium">
              No matching folders found.
            </div>
          )}
        </div>
      </section>

      {/* Active Filter Banner */}
      {selectedSubject && (
        <div id="active-filter-banner" className="flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 px-3.5 py-2.5 text-xs text-primary animate-fade-in">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span>Active Folder:</span>
            <span className="font-extrabold bg-primary text-primary-foreground px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wide">{selectedSubject}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedSubject(null);
              showToast("Cleared syllabus folder filter", "info");
            }}
            className="text-[11px] font-bold hover:underline focus:outline-none"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Section B: Stored Feeds Catalog organized according to Date & Topic Name */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xs font-bold uppercase tracking-widest text-primary/80">
            Recorded Feeds Archive (By Date)
          </h2>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
            {recentLectures.length} Total Feeds
          </span>
        </div>

        {searchedGroupedLectures.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border bg-card/25 px-4 py-12 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Inbox className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-foreground">No lectures found</p>
            <p className="max-w-xs text-[10px] text-muted-foreground leading-relaxed">
              {query 
                ? "Refine your search keywords for subjects or lecture topic titles."
                : "Recordings and feed cards will automatically catalog here ordered dynamically by date."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {searchedGroupedLectures.map((group) => (
              <div key={group.date} className="space-y-2.5">
                {/* Date Group Header */}
                <div className="flex items-center gap-2 px-1 py-0.5 border-b border-border/40">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-extrabold text-foreground font-display tracking-tight">
                    {group.date}
                  </span>
                </div>

                {/* Lectures under this Date */}
                <div className="space-y-2">
                  {group.lectures.map((lec) => {
                    const isExpanded = expandedLecId === lec.id;
                    const isPlaying = playingLecId === lec.id;
                    const hasAudio = Boolean(lec.audioUrl || lec.audioBase64);
                    
                    return (
                      <div 
                        key={lec.id}
                        onClick={() => toggleExpandLecture(lec.id)}
                        className={`group rounded-2xl border transition-all text-left overflow-hidden bg-card cursor-pointer ${
                          isExpanded 
                            ? "border-primary/40 shadow-sm" 
                            : "border-border hover:border-border-hover"
                        }`}
                      >
                        {/* Summary Header Block */}
                        <div className="p-4 flex items-start gap-3.5 justify-between">
                          <div className="space-y-1.5 min-w-0 flex-1">
                            {/* Subject tag & weekday details */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span 
                                className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full text-white"
                                style={{ backgroundColor: SUBJECT_COVERS[lec.subject] || "oklch(0.5 0.1 50)" }}
                              >
                                {lec.subject}
                              </span>
                              <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {lec.duration || "N/A"}
                              </span>
                            </div>

                            {/* Lecture Topic Name (Primary Name of Lecture) */}
                            <h3 className="font-display text-sm font-bold text-foreground leading-snug line-clamp-2">
                              {lec.topic}
                            </h3>

                            {/* Professor Badge */}
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <User className="h-3 w-3 shrink-0" />
                              <span className="truncate">{lec.professor}</span>
                            </div>
                          </div>

                          {/* Controls (Quick Play & Chevron toggle) */}
                          <div className="flex items-center gap-1.5 shrink-0 ml-1">
                            {hasAudio && (
                              <button
                                onClick={(e) => handleTogglePlay(e, lec)}
                                className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
                                  isPlaying 
                                    ? "bg-primary text-primary-foreground border-primary" 
                                    : "bg-muted/40 hover:bg-muted text-foreground border-border hover:scale-105"
                                }`}
                                title={isPlaying ? "Pause voice note" : "Listen to lecture highlights"}
                              >
                                {isPlaying ? (
                                  <Pause className="h-3.5 w-3.5 fill-current animate-pulse" />
                                ) : (
                                  <Play className="h-3.5 w-3.5 translate-x-0.5 fill-current text-primary" />
                                )}
                              </button>
                            )}

                            <div className="text-muted-foreground/60 group-hover:text-foreground">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Expanded Detail pane */}
                        {isExpanded && (
                          <div className="border-t border-border/50 bg-muted/15 p-4 space-y-4 text-xs leading-relaxed animate-fade-in">
                            {/* Key concept points summary block */}
                            <div className="space-y-1.5">
                              <h4 className="font-bold text-foreground font-display flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wider">
                                <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                                Recited Key Concepts
                              </h4>
                              {lec.keyConcepts && lec.keyConcepts.length > 0 ? (
                                <ul className="space-y-1.5 pl-1.5">
                                  {lec.keyConcepts.map((item, index) => (
                                    <li key={index} className="flex items-start gap-1.5 text-foreground/80">
                                      <span className="mt-1 text-primary shrink-0 text-[10px]">•</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-muted-foreground italic pl-1">No recorded point highlights found.</p>
                              )}
                            </div>

                            {/* Syllabus WhatsApp Guidelines */}
                            {lec.whatsappContext && (
                              <div className="flex gap-2.5 rounded-2xl border border-success/30 bg-success/5 p-3.5 text-left">
                                <MessageCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                                <div className="text-xs leading-relaxed text-foreground/90">
                                  <span className="font-extrabold text-success uppercase tracking-wider text-[10px] block mb-0.5">
                                    Given Assignment / Task:
                                  </span>
                                  "{lec.whatsappContext}"
                                </div>
                              </div>
                            )}

                            {/* NCISM Exam Highlights */}
                            {lec.examAlert && (
                              <div className="space-y-1.5 rounded-xl bg-orange-500/10 p-3 border border-orange-500/15 text-orange-600 dark:text-orange-400">
                                <h4 className="font-bold font-display flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                  viva / Exam Alert
                                </h4>
                                <p className="leading-normal text-[11px] font-medium font-sans">
                                  {lec.examAlert}
                                </p>
                              </div>
                            )}

                            {/* Toggleable Transcript view */}
                            {lec.transcript && (
                              <div className="space-y-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowTranscriptId(prev => prev === lec.id ? null : lec.id);
                                  }}
                                  className="flex items-center gap-1 text-[11px] font-bold text-primary/80 hover:text-primary hover:underline"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  {showTranscriptId === lec.id ? "Hide Raw Transcript" : "Examine Lecture Transcript"}
                                </button>
                                
                                {showTranscriptId === lec.id && (
                                  <div className="rounded-xl border border-border bg-card p-3 max-h-36 overflow-y-auto font-mono text-[10px] leading-relaxed text-muted-foreground scrollbar-thin">
                                    {lec.transcript}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Associated file attachment */}
                            {lec.attachment && (
                              <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/10">
                                    <FileText className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 leading-normal">
                                    <p className="truncate text-[11px] font-bold text-foreground">
                                      {lec.attachment.name}
                                    </p>
                                    <p className="text-[9px] text-muted-foreground">
                                      PDF • {lec.attachment.size}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    showToast(`Downloading: ${lec.attachment?.name}`, "success");
                                  }}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted font-bold hover:scale-105 active:scale-95 text-foreground shrink-0"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}

                            {/* Switch to feed button */}
                            <div className="flex justify-end pt-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onFilterSubject(lec.subject);
                                  onChangeRoute("feed");
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:brightness-110"
                              >
                                View full feed board →
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
