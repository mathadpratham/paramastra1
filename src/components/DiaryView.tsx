import React, { useState, useEffect, useMemo } from "react";
import { 
  Calendar, 
  User, 
  BookOpen, 
  CheckSquare, 
  Square, 
  Trash2, 
  Plus, 
  Clock, 
  ClipboardList, 
  CheckCircle,
  HelpCircle,
  Sparkles,
  Award,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Download,
  Check,
  TrendingUp,
  FileSpreadsheet,
  MessageCircle
} from "lucide-react";
import { getApiUrl } from "../config";
import { subjects, SUBJECT_COVERS, getIndianDate } from "../data/lectures";
import type { Lecture } from "../types";

type DiaryEntry = {
  id: string;
  dateStr: string; // "YYYY-MM-DD" style representation
  dayName: string; // e.g., "Saturday"
  timeSlot: string; // e.g., "09:00 AM - 10:00 AM"
  subject: string;
  professor: string;
  topic: string;
  assignment: string;
};

type DiaryViewProps = {
  userRole?: "student" | "cr" | null;
  showToast: (message: string, type?: "success" | "warning" | "info") => void;
  feedLectures?: Lecture[];
};

// Local date conversions matching backend automation exactly
const convertFeedDateToDiaryDate = (feedDateStr?: string): string => {
  if (!feedDateStr) return "2026-06-06";
  const trimmed = feedDateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  
  const match = trimmed.match(/^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i);
  if (match) {
    const day = match[1].padStart(2, "0");
    const monthStr = match[2].toLowerCase();
    const year = match[3];
    const months: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
    };
    const month = months[monthStr] || "06";
    return `${year}-${month}-${day}`;
  }
  return feedDateStr;
};

const getAutoAssignmentForSubject = (subject: string, topic: string, keyConcepts: string[] = []): string => {
  const conceptsText = keyConcepts && keyConcepts.length > 0 ? keyConcepts.slice(0, 3).join(", ") : "";
  const sub = String(subject || "").toLowerCase();
  
  if (sub.includes("rachana") || sub.includes("anatomy")) {
    return `Draw a neat, highly-detailed anatomical chart of "${topic}"${conceptsText ? ` (focusing on: ${conceptsText})` : ""} in your Rachana Sharir record book. Reference the classic Sushruta Samhita descriptions.`;
  }
  if (sub.includes("kriya") || sub.includes("physiology")) {
    return `Draft a conceptual flow map of "${topic}"${conceptsText ? ` with emphasis on: ${conceptsText}` : ""}. Cite Charaka Sutrasthana shlokas relating to its physiological actions.`;
  }
  if (sub.includes("padartha") || sub.includes("philosophy") || sub.includes("vijnana")) {
    return `Write a 500-word critical analysis on "${topic}", explaining how ${conceptsText || "the causation theories"} apply directly to Ayurvedic pathology and therapeutics.`;
  }
  if (sub.includes("sanskrit") || sub.includes("bhasha")) {
    return `Transcribe the core Shlokas for "${topic}" and list the grammatical breakdown of key nouns. Correct pronunciation matrix due by next Monday.`;
  }
  if (sub.includes("samhita") || sub.includes("adhyayan")) {
    return `Read Ashtanga Hridaya chapter matching "${topic}". List down the critical treatment parameters or recipes outlined in the text.`;
  }
  return `Write a comprehensive self-study summary on "${topic}" clarifying: ${conceptsText || "clinical classification and diagnostic value in BAMS"}.`;
};

// Elegant seed data mimicking authentic First-Year BAMS classes
const DEFAULT_DIARY_SEEDS: DiaryEntry[] = [
  {
    id: "diary-seed-1",
    dateStr: "2026-06-06",
    dayName: "Saturday",
    timeSlot: "09:00 AM - 10:00 AM",
    subject: "Rachana Sharir",
    professor: "Dr. Sandeep Sharma",
    topic: "Introduction to Asthi Sharir & Osteology",
    assignment: "Draw the 5 classifications of bone in your lab drawing journal."
  },
  {
    id: "diary-seed-2",
    dateStr: "2026-06-06",
    dayName: "Saturday",
    timeSlot: "10:15 AM - 11:15 AM",
    subject: "Kriya Sharir",
    professor: "Dr. Kavitha Rao",
    topic: "Pitta Dosha Sub-types & Functions",
    assignment: "Memorize the Pachaka Pitta shloka for tomorrow's recitation session."
  },
  {
    id: "diary-seed-3",
    dateStr: "2026-06-06",
    dayName: "Saturday",
    timeSlot: "11:30 AM - 12:30 PM",
    subject: "Sanskritam Evum Ayurveda Ithihasa",
    professor: "Prof. Acharya Shastri",
    topic: "Sanskrit Noun Cases (Vibhaktis)",
    assignment: "Write out the declension tables of 'Nara' and 'Asthi' 3 times."
  },
  {
    id: "diary-seed-4",
    dateStr: "2026-06-05", // Friday
    dayName: "Friday",
    timeSlot: "09:15 AM - 10:15 AM",
    subject: "Samhita Adyayan-1",
    professor: "Dr. Mukund Soni",
    topic: "Ashtanga Hridaya Sutrasthana - Chapter 1 Recitals",
    assignment: "Prepare a translation matrix for the first 3 shlokas."
  },
  {
    id: "diary-seed-5",
    dateStr: "2026-06-05", // Friday
    dayName: "Friday",
    timeSlot: "11:30 AM - 12:30 PM",
    subject: "Padartha Vijnana",
    professor: "Dr. Rajeshwar Mishra",
    topic: "Karya-Karana Siddhanta (Theory of Causation)",
    assignment: "Complete the comparison diagram between Satkaryavada and Asatkaryavada."
  }
];

// Helper to parse "YYYY-MM-DD" safely in local timezone to avoid any UTC shift bugs
const parseLocalDate = (dateStr: string): Date => {
  const parts = dateStr.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
};

// Helper to format Date back to "YYYY-MM-DD" safely
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function DiaryView({ userRole, showToast, feedLectures }: DiaryViewProps) {
  // Current active date string initialization
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    try {
      return formatLocalDate(getIndianDate());
    } catch {
      return "2026-06-06";
    }
  });

  // Filter mode state
  const [viewMode, setViewMode] = useState<"calendar" | "uncompleted" | "tomorrow">("calendar");

  // Load state
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [completedAssignments, setCompletedAssignments] = useState<Record<string, boolean>>({});

  // Form states for adding/editing logs
  const [showAddForm, setShowAddForm] = useState(false);
  const [formTimeSlot, setFormTimeSlot] = useState("09:00 AM - 10:00 AM");
  const [formSubject, setFormSubject] = useState("Rachana Sharir");
  const [formProfessor, setFormProfessor] = useState("");
  const [formTopic, setFormTopic] = useState("");
  const [formAssignment, setFormAssignment] = useState("");

  // Sync index and fetch
  const fetchDiary = async () => {
    try {
      const classCode = localStorage.getItem("paramastra_class_code") || "default";
      const res = await fetch(getApiUrl(`/api/diary?classCode=${encodeURIComponent(classCode)}`));
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
        return;
      }
    } catch (e) {
      console.warn("API fallback to local persistence:", e);
    }

    // Client-side local storage backup fallback
    try {
      const cached = localStorage.getItem("paramastra_bams_diary_v1");
      if (cached) {
        setEntries(JSON.parse(cached));
      } else {
        localStorage.setItem("paramastra_bams_diary_v1", JSON.stringify(DEFAULT_DIARY_SEEDS));
        setEntries(DEFAULT_DIARY_SEEDS);
      }
    } catch {
      setEntries(DEFAULT_DIARY_SEEDS);
    }
  };

  // Sync on mount
  useEffect(() => {
    void fetchDiary();

    try {
      const cachedComps = localStorage.getItem("paramastra_diary_completed_v1");
      if (cachedComps) {
        setCompletedAssignments(JSON.parse(cachedComps));
      }
    } catch {}
  }, []);

  // Post new entry helper
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProfessor.trim() || !formTopic.trim()) {
      showToast("Professor name and Lecture topic are required.", "warning");
      return;
    }

    const dateObj = parseLocalDate(selectedDate);
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });

    const newLec: DiaryEntry = {
      id: `diary-${Date.now()}`,
      dateStr: selectedDate,
      dayName: dayName,
      timeSlot: formTimeSlot,
      subject: formSubject,
      professor: formProfessor.trim(),
      topic: formTopic.trim(),
      assignment: formAssignment.trim() || "No practical assignment assigned."
    };

    const nextList = [newLec, ...entries];
    setEntries(nextList);

    // Save to local
    try {
      localStorage.setItem("paramastra_bams_diary_v1", JSON.stringify(nextList));
    } catch {}

    // Push to server
    try {
      const classCode = localStorage.getItem("paramastra_class_code") || "default";
      await fetch(getApiUrl("/api/diary"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newLec, classCode })
      });
    } catch (err) {
      console.warn("Server diary sync failed, saved locally:", err);
    }

    showToast("Class logs written to BAMS Academic Diary!", "success");
    
    // Clear inputs
    setFormProfessor("");
    setFormTopic("");
    setFormAssignment("");
    setShowAddForm(false);
  };

  // Delete diary log (CR permission)
  const handleDeleteEntry = async (id: string) => {
    const nextList = entries.filter(e => e.id !== id);
    setEntries(nextList);

    try {
      localStorage.setItem("paramastra_bams_diary_v1", JSON.stringify(nextList));
    } catch {}

    try {
      const classCode = localStorage.getItem("paramastra_class_code") || "default";
      await fetch(getApiUrl(`/api/diary/${id}?classCode=${encodeURIComponent(classCode)}`), { method: "DELETE" });
    } catch (err) {
      console.warn("Server deletion failed, removed locally:", err);
    }

    showToast("Log discarded from the diary.", "warning");
  };

  // Toggle checklist
  const toggleAssignmentCheckbox = (id: string) => {
    const next = {
      ...completedAssignments,
      [id]: !completedAssignments[id]
    };
    setCompletedAssignments(next);
    try {
      localStorage.setItem("paramastra_diary_completed_v1", JSON.stringify(next));
    } catch {}

    if (next[id]) {
      showToast("Great! Task marked as completed.", "success");
    }
  };

  // Day navigation helper
  const changeSelectedDateOffset = (days: number) => {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(formatLocalDate(d));
  };

  // Computed properties
  const activeHumanDate = useMemo(() => {
    const d = parseLocalDate(selectedDate);
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    const dateStr = d.toLocaleDateString("en-IN", options);
    const dayName = d.toLocaleDateString("en-IN", { weekday: "long" });
    return { dateStr, dayName };
  }, [selectedDate]);

  // Dynamically reconcile & synchronize feed Lectures with physical user diary logs
  const allEntries = useMemo(() => {
    // We map over entries and ensure any auto-diary entry matches the current corresponding live lecture fields (assignment, professor) perfectly!
    const combined = entries.map(entry => {
      if (entry && entry.id && entry.id.startsWith("diary-auto-") && Array.isArray(feedLectures)) {
        const matchingLec = feedLectures.find(lec => 
          lec.topic &&
          String(entry.topic).toLowerCase() === String(lec.topic).toLowerCase() && 
          String(entry.subject).toLowerCase() === String(lec.subject).toLowerCase() && 
          entry.dateStr === convertFeedDateToDiaryDate(lec.dateStr)
        );
        if (matchingLec) {
          return {
            ...entry,
            professor: matchingLec.professor || entry.professor,
            assignment: matchingLec.whatsappContext || matchingLec.examAlert || getAutoAssignmentForSubject(matchingLec.subject, matchingLec.topic, matchingLec.keyConcepts || [])
          };
        }
      }
      return entry;
    });
    
    if (Array.isArray(feedLectures)) {
      feedLectures.forEach((lec, idx) => {
        if (!lec.topic) return;
        const targetDate = convertFeedDateToDiaryDate(lec.dateStr);
        
        const exists = combined.some((e) => 
          String(e.topic).toLowerCase() === String(lec.topic).toLowerCase() && 
          String(e.subject).toLowerCase() === String(lec.subject).toLowerCase() && 
          e.dateStr === targetDate
        );
        
        if (!exists) {
          // Derive the dayName
          let dayName = lec.dayName || "Saturday";
          try {
            const dateParts = targetDate.split("-");
            const year = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1;
            const dayVal = parseInt(dateParts[2], 10);
            const dateObj = new Date(year, month, dayVal);
            dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
          } catch (e) {
            console.error("Error parsing date:", e);
          }
          
          // Generate a slot
          const standardTimeSlots = [
            "09:15 AM - 10:15 AM",
            "10:30 AM - 11:30 AM",
            "11:45 AM - 12:45 PM",
            "01:30 PM - 02:30 PM",
            "02:45 PM - 03:45 PM"
          ];
          const countForDay = combined.filter((e) => e.dateStr === targetDate).length;
          const chosenSlot = standardTimeSlots[countForDay % standardTimeSlots.length];
          
          combined.push({
            id: `diary-auto-${lec.id || idx}`,
            dateStr: targetDate,
            dayName: dayName,
            timeSlot: chosenSlot,
            subject: lec.subject || "Rachana Sharir",
            professor: lec.professor || "Dr. Ayurveda Expert",
            topic: lec.topic,
            assignment: lec.whatsappContext || lec.examAlert || getAutoAssignmentForSubject(lec.subject, lec.topic, lec.keyConcepts || [])
          });
        }
      });
    }
    
    return combined.sort((a, b) => {
      const dateA = a.dateStr || "2026-06-06";
      const dateB = b.dateStr || "2026-06-06";
      const cmp = dateB.localeCompare(dateA);
      if (cmp !== 0) return cmp;
      return (a.timeSlot || "").localeCompare(b.timeSlot || "");
    });
  }, [entries, feedLectures]);

  const activeDayEntries = useMemo(() => {
    return allEntries.filter(e => e.dateStr === selectedDate);
  }, [allEntries, selectedDate]);

  // Tomorrow's date helper relative to simulated selection
  const tomorrowDateStr = useMemo(() => {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() + 1);
    return formatLocalDate(d);
  }, [selectedDate]);

  const tomorrowHumanDate = useMemo(() => {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() + 1);
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    return {
      dateStr: d.toLocaleDateString("en-IN", options),
      dayName: d.toLocaleDateString("en-IN", { weekday: "long" })
    };
  }, [selectedDate]);

  // Filters and counts
  const uncompletedCount = useMemo(() => {
    return allEntries.filter(e => !completedAssignments[e.id]).length;
  }, [allEntries, completedAssignments]);

  const otherDaysUncompletedEntries = useMemo(() => {
    return allEntries.filter(e => e.dateStr !== selectedDate && !completedAssignments[e.id]);
  }, [allEntries, selectedDate, completedAssignments]);

  const tomorrowEntries = useMemo(() => {
    return allEntries.filter(e => e.dateStr === tomorrowDateStr);
  }, [allEntries, tomorrowDateStr]);

  const tomorrowCount = useMemo(() => {
    return tomorrowEntries.length;
  }, [tomorrowEntries]);

  const filteredEntries = useMemo(() => {
    if (viewMode === "uncompleted") {
      return allEntries.filter(e => !completedAssignments[e.id]);
    }
    if (viewMode === "tomorrow") {
      return tomorrowEntries;
    }
    return activeDayEntries;
  }, [viewMode, allEntries, completedAssignments, tomorrowEntries, activeDayEntries]);

  // Total completed counts on selected date
  const completedStats = useMemo(() => {
    const total = activeDayEntries.length;
    const completed = activeDayEntries.filter(e => completedAssignments[e.id]).length;
    return { total, completed };
  }, [activeDayEntries, completedAssignments]);

  // Reusable helper to render any list of diary/assignment entries elegantly
  const renderEntriesList = (
    list: DiaryEntry[], 
    emptyTitle: string, 
    emptyDesc: string, 
    isFromFilter: boolean = false
  ) => {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card/20 px-4 py-16 text-center animate-fade-in">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 border border-border text-muted-foreground/60">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-foreground">{emptyTitle}</p>
            <p className="max-w-xs text-[11px] text-muted-foreground leading-relaxed">{emptyDesc}</p>
          </div>
          {!isFromFilter && (
            <button
              onClick={() => {
                setEntries(DEFAULT_DIARY_SEEDS);
                localStorage.setItem("paramastra_bams_diary_v1", JSON.stringify(DEFAULT_DIARY_SEEDS));
                showToast("Simulated authentic BAMS class records!", "success");
              }}
              className="mt-2 text-[11px] font-bold text-primary hover:underline cursor-pointer"
            >
              Populate Sample Logs
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {list.map((lec) => {
          const isChecked = completedAssignments[lec.id] || false;
          return (
            <div 
              key={lec.id}
              className={`relative rounded-3xl border transition-all duration-300 p-4 shrink-0 overflow-hidden ${
                isChecked 
                  ? "border-emerald-500/20 bg-emerald-950/10 opacity-75 shadow-inner" 
                  : "border-border bg-card/50 hover:bg-card hover:border-border-hover shadow-sm"
              }`}
            >
              <div className="flex items-start gap-3 justify-between">
                <div className="space-y-2 min-w-0 flex-1">
                  
                  {/* Subject and Time Slots Header */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span 
                      className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: SUBJECT_COVERS[lec.subject] || "oklch(0.5 0.1 50)" }}
                    >
                      {lec.subject}
                    </span>
                    
                    <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-lg border border-border/20">
                      <Clock className="h-3 w-3 text-primary shrink-0" />
                      <span>{lec.timeSlot}</span>
                    </span>

                    {lec.dateStr !== selectedDate && (
                      <span className="text-[10px] text-primary/80 font-mono font-bold bg-primary/10 px-2s.5 py-0.5 rounded-lg border border-primary/20">
                        {lec.dateStr}
                      </span>
                    )}

                    {/* Explicit Status Badge */}
                    {isChecked ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg uppercase tracking-wider font-mono">
                        <Check className="h-2.5 w-2.5" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg uppercase tracking-wider font-mono animate-pulse">
                        <AlertCircle className="h-2.5 w-2.5" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>

                  {/* Topic title */}
                  <h3 className="font-display text-base font-bold text-foreground leading-snug line-clamp-2">
                    {lec.topic}
                  </h3>

                  {/* Instructor block */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-[10px] text-primary font-bold">
                      {lec.professor.charAt(0).toUpperCase()}
                    </div>
                    <span>Lecturer: </span>
                    <span className="font-bold text-foreground/80">{lec.professor}</span>
                  </div>

                  {/* Assignment card segment */}
                  <div className="flex gap-2.5 rounded-2xl border border-success/30 bg-success/5 p-3.5 text-left">
                    <MessageCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                    <div className="text-xs leading-relaxed text-foreground/90 font-sans">
                      <span className="font-extrabold text-success uppercase tracking-wider text-[10px] block mb-0.5 font-sans">
                        Given Assignment / Task:
                      </span>
                      {lec.assignment ? `"${lec.assignment}"` : "No formal homework assigned."}
                    </div>
                  </div>

                </div>

                {/* Completion actions (Student Checkbox or CR Trash control) */}
                <div className="flex flex-col items-center gap-2 shrink-0 self-start">
                  <button
                    onClick={() => toggleAssignmentCheckbox(lec.id)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all cursor-pointer ${
                      isChecked 
                        ? "bg-emerald-500 border-emerald-500 text-white" 
                        : "bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground active:scale-90"
                    }`}
                    title={isChecked ? "Mark assignment pending" : "Complete assignment!"}
                  >
                    {isChecked ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>

                  {userRole === "cr" && (
                    <button
                      onClick={() => handleDeleteEntry(lec.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background hover:bg-red-500/10 text-muted-foreground hover:text-red-500 hover:border-red-500/20 active:scale-90 transition-all cursor-pointer"
                      title="Discard log"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-screen-sm px-4 py-5 space-y-6 pb-24">
      
      {/* Task Filters Header Buttons */}
      <div className="grid grid-cols-2 gap-3" id="filters-container">
        <button
          id="btn-show-uncompleted"
          onClick={() => setViewMode(prev => prev === "uncompleted" ? "calendar" : "uncompleted")}
          className={`group flex items-center justify-center gap-2.5 rounded-2xl border px-4 py-3 transition-all active:scale-95 cursor-pointer ${
            viewMode === "uncompleted"
              ? "bg-primary border-primary text-primary-foreground shadow-md ring-1 ring-primary"
              : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground shadow-xs"
          }`}
        >
          <CheckSquare className={`h-4.5 w-4.5 ${viewMode === "uncompleted" ? "text-primary-foreground" : "text-primary"} transition-transform group-hover:scale-110`} />
          <div className="text-left">
            <p className="text-[10px] uppercase font-extrabold tracking-wider leading-none">Uncompleted</p>
            <p className="text-[9px] opacity-75 font-mono mt-1 font-semibold">{uncompletedCount} tasks pending</p>
          </div>
        </button>

        <button
          id="btn-show-tomorrow"
          onClick={() => setViewMode(prev => prev === "tomorrow" ? "calendar" : "tomorrow")}
          className={`group flex items-center justify-center gap-2.5 rounded-2xl border px-4 py-3 transition-all active:scale-95 cursor-pointer ${
            viewMode === "tomorrow"
              ? "bg-primary border-primary text-primary-foreground shadow-md ring-1 ring-primary"
              : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground shadow-xs"
          }`}
        >
          <AlertCircle className={`h-4.5 w-4.5 ${viewMode === "tomorrow" ? "text-primary-foreground" : "text-amber-500"} transition-transform group-hover:scale-110`} />
          <div className="text-left">
            <p className="text-[10px] uppercase font-extrabold tracking-wider leading-none">Due Tomorrow</p>
            <p className="text-[9px] opacity-75 font-mono mt-1 font-semibold">{tomorrowCount} tasks listed</p>
          </div>
        </button>
      </div>

      {/* ACTIVE TASKS LIST RENDERED DIRECTLY ABOVE THE DATE SWITCHER */}
      {viewMode !== "calendar" && (
        <section className="space-y-4 border-b border-border/80 pb-6 animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-primary font-mono mb-2">
            <CheckSquare className="h-4.5 w-4.5 shrink-0" />
            <span>
              {viewMode === "uncompleted" ? "Pending Academic Tasks Checklist" : "Tomorrow's Scheduled Tasks"}
            </span>
          </div>

          {viewMode === "uncompleted" && 
            renderEntriesList(
              filteredEntries, 
              "No Uncompleted Tasks!", 
              "Amazing work! All logged assignments and class reviews have been completed successfully.",
              true
            )
          }

          {viewMode === "tomorrow" && 
            renderEntriesList(
              filteredEntries, 
              "No Classes Due Tomorrow", 
              "No Ayurveda classes or assignments have been pre-scheduled for tomorrow relative to this date.",
              true
            )
          }
        </section>
      )}

      {/* Date Switcher Heading (Only visible in filter mode to clarify separation) */}
      {viewMode !== "calendar" && (
        <div className="pt-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground font-mono">
              Daily Class Logs Browser / Calendar
            </span>
          </div>
        </div>
      )}

      {/* Date Switcher Ribbon */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-sm">
        <button
          onClick={() => changeSelectedDateOffset(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background hover:bg-muted font-bold active:scale-90 transition-all text-foreground"
          title="Previous day"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary font-display">
            {activeHumanDate.dayName}
          </p>
          <p className="text-sm font-black text-foreground">
            {activeHumanDate.dateStr}
          </p>
        </div>

        <button
          onClick={() => changeSelectedDateOffset(1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background hover:bg-muted font-bold active:scale-90 transition-all text-foreground"
          title="Next day"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>



      {/* Stats progress ring */}
      {activeDayEntries.length > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 text-xs text-foreground">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500 animate-bounce" />
            <div>
              <p className="font-bold">Daily Study Checklist</p>
              <p className="text-[11px] text-muted-foreground">Keep pace with classes & assignments.</p>
            </div>
          </div>
          <span className="font-extrabold text-primary text-sm">
            {completedStats.completed} / {completedStats.total} done
          </span>
        </div>
      )}

      {/* CR Controls Block */}
      {userRole === "cr" && (
        <div className="border border-dashed border-primary/45 rounded-2xl bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span>Representative Dashboard Panel</span>
            </div>
            <button
              onClick={() => setShowAddForm(prev => !prev)}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-black text-primary-foreground hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              {showAddForm ? "Close Form" : "Log Today's Class"}
              <Plus className={`h-3 w-3 transition-transform ${showAddForm ? "rotate-45" : ""}`} />
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleSaveEntry} className="space-y-4 pt-2 border-t border-primary/10 animate-fade-in text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* Time slot picker */}
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Class Period Slot</label>
                  <select 
                    value={formTimeSlot} 
                    onChange={e => setFormTimeSlot(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card p-2 text-foreground font-semibold outline-none"
                  >
                    <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
                    <option value="10:15 AM - 11:15 AM">10:15 AM - 11:15 AM</option>
                    <option value="11:30 AM - 12:30 PM">11:30 AM - 12:30 PM</option>
                    <option value="01:30 PM - 02:30 PM">01:30 PM - 02:30 PM</option>
                    <option value="02:45 PM - 03:45 PM">02:45 PM - 03:45 PM</option>
                    <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                  </select>
                </div>

                {/* Subject dropdown */}
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Syllabus Subject</label>
                  <select 
                    value={formSubject} 
                    onChange={e => setFormSubject(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card p-2 text-foreground font-semibold outline-none"
                  >
                    {subjects.map(s => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Professor Name */}
              <div className="space-y-1">
                <label className="font-bold text-foreground">Who Taken Class Today? (Professor)</label>
                <input
                  type="text"
                  placeholder="e.g., Dr. Sandeep Sharma, Dr. Kavitha Rao"
                  value={formProfessor}
                  onChange={e => setFormProfessor(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card p-2.5 outline-none focus:border-primary/50 text-foreground font-medium"
                />
              </div>

              {/* Topic Name */}
              <div className="space-y-1">
                <label className="font-bold text-foreground">What Topic Name? (Lecture Topic)</label>
                <input
                  type="text"
                  placeholder="e.g., Asthi Classification, Pitta sub-types"
                  value={formTopic}
                  onChange={e => setFormTopic(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card p-2.5 outline-none focus:border-primary/50 text-foreground font-medium"
                />
              </div>

              {/* Homework / Assignment given */}
              <div className="space-y-1">
                <label className="font-bold text-foreground">What Assignment Given?</label>
                <textarea
                  placeholder="Describe homework task, exam files, or workbook journal drawings given today..."
                  value={formAssignment}
                  onChange={e => setFormAssignment(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-card p-2.5 outline-none focus:border-primary/50 text-foreground font-medium resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-2.5 text-xs font-black text-primary-foreground hover:brightness-110 active:scale-98 transition-all"
              >
                Log Entry Into Central Diary
              </button>
            </form>
          )}
        </div>
      )}

      {/* Section C: Diary Records List (Daily logs) */}
      <section className="space-y-4">
        {renderEntriesList(
          activeDayEntries,
          "Empty Academic Diary",
          "No classes or assignments logged yet for this date. Check preceding dates or wait for the CR to submit logs."
        )}
      </section>

    </div>
  );
}
