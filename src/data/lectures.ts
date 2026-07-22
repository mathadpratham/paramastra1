export type Lecture = {
  id: string;
  subject: string;
  professor: string;
  professorHandle: string;
  topic: string;
  timeAgo: string;
  duration: string;
  cover?: string;
  keyConcepts: string[];
  examAlert?: string | null;
  whatsappContext?: string | null;
  attachment?: {
    name: string;
    size: string;
  } | null;
  saves: number;
  liked?: boolean;
  saved?: boolean;
  isDemo?: boolean;
};

export type TimetableClass = {
  id: string;
  subject: string;
  time: string;
  status: "ready" | "live" | "upcoming";
  professor: string;
  topic: string;
  instructions: string;
};

// Full weekly BAMS first-year syllabus schedule aligned with the photo timetable (Monday - Saturday)
export const weeklySchedule: Record<string, TimetableClass[]> = {
  Monday: [
    {
      id: "mon-rachana",
      subject: "Rachana Sharir",
      time: "9.00 - 10.00 AM",
      status: "ready",
      professor: "Dr. Sandeep Sharma (Dr. SS)",
      topic: "Introduction to Asthi Sharir & Osteology",
      instructions: "Carry standard anatomical aprons for osteology practical references. Read Charaka's osteology shlokas beforehand."
    },
    {
      id: "mon-samhita",
      subject: "Samhita Adyayan-1",
      time: "10.00 - 11.00 AM",
      status: "ready",
      professor: "Dr. Shrikant (Dr. SSM)",
      topic: "Ashtanga Hridaya Sutrasthana - Chapter 1",
      instructions: "Prepare basic definitions of Ayus and health compilation indices. Expect spot questions on invocation verses."
    },
    {
      id: "mon-sanskrit",
      subject: "Sanskritam Evum Ayurveda Ithihasa",
      time: "11.00 - 12.00 PM",
      status: "ready",
      professor: "Mr. S.N. Bhat (Mr. SNB)",
      topic: "Sanskrit Shlokas & Vibhakti Rules",
      instructions: "Practise translating Sanskrit nominative and objective suffixes. Bring your grammar diaries."
    },
    {
      id: "mon-padartha",
      subject: "Padartha Vijnana",
      time: "12.00 - 1.00 PM",
      status: "ready",
      professor: "Dr. Vidyadhar Joshi (Dr. VK)",
      topic: "Pancha Mahabhuta Theory: Deep Akasha and Vayu Dynamics",
      instructions: "Observe respiratory peristalsis in relation to Vayu triggers. Check preview notes."
    },
    {
      id: "mon-nlhp",
      subject: "NLHP/ECE",
      time: "2.00 - 4.00 PM",
      status: "live",
      professor: "Dr. SK/ Dr. MA/ Dr. SPH/ Dr. SS // Dr. KNR/ Dr. GH/ Dr. SSA/ Dr. R/ Dr. SJ",
      topic: "Rachana Sharir & Kriya Sharir Practicals",
      instructions: "Mandatory lab uniforms and dissecting kits are expected. 15mins of Samhita Parayana roster checks today."
    },
    {
      id: "mon-club",
      subject: "Club Activities / Mentorship",
      time: "4.00 - 4.30 PM",
      status: "upcoming",
      professor: "All Mentors / Faculty",
      topic: "Interactive Peer Mentorship & BAMS Club Events",
      instructions: "Connect with your assigned group leads. Discussions on current term academic adjustments."
    }
  ],
  Tuesday: [
    {
      id: "tue-sanskrit",
      subject: "Sanskritam Evum Ayurveda Ithihasa",
      time: "9.00 - 10.00 AM",
      status: "ready",
      professor: "Mr. S.N. Bhat / Dr. Vidyadhar Joshi",
      topic: "Grammar Inflections & Classical History Recital",
      instructions: "Learn historical lines of Ayurveda transfer from Brahma to sage Charaka. Bring notebooks."
    },
    {
      id: "tue-rachana",
      subject: "Rachana Sharir",
      time: "10.00 - 11.00 AM",
      status: "ready",
      professor: "Dr. Sandeep K. (Dr. SK)",
      topic: "Asthi Sandhis & Classification of Joints",
      instructions: "Identify Kora (hinge) and Ulukhala (ball-and-socket) joints on model skeleton charts."
    },
    {
      id: "tue-samhita",
      subject: "Samhita Adyayan-1",
      time: "11.00 - 12.00 PM",
      status: "ready",
      professor: "Dr. Shailesh Rao (Dr. SR)",
      topic: "Charaka Samhita Sutrasthana Chapters 1-3",
      instructions: "Memorize first 5 verses of chapter 1. Oral recitation test scheduled right after session."
    },
    {
      id: "tue-kriya",
      subject: "Kriya Sharir",
      time: "12.00 - 1.00 PM",
      status: "ready",
      professor: "Dr. Sanjay Jain (Dr. SJ)",
      topic: "Rasa Dhatu Utpatti & Pitta Dosha Subtypes",
      instructions: "Draw the biochemical chart mapping Ahara Rasa conversion into clear plasma fluids."
    },
    {
      id: "tue-nlhp",
      subject: "NLHP/ECE",
      time: "2.00 - 4.00 PM",
      status: "live",
      professor: "Dr. SK/ Dr. MA/ Dr. SPH/ Dr. SS // Dr. KNR/ Dr. GH/ Dr. SSA/ Dr. R/ Dr. SJ",
      topic: "Rachana Sharir & Kriya Sharir Practicals",
      instructions: "Dissection lab attendance is necessary. Keep practical logbooks updated and ready."
    },
    {
      id: "tue-club",
      subject: "Club Activities / Mentorship",
      time: "4.00 - 4.30 PM",
      status: "upcoming",
      professor: "All Mentors / Faculty",
      topic: "Interactive Peer Mentorship & BAMS Club Events",
      instructions: "Brief mentorship assemblies to review first Prof. curriculum adaptation issues."
    }
  ],
  Wednesday: [
    {
      id: "wed-kriya",
      subject: "Kriya Sharir",
      time: "9.00 - 10.00 AM",
      status: "ready",
      professor: "Dr. Girish Hegde (Dr. GH)",
      topic: "Hematology - Estimation of Hemoglobin & RBC Counting",
      instructions: "Read up on Sahli's hemoglobinometer techniques. Laboratory journals must be signed today."
    },
    {
      id: "wed-sanskrit",
      subject: "Sanskritam Evum Ayurveda Ithihasa",
      time: "10.00 - 11.00 AM",
      status: "ready",
      professor: "Mr. S.N. Bhat (Mr. SNB)",
      topic: "Ayurveda Ithihasa - Traditional Descent of Sages",
      instructions: "Revise original textual references tracking the descent of medicine from Lord Indra."
    },
    {
      id: "wed-padartha",
      subject: "Padartha Vijnana",
      time: "11.00 - 12.00 PM",
      status: "ready",
      professor: "Dr. Vidyadhar Joshi (Dr. VK)",
      topic: "Srishti Utpatti Krama (Cosmology of Creation)",
      instructions: "Read comparative materials on Samkhya vs Sushruta views of element evolution."
    },
    {
      id: "wed-samhita",
      subject: "Samhita Adyayan-1",
      time: "12.00 - 1.00 PM",
      status: "ready",
      professor: "Dr. R.M. Sane (Dr. RMS)",
      topic: "Ashtanga Hridaya - Chapter 2 (Dincharya Daily Regimen)",
      instructions: "Practise drawing the daily sunrise regimen chart. Contrast summer vs winter schedules."
    },
    {
      id: "wed-nlhp",
      subject: "NLHP/ECE",
      time: "2.00 - 4.00 PM",
      status: "live",
      professor: "Dr. KNR/ Dr. GH/ Dr. SSA/ Dr. R/ Dr. SJ // Dr. SK/ Dr. MA/ Dr. SPH/ Dr. SS",
      topic: "Kriya Sharir & Rachana Sharir Practicals",
      instructions: "Bring sterile lancets and blood grouping kits for hematology laboratory exercises."
    },
    {
      id: "wed-club",
      subject: "Club Activities / Mentorship",
      time: "4.00 - 4.30 PM",
      status: "upcoming",
      professor: "All Mentors / Faculty",
      topic: "Interactive Peer Mentorship & BAMS Club Events",
      instructions: "Voluntary participation in AYUSH herb cataloging club group assignment."
    }
  ],
  Thursday: [
    {
      id: "thu-sanskrit",
      subject: "Sanskritam Evum Ayurveda Ithihasa",
      time: "9.00 - 10.00 AM",
      status: "ready",
      professor: "Mr. S.N. Bhat (Mr. SNB)",
      topic: "Sanskrit Shlokas, Translation Rules & Sloka Grammar",
      instructions: "Write down composite translation rules from Astanga Hridaya chapter verses."
    },
    {
      id: "thu-padartha",
      subject: "Padartha Vijnana",
      time: "10.00 - 11.00 AM",
      status: "ready",
      professor: "Dr. Manoj Kumar (Dr. MK)",
      topic: "Concept of Karma & Samanya and Vishesha Siddhanta",
      instructions: "Prepare examples of how increase (Vriddhi) is triggered by similarity in substances."
    },
    {
      id: "thu-samhita",
      subject: "Samhita Adyayan-1",
      time: "11.00 - 12.00 PM",
      status: "ready",
      professor: "Dr. R.M. Sane (Dr. RMS)",
      topic: "Ashtanga Hridaya Sutrasthana - Chapter 1 MCQ & Shloka Test",
      instructions: "Ayushkamiya Adhyaya Shlokas 1 to 5 written assessment is starting sharp at 9.00 AM!"
    },
    {
      id: "thu-rachana",
      subject: "Rachana Sharir",
      time: "12.00 - 1.00 PM",
      status: "ready",
      professor: "Dr. Madhav Acharya (Dr. MA)",
      topic: "Peshya Sharir (Skeletal Myology & Muscle Attachments)",
      instructions: "Review muscular structures of the back and pelvic regions. Submit labeled diagram sheets."
    },
    {
      id: "thu-nlhp",
      subject: "NLHP/ECE",
      time: "2.00 - 4.00 PM",
      status: "live",
      professor: "Dr. KNR/ Dr. GH/ Dr. SSA/ Dr. R/ Dr. SJ // Dr. SK/ Dr. MA/ Dr. SPH/ Dr. SS",
      topic: "Kriya Sharir & Rachana Sharir Practicals",
      instructions: "Practicals require clinical pulse-reading manuals. Keep observation notebooks ready."
    },
    {
      id: "thu-club",
      subject: "Club Activities / Mentorship",
      time: "4.00 - 4.30 PM",
      status: "upcoming",
      professor: "All Mentors / Faculty",
      topic: "Interactive Peer Mentorship & BAMS Club Events",
      instructions: "Join the mentorship session focusing on exam score optimization techniques."
    }
  ],
  Friday: [
    {
      id: "fri-samhita",
      subject: "Samhita Adyayan-1",
      time: "9.00 - 10.00 AM",
      status: "ready",
      professor: "Dr. Shailesh Rao (Dr. SR)",
      topic: "Sutrasthana Chapter 5 - Dietary Rules & Ahara Vidhi",
      instructions: "Analyse classical rules governing hot, heavy and incompatible foods."
    },
    {
      id: "fri-sanskrit",
      subject: "Sanskritam Evum Ayurveda Ithihasa",
      time: "10.00 - 11.00 AM",
      status: "ready",
      professor: "Mr. S.N. Bhat (Mr. SNB)",
      topic: "Noun Declensions & Compound Splitting Rules",
      instructions: "Practise splitting composite shloka combinations in class files."
    },
    {
      id: "fri-rachana",
      subject: "Rachana Sharir",
      time: "11.00 - 12.00 PM",
      status: "ready",
      professor: "Dr. Shashi Prasad H. (Dr. SPH)",
      topic: "Shira and Dhamani Sharir (Circulatory Network Anatomy)",
      instructions: "Review core blood vessel alignments around cervical and cranial structures."
    },
    {
      id: "fri-kriya",
      subject: "Kriya Sharir",
      time: "12.00 - 1.00 PM",
      status: "ready",
      professor: "Dr. S.S. Avati (Dr. SSA)",
      topic: "Kapha Dosha locations and functional subtypes",
      instructions: "Pre-read modern metabolic counterparts to Tarpaka and Bodhaka Kapha actions."
    },
    {
      id: "fri-samhita2",
      subject: "Samhita Adyayan-1",
      time: "2.00 - 3.00 PM",
      status: "live",
      professor: "Dr. Shrikant (Dr. SSM)",
      topic: "Ayurveda Purana Principles & Scriptural Cross-references",
      instructions: "Review fundamental Samhita frameworks. High attendance required today."
    },
    {
      id: "fri-padartha",
      subject: "Padartha Vijnana",
      time: "3.00 - 4.00 PM",
      status: "live",
      professor: "Dr. Vidyadhar Joshi (Dr. VK)",
      topic: "Abhava Theory & Non-existence as a valid logic construct",
      instructions: "Draft a 1-page summary on how the void of a symptom serves to diagnose health."
    },
    {
      id: "fri-club",
      subject: "Club Activities / Mentorship",
      time: "4.00 - 4.30 PM",
      status: "upcoming",
      professor: "All Mentors / Faculty",
      topic: "Interactive Peer Mentorship & BAMS Club Events",
      instructions: "Relaxed Friday cultural club gathering. Plan Ayurvedic food exhibition activities."
    }
  ],
  Saturday: [
    {
      id: "sat-padartha",
      subject: "Padartha Vijnana",
      time: "9.00 - 10.00 AM",
      status: "ready",
      professor: "Dr. Manoj Kumar (Dr. MK)",
      topic: "Pramana Vijnana - Pratyaksha & Sannikarsha",
      instructions: "Understand direct sensory limitations & outer perceptual barrier criteria."
    },
    {
      id: "sat-kriya",
      subject: "Kriya Sharir",
      time: "10.00 - 11.00 AM",
      status: "ready",
      professor: "Dr. Rajalakshmi (Dr. R)",
      topic: "Ojas - ultimate biological defense & immunity layers",
      instructions: "Apara and Para Ojas comparative notes must be updated in practical log files."
    },
    {
      id: "sat-samhita",
      subject: "Samhita Adyayan-1",
      time: "11.00 - 12.00 PM",
      status: "ready",
      professor: "Dr. A.U. Sharma (Dr. AUS)",
      topic: "Comprehensive Samhita Parayana Methods",
      instructions: "Oral recitation practice of major first-term shlokas under group guidance."
    },
    {
      id: "sat-rachana",
      subject: "Rachana Sharir",
      time: "12.00 - 1.00 PM",
      status: "ready",
      professor: "Dr. SK/ Dr. SPH/ Dr. SS / Dr. YD",
      topic: "Osteology landmarks and muscle attachment orientation",
      instructions: "Open forum for anatomical model queries. Review bone structures in detail."
    },
    {
      id: "sat-library",
      subject: "Library",
      time: "2.00 - 4.00 PM",
      status: "live",
      professor: "Library In-Charge",
      topic: "Self Study, Reference Reading & Manuscript Review",
      instructions: "Self study hour. Reference books on classical BAMS are available for issue."
    },
    {
      id: "sat-club",
      subject: "Club Activities / Mentorship",
      time: "4.00 - 4.30 PM",
      status: "upcoming",
      professor: "All Mentors / Faculty",
      topic: "Weekend Club Meetups & Mentor Check-ins",
      instructions: "Saturday review and personal progression checklist sync with supervisors."
    }
  ],
  Sunday: [
    {
      id: "sun-holiday",
      subject: "Holiday",
      time: "All Day",
      status: "ready",
      professor: "None",
      topic: "Sunday Rest & Self-Care",
      instructions: "No scheduled BAMS lectures today. Rest well or catch up on self study!"
    }
  ]
};

export function getIndianDate(): Date {
  const now = new Date();
  // Get absolute epoch ms in UTC
  const utc = now.getTime();
  // Shift to IST (UTC + 5.5 hours)
  const istTime = utc + (5.5 * 3600000);
  // Apply the client's current local timezone offset back so that standard local date getters match IST
  return new Date(istTime + (now.getTimezoneOffset() * 60000));
}

export function getIndianWeekday(): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const istDayIdx = getIndianDate().getDay();
  const dayName = days[istDayIdx];
  return dayName;
}

export function getIndianDateOfWeekday(targetDayName: string): Date {
  const current = getIndianDate();
  const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday, etc.
  
  // Find offset from today to the current week's Monday (academic cycle start)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const weekdayOffsets: Record<string, number> = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6
  };
  
  const targetOffset = weekdayOffsets[targetDayName] ?? 0;
  const totalDiff = diffToMonday + targetOffset;
  const targetDate = new Date(current.getTime() + totalDiff * 24 * 60 * 60 * 1000);
  return targetDate;
}

export function getIndianFormattedDateOfWeekday(targetDayName: string): string {
  const dateObj = getIndianDateOfWeekday(targetDayName);
  const day = dateObj.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day} ${month} ${year}`;
}

// Auto-detect current weekday and supply as default, falling back from Sunday to Monday
const activeDayName = getIndianWeekday();

export const todaysClasses = weeklySchedule[activeDayName];

export const subjects = [
  { name: "Rachana Sharir", lectures: 24, color: "oklch(0.62 0.22 28)" },
  { name: "Kriya Sharir", lectures: 18, color: "oklch(0.62 0.16 165)" },
  { name: "Samhita Adyayan-1", lectures: 21, color: "oklch(0.65 0.18 90)" },
  { name: "Sanskritam Evum Ayurveda Ithihasa", lectures: 15, color: "oklch(0.55 0.2 280)" },
  { name: "Padartha Vijnana", lectures: 19, color: "oklch(0.55 0.18 200)" },
  { name: "NLHP/ECE", lectures: 6, color: "oklch(0.6 0.16 240)" },
  { name: "Library", lectures: 4, color: "oklch(0.5 0.14 120)" },
  { name: "Club Activities / Mentorship", lectures: 6, color: "oklch(0.6 0.11 310)" },
];

export const SUBJECT_COVERS: Record<string, string> = {
  "Rachana Sharir": "oklch(0.45 0.12 35)",
  "Kriya Sharir": "oklch(0.42 0.12 165)",
  "Samhita Adyayan-1": "oklch(0.48 0.12 90)",
  "Sanskritam Evum Ayurveda Ithihasa": "oklch(0.4 0.13 280)",
  "Padartha Vijnana": "oklch(0.4 0.12 200)",
  "NLHP/ECE": "oklch(0.43 0.11 240)",
  "Library": "oklch(0.5 0.14 120)",
  "Club Activities / Mentorship": "oklch(0.6 0.11 310)",
};

export function getDynamicClassStatus(slotTime: string, slotDay: string): "ready" | "live" | "upcoming" {
  const now = getIndianDate();
  
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = daysOfWeek[now.getDay()];
  
  if (currentDayName !== slotDay) {
    return "ready";
  }

  try {
    const parts = slotTime.split("-").map(p => p.trim());
    if (parts.length !== 2) return "ready";
    
    const endPart = parts[1];
    const startPart = parts[0];
    
    const endAmPm = endPart.toLowerCase().includes("pm") ? "PM" : "AM";
    
    let startDefault: "AM" | "PM" = endAmPm;
    if (endAmPm === "PM") {
      const startNum = parseFloat(startPart);
      if (startNum === 11) {
        startDefault = "AM";
      } else {
        startDefault = "PM";
      }
    }
    
    const parseTimeAndMinutes = (timeStr: string, defaultAmPm: "AM" | "PM"): number => {
      const clean = timeStr.toLowerCase().replace(/\s+/g, "");
      const isPm = clean.includes("pm") || (!clean.includes("am") && defaultAmPm === "PM");
      const isAm = clean.includes("am") || (!clean.includes("pm") && defaultAmPm === "AM");
      
      const numbersOnly = clean.replace(/[a-z]/g, "");
      const [hStr, mStr] = numbersOnly.split(".");
      let hour = parseInt(hStr, 10);
      const minute = mStr ? parseInt(mStr, 10) : 0;
      
      if (isPm && hour !== 12) {
        hour += 12;
      } else if (isAm && hour === 12) {
        hour = 0;
      }
      
      return hour * 60 + minute;
    };
    
    const startMins = parseTimeAndMinutes(startPart, startDefault);
    const endMins = parseTimeAndMinutes(endPart, endAmPm);
    
    const currentMins = now.getHours() * 60 + now.getMinutes();
    
    if (currentMins >= startMins && currentMins < endMins) {
      return "live";
    } else if (currentMins < startMins) {
      return "upcoming";
    } else {
      return "ready";
    }
  } catch (err) {
    return "ready";
  }
}
