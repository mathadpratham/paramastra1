export type Lecture = {
  id: string;
  subject: string;
  professor: string;
  professorHandle: string;
  topic: string;
  timeAgo: string;
  createdAt?: string | number;
  duration: string;
  coverHue?: string;
  keyConcepts: string[];
  examAlert?: string | null;
  whatsappContext?: string | null;
  saves: number;
  liked?: boolean;
  saved?: boolean;
  isDemo?: boolean;
  transcript?: string;
  audioUrl?: string;
  audioBase64?: string;
  dateStr?: string;
  attachment?: {
    name: string;
    size: string;
  } | null;
  imageUrl?: string;
  dayName?: string;
  timetableClassId?: string;
  classNotes?: string | null;
};

export function formatTimeAgo(lectureOrTimestamp: any): string {
  if (!lectureOrTimestamp) return "Just now";

  let timestampMs: number | null = null;

  if (typeof lectureOrTimestamp === "object") {
    // 1. Check explicit createdAt
    if (lectureOrTimestamp.createdAt) {
      const t = new Date(lectureOrTimestamp.createdAt).getTime();
      if (!isNaN(t) && t > 0) timestampMs = t;
    }

    // 2. Extract epoch timestamp from id (e.g., lec-1784356889516 or task-1784356889516)
    if (!timestampMs && lectureOrTimestamp.id) {
      const match = String(lectureOrTimestamp.id).match(/(\d{10,13})/);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (parsed > 1577836800000 && parsed < 1893456000000) {
          timestampMs = parsed;
        }
      }
    }

    // 3. Extract timestamp from dateStr (e.g., "18 Jul 2026")
    if (!timestampMs && lectureOrTimestamp.dateStr) {
      const d = new Date(lectureOrTimestamp.dateStr).getTime();
      if (!isNaN(d) && d > 0) timestampMs = d;
    }

    // 4. Fallback to existing timeAgo string if not the static default "1m ago"
    if (!timestampMs && lectureOrTimestamp.timeAgo && lectureOrTimestamp.timeAgo !== "1m ago") {
      return lectureOrTimestamp.timeAgo;
    }
  } else if (typeof lectureOrTimestamp === "number") {
    timestampMs = lectureOrTimestamp;
  } else if (typeof lectureOrTimestamp === "string") {
    const d = new Date(lectureOrTimestamp).getTime();
    if (!isNaN(d) && d > 0) {
      timestampMs = d;
    } else if (lectureOrTimestamp !== "1m ago") {
      return lectureOrTimestamp;
    }
  }

  if (!timestampMs) {
    return "Just now";
  }

  const now = Date.now();
  const diffSec = Math.floor((now - timestampMs) / 1000);

  if (diffSec < 45) {
    return "Just now";
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) {
    return `${diffWeeks}w ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths}mo ago`;
  }

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}y ago`;
}

export type AppState = {
  route: "landing" | "feed" | "library" | "tutor" | "profile" | "cr" | "diary" | "roster";
  lectures: Lecture[];
  publishLecture: (lecture: Omit<Lecture, "id" | "timeAgo" | "saves">) => void;
  deleteLecture: (id: string) => void;
  toggleSave: (id: string) => void;
};

export function isSubjectMatching(subA: string, subB: string): boolean {
  if (!subA || !subB) return false;
  const a = subA.toLowerCase().trim();
  const b = subB.toLowerCase().trim();
  
  if (a === b) return true;
  
  // Custom smart BAMS subject mapping to handle variations in spellings/shorthands/suffixes
  const isSamhita = (s: string) => s.includes("samhita") || s.includes("adyayan") || s.includes("adhyayan");
  const isSanskrit = (s: string) => s.includes("sanskrit") || s.includes("ithihasa") || s.includes("history");
  const isRachana = (s: string) => s.includes("rachana") || s.includes("anatomy");
  const isKriya = (s: string) => s.includes("kriya") || s.includes("physiology");
  const isPadartha = (s: string) => s.includes("padartha") || s.includes("vijnana") || s.includes("philosophy");
  
  if (isSamhita(a) && isSamhita(b)) return true;
  if (isSanskrit(a) && isSanskrit(b)) return true;
  if (isRachana(a) && isRachana(b)) return true;
  if (isKriya(a) && isKriya(b)) return true;
  if (isPadartha(a) && isPadartha(b)) return true;
  
  // Substring checks
  if (a.includes(b) || b.includes(a)) return true;
  
  return false;
}

export interface TimetableClassInterface {
  id: string;
  subject: string;
}

export function matchLecturesToClasses(
  classes: TimetableClassInterface[],
  lectures: Lecture[]
): Record<string, Lecture | null> {
  const mapping: Record<string, Lecture | null> = {};
  const matchedLectureIds = new Set<string>();

  // Initialize all slots to null
  classes.forEach(c => {
    mapping[c.id] = null;
  });

  const activeLectures = (lectures || []).filter(l => l && l.id);

  // Step 1: Match by exact timetableClassId first (high priority)
  classes.forEach(c => {
    const directMatch = activeLectures.find(l => l.timetableClassId === c.id);
    if (directMatch) {
      mapping[c.id] = directMatch;
      matchedLectureIds.add(directMatch.id);
    }
  });

  // Step 2: Match remaining slots by subject in order of unmatched lectures
  classes.forEach(c => {
    if (mapping[c.id] !== null) return; // already matched directly

    const subjectMatch = activeLectures.find(l => {
      if (matchedLectureIds.has(l.id)) return false;
      if (l.timetableClassId && l.timetableClassId !== c.id) return false; // has target, belongs elsewhere
      return isSubjectMatching(l.subject, c.subject);
    });

    if (subjectMatch) {
      mapping[c.id] = subjectMatch;
      matchedLectureIds.add(subjectMatch.id);
    }
  });

  return mapping;
}

