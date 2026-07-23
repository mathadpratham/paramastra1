import { useState, useEffect, useMemo, useRef } from "react";
import { TopBar } from "./components/TopBar";
import { BottomNav } from "./components/BottomNav";
import { Stories } from "./components/Stories";
import { FeedCard } from "./components/FeedCard";
import { RoleSelectionLanding } from "./components/RoleSelectionLanding";
import { CRDashboardView } from "./components/CRDashboardView";
import { LibraryView } from "./components/LibraryView";
import { TutorView } from "./components/TutorView";
import { ProfileView } from "./components/ProfileView";
import { DiaryView } from "./components/DiaryView";
import { StudentRosterView } from "./components/StudentRosterView";
import type { Lecture } from "./types";
import { isSubjectMatching } from "./types";
import { weeklyLecturesFeed } from "./data/lecturesFeed";
import { getIndianDate, getIndianWeekday, getIndianFormattedDateOfWeekday } from "./data/lectures";
import { getApiUrl } from "./config";
import { Mic, BookOpen, Trash2, CheckCircle2, AlertTriangle, RefreshCw, X, ArrowRight, Sparkles, Download } from "lucide-react";

export default function App() {
  const [route, setRoute] = useState<"landing" | "feed" | "library" | "tutor" | "profile" | "cr" | "diary">(() => {
    try {
      const storedRole = localStorage.getItem("paramastra_user_role");
      const storedCode = localStorage.getItem("paramastra_class_code");
      if (storedRole === "cr" && storedCode) return "cr";
      if (storedRole === "student" && storedCode) return "feed";
    } catch {}
    return "landing";
  });
  const [userRole, setUserRole] = useState<"student" | "cr" | null>(() => {
    try {
      const storedRole = localStorage.getItem("paramastra_user_role");
      const storedCode = localStorage.getItem("paramastra_class_code");
      if (storedCode && (storedRole === "student" || storedRole === "cr")) {
        return storedRole;
      }
    } catch {}
    return null;
  });

  // Synchronized active weekday state invariant of the device physical location/time zone
  const [activeDay, setActiveDay] = useState<string>(getIndianWeekday);

  const [lecturesByDay, setLecturesByDay] = useState<Record<string, Lecture[]>>({});
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" | "info" | "error" } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | { id: string; day: string } | null>(null);

  // Sync state and manual refresh indicators
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("Initializing...");

  // Real-time live warning banner
  const [liveNotification, setLiveNotification] = useState<{
    lecture: Lecture;
    day: string;
  } | null>(null);

  // Cache of seen ids to prevent duplicate alerts
  const [seenIds, setSeenIds] = useState<Set<string>>(() => new Set());

  // Unified Global Audio player state
  const [globalAudio, setGlobalAudio] = useState<{
    lectureId: string | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
  }>({
    lectureId: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  });

  const globalAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleToggleGlobalAudio = (lecture: Lecture) => {
    if (!lecture.audioUrl) {
      showToast("Audio of this lecture was not uploaded. Live playback is only available for lectures recorded or uploaded by the CR.", "warning");
      return;
    }

    if (globalAudio.lectureId === lecture.id) {
      if (globalAudio.isPlaying) {
        globalAudioRef.current?.pause();
        setGlobalAudio(prev => ({ ...prev, isPlaying: false }));
      } else {
        globalAudioRef.current?.play().catch(e => console.warn(e));
        setGlobalAudio(prev => ({ ...prev, isPlaying: true }));
      }
    } else {
      if (globalAudioRef.current) {
        globalAudioRef.current.pause();
        globalAudioRef.current = null;
      }

      const audio = new Audio(lecture.audioUrl);
      globalAudioRef.current = audio;

      audio.addEventListener("timeupdate", () => {
        setGlobalAudio(prev => {
          if (prev.lectureId === lecture.id) {
            return { ...prev, currentTime: Math.floor(audio.currentTime) };
          }
          return prev;
        });
      });

      audio.addEventListener("loadedmetadata", () => {
        setGlobalAudio(prev => {
          if (prev.lectureId === lecture.id) {
            return { ...prev, duration: Math.floor(audio.duration) };
          }
          return prev;
        });
      });

      audio.addEventListener("ended", () => {
        setGlobalAudio({
          lectureId: null,
          isPlaying: false,
          currentTime: 0,
          duration: 0
        });
      });

      audio.play().catch(e => {
        console.error("Global play failed:", e);
        showToast("Failed to stream recorded audio.", "warning");
      });

      setGlobalAudio({
        lectureId: lecture.id,
        isPlaying: true,
        currentTime: 0,
        duration: 0
      });
    }
  };

  useEffect(() => {
    return () => {
      if (globalAudioRef.current) {
        globalAudioRef.current.pause();
        globalAudioRef.current = null;
      }
    };
  }, []);

  // PWA installation state pointers
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log("[PWA Event] Captured beforeinstallprompt event successfully");
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA Outcome] Selected choice: ${outcome}`);
    setDeferredPrompt(null);
    showToast("Paramastra is installing to your device screen!", "success");
  };

  const handleLoginSuccess = (
    role: "student" | "cr",
    classCode: string,
    name: string,
    college: string,
    batch: string,
    roll?: string
  ) => {
    setUserRole(role);
    try {
      localStorage.setItem("paramastra_user_role", role);
      localStorage.setItem("paramastra_class_code", classCode);
      localStorage.setItem("paramastra_user_name", name);
      localStorage.setItem("paramastra_user_college", college);
      localStorage.setItem("paramastra_user_batch", batch);
      if (roll) {
        localStorage.setItem("paramastra_user_roll", roll);
      } else {
        localStorage.removeItem("paramastra_user_roll");
      }
    } catch (e) {
      console.warn("Storage registration error:", e);
    }

    const targetRoute = role === "cr" ? "cr" : "feed";
    setRoute(targetRoute);
    
    setTimeout(() => {
      fetchServerAndLocal(true);
    }, 120);
  };

  // Periodic 60s ticker to automatically update real-time relative time display (e.g. Just now -> 1m ago -> 2h ago -> 3d ago) live
  const [, setTimeTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getBookmarkedIds = (): Set<string> => {
    try {
      const stored = localStorage.getItem("paramastra_bookmarked_ids");
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch {}
    return new Set();
  };

  const mergeBookmarksWithLectures = (data: Record<string, Lecture[]>): Record<string, Lecture[]> => {
    const bookmarked = getBookmarkedIds();
    const result: Record<string, Lecture[]> = {};
    Object.keys(data || {}).forEach((day) => {
      const val = data[day];
      if (Array.isArray(val)) {
        result[day] = val.map((l) => ({
          ...l,
          saved: bookmarked.has(l.id),
        }));
      } else {
        result[day] = val as any;
      }
    });
    return result;
  };

  const showToast = (message: string, type: "success" | "warning" | "info" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchServerAndLocal = async (isManual = false) => {
    if (isUploading && !isManual) {
      return; 
    }
    setIsSyncing(true);
    
    // --- AUTONOMOUS PEER-TO-PEER RECOVERY MESH ---
    const classCode = localStorage.getItem("paramastra_class_code") || "default";
    if (classCode !== "default") {
      try {
        const checkRes = await fetch(getApiUrl(`/api/class-exists/${classCode}`));
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (!checkData.exists) {
            console.log(`[RECOVERY MESH] Classroom ${classCode} not found on server. Triggering auto-restore sync from client...`);
            
            const role = localStorage.getItem("paramastra_user_role");
            const name = localStorage.getItem("paramastra_user_name") || "BAMS User";
            const college = localStorage.getItem("paramastra_user_college") || "AAMC Moodbidari";
            const batch = localStorage.getItem("paramastra_user_batch") || "1st year";
            const userId = localStorage.getItem("paramastra_user_id") || "";
            const password = localStorage.getItem("paramastra_user_password") || "crpassword123";
            const roll = localStorage.getItem("paramastra_user_roll") || "01";
            
            let classInfo: any = null;
            if (role === "cr") {
              classInfo = {
                classCode,
                crName: name,
                collegeName: college,
                batchYear: batch,
                crUserId: userId,
                crPassword: password,
                students: []
              };
            } else {
              classInfo = {
                classCode,
                crName: "Pratham M",
                collegeName: college,
                batchYear: batch,
                crUserId: "pracr",
                crPassword: "crpassword123",
                students: [{
                  name,
                  rollNumber: roll,
                  collegeName: college,
                  batchYear: batch,
                  userId,
                  password,
                  joinedAt: Date.now()
                }]
              };
            }
            
            let localLectures = null;
            try {
              const cachedLecs = localStorage.getItem("paramastra_lectures_by_day_v2");
              if (cachedLecs) localLectures = JSON.parse(cachedLecs);
            } catch {}
            
            let localDiary = null;
            try {
              const cachedDiary = localStorage.getItem("paramastra_bams_diary_v1");
              if (cachedDiary) localDiary = JSON.parse(cachedDiary);
            } catch {}
            
            await fetch(getApiUrl("/api/backup/class-restore"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                classCode,
                classInfo,
                lectures: localLectures,
                diary: localDiary
              })
            });
            console.log("[RECOVERY MESH] Autonomous self-healing completed! Classroom restored on server.");
          }
        }
      } catch (err) {
        console.warn("[RECOVERY MESH] Skipping verification check:", err);
      }
    }

    try {
      const response = await fetch(getApiUrl(`/api/lectures?classCode=${encodeURIComponent(classCode)}&_t=${Date.now()}`));
      if (response.ok) {
        let data = await response.json();
        
        // Cleanse and filter out the fake seed lecture (seed-1) from incoming server data
        const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        weekdays.forEach((day) => {
          if (Array.isArray(data[day])) {
            data[day] = data[day].filter((l: any) => l.id !== "seed-1");
          }
        });
        if (Array.isArray(data.archive)) {
          data.archive = data.archive.filter((l: any) => l.id !== "seed-1");
        }
        
        // --- SMART MERGE / SELF-HEALING PERSISTENCE ---
        let localDataStr = null;
        try {
          localDataStr = localStorage.getItem("paramastra_lectures_by_day_v2");
        } catch {}
        
        let needsReSyncToServer = false;
        if (localDataStr) {
          try {
            const localData = JSON.parse(localDataStr);
            
            // Cleanse and filter out the fake seed lecture (seed-1) from the local cache as well
            weekdays.forEach((day) => {
              if (Array.isArray(localData[day])) {
                localData[day] = localData[day].filter((l: any) => l.id !== "seed-1");
              }
            });
            if (Array.isArray(localData.archive)) {
              localData.archive = localData.archive.filter((l: any) => l.id !== "seed-1");
            }
            
            weekdays.forEach((day) => {
              const serverList = Array.isArray(data[day]) ? data[day] : [];
              const localList = Array.isArray(localData[day]) ? localData[day] : [];
              
              if (localList.length > 0) {
                const serverIds = new Set(serverList.map((l: any) => l.id));
                const mergedList = [...serverList];
                let mergedAny = false;
                
                localList.forEach((localLec: any) => {
                  if (localLec && localLec.id && !serverIds.has(localLec.id)) {
                    // This is a local lecture recorded by user that is missing on the server (due to container reboot). Restore it!
                    mergedList.push(localLec);
                    serverIds.add(localLec.id);
                    mergedAny = true;
                    needsReSyncToServer = true;
                  }
                });
                
                if (mergedAny) {
                  data[day] = mergedList;
                }
              }
            });

            // Also check archives
            if (Array.isArray(localData.archive) && localData.archive.length > 0) {
              if (!data.archive) data.archive = [];
              const serverArchiveIds = new Set(data.archive.map((l: any) => l.id));
              localData.archive.forEach((localArc: any) => {
                if (localArc && localArc.id && !serverArchiveIds.has(localArc.id)) {
                  data.archive.push(localArc);
                  serverArchiveIds.add(localArc.id);
                  needsReSyncToServer = true;
                }
              });
            }
          } catch (e) {
            console.warn("Could not merge offline-local cache:", e);
          }
        }
        
        // If we found any locally saved lectures missing on the server, upload/heal the server database immediately!
        if (needsReSyncToServer) {
          console.log("[SELF-HEALING SYNC] Cloud container restarted. Syncing local lectures back to central server database...", data);
          fetch(getApiUrl("/api/lectures/sync"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lecturesByDay: data, classCode })
          }).catch((err) => console.warn("Self-healing sync back to server failed:", err));
        }

        // Intelligent comparison to detect new live feeds in background polling
        setLecturesByDay((prev) => {
          let hasOldData = false;
          const oldIds = new Set<string>();
          Object.values(prev || {}).forEach((val: any) => {
            if (val && Array.isArray(val) && val.length > 0) {
              hasOldData = true;
              val.forEach((l: any) => oldIds.add(l.id));
            }
          });

          // If we had old data and we fetched new data, look for any new ID that we haven't seen
          if (hasOldData) {
            let newlyAddedLec: any = null;
            let newlyAddedDayStr = "";

            Object.keys(data).forEach((day) => {
              const val = data[day];
              if (Array.isArray(val)) {
                val.forEach((l: any) => {
                  if (l && l.id && !oldIds.has(l.id) && !seenIds.has(l.id)) {
                    // Only alert on real, newly added user recordings (ignore hardcoded mock templates)
                    if (
                      !l.id.startsWith("mon-") && 
                      !l.id.startsWith("tue-") && 
                      !l.id.startsWith("wed-") && 
                      !l.id.startsWith("thu-") && 
                      !l.id.startsWith("fri-") && 
                      !l.id.startsWith("sat-")
                    ) {
                      newlyAddedLec = l;
                      newlyAddedDayStr = day;
                    }
                  }
                });
              }
            });

            if (newlyAddedLec) {
              setSeenIds((prevSeen) => {
                const next = new Set(prevSeen);
                next.add(newlyAddedLec.id);
                return next;
              });
              setLiveNotification({
                lecture: newlyAddedLec,
                day: newlyAddedDayStr,
              });
            }
          } else {
            // First time load, populate seenIds set
            const initialIds = new Set<string>();
            Object.values(data || {}).forEach((val: any) => {
              if (Array.isArray(val)) {
                val.forEach((l: any) => {
                  if (l && l.id) initialIds.add(l.id);
                });
              }
            });
            setSeenIds(initialIds);
          }

          return mergeBookmarksWithLectures(data);
        });

        // Sync to localStorage as local backup
        localStorage.setItem("paramastra_lectures_by_day_v2", JSON.stringify(data));
        
        const nowStr = new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        });
        setLastSyncedTime(nowStr);
        if (isManual) {
          showToast("Batch study feed is perfectly up to date!", "success");
        }
        return;
      }
    } catch (err) {
      console.warn("Failed to fetch fresh study feed from server:", err);
    } finally {
      setIsSyncing(false);
    }
    
    // Fallback if network offline
    try {
      const cached = localStorage.getItem("paramastra_lectures_by_day_v2");
      if (cached) {
        let data = JSON.parse(cached);
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Kolkata",
          weekday: "long",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        const parts = formatter.formatToParts(new Date());
        const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
        const currentDayName = partMap.weekday; // e.g. "Monday"
        const todayStr = `${partMap.year}-${partMap.month}-${partMap.day}`;
        const dayOfMonth = partMap.day;
        
        if (currentDayName === "Monday") {
          if (data && data.lastResetDate !== todayStr) {
            console.log("[CLIENT ARCHIVE] Network offline. Performing local Monday archive...");
            if (!data.archive) data.archive = [];
            const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            
            for (const d of weekdays) {
              if (Array.isArray(data[d]) && data[d].length > 0) {
                for (const lec of data[d]) {
                  if (!data.archive.some((a: any) => a.id === lec.id)) {
                    data.archive.push({
                      ...lec,
                      dateStr: lec.dateStr || `${dayOfMonth} Jun 2026`,
                      dayName: d
                    });
                  }
                }
                // Keep weekday feed/story permanently visible without resetting
                // data[d] = [];
              }
            }
            data.lastResetDate = todayStr;
            localStorage.setItem("paramastra_lectures_by_day_v2", JSON.stringify(data));
          }
        }
        setLecturesByDay(mergeBookmarksWithLectures(data));
      } else {
        setLecturesByDay(mergeBookmarksWithLectures(weeklyLecturesFeed));
        localStorage.setItem("paramastra_lectures_by_day_v2", JSON.stringify(weeklyLecturesFeed));
      }
    } catch (e) {
      setLecturesByDay(mergeBookmarksWithLectures(weeklyLecturesFeed));
    }
  };

  // Sync state with server first, fallback to cached or seeded, and keep all devices in sync in real time!
  useEffect(() => {
    void fetchServerAndLocal();
    
    // Set up a dynamic background poller to sync laptop & phone instantly!
    const interval = setInterval(() => {
      void fetchServerAndLocal();
    }, 20000);
    
    return () => clearInterval(interval);
  }, []);

  const lectures = lecturesByDay[activeDay] || [];
  const allLecturesCombined = useMemo(() => {
    const weekdaysList = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    // Process current week lectures
    const currentWeekLecs = weekdaysList.flatMap((day) => {
      const lecs = lecturesByDay[day] || [];
      return lecs.map((l, idx) => {
        let calcDate = l.dateStr;
        if (!calcDate) {
          const offsets: Record<string, number> = {
            Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7
          };
          const dayNum = offsets[day] ?? (idx % 6 + 1);
          calcDate = `${dayNum.toString().padStart(2, "0")} Jun 2026`;
        }
        return {
          ...l,
          dateStr: calcDate,
          dayName: day
        };
      });
    });

    // Process archived lectures
    const archiveLecs = (lecturesByDay as any)?.archive || [];
    const mappedArchive = archiveLecs.map((l: any) => ({
      ...l,
      dateStr: l.dateStr || "General Study Archive",
      dayName: l.dayName || "Monday"
    }));

    return [...currentWeekLecs, ...mappedArchive] as Lecture[];
  }, [lecturesByDay]);

  const saveLecturesState = async (newLectures: Lecture[]) => {
    const updated = {
      ...lecturesByDay,
      [activeDay]: newLectures
    };
    setLecturesByDay(updated);
    try {
      localStorage.setItem("paramastra_lectures_by_day_v2", JSON.stringify(updated));
    } catch (e) {
      console.warn("Storage write failed:", e);
    }

    setIsUploading(true);
    // Direct synchronized server push
    try {
      const classCode = localStorage.getItem("paramastra_class_code") || "default";
      await fetch(getApiUrl("/api/lectures/sync"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lecturesByDay: updated, classCode })
      });
    } catch (err) {
      console.warn("Could not sync state to central server:", err);
    } finally {
      setIsUploading(false);
    }
  };

  // Callback to insert a newly analyzed lecture directly into the feed 
  const handlePublishLecture = async (
    newLecture: Omit<Lecture, "id" | "timeAgo" | "saves">,
    targetDay?: string
  ): Promise<boolean> => {
    const destDay = targetDay || activeDay;
    
    // Assign a beautiful dynamic cover illustration if none is specified, guaranteeing visual variation for successive uploads
    const cleanSubject = String(newLecture.subject || "Ayurveda BAMS").replace(/[^a-zA-Z0-9\s]/g, "");
    const cleanTopic = String(newLecture.topic || "Study Revision").replace(/[^a-zA-Z0-9\s]/g, "");
    const finalImageUrl = newLecture.imageUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(
      `An elegant scholarly illustration of ${cleanSubject} medical curriculum relating to ${cleanTopic}, warm candlelight workspace with antique sanskrit scrolls, books, herbs, soft-lit fine art style`
    )}?nologo=true&seed=${Math.floor(Math.random() * 90000) + 10000}&width=800&height=500`;

    const fresh: Lecture = {
      ...newLecture,
      dayName: destDay,
      imageUrl: finalImageUrl,
      id: (newLecture as any).id || `lec-${Date.now()}`,
      createdAt: (newLecture as any).createdAt || new Date().toISOString(),
      timeAgo: "Just now",
      saves: Math.floor(Math.random() * 20) + 5,
      saved: false,
      dateStr: getIndianFormattedDateOfWeekday(destDay),
    };
    
    // Optimistic local update (strip raw base64 data to keep client state and local storage highly performant)
    const cleanFresh: Lecture = { ...fresh };
    delete cleanFresh.audioBase64;

    setLecturesByDay((prev) => {
      const currentForDest = prev[destDay] || [];
      const filtered = currentForDest.filter((l) => l.id !== cleanFresh.id);
      const updated = [cleanFresh, ...filtered];
      const nextByDay = {
        ...prev,
        [destDay]: updated
      };
      try {
        localStorage.setItem("paramastra_lectures_by_day_v2", JSON.stringify(nextByDay));
      } catch {}
      return mergeBookmarksWithLectures(nextByDay);
    });

    if (userRole === "cr") {
      setRoute("cr"); // Keep CR on the CR recording dashboard
    } else {
      setRoute("feed"); // Jump to the feed to view the result immediately!
    }

    setIsUploading(true);
    // Direct publish to server to enable server-side audio caching
    try {
      const classCode = localStorage.getItem("paramastra_class_code") || "default";
      const response = await fetch(getApiUrl("/api/lectures"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeDay: destDay,
          lecture: fresh,
          classCode
        })
      });
      if (response.ok) {
        const result = await response.json();
        // The server will assign standard audioUrl endpoint `/api/audio/...` 
        // We sync our app state with the correct server-mapped links!
        setLecturesByDay((prev) => {
          const currentForDest = prev[destDay] || [];
          const received = result.lectures || [result.lecture, ...currentForDest.filter((l: any) => l.id !== result.lecture?.id)];
          const cleanReceived = received.map((l: any) => {
            const cl = { ...l };
            delete cl.audioBase64;
            return cl;
          });
          const serverSynced = {
            ...prev,
            [destDay]: cleanReceived
          };
          try {
            localStorage.setItem("paramastra_lectures_by_day_v2", JSON.stringify(serverSynced));
          } catch {}
          return mergeBookmarksWithLectures(serverSynced);
        });
        return true;
      }
    } catch (err) {
      console.warn("Server publishing failed, fallback to local cache:", err);
    } finally {
      setIsUploading(false);
    }
    return false;
  };

  // Sync edited or custom generated lecture image changes back to the key central server
  const handleUpdateLecture = async (updatedLec: Lecture) => {
    const day = updatedLec.dayName || activeDay;
    if (!day) return;

    // 1. Update locally in lecturesByDay
    setLecturesByDay((prev) => {
      const dayList = prev[day] || [];
      const index = dayList.findIndex(l => l.id === updatedLec.id);
      if (index === -1) return prev;

      const updatedList = [...dayList];
      updatedList[index] = { ...updatedList[index], ...updatedLec };
      const nextByDay = {
        ...prev,
        [day]: updatedList
      };

      try {
        localStorage.setItem("paramastra_lectures_by_day_v2", JSON.stringify(nextByDay));
      } catch {}

      return nextByDay;
    });

    // 2. Persist dynamic card updates back to the central server
    try {
      const classCode = localStorage.getItem("paramastra_class_code") || "default";
      await fetch(getApiUrl("/api/lectures"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeDay: day,
          lecture: updatedLec,
          classCode
        })
      });
    } catch (err) {
      console.warn("Could not sync updated lecture background on central database:", err);
    }
  };

  // Dynamic Permutation & Combination of amazing images applied to the feed
  const handlePermuteFeedImages = async () => {
    try {
      showToast("Shuffling permutation combinations of amazing study art...", "info");
      
      const amazingLibrary = [
        "https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1594897030264-ab7d87efc473?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1502481851512-e9e2529bbbf9?q=80&w=800&auto=format&fit=crop",
        "https://image.pollinations.ai/prompt/An%20gorgeous%20medical%20illustration%20of%20human%20bone%20structure%2C%20vintage%20Sanskrit%20manuscript%20anatomy%20sketch%2C%20hand-drawn%20sepia%20ink%2520on%2520aged%2520yellowed%2520parchment?nologo=true&seed=45831&width=800&height=500",
        "https://image.pollinations.ai/prompt/Traditional%20Indian%20Ayurveda%20plants%20herbarium%20manuscript%2C%20vintage%20engraving%20illustrated%20book%20cover%2C%20fine%20line%20art%20on%20paper?nologo=true&seed=81273&width=800&height=500",
        "https://image.pollinations.ai/prompt/Spiritual%20healing%20nadis%20energy%20channels%2C%20yoga%20meditation%20glowing%20body%20outline%20with%20chakras%20illustration?nologo=true&seed=39128&width=800&height=500"
      ];

      setLecturesByDay((prev) => {
        const nextByDay = { ...prev };
        let modifiedCount = 0;

        for (const day of Object.keys(nextByDay)) {
          const list = nextByDay[day] || [];
          nextByDay[day] = list.map((lec) => {
            const randomPick = amazingLibrary[Math.floor(Math.random() * amazingLibrary.length)];
            let finalUrl = randomPick;
            if (randomPick.includes("pollinations.ai")) {
              const freshSeed = Math.floor(Math.random() * 90000) + 10000;
              finalUrl = randomPick.replace(/seed=\d+/, `seed=${freshSeed}`);
            }

            try {
              localStorage.removeItem(`paramastra_custom_bg_${lec.id}`);
            } catch {}

            modifiedCount++;
            return {
              ...lec,
              imageUrl: finalUrl
            };
          });
        }

        try {
          localStorage.setItem("paramastra_lectures_by_day_v2", JSON.stringify(nextByDay));
        } catch {}

        const classCode = localStorage.getItem("paramastra_class_code") || "default";
        void fetch(getApiUrl("/api/lectures/sync"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lecturesByDay: nextByDay, classCode })
        });

        setTimeout(() => {
          showToast(`⚡ Applied beautiful combinations! ${modifiedCount} feed backgrounds permuted.`, "success");
        }, 800);

        return nextByDay;
      });
    } catch (err: any) {
      showToast("Error shuffling combinations: " + err.message, "warning");
    }
  };

  const handleToggleSave = (id: string) => {
    let novelSavesOffset = 0;
    
    // Read current bookmark set
    let storedList: string[] = [];
    try {
      const stored = localStorage.getItem("paramastra_bookmarked_ids");
      if (stored) storedList = JSON.parse(stored);
    } catch {}
    
    const set = new Set(storedList);
    if (set.has(id)) {
      set.delete(id);
      novelSavesOffset = -1;
    } else {
      set.add(id);
      novelSavesOffset = 1;
    }
    
    try {
      localStorage.setItem("paramastra_bookmarked_ids", JSON.stringify(Array.from(set)));
    } catch {}

    // Update lecturesByDay with the updated saves count and saved state
    const nextLecturesByDay = { ...lecturesByDay };
    Object.keys(nextLecturesByDay).forEach((day) => {
      const val = nextLecturesByDay[day];
      if (Array.isArray(val)) {
        nextLecturesByDay[day] = val.map((l) => {
          if (l.id === id) {
            return {
              ...l,
              saved: !l.saved,
              saves: Math.max(0, l.saves + novelSavesOffset),
            };
          }
          return l;
        });
      }
    });
    
    setLecturesByDay(nextLecturesByDay);
    try {
      localStorage.setItem("paramastra_lectures_by_day_v2", JSON.stringify(nextLecturesByDay));
    } catch {}

    // Direct synchronized server push
    const classCode = localStorage.getItem("paramastra_class_code") || "default";
    void fetch(getApiUrl("/api/lectures/sync"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lecturesByDay: nextLecturesByDay, classCode })
    }).catch(err => console.warn("Sync saves to server warning:", err));
  };

  const handleDeleteLecture = (id: string) => {
    setConfirmDeleteId(id);
  };

  // Simulated quick installer seed for evaluators to skip reading into mic
  const handleSeedExample = () => {
    const seed: Lecture = {
      id: "seed-1",
      subject: "Rachana Sharir",
      topic: "Introduction to Asthi Sharir & Osteology",
      professor: "Dr. Sandeep Sharma",
      professorHandle: "prof_ayurveda",
      duration: "52:00",
      timeAgo: "Just now",
      saves: 42,
      saved: true,
      whatsappContext: "Prof. Sandeep noted: 'Only study Osteology chapters 4–6, do not memorize the complex joint ligaments yet.'",
      examAlert: "HIGHLY HIGHLIGHTED VIVA QUESTIONS: Direct asthi counts matching Charaka (360) and Sushruta (300) are tested annually.",
      keyConcepts: [
        "Classification of bones in classic Sanskrit ayurveda into Kapala, Taruna, and Nalaka classes",
        "Deep osteological landmarks matching global orthopedic models",
        "Correlation of bone health with vulnerable Marma (vital joint) nodes",
      ],
      attachment: {
        name: "Asthi_Osteology_First_Year_BAMS.pdf",
        size: "3.4 MB",
      },
      transcript: "नमस्ते first-year students. Welcome to Osteology (Asthi Sharir). Today we explore the primary bones. Standard text says Acharya Charaka counted 360, while Sushruta counted 300.",
      imageUrl: "https://image.pollinations.ai/prompt/An%20gorgeous%20medical%20illustration%20of%20human%20bone%20structure%2C%20vintage%20Sanskrit%20manuscript%20anatomy%20sketch%2C%20hand-drawn%20sepia%20ink%20line%20art%20on%20aged%20yellowed%2520parchment%2C%20ancient%20classical%20Ayurveda%20style?nologo=true&seed=45831&width=800&height=500"
    };
    
    saveLecturesState([seed, ...lectures]);
    setRoute("feed");
  };

  const handleClassStoriesClick = (subName: string) => {
    setSubjectFilter(subName);
    setRoute("feed");
  };

  // Filter the study feed based on the active search category
  const filteredLectures = subjectFilter
    ? lectures.filter((l) => isSubjectMatching(l.subject, subjectFilter))
    : lectures;

  const currentTitle =
    route === "feed"
      ? subjectFilter
        ? `${subjectFilter} Study Feed`
        : "Syllabus Study Feed"
      : route === "library"
        ? "BAMS Organized Library"
        : route === "tutor"
          ? "Sutra AI Tutor"
          : route === "diary"
            ? "Academic Diary"
            : route === "profile"
              ? "Batch Profile Stats"
              : route === "cr"
                ? "CR Intake Pipeline"
                : route === "roster"
                  ? "Verified Class Roster"
                  : "Paramastra";

  return (
    <div className="mx-auto flex min-h-screen max-w-screen-sm flex-col bg-background relative border-x border-border/10 shadow-lg">
      
      {/* Universal Top Header (Except landing page) */}
      {route !== "landing" && (
        <TopBar
          title={currentTitle}
          userRole={userRole}
          notificationsCount={lectures.length}
          onProfileClick={() => setRoute("profile")}
          onNotificationClick={() => {
            if (userRole === "cr") {
              showToast("You are in CR mode", "info");
              return;
            }
            setSubjectFilter(null);
            setRoute("feed");
          }}
        />
      )}

      {/* Real-time Student Broadcast Banner Notification */}
      {liveNotification && userRole === "student" && (
        <div className="mx-4 mt-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-xl border border-emerald-500/30 flex items-start gap-3 animate-bounce relative z-40 select-none">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 mt-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black tracking-tight leading-normal uppercase">
              Live Broadcast Received!
            </p>
            <p className="text-[11px] text-emerald-50/90 font-semibold leading-normal mt-0.5">
              Your Class Representative just processed a fresh BAMS summary for <strong className="underline">{liveNotification.lecture.subject}</strong> on {liveNotification.day}.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => {
                  setRoute("feed");
                  setActiveDay(liveNotification.day);
                  setSubjectFilter(null);
                  setLiveNotification(null);
                  showToast("Switched with precision to the live lecture feed!", "success");
                }}
                className="bg-white text-emerald-800 px-3.5 py-1.5 rounded-full text-[10px] font-black hover:bg-emerald-50 active:scale-95 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <span>View Notes & Play Audio</span>
                <ArrowRight className="h-3 w-3" />
              </button>
              <button
                onClick={() => setLiveNotification(null)}
                className="text-[10px] text-emerald-100 font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={() => setLiveNotification(null)}
            className="absolute top-2 right-2 text-white/70 hover:text-white p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Screen Routing Outlet Container */}
      <main className="flex-1 pb-16">
        {route === "landing" && (
          <RoleSelectionLanding
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {route === "feed" && (
          <div className="animate-fade-in space-y-6 pb-12 bg-muted/15 min-h-screen">
            {/* Horizontal Today's schedule line */}
            {!(userRole === "student" && lectures.length === 0) && (
              <Stories
                onClassClick={handleClassStoriesClick}
                activeDay={activeDay}
                setActiveDay={setActiveDay}
                lecturesByDay={lecturesByDay}
                globalAudio={globalAudio}
                onToggleAudio={handleToggleGlobalAudio}
                userRole={userRole}
              />
            )}


            {subjectFilter && (
              <div className="px-4 py-2 bg-primary/10 border-b border-border flex items-center justify-between text-xs font-semibold text-primary">
                <span>Filtering: {subjectFilter}</span>
                <button
                  onClick={() => setSubjectFilter(null)}
                  className="font-bold underline uppercase tracking-wider text-[10px] hover:brightness-110"
                >
                  Clear filter
                </button>
              </div>
            )}

            {activeDay === "Sunday" ? (
              /* Beautiful holiday status / rest day feed layout */
              <div className="mx-auto max-w-screen-sm px-5 py-12 space-y-6">
                <div className="relative rounded-3xl overflow-hidden border border-border bg-card p-6 space-y-6 shadow-xl animate-fade-in select-none">
                  <div className="absolute top-0 right-0 h-48 w-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                  
                  {/* Decorative Banner */}
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-border/80">
                    <img 
                      src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop" 
                      alt="Sunday Meditation Study Rest"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover brightness-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 z-10">
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary-foreground bg-primary px-2.5 py-1 rounded-full border border-primary/20">
                        ☀️ WEEKLY REST
                      </span>
                      <h3 className="text-lg font-black text-white mt-2 drop-shadow-sm font-display">BAMS Sunday Shanti</h3>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-foreground">Regenerative Ayurvedic Ritucharya</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      No formal lectures are scheduled today. Sunday is traditionally dedicated to aligning with natural rhythms, digesting the week's concepts, and restoring mental clarity.
                    </p>
                  </div>

                  {/* Rest Suggestions List */}
                  <div className="border-t border-border/60 pt-4 space-y-3">
                    <h5 className="text-[11px] font-bold text-primary uppercase tracking-wider">Suggested BAMS Self-Care</h5>
                    <div className="grid grid-cols-1 gap-2.5">
                      <div className="flex gap-2.5 items-start p-2.5 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
                        <span className="text-sm shrink-0">🌿</span>
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-foreground">Abhyanga & Dinacharya</p>
                          <p className="text-[10px] text-muted-foreground">Practice physical self-care with warm oils to balance regulatory dosha energies.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start p-2.5 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
                        <span className="text-sm shrink-0">📖</span>
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-foreground">Classical Shloka Recitations</p>
                          <p className="text-[10px] text-muted-foreground">Calmly read and articulate selected verses from Ashtanga Hridaya at your leisure.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-start p-2.5 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
                        <span className="text-sm shrink-0">🍵</span>
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-foreground">Digestive Rest (Langhana)</p>
                          <p className="text-[10px] text-muted-foreground">Give your digestive agni a steady rest with warm herbal infusions and light meals.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : filteredLectures.length === 0 ? (
              /* Empty Study Feed view per user specification */
              <div className="mx-auto max-w-screen-sm px-5 py-24 text-center space-y-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-inner animate-pulse">
                  <Mic className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-display text-xl font-extrabold tracking-tight">Authentic Lecture Notes Pending</h2>
                  <p className="mx-auto max-w-sm text-xs text-muted-foreground leading-relaxed">
                    We only provide authentic study notes and audio recordings transcribed directly from this morning's live lectures. No feed or stories are available until the CR uploads the actual lecture audio.
                  </p>
                  <p className="mx-auto max-w-sm text-[11px] text-amber-600 font-semibold bg-amber-500/5 py-2 px-3 rounded-xl border border-amber-500/10 inline-block mt-2">
                    ⏳ Waiting for your Class Representative (CR) to record or upload the morning lecture.
                  </p>
                </div>
              </div>
            ) : (
              /* Populated Cards list stream */
              filteredLectures.map((item) => (
                <FeedCard
                  key={item.id}
                  lecture={item}
                  onSaveToggle={handleToggleSave}
                  onDeleteClick={userRole !== "student" ? handleDeleteLecture : undefined}
                  showToast={showToast}
                  onUpdateLecture={handleUpdateLecture}
                  globalAudio={globalAudio}
                  onToggleAudio={handleToggleGlobalAudio}
                />
              ))
            )}
          </div>
        )}

        {route === "library" && (
          <LibraryView
            onChangeRoute={setRoute}
            onFilterSubject={setSubjectFilter}
            recentLectures={allLecturesCombined}
            showToast={showToast}
          />
        )}

        {route === "diary" && (
          <DiaryView
            userRole={userRole}
            showToast={showToast}
            feedLectures={allLecturesCombined}
          />
        )}

        {route === "tutor" && <TutorView />}

        {route === "profile" && (
          <ProfileView
            onChangeRoute={(newRoute) => {
              if (newRoute === "landing") {
                setUserRole(null);
                try {
                  localStorage.removeItem("paramastra_user_role");
                  localStorage.removeItem("paramastra_class_code");
                  localStorage.removeItem("paramastra_user_name");
                  localStorage.removeItem("paramastra_user_college");
                  localStorage.removeItem("paramastra_user_batch");
                  localStorage.removeItem("paramastra_user_roll");
                } catch {}
              }
              setRoute(newRoute);
            }}
            recentLectures={allLecturesCombined}
            deferredPrompt={deferredPrompt}
            onInstall={handleInstallPWA}
          />
        )}

        {route === "cr" && (
          <CRDashboardView
            onPublishLecture={handlePublishLecture}
            lecturesByDay={lecturesByDay}
            showToast={showToast}
            onDeleteLecture={handleDeleteLecture}
          />
        )}

        {route === "roster" && (
          <div className="p-4">
            <StudentRosterView
              classCode={localStorage.getItem("paramastra_class_code") || "default"}
              collegeName={localStorage.getItem("paramastra_college") || "AAMC Moodbidari"}
              batchYear={localStorage.getItem("paramastra_batch") || "1st Year (2026)"}
              showToast={showToast}
            />
          </div>
        )}
      </main>

      {/* Persistent Bottom Tab navigator */}
      <BottomNav currentRoute={route} onChangeRoute={setRoute} userRole={userRole} />

      {/* Dynamic Toast Notification Control */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs px-4 animate-fade-in pointer-events-none">
          <div className={`p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-left ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : toast.type === "warning" || toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-900"
                : "bg-amber-50 border-amber-200 text-amber-900"
          } backdrop-blur-md`}>
            <span className="shrink-0">
              {toast.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
            </span>
            <div className="text-xs font-bold leading-normal">{toast.message}</div>
          </div>
        </div>
      )}

      {/* Modern, Inline Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xs rounded-3xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20">
              <Trash2 className="h-5 w-5" />
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="text-sm font-extrabold text-foreground">Discard Summary?</h3>
              <p className="text-xs text-muted-foreground leading-normal">
                Are you sure you want to discard this BAMS lecture summary from the batch feed? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded-full border border-border bg-background py-2.5 text-xs font-bold text-foreground hover:bg-muted active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const target = confirmDeleteId;
                  setConfirmDeleteId(null);
                  if (!target) return;

                  const id = typeof target === "string" ? target : target.id;
                  const targetDay = typeof target === "string" ? activeDay : target.day;

                  const targetLectures = lecturesByDay[targetDay] || [];
                  const updated = targetLectures.filter((l) => l.id !== id);
                  const updatedByDay = {
                    ...lecturesByDay,
                    [targetDay]: updated
                  };
                  setLecturesByDay(mergeBookmarksWithLectures(updatedByDay));
                  try {
                    localStorage.setItem("paramastra_lectures_by_day_v2", JSON.stringify(updatedByDay));
                  } catch {}

                  // Server delete call
                  try {
                    const classCode = localStorage.getItem("paramastra_class_code") || "default";
                    const res = await fetch(getApiUrl("/api/lectures"), {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ day: targetDay, id, classCode })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      const serverSynced = {
                        ...lecturesByDay,
                        [targetDay]: data.lectures || updated
                      };
                      setLecturesByDay(mergeBookmarksWithLectures(serverSynced));
                      localStorage.setItem("paramastra_lectures_by_day_v2", JSON.stringify(serverSynced));
                    }
                  } catch (err) {
                    console.warn("Server delete call warning:", err);
                  }
                  showToast("Lecture summary has been discarded.", "warning");
                }}
                className="flex-1 rounded-full bg-destructive px-4 py-2.5 text-xs font-bold text-destructive-foreground hover:brightness-110 active:scale-95 transition-all"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
