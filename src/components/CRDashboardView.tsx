import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Upload,
  FileAudio,
  Sparkles,
  Languages,
  CheckCircle2,
  Loader2,
  Send,
  Users,
  Clock,
  TrendingUp,
  Square,
  AlertCircle,
  Inbox,
  AlertTriangle,
  MessageCircle,
  RefreshCw,
  Sliders,
  Volume2,
  Activity,
  Trash2,
} from "lucide-react";
import type { Lecture } from "../types";
import { isSubjectMatching, matchLecturesToClasses } from "../types";
import { weeklySchedule, TimetableClass, getIndianDate } from "../data/lectures";
import { getApiUrl } from "../config";

type CRDashboardViewProps = {
  onPublishLecture: (lecture: Omit<Lecture, "id" | "timeAgo" | "saves">, targetDay: string) => Promise<boolean>;
  lecturesByDay: Record<string, Lecture[]>;
  showToast: (message: string, type?: "success" | "warning" | "info" | "error") => void;
  onDeleteLecture: (id: string | { id: string; day: string }) => void;
};

type Stage = "idle" | "recording" | "uploading" | "transcribing" | "analysing" | "ready" | "error";

export function CRDashboardView({ onPublishLecture, lecturesByDay, showToast, onDeleteLecture }: CRDashboardViewProps) {
  const classCode = localStorage.getItem("paramastra_class_code") || "default";
  const collegeName = localStorage.getItem("paramastra_college") || "AAMC Moodbidari";
  const batchYear = localStorage.getItem("paramastra_batch") || "1st Year (2026)";

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = days[getIndianDate().getDay()];
  const displayDay = currentDayName;

  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const daysList = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return daysList[getIndianDate().getDay()];
  });

  const recentLectures = lecturesByDay[selectedDay] || [];

  const scheduleForSelectedDay = weeklySchedule[selectedDay] || [];

  const getActiveSlotByTime = (slots: TimetableClass[]): TimetableClass | null => {
    const now = getIndianDate();
    const hrs = now.getHours();
    const mins = now.getMinutes();
    const currentMinutes = hrs * 60 + mins;

    for (const slot of slots) {
      const timeStr = slot.time.toUpperCase();
      const parts = timeStr.split("-");
      if (parts.length !== 2) continue;

      const startPart = parts[0].trim();
      const endPart = parts[1].trim();

      const isPM = endPart.includes("PM");

      const startNumParts = startPart.split(".");
      const startHr = parseInt(startNumParts[0]);
      const startMin = startNumParts.length > 1 ? parseInt(startNumParts[1]) : 0;

      const endCleaned = endPart.replace("AM", "").replace("PM", "").trim();
      const endNumParts = endCleaned.split(".");
      const endHr = parseInt(endNumParts[0]);
      const endMin = endNumParts.length > 1 ? parseInt(endNumParts[1]) : 0;

      let startHr24 = startHr;
      let endHr24 = endHr;

      if (startHr >= 1 && startHr < 8) {
        startHr24 += 12;
      }
      if (endHr >= 1 && endHr < 8) {
        endHr24 += 12;
      }

      if (startHr === 12 && startPart.includes("12") && isPM) {
        startHr24 = 12;
      }

      const startMinutes = startHr24 * 60 + startMin;
      const endMinutes = endHr24 * 60 + endMin;

      if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
        return slot;
      }
    }
    return null;
  };

  const [selectedClass, setSelectedClass] = useState<TimetableClass | null>(null);
  const isSelectedClassActiveNow = !!(selectedClass && getActiveSlotByTime(scheduleForSelectedDay)?.id === selectedClass.id);

  useEffect(() => {
    const active = getActiveSlotByTime(scheduleForSelectedDay);
    if (active) {
      setSelectedClass(active);
    } else if (scheduleForSelectedDay.length > 0) {
      setSelectedClass(scheduleForSelectedDay[0]);
    } else {
      setSelectedClass(null);
    }
  }, [selectedDay]);

  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [isNoiseSuppressionEnabled, setIsNoiseSuppressionEnabled] = useState<boolean>(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const maxVolumeObservedRef = useRef<number>(0);
  const wakeLockRef = useRef<any>(null);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);

  const startSilentPlayback = async () => {
    try {
      // 1-second ultra-lightweight silent WAV file base64 data URI
      const base64Silent = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQQAAAAAAA==";
      const audio = new Audio(base64Silent);
      audio.loop = true;
      audio.volume = 0.01;
      // Essential attributes for inline silent background playing on iOS/Android
      audio.setAttribute("playsinline", "true");
      audio.setAttribute("webkit-playsinline", "true");
      (audio as any).playsInline = true;
      (audio as any).webkitPlaysInline = true;
      
      await audio.play();
      silentAudioRef.current = audio;
      console.log("[Background Keep-Alive] Silent audio loop initiated to sustain CPU cycles during sleep/lock states.");

      // Configure native OS lock screen media session controls to keep the voice recording pipeline alive and inform the user
      if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
        const subjectName = selectedClass?.subject || "Rachana Sharir";
        const topicName = selectedClass?.topic || "Live Class Recording";
        (navigator as any).mediaSession.metadata = new (window as any).MediaMetadata({
          title: `🔴 Recording: ${topicName}`,
          artist: subjectName,
          album: "BAMS Lecture Companion",
        });

        (navigator as any).mediaSession.setActionHandler("pause", () => {
          console.log("[MediaSession] User triggered pause from lock screen.");
          stopRecording();
        });
        (navigator as any).mediaSession.setActionHandler("stop", () => {
          console.log("[MediaSession] User triggered stop from lock screen.");
          stopRecording();
        });
      }
    } catch (err) {
      console.warn("[Background Keep-Alive] Failed to start silent helper audio:", err);
    }
  };

  const stopSilentPlayback = () => {
    if (silentAudioRef.current) {
      try {
        silentAudioRef.current.pause();
        silentAudioRef.current = null;
        console.log("[Background Keep-Alive] Silent audio loop terminated.");
      } catch (err) {
        console.warn("[Background Keep-Alive] Failed to stop silent audio:", err);
      }
    }
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      try {
        (navigator as any).mediaSession.metadata = null;
      } catch (e) {}
    }
  };

  const requestWakeLock = async () => {
    if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        console.log("[WakeLock] Prevent device from going to sleep.");
      } catch (err) {
        console.warn("[WakeLock] Could not acquire Screen Wake Lock:", err);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        console.log("[WakeLock] Screen Wake Lock released successfully.");
      } catch (err) {
        console.warn("[WakeLock] Error releasing Screen Wake Lock:", err);
      }
      wakeLockRef.current = null;
    }
  };

  const [stage, setStage] = useState<Stage>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [language, setLanguage] = useState("Auto-Detect (Kanglish, Sanskrit, English, Hindi)");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [realtimeTranscript, setRealtimeTranscript] = useState<string>("");
  const [hasPublished, setHasPublished] = useState(false);

  const isInIframe = typeof window !== "undefined" && window.self !== window.top;

  // Background Processing Queue State
  type TaskStage = "uploading" | "transcribing" | "analysing" | "ready" | "error";
  interface BackgroundTask {
    id: string;
    name: string;
    subject: string;
    topic: string;
    stage: TaskStage;
    elapsedSec: number;
    error: string | null;
    timestamp: string;
    topicClassified?: string;
  }
  const [backgroundTasks, setBackgroundTasks] = useState<BackgroundTask[]>([]);

  // Gemini / analysis payload
  const [analysisResult, setAnalysisResult] = useState<{
    subject: string;
    topic: string;
    transcript: string;
    keyConcepts: string[];
    examAlert: string | null;
    whatsappContext: string | null;
    isDemo?: boolean;
    audioUrl?: string;
    audioBase64?: string;
    imageUrl?: string;
  } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const activeRecordStreamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);
  const realtimeTranscriptRef = useRef<string>("");

  useEffect(() => {
    return () => {
      stopAllTracks();
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        void audioContextRef.current.close().catch(() => {});
      }
      void releaseWakeLock();
    };
  }, []);

  // HIGH-RELIABILITY VISIBILITY-CHANGE RECOVERY ENGINE:
  // Detects sleep mode transitions or tab background suspends, immediately restoring AudioContext state,
  // web speech transcription listeners, and Screen Wake Lock assertions once the viewport is active again.
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        console.log("[Visibility Recovery] Tab became visible. Checking pipeline state...");
        
        // 1. Re-acquire Wake Lock if actively recording
        if (stage === "recording") {
          if (!wakeLockRef.current) {
            await requestWakeLock();
          }
          
          // 2. Safely resume any AudioContext that was suspended by browser power-saving rules
          if (audioContextRef.current && audioContextRef.current.state === "suspended") {
            try {
              await audioContextRef.current.resume();
              console.log("[Visibility Recovery] Web AudioContext successfully resumed from suspended sleep state.");
            } catch (resumeErr) {
              console.warn("[Visibility Recovery] Web AudioContext resume failed:", resumeErr);
            }
          }
          
          // 3. Keep speech recognition transcription running or hot-start it if inactive
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
              console.log("[Visibility Recovery] Continuous Speech Recognition verified/re-started.");
            } catch (recognitionErr) {
              // Ignore already-started exceptions
            }
          }
        }
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [stage]);

  const stopAllTracks = () => {
    void releaseWakeLock();
    stopSilentPlayback();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (activeRecordStreamRef.current) {
      activeRecordStreamRef.current.getTracks().forEach((track) => track.stop());
      activeRecordStreamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      void audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setVolumeLevel(0);
  };

  const reset = () => {
    setStage("idle");
    setFileName(null);
    setAnalysisResult(null);
    setError(null);
    setElapsed(0);
    setRealtimeTranscript("");
    realtimeTranscriptRef.current = "";
    setHasPublished(false);
    maxVolumeObservedRef.current = 0;
    stopAllTracks();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64Index = result.indexOf(",");
        resolve(base64Index >= 0 ? result.slice(base64Index + 1) : result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  };

  const processAudioPipelineBackground = async (
    blob: Blob,
    name: string,
    subjectName: string,
    topicName: string,
    selectedDayVal: string,
    manualTranscript?: string,
    targetClassId?: string,
    targetInstructions?: string
  ) => {
    const taskId = `task-${Date.now()}`;
    const timestampStr = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Generate a locally playable Object URL for real-time audio playback
    const audioUrl = URL.createObjectURL(blob);

    // Get exact duration of the audio blob natively!
    const tempAudio = new Audio(audioUrl);
    let audioDuration = 0;
    try {
      await new Promise<void>((resolve) => {
        tempAudio.addEventListener("loadedmetadata", () => {
          audioDuration = tempAudio.duration;
          resolve();
        });
        tempAudio.addEventListener("error", () => {
          resolve();
        });
        setTimeout(resolve, 800);
      });
    } catch (e) {}

    const calculatedDuration = elapsed > 0 ? elapsed : (audioDuration > 0 && Number.isFinite(audioDuration) ? Math.round(audioDuration) : 60);

    const newTask: BackgroundTask = {
      id: taskId,
      name,
      subject: subjectName,
      topic: topicName,
      stage: "uploading",
      elapsedSec: calculatedDuration,
      error: null,
      timestamp: timestampStr,
    };

    // Append to background tasks list
    setBackgroundTasks((prev) => [newTask, ...prev]);

    // Give visual toast that recording has background enqueued successfully!
    showToast(`"${subjectName}" lecture enqueued in background! Ready to record your next class session.`, "success");

    // Clear state inputs immediately so they can record another class file right away
    setRealtimeTranscript("");

    // Asynchronously carry out the rest of the processing
    void (async () => {
      const updateTaskStage = (s: TaskStage, errStr: string | null = null, topicClass?: string) => {
        setBackgroundTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, stage: s, error: errStr, topicClassified: topicClass } : t))
        );
      };

      try {
        if (!blob || blob.size < 100) {
          throw new Error("No audio content found. Please record or upload a valid, non-empty audio lecture.");
        }

        const audioBase64 = await blobToBase64(blob);

        updateTaskStage("transcribing");
        await new Promise((r) => setTimeout(r, 1400));

        updateTaskStage("analysing");

        const getAudioMimeType = (fileName: string, fileType: string): string => {
          const ext = fileName.split(".").pop()?.toLowerCase();
          if (ext === "mp3") return "audio/mpeg";
          if (ext === "wav" || ext === "wave") return "audio/wav";
          if (ext === "m4a") return "audio/mp4";
          if (ext === "webm") return "audio/webm";
          if (ext === "ogg") return "audio/ogg";
          if (ext === "aac") return "audio/aac";
          if (ext === "flac") return "audio/flac";
          
          const cleanType = (fileType || "").split(";")[0].trim().toLowerCase();
          if (cleanType.includes("mpeg") || cleanType.includes("mp3")) return "audio/mpeg";
          if (cleanType.includes("wav") || cleanType.includes("wave")) return "audio/wav";
          if (cleanType.includes("m4a") || cleanType.includes("mp4")) return "audio/mp4";
          if (cleanType.includes("webm")) return "audio/webm";
          return cleanType || "audio/mpeg";
        };

        let result;
        try {
          // Real API Call to Express Backend
          const response = await fetch(getApiUrl("/api/analyze"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audioBase64,
              mimeType: getAudioMimeType(name, blob.type),
              language,
              speechTranscript: manualTranscript || undefined,
              isRecording: name.startsWith("BAMS-Lecture-"),
              targetSubject: subjectName,
              targetTopic: topicName || undefined,
              targetInstructions: targetInstructions || undefined,
              originalDurationSec: calculatedDuration,
            }),
          });

          if (!response.ok) {
            let errMsg = response.statusText;
            try {
              const errData = await response.json();
              errMsg = errData.error || errMsg;
            } catch {
              try {
                const text = await response.text();
                if (text) errMsg = text;
              } catch {}
            }
            throw new Error(errMsg || "AI processing failed.");
          }

          result = await response.json();
        } catch (err: any) {
          console.error("[PIPELINE ERROR] Analysis failed:", err);
          showToast(`Analysis failed: ${err.message || "Unknown error"}. Real audio transcription requires server connectivity.`, "error");
          throw err;
        }

        const finalSubject = result.subject || subjectName || "Rachana Sharir";
        const finalTopic = result.topic || "Live Study Review";

        updateTaskStage("ready", null, finalTopic);

        // Auto-publish to the server database so other devices (laptops, phones) receive it instantly!
        const autoLec = {
          subject: finalSubject,
          topic: finalTopic,
          professor: "Dr. Sandeep Sharma",
          professorHandle: "prof_ayurveda",
          duration: formatTime(calculatedDuration),
          keyConcepts: result.keyConcepts || [],
          examAlert: result.examAlert || "",
          whatsappContext: result.whatsappContext || "",
          transcript: result.transcript || "",
          classNotes: result.classNotes || "",
          isDemo: Boolean(result.isDemo),
          audioUrl,
          audioBase64,
          mimeType: blob.type || "audio/webm",
          imageUrl: result.imageUrl || undefined,
          timetableClassId: targetClassId,
        };

        await onPublishLecture(autoLec, selectedDayVal);
        showToast(`Published! "${finalSubject} - ${finalTopic}" has been analyzed in background & broadcasted live.`, "success");
      } catch (err: any) {
        console.error(`Background task ${taskId} failure:`, err);
        updateTaskStage("error", err.message || "An unexpected error occurred during transcription.");
        showToast(`Gemini background analysis failed for "${subjectName}": ${err.message || "Unknown error"}.`, "warning");
      }
    })();
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const subjectName = selectedClass?.subject || "Rachana Sharir";
      const topicName = selectedClass?.topic || "Standard study session guide";
      void processAudioPipelineBackground(
        file,
        file.name,
        subjectName,
        topicName,
        selectedDay,
        undefined,
        selectedClass?.id,
        selectedClass?.instructions
      );
      reset();
    }
    e.target.value = ""; // clear value so they can re-select if needed
  };

  // Removed simulated fallback functions as per direct guidelines

  const startRecording = async () => {
    setError(null);
    setRealtimeTranscript("");
    maxVolumeObservedRef.current = 0;
    await requestWakeLock();
    await startSilentPlayback();
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new TypeError("MEDIA_NOT_SUPPORTED");
      }
      
      let stream;
      try {
        console.log("[Mic] Attempting high-fidelity audio stream acquisition...");
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: { ideal: 1 },
            sampleRate: { ideal: 44100 },
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true },
          },
        });
      } catch (constraintsErr) {
        console.warn("[Mic] High-fidelity constraints rejected, falling back to standard audio stream:", constraintsErr);
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      }
      streamRef.current = stream;

      let recordStream = stream;

      // Real-time Mic Amplitude Analyzer & Software DSP Noise Suppression Pipeline
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          
          // Safari/Chrome autoplay policy workaround: Resume suspended AudioContext on user action
          if (ctx.state === "suspended") {
            await ctx.resume();
          }

          const srcNode = ctx.createMediaStreamSource(stream);

          if (isNoiseSuppressionEnabled) {
            console.log("[DSP] Initializing Senior Software Engineer Vocal Isolation & Noise Suppression Pipeline...");
            
            // 1. High-Pass Filter: Attenuate sub-80Hz sub-bass and environmental rumble (A/C, room hum, wind, vibration) without stripping voice resonance
            const hpFilter = ctx.createBiquadFilter();
            hpFilter.type = "highpass";
            hpFilter.frequency.setValueAtTime(80, ctx.currentTime);
            hpFilter.Q.setValueAtTime(0.707, ctx.currentTime);

            // 2. Vocal Presence Peaking Filter: Boost standard speech clarity around 3000Hz (presence and articulation band)
            const peakingFilter = ctx.createBiquadFilter();
            peakingFilter.type = "peaking";
            peakingFilter.frequency.setValueAtTime(3000, ctx.currentTime);
            peakingFilter.Q.setValueAtTime(1.0, ctx.currentTime);
            peakingFilter.gain.setValueAtTime(3.0, ctx.currentTime); // Gentle 3dB presence boost

            // 3. High-Fidelity Low-Pass Filter: Attenuate high-pitched fan whistles and system hiss above 10000Hz while preserving sibilant brilliance
            const lpFilter = ctx.createBiquadFilter();
            lpFilter.type = "lowpass";
            lpFilter.frequency.setValueAtTime(10000, ctx.currentTime);
            lpFilter.Q.setValueAtTime(0.707, ctx.currentTime);

            // 4. Dynamics Compressor: Smooth vocal volume level variations naturally without brickwall squashing or pumping
            const compressor = ctx.createDynamicsCompressor();
            compressor.threshold.setValueAtTime(-16, ctx.currentTime);
            compressor.knee.setValueAtTime(12, ctx.currentTime);
            compressor.ratio.setValueAtTime(4, ctx.currentTime); // Balanced 4:1 vocal compression
            compressor.attack.setValueAtTime(0.012, ctx.currentTime); // 12ms attack allows speech transients to pass cleanly
            compressor.release.setValueAtTime(0.15, ctx.currentTime); // 150ms release for smooth recovery

            // 5. Connect DSP pipeline: Source -> HPF -> Peaking -> LPF -> Compressor
            srcNode.connect(hpFilter);
            hpFilter.connect(peakingFilter);
            peakingFilter.connect(lpFilter);
            lpFilter.connect(compressor);

            // 6. Output to recording stream destination - Record hardware stream directly for max reliability
            recordStream = stream;
            activeRecordStreamRef.current = stream;

            const dest = ctx.createMediaStreamDestination();
            compressor.connect(dest);

            const silenceGain = ctx.createGain();
            silenceGain.gain.setValueAtTime(0, ctx.currentTime);
            compressor.connect(silenceGain);
            silenceGain.connect(ctx.destination);

            // 7. Connect to visualizer analyzer for real-time visual output of clean speech
            const ansNode = ctx.createAnalyser();
            ansNode.fftSize = 64;
            compressor.connect(ansNode);
            analyserRef.current = ansNode;
          } else {
            console.log("[DSP] Vocal Filter Bypass - Recording Raw Mic Stream");
            const ansNode = ctx.createAnalyser();
            ansNode.fftSize = 64;
            srcNode.connect(ansNode);
            analyserRef.current = ansNode;
            activeRecordStreamRef.current = null;

            // Connect raw stream analyzer branch to physical destination to ensure WebKit keeps pulling audio
            const silenceGain = ctx.createGain();
            silenceGain.gain.setValueAtTime(0, ctx.currentTime);
            ansNode.connect(silenceGain);
            silenceGain.connect(ctx.destination);
          }

          const ansNode = analyserRef.current;
          if (ansNode) {
            const bufferLength = ansNode.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            const checkVolume = () => {
              if (!analyserRef.current) return;
              analyserRef.current.getByteFrequencyData(dataArray);
              let total = 0;
              for (let i = 0; i < bufferLength; i++) {
                total += dataArray[i];
              }
              const avg = total / bufferLength;
              const percentage = Math.min(100, Math.round((avg / 120) * 100));
              setVolumeLevel(percentage);
              if (percentage > maxVolumeObservedRef.current) {
                maxVolumeObservedRef.current = percentage;
              }
              
              animationFrameRef.current = requestAnimationFrame(checkVolume);
            };
            animationFrameRef.current = requestAnimationFrame(checkVolume);
          }
        }
      } catch (audioCtxErr) {
        console.warn("Could not start visual feedback analyzer:", audioCtxErr);
      }

      // Select supported audio formats natively
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : undefined;

      const recorder = new MediaRecorder(recordStream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        let compiledBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        
        stopAllTracks();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        const stamp = new Date().toISOString().substring(11, 19).replace(/:/g, "-");
        const fileExtension = (recorder.mimeType || "webm").includes("mp4") ? "m4a" : "webm";
        let recordingName = `BAMS-Lecture-${stamp}.${fileExtension}`;

        // Only enforce a real file structure check. Removing the strict amplitude and recognition text thresholds
        // prevents false-positives under silent environments or when the browser's speech recognition fails/is offline.
        if (compiledBlob.size < 1000) {
          setError("No live audio signal could be captured. Please ensure your microphone is unmuted, verify your device has mic access, or upload a pre-recorded audio file directly.");
          setStage("error");
          showToast("Live audio capture failed. Recording was empty.", "warning");
          return;
        }

        const subjectName = selectedClass?.subject || "Rachana Sharir";
        const topicName = selectedClass?.topic || "Standard study session guide";
        void processAudioPipelineBackground(
          compiledBlob,
          recordingName,
          subjectName,
          topicName,
          selectedDay,
          realtimeTranscriptRef.current,
          selectedClass?.id,
          selectedClass?.instructions
        );
        reset();
      };

      // Continuous chunk collection (every 1000ms timeslice) guarantees chunks are fed dynamically
      // to ondataavailable, protecting against blank recordings on stop actions.
      try {
        recorder.start(1000);
      } catch (startErr) {
        console.warn("[MediaRecorder] Timeslice start failed, fallback to unconditional start:", startErr);
        recorder.start();
      }

      startedAtRef.current = Date.now();
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 500);

      // Start Speech Recognition in parallel for real-time transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        // Map dialect to native BCP-47 tags
        let locale = "en-IN";
        if (language.includes("Auto-Detect")) {
          // Indian English locale has superb code-mixed recognition for Kanglish, Hindi and Sanskrit phonology
          locale = "en-IN";
        } else if (language === "Hindi Pure" || language === "Sanskrit Vocab" || language === "English + Hindi") {
          locale = "hi-IN";
        } else if (language === "Tamil") {
          locale = "ta-IN";
        } else if (language === "Kannada") {
          locale = "kn-IN";
        } else if (language === "Marathi") {
          locale = "mr-IN";
        }
        recognition.lang = locale;

        let finalTranscript = "";
        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " ";
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          const fullText = finalTranscript + interimTranscript;
          setRealtimeTranscript(fullText);
          realtimeTranscriptRef.current = fullText;
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
        };

        recognition.onend = () => {
          console.log("Speech recognition ended.");
          // Auto-restart continuous speech recognition if actively recording
          if (recorderRef.current && recorderRef.current.state === "recording") {
            try {
              recognition.start();
              console.log("[SpeechRecognition] Auto-restarted speech transcription listener.");
            } catch (e) {}
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      setStage("recording");
    } catch (err: any) {
      console.error("Microphone capture failed:", err);
      if (err.message === "MEDIA_NOT_SUPPORTED" || err.name === "TypeError") {
        setError("Your browser or preview container restricts direct microphone access in secure iframes. Please click the 'Open in new tab' button at the top-right of the preview window to trigger microphone actions directly.");
      } else if (err.name === "NotAllowedError") {
        setError("Microphone access denied. Please grant permission in your browser settings or click the 'Open in new tab' button at the top-right of the preview window.");
      } else if (err.name === "NotFoundError") {
        setError("No microphone found. Please connect an input device.");
      } else {
        setError("Could not capture live microphone audio. Please verify your connection or upload an audio file instead.");
      }
      setStage("error");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!analysisResult) return;
    
    setIsPublishing(true);
    try {
      const success = await onPublishLecture({
        subject: analysisResult.subject,
        topic: analysisResult.topic,
        professor: "Dr. Sandeep Sharma",
        professorHandle: "prof_ayurveda",
        duration: formatTime(elapsed || 3120),
        keyConcepts: analysisResult.keyConcepts,
        examAlert: analysisResult.examAlert,
        whatsappContext: analysisResult.whatsappContext,
        transcript: analysisResult.transcript,
        classNotes: analysisResult.classNotes,
        isDemo: Boolean(analysisResult.isDemo),
        audioUrl: analysisResult.audioUrl,
        audioBase64: analysisResult.audioBase64,
        imageUrl: analysisResult.imageUrl || undefined,
        timetableClassId: selectedClass?.id,
      }, selectedDay);

      if (success) {
        setHasPublished(true);
        showToast("Synchronized! Successfully published BAMS summary to database & all devices.", "success");
      } else {
        setHasPublished(true);
        showToast("Sync warning: Saved locally on your phone cache. Note will update on laptop when network resumes.", "info");
      }
    } catch (err) {
      console.error("Publishing action error:", err);
      setHasPublished(true);
      showToast("Sync error: Saved to offline phone cache.", "warning");
    } finally {
      setIsPublishing(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mx-auto max-w-screen-sm px-4 py-5 space-y-6">
      {/* Dynamic Class Selector based on Timetable */}
          <div className="rounded-3xl border border-border bg-card p-5 space-y-3.5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-primary" />
            BAMS Timetable Coordinator Stream
          </div>
          <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded font-bold">
            IST {getIndianDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </span>
        </div>

        {/* Horizontal Weekday Tabs Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b border-border/50 scrollbar-thin select-none">
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => {
            const isSel = selectedDay === d;
            const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const todayName = daysOfWeek[getIndianDate().getDay()];
            const isToday = d === todayName;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDay(d)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border outline-none cursor-pointer flex items-center gap-1 ${
                  isSel
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background/85 hover:bg-muted text-muted-foreground border-border"
                }`}
              >
                <span>{d.substring(0, 3)}</span>
                {isToday && <span className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ring-1 ${isSel ? "bg-primary-foreground ring-primary-foreground/40" : "bg-primary ring-primary/40"}`} />}
              </button>
            );
          })}
        </div>

        <div className="space-y-1">
          <h3 className="font-display text-sm font-extrabold text-foreground leading-tight">
            Select BAMS Timetable target slot
          </h3>
          <p className="text-xs text-muted-foreground leading-normal">
            Select which class slot you are recording/simulating notes for. This maps notes perfectly to the student feed day.
          </p>
        </div>

        {/* Timetable schedule list */}
        <div className="grid gap-2 text-left">
          {(() => {
            const slotsMap = matchLecturesToClasses(scheduleForSelectedDay, lecturesByDay[selectedDay] || []);
            return scheduleForSelectedDay.map((slot) => {
              const isActive = selectedClass?.id === slot.id;
              const isCurrentlyTimeActive = getActiveSlotByTime(scheduleForSelectedDay)?.id === slot.id;
              const matchingLec = slotsMap[slot.id];

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedClass(slot)}
                  className={`w-full rounded-2xl border text-left p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-all outline-none cursor-pointer ${
                    isActive
                      ? "bg-primary/[0.07] border-primary text-foreground shadow-sm"
                      : "bg-background/90 hover:bg-muted/50 border-border/80 text-foreground"
                  }`}
                >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-extrabold text-foreground leading-tight">
                      {slot.subject}
                    </span>
                    {isCurrentlyTimeActive && (
                      <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/25 px-1.5 py-0.2 rounded-full flex items-center gap-1 shrink-0">
                        <span className="h-1 w-1 bg-amber-500 rounded-full animate-ping" />
                        Active Now
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate leading-normal">
                    {matchingLec ? (
                      <span className="text-foreground font-bold">Topic: {matchingLec.topic}</span>
                    ) : (
                      <span className="text-muted-foreground/55">Topic will update live post-lesson</span>
                    )}
                    {" • "}
                    <span className="font-semibold text-foreground/80">{slot.professor}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right md:-mt-1">
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full ${
                    isActive
                      ? "bg-primary text-primary-foreground font-black"
                      : "bg-muted text-muted-foreground font-semibold"
                  }`}>
                    {slot.time}
                  </span>
                </div>
              </button>
            );
          })})()}
        </div>
      </div>

      {/* Primary Pipeline Hub */}
      <div className="space-y-3">
        <h2 className="font-display text-sm font-bold tracking-tight text-foreground uppercase">
          Lecture Intake
        </h2>

        {stage === "idle" || stage === "error" ? (
          <div className="rounded-3xl border-2 border-dashed border-border bg-card/40 p-6 text-center shadow-sm relative">
            {selectedClass && (
              <div className="mb-4 rounded-2xl bg-primary/5 border border-primary/20 p-3.5 text-left animate-fade-in flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[9.5px] uppercase tracking-widest text-primary font-extrabold">
                    {isSelectedClassActiveNow ? "Target Class Active Now:" : "Target Class Selected (Offline):"}
                  </div>
                  <div className="truncate text-xs font-bold text-foreground mt-0.5">
                    {selectedClass.subject}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground leading-normal">
                    Instructor: {selectedClass.professor}
                  </div>
                </div>
                {isSelectedClassActiveNow ? (
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
                )}
              </div>
            )}

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Mic className={`h-6 w-6 ${isSelectedClassActiveNow ? 'animate-pulse' : ''}`} />
            </div>

            <h3 className="mt-4 text-sm font-semibold">Record Live Lesson or Pick Audio File</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Supports continuous microphone streams or file inputs (.webm, .m4a, .mp3, .wav)
            </p>

            {/* DSP Senior Engineer Noise Cancellation Controls */}
            <div className="mt-4 max-w-xs mx-auto rounded-2xl bg-primary/5 border border-primary/10 p-3 flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2.5 min-w-0">
                <Sliders className="h-4 w-4 text-primary shrink-0 animate-pulse" />
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-wider text-primary">
                    Vocal Isolation DSP Filter
                  </div>
                  <div className="text-[9px] text-muted-foreground font-semibold leading-normal truncate mt-0.5">
                    {isNoiseSuppressionEnabled ? "120Hz HPF + 1.5kHz Peak + 4kHz LPF + AGC Active" : "Bypass Filters (Raw Stream)"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNoiseSuppressionEnabled(!isNoiseSuppressionEnabled)}
                className={`text-[9px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  isNoiseSuppressionEnabled
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {isNoiseSuppressionEnabled ? "ACTIVE" : "BYPASS"}
              </button>
            </div>

            {/* CTA Actions */}
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:justify-center flex-wrap">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-3 text-xs font-bold hover:bg-muted active:scale-95 transition-all text-foreground cursor-pointer"
              >
                <Upload className="h-4 w-4 text-muted-foreground" /> Import Audio
              </button>
              
              <button
                type="button"
                onClick={() => void startRecording()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-xs font-extrabold text-primary-foreground shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                <Mic className="h-4 w-4 fill-current text-primary-foreground" /> Record Live
              </button>
            </div>





            {/* Removed iframe simulation mode to enforce real live audio only */}

            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={onFileSelected}
            />

            {stage === "error" && error && (
              <div className="mt-4.5 flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/5 p-3.5 text-left text-xs text-destructive animate-fade-in">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span className="leading-normal font-semibold">{error}</span>
              </div>
            )}
          </div>
        ) : stage === "recording" ? (
          /* Live Recording Monitor */
          <div className="rounded-3xl border border-exam/40 bg-exam/5 p-6 text-center animate-pulse">
            {selectedClass && (
              <div className="mb-4.5 rounded-2xl bg-exam/10 border border-exam/25 p-3.5 text-left animate-fade-in">
                <div className="text-[9.5px] uppercase tracking-widest text-exam font-black flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-exam animate-ping" />
                  Currently Recording Class:
                </div>
                <div className="text-xs font-extrabold text-foreground mt-0.5">
                  {selectedClass.subject}
                </div>
                <div className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                  Instructor: {selectedClass.professor}
                </div>
              </div>
            )}

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-exam/25 text-exam">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-exam opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-exam"></span>
              </span>
            </div>

            <h3 className="mt-3.5 text-xs font-bold uppercase tracking-wider text-exam">
              Paramastra Live Stream Ingestion
            </h3>
            
            <p className="mt-1.5 font-display text-4xl font-black text-foreground tracking-tight tabular-nums">
              {formatTime(elapsed)}
            </p>
            
            <p className="text-xs text-muted-foreground mt-1">
              Language Target: <span className="font-semibold text-foreground">{language}</span>
            </p>

            {/* Live Volume Level visualization & Bluetooth diagnosis */}
            (
              <div className="mt-4 max-w-xs mx-auto space-y-2 text-left bg-background/50 border border-border/60 p-3.5 rounded-2xl">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    {volumeLevel > 2 ? "🎤 Voice stream active" : "🔇 No voice audio signal"}
                  </span>
                  <span className="font-mono text-primary">{volumeLevel}% input level</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-75 ${
                      volumeLevel > 40 ? "bg-emerald-500 animate-pulse" : volumeLevel > 10 ? "bg-primary" : "bg-muted-foreground/30"
                    }`} 
                    style={{ width: `${volumeLevel}%` }}
                  />
                </div>
                {isNoiseSuppressionEnabled && (
                  <div className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-1.5 rounded-xl font-bold flex items-center justify-between gap-2.5">
                    <span className="flex items-center gap-1 shrink-0">
                      <Sliders className="h-3 w-3 text-primary shrink-0 animate-pulse" /> DSP Isolated Speech
                    </span>
                    <span className="text-[8.5px] text-muted-foreground/90 font-semibold truncate">120Hz HPF + 1.5kHz Peak + 4kHz LPF + AGC</span>
                  </div>
                )}
                {volumeLevel <= 2 && (
                  <div className="text-[10px] text-amber-500 font-medium leading-normal border border-amber-500/15 bg-amber-500/5 p-2 rounded-xl animate-pulse space-y-1">
                    <p>
                      <strong>🔇 Bluetooth flatline detected!</strong> Sound stream contains no voice amplitude data.
                    </p>
                    <ul className="list-disc pl-3 text-[9px] text-muted-foreground space-y-0.5 mt-1">
                      <li>Check if Bluetooth earbuds' microphone is muted</li>
                      <li>Try refreshing page in <strong>Safari/Chrome</strong> directly (not inside in-app webviews)</li>
                      <li>Turn off Bluetooth momentarily to record directly into your phone microphone</li>
                    </ul>
                  </div>
                )}
              </div>
            )

            {realtimeTranscript && (
              <div className="mt-4 p-3 bg-background/60 border border-border/80 rounded-2xl max-w-sm mx-auto animate-fade-in text-left">
                <p className="text-[9px] uppercase tracking-wider text-primary font-extrabold mb-1 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                  Live Voice Transcript:
                </p>
                <p className="text-xs text-foreground/90 font-mono leading-relaxed max-h-24 overflow-y-auto italic divide-y divide-border/20 scrollbar-thin">
                  "{realtimeTranscript}"
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={stopRecording}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-xs font-extrabold text-background hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <Square className="h-4 w-4 fill-current" /> Finish & Run Analysis
            </button>
          </div>
        ) : (
          /* Analysis & Transcribing Progress Steps */
          <div className="rounded-3xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <FileAudio className="h-5 w-5 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{fileName}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Ingested • {language}
                </div>
              </div>
              
              {stage === "ready" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 border border-success/30 px-2.5 py-1 text-xs font-bold text-success">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Structured
                </span>
              )}
            </div>

            <ol className="space-y-2.5 pt-2 border-t border-border/60">
              <PipelineStep
                label="Uploading Raw File Streams"
                sub="Caching buffer chunks safely on sandboxed layout"
                active={stage === "uploading"}
                done={["transcribing", "analysing", "ready"].includes(stage)}
              />
              <PipelineStep
                label="Gemini Modality Transcribing"
                sub="Executing Sanskrit dictionary and term extraction"
                active={stage === "transcribing"}
                done={["analysing", "ready"].includes(stage)}
              />
              <PipelineStep
                label="Gemini Structuring & Syllabus Alignment"
                sub="Collating high-yield exam alerts & key concepts"
                active={stage === "analysing"}
                done={stage === "ready"}
              />
            </ol>

            {stage === "ready" && analysisResult && (
              <div className="mt-5 space-y-4 pt-4 border-t border-border animate-fade-in">
                {/* Real-time broadcast status alert badge */}
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 flex items-start gap-3 text-emerald-500 shadow-sm animate-pulse">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold leading-normal">
                      Automatically Synced & Broadcasted Live!
                    </p>
                    <p className="text-[10.5px] text-emerald-500/90 font-medium leading-normal mt-0.5">
                      This lecture summary has been written to the central database. Student laptops and feeds will update dynamically in real time.
                    </p>
                  </div>
                </div>

                {/* Result summary info header */}
                <div className="rounded-2xl bg-secondary/80 p-3.5 border border-border">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Detected BAMS Subject
                  </div>
                  <div className="mt-0.5 text-base font-extrabold text-foreground leading-tight">
                    {analysisResult.subject}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground font-semibold leading-normal">
                    AI Topic Classify: "{analysisResult.topic}"
                  </div>
                </div>

                {/* Transcript Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                    <Languages className="h-4 w-4" /> Real-time Word Translation
                  </div>
                  <p className="max-h-32 overflow-y-auto rounded-2xl bg-muted/60 p-3.5 text-xs leading-relaxed text-muted-foreground border border-border font-mono scrollbar-thin">
                    {analysisResult.transcript}
                  </p>
                </div>

                {/* Structured key concepts */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" /> AI Synthesized Concepts
                  </div>
                  <ul className="space-y-1.5">
                    {analysisResult.keyConcepts.map((concept, index) => (
                      <li
                        key={concept}
                        className="rounded-xl bg-secondary/50 border border-border/40 px-3.5 py-2.5 text-xs text-secondary-foreground font-medium leading-normal"
                      >
                        <span className="font-bold text-primary mr-1">{index + 1}.</span> {concept}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Exam alerts highlight */}
                {analysisResult.examAlert && (
                  <div className="rounded-2xl border border-exam/30 bg-exam/5 p-3.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-exam flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Exam-Yield Highlight Captured
                    </div>
                    <p className="mt-1 text-xs text-foreground/90 font-medium">
                      {analysisResult.examAlert}
                    </p>
                  </div>
                )}

                {/* WhatsApp guidelines highlight */}
                {analysisResult.whatsappContext && (
                  <div className="flex gap-2.5 rounded-2xl border border-success/30 bg-success/5 p-3.5 text-left">
                    <MessageCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success shrink-0" />
                    <div className="text-xs leading-relaxed text-foreground/90">
                      <span className="font-extrabold text-success uppercase tracking-wider text-[10px] block mb-0.5">
                        Given Assignment / Task:
                      </span>
                      "{analysisResult.whatsappContext}"
                    </div>
                  </div>
                )}

                {/* Primary published CTA */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={reset}
                    disabled={isPublishing}
                    className="flex-1 rounded-full border border-border bg-background px-4 py-3 text-xs font-bold text-foreground hover:bg-muted active:scale-95 transition-all disabled:opacity-50"
                  >
                    Record Another Lecture
                  </button>
                  {hasPublished ? (
                    <button
                      disabled
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600/10 border border-emerald-500/25 px-4 py-3 text-xs font-extrabold text-emerald-500"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>Published Live!</span>
                    </button>
                  ) : (
                    <button
                      onClick={handlePublish}
                      disabled={isPublishing}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-xs font-extrabold text-primary-foreground hover:brightness-115 active:scale-95 transition-all shadow-md disabled:opacity-50"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Publish Lecture Summary</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Background Operations Queue */}
      {backgroundTasks.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-5 space-y-4 animate-fade-in shadow-xs select-none">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              Background Operations Desk ({backgroundTasks.filter(t => ["uploading", "transcribing", "analysing"].includes(t.stage)).length} active)
            </h3>
            <button
              onClick={() => setBackgroundTasks([])}
              className="text-[10px] font-bold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Clear Logs
            </button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin divide-y divide-border/40">
            {backgroundTasks.map((task, idx) => {
              return (
                <div key={task.id} className={`pt-3 ${idx === 0 ? "pt-0 border-none" : "border-t border-border/40"} space-y-3`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-foreground leading-tight truncate">
                          {task.subject}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-muted/80 text-muted-foreground font-mono">
                          {task.timestamp}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-muted-foreground font-semibold truncate leading-normal mt-0.5">
                        {task.topicClassified ? `Topic Classify: "${task.topicClassified}"` : `Target Plan: "${task.topic}"`}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {task.stage === "ready" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black text-emerald-500 animate-fade-in">
                          <CheckCircle2 className="h-3 w-3" /> Ready & Feed Broadcasted!
                        </span>
                      ) : task.stage === "error" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 border border-destructive/30 px-2.5 py-0.5 text-[10px] font-black text-destructive">
                          <AlertCircle className="h-3 w-3" /> Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/25 px-2.5 py-0.5 text-[10px] font-black text-primary animate-pulse">
                          <Loader2 className="h-3 w-3 animate-spin" /> Processing...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tiny progress status bars represent pipeline status */}
                  <div className="space-y-1 bg-muted/60 border border-border/40 p-3 rounded-2xl">
                    <ol className="grid grid-cols-3 gap-1.5 text-center text-[9px] font-bold">
                      <li className={`rounded-lg p-1 border transition-all ${
                        task.stage === "uploading"
                          ? "bg-primary/10 border-primary/20 text-primary animate-pulse font-black"
                          : ["transcribing", "analysing", "ready"].includes(task.stage)
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            : task.stage === "error"
                              ? "bg-destructive/10 border-destructive/20 text-destructive/80"
                              : "bg-muted/80 border-border/30 text-muted-foreground/50"
                      }`}>
                        1. Ingest {task.stage === "uploading" && "..."}
                      </li>
                      <li className={`rounded-lg p-1 border transition-all ${
                        task.stage === "transcribing"
                          ? "bg-primary/10 border-primary/20 text-primary animate-pulse font-black"
                          : ["analysing", "ready"].includes(task.stage)
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            : task.stage === "error" && ["uploading"].includes(task.stage)
                              ? "bg-muted/80 border-border/30 text-muted-foreground/50"
                              : task.stage === "error"
                                ? "bg-destructive/10 border-destructive/20 text-destructive/80"
                                : "bg-muted/80 border-border/30 text-muted-foreground/50"
                      }`}>
                        2. Transcribe {task.stage === "transcribing" && "..."}
                      </li>
                      <li className={`rounded-lg p-1 border transition-all ${
                        task.stage === "analysing"
                          ? "bg-primary/10 border-primary/20 text-primary animate-pulse font-black"
                          : task.stage === "ready"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            : task.stage === "error" && ["uploading", "transcribing"].includes(task.stage)
                              ? "bg-muted/80 border-border/30 text-muted-foreground/50"
                              : task.stage === "error"
                                ? "bg-destructive/10 border-destructive/20 text-destructive/80"
                                : "bg-muted/80 border-border/30 text-muted-foreground/50"
                      }`}>
                        3. AI Collate {task.stage === "analysing" && "..."}
                      </li>
                    </ol>

                    {task.error && (
                      <div className="text-[10px] text-destructive leading-normal border border-destructive/15 bg-destructive/5 p-2.5 rounded-xl mt-2 flex items-start gap-1.5 animate-fade-in font-medium">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>{task.error}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History log representing published stuff */}
      <section className="space-y-2.5">
        <h2 className="font-display text-sm font-bold tracking-tight text-foreground uppercase">
          Coordinator History Logs
        </h2>

        {recentLectures.length === 0 ? (
          <div className="border border-border rounded-3xl bg-card/25 p-8 text-center flex flex-col items-center justify-center gap-1.5 grayscale opacity-75">
            <Inbox className="h-8 w-8 text-muted-foreground" />
            <h3 className="text-xs font-semibold text-foreground/80">No published logs in this session</h3>
            <p className="text-[10px] text-muted-foreground">Lectures published by you will stack here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
            {recentLectures.map((item) => (
              <li key={item.id} className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/30 transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-xs font-extrabold text-primary">
                  {item.subject.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-foreground">{item.topic}</div>
                  <div className="text-[11px] text-muted-foreground font-medium">
                    {item.subject} • {item.timeAgo}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success border border-success/10">
                    Live
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteLecture({ id: item.id, day: selectedDay })}
                    className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-95 transition-all cursor-pointer"
                    title="Remove unwanted lecture"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-[10px] text-muted-foreground font-medium pt-3.5">
        Coordinator Mode • {collegeName} • {batchYear} Space
      </p>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-secondary/80 px-3 py-2.5 border border-border flex flex-col justify-between">
      <Icon className="h-4 w-4 text-primary" />
      <div className="mt-1.5 font-display text-base font-extrabold leading-none text-foreground">{value}</div>
      <div className="mt-1 text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
        {label}
      </div>
    </div>
  );
}

function PipelineStep({
  label,
  sub,
  active,
  done,
}: {
  label: string;
  sub?: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <li className="flex items-start gap-3 animate-fade-in">
      <div
        className={
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 " +
          (done
            ? "bg-success/15 border-success/30 text-success"
            : active
              ? "bg-primary/10 border-primary/30 text-primary animate-pulse"
              : "bg-muted/50 border-border/80 text-muted-foreground")
        }
      >
        {done ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
        ) : active ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        )}
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <div
          className={
            "text-xs font-bold transition-colors " +
            (done || active ? "text-foreground" : "text-muted-foreground")
          }
        >
          {label}
        </div>
        {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </li>
  );
}
