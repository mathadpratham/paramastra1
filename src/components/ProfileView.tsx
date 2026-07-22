import React, { useState } from "react";
import { User, GraduationCap, Flame, Star, Clock, Download, Upload, Check, AlertCircle, RefreshCw, Sparkles, BookOpen, ShieldCheck, Heart, ChevronRight, Settings, LogOut, Smartphone, X } from "lucide-react";
import { getApiUrl } from "../config";
import type { AppState, Lecture } from "../types";

type ProfileViewProps = {
  onChangeRoute: (route: AppState["route"]) => void;
  recentLectures: Lecture[];
  deferredPrompt?: any;
  onInstall?: () => void;
};

export function ProfileView({ 
  onChangeRoute, 
  recentLectures, 
  deferredPrompt, 
  onInstall 
}: ProfileViewProps) {
  const savedLecturesCount = recentLectures.filter((l) => l.saved).length || 8;
  const streakDays = 12;
  const hoursCovered = 38 + recentLectures.length;

  const [storedName, setStoredName] = useState(() => typeof window !== "undefined" ? localStorage.getItem("paramastra_user_name") || "BAMS Scholar" : "BAMS Scholar");
  const [storedCollege, setStoredCollege] = useState(() => typeof window !== "undefined" ? localStorage.getItem("paramastra_user_college") || "AAMC Moodbidari" : "AAMC Moodbidari");
  const [storedBatch, setStoredBatch] = useState(() => typeof window !== "undefined" ? localStorage.getItem("paramastra_user_batch") || "1st year" : "1st year");
  const [storedRoll, setStoredRoll] = useState(() => typeof window !== "undefined" ? localStorage.getItem("paramastra_user_roll") || "" : "");

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(storedName);
  const [editCollege, setEditCollege] = useState(storedCollege);
  const [editBatch, setEditBatch] = useState(storedBatch);
  const [editRoll, setEditRoll] = useState(storedRoll);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Database and Cloud sync state
  const [cloudStatus, setCloudStatus] = useState<{
    quotaExhausted: boolean;
    circuitBreakerActive: boolean;
    dbInitialized: boolean;
  } | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  const userRole = typeof window !== "undefined" ? localStorage.getItem("paramastra_user_role") || "student" : "student";

  React.useEffect(() => {
    fetch(getApiUrl("/api/firestore/status"))
      .then((r) => r.json())
      .then((data) => setCloudStatus(data))
      .catch((e) => console.error("Error loading status:", e));
  }, []);

  const handleForceSync = async () => {
    setSyncLoading(true);
    setSyncMessage(null);
    setSyncError(null);
    try {
      const res = await fetch(getApiUrl("/api/firestore/reset"), { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      
      const statusRes = await fetch(getApiUrl("/api/firestore/status"));
      const statusData = await statusRes.json();
      setCloudStatus(statusData);
      
      if (data.success) {
        setSyncMessage("Cloud sync successfully re-established!");
      } else {
        setSyncError(data.message || "Failed to establish cloud sync. Daily limit might still be active.");
      }
    } catch (err: any) {
      setSyncError(err.message || "Failed to force sync.");
    } finally {
      setSyncLoading(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const res = await fetch(getApiUrl("/api/backup/export"));
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `paramastra_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Failed to export backup: " + err.message);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("WARNING: Importing this backup will overwrite the current class registrations, schedules, and student diaries. Are you sure you want to proceed?")) {
      e.target.value = "";
      return;
    }

    setImportLoading(true);
    setSyncMessage(null);
    setSyncError(null);

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      const res = await fetch(getApiUrl("/api/backup/import"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backupData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      setSyncMessage("Database backup imported and restored successfully! Re-loading session...");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setSyncError("Import failed: " + err.message);
    } finally {
      setImportLoading(false);
      e.target.value = "";
    }
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(storedName);

  const stats = [
    { label: "Sadhana Streak", value: `${streakDays} Days`, icon: Flame, color: "oklch(0.62 0.22 28)" },
    { label: "Saved Sutras", value: `${savedLecturesCount}`, icon: Star, color: "oklch(0.78 0.15 75)" },
    { label: "Minutes Read", value: `${hoursCovered * 50}m`, icon: Clock, color: "oklch(0.62 0.16 165)" },
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSaving(true);

    try {
      const userRole = localStorage.getItem("paramastra_user_role") || "student";
      const classCode = localStorage.getItem("paramastra_class_code") || "default";
      // Dynamic userid generation guess or loaded from localStorage
      // We can generate it or look up the stored user ID if exists, or use the initials of old/new name
      const computedInitials = storedName.replace(/[^a-zA-Z]/g, "").slice(0, 3).toLowerCase();
      const storedRollVal = localStorage.getItem("paramastra_user_roll") || "";
      const fallbackUserId = computedInitials + storedRollVal;

      const userIdKey = fallbackUserId; // Default fallback

      const response = await fetch(getApiUrl("/api/profile/update"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: userRole,
          classCode,
          userId: userIdKey,
          name: editName.trim(),
          collegeName: editCollege.trim(),
          batchYear: editBatch.trim(),
          rollNumber: editRoll.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile settings.");
      }

      // Success, persist to localStorage too
      localStorage.setItem("paramastra_user_name", editName.trim());
      localStorage.setItem("paramastra_user_college", editCollege.trim());
      localStorage.setItem("paramastra_user_batch", editBatch.trim());
      if (editRoll.trim()) {
        localStorage.setItem("paramastra_user_roll", editRoll.trim());
      } else {
        localStorage.removeItem("paramastra_user_roll");
      }

      setStoredName(editName.trim());
      setStoredCollege(editCollege.trim());
      setStoredBatch(editBatch.trim());
      setStoredRoll(editRoll.trim());
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not link changes to class database.");
    } finally {
      setIsSaving(false);
    }
  };

  // Standalone mode detector
  const isStandalone = typeof window !== "undefined" && (
    window.matchMedia("(display-mode: standalone)").matches || 
    (window.navigator as any).standalone === true
  );

  const isIOS = typeof window !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  return (
    <div className="mx-auto max-w-screen-sm px-4 py-5 space-y-6 relative">
      {/* Bio banner */}
      <div className="flex items-center gap-4 border-b border-b-border/60 pb-5">
        <div className="story-ring rounded-full p-[3px]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground ring-4 ring-background select-none font-display">
            {initials}
          </div>
        </div>
        <div className="min-w-0 flex-1 leading-normal text-left">
          <h1 className="font-display text-lg font-bold text-foreground">{storedName}</h1>
          <p className="text-xs text-muted-foreground font-semibold">
            BAMS • {storedCollege} • {storedBatch}{storedRoll ? ` • Roll: ${storedRoll}` : ""}
          </p>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-success/15 border border-success/30 px-2.5 py-0.5 text-[10px] font-bold text-success capitalize">
            ● Active Batch Subscription
          </span>
        </div>
      </div>



      {/* Professional PWA Installer Section */}
      {isStandalone ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-4 relative overflow-hidden text-left shadow-sm animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="space-y-0.5 leading-normal">
              <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                Native App Mode Active
                <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
              </h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Running in isolated, optimized client frame. Transcriptions and offline caching are now hardware accelerated.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-primary/25 bg-radial-[circle_at_top_right,var(--color-primary)_30%,transparent_100%] from-primary/5 via-transparent to-transparent p-4 relative overflow-hidden text-left shadow-md flex flex-col gap-3.5 border-border">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="space-y-1 leading-normal">
              <h3 className="text-xs font-bold text-foreground">Save Paramastra App</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Add to your home screen to enjoy seamless offline access, fast load speeds, and immersive full-screen reading without search address bar overhead.
              </p>
            </div>
          </div>

          {deferredPrompt ? (
            <button
              onClick={onInstall}
              className="w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold py-2 px-4 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-primary/20"
            >
              <Smartphone className="h-4 w-4" />
              <span>Install Web App (Frictionless)</span>
            </button>
          ) : isIOS ? (
            <div className="bg-muted/40 rounded-xl p-3 border border-border/60 text-left space-y-1">
              <div className="text-[10px] font-black uppercase text-primary tracking-wider">iOS Quick Setup</div>
              <p className="text-[10.5px] text-foreground leading-normal font-medium">
                To install, tap the <span className="font-bold underline text-primary">Share button</span> at the bottom of Safari, scroll down, and select <span className="font-bold underline text-primary">"Add to Home Screen"</span>. 📲
              </p>
            </div>
          ) : (
            <div className="bg-muted/30 rounded-xl p-3 border border-border/40 text-left">
              <p className="text-[10.5px] text-muted-foreground leading-normal">
                Open in Google Chrome, Edge, or Safari Mobile/Android browser settings and tap <strong className="text-foreground font-bold">"Add of Install App"</strong> to launch directly.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Account options */}
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {[
          { label: "Student Catalog Details", icon: Star, onClick: () => onChangeRoute("library") },
          { label: "Profile Settings", icon: Settings, onClick: () => {
              setEditName(storedName);
              setEditCollege(storedCollege);
              setEditBatch(storedBatch);
              setEditRoll(storedRoll);
              setIsEditing(true);
            }
          },
          { label: "Sign out Batch Session", icon: LogOut, danger: true, onClick: () => onChangeRoute("landing") },
        ].map((row, idx) => (
          <li key={idx}>
            <button
              onClick={row.onClick}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/35 outline-none transition-colors cursor-pointer"
            >
              <row.icon
                className={"h-4 w-4 shrink-0 " + (row.danger ? "text-destructive" : "text-muted-foreground")}
              />
              <span
                className={
                  "flex-1 text-xs font-bold " +
                  (row.danger ? "text-destructive" : "text-foreground")
                }
              >
                {row.label}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          </li>
        ))}
      </ul>

      {/* Cloud Sync & Backup Control Panel */}
      <div className="rounded-2xl border border-border bg-card p-4 text-left shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <BookOpen className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-black text-foreground">Database & Cloud Sync</h3>
          </div>
          {cloudStatus ? (
            cloudStatus.quotaExhausted ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                Offline Mode
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                Cloud Synchronized
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
              Checking status...
            </span>
          )}
        </div>

        {cloudStatus?.quotaExhausted && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 space-y-1 text-[10.5px] leading-relaxed text-amber-700 dark:text-amber-300">
            <div className="font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Daily Cloud Storage Quota Exceeded</span>
            </div>
            <p>
              Your cloud database has paused because the 20,000 free writes daily limit was reached.
              Students can still login, register, and read files via our high-speed local fallback, but <strong className="font-black">changes might be lost if the server container restarts.</strong>
            </p>
            <p className="font-bold">
              👉 To prevent data loss, please click "Download Backup" below on your phone to save your data, or click the refresh button once the limit resets!
            </p>
          </div>
        )}

        {syncMessage && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 flex gap-2 items-start text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed flex-1">{syncMessage}</span>
          </div>
        )}

        {syncError && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-2.5 flex gap-2 items-start text-xs font-semibold text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed flex-1">{syncError}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold py-2 px-3 rounded-xl border border-border transition-all cursor-pointer active:scale-98"
          >
            <Download className="h-4 w-4 text-primary shrink-0" />
            <span>Download Backup</span>
          </button>

          {userRole === "cr" ? (
            <label className="flex items-center justify-center gap-1.5 bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold py-2 px-3 rounded-xl border border-primary/20 transition-all cursor-pointer active:scale-98 relative">
              <Upload className="h-4 w-4 shrink-0" />
              <span>{importLoading ? "Restoring..." : "Restore Backup"}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                disabled={importLoading}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>
          ) : (
            <div className="flex items-center justify-center text-[10px] text-muted-foreground text-center px-2 font-medium">
              Only Class Reps can restore database backups.
            </div>
          )}
        </div>

        {cloudStatus?.quotaExhausted && (
          <button
            type="button"
            disabled={syncLoading}
            onClick={handleForceSync}
            className="w-full flex items-center justify-center gap-1.5 bg-stone-900 hover:bg-stone-950 text-stone-100 text-[10.5px] font-black uppercase tracking-wider py-1.5 rounded-xl border border-stone-800 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${syncLoading ? "animate-spin" : ""}`} />
            <span>{syncLoading ? "Checking..." : "Re-Verify Cloud Status & Force Sync"}</span>
          </button>
        )}
      </div>

      {/* Profile Settings Modal Overlay */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-fade-in">
          <form 
            onSubmit={handleSaveProfile}
            className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 text-left"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-1.5">
                <Settings className="h-4.5 w-4.5 text-primary" />
                <span>Customize Profile Details</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-muted-foreground hover:text-foreground h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-2.5 flex gap-1.5 items-center text-[11px] font-semibold text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                  College Name
                </label>
                <input
                  type="text"
                  required
                  value={editCollege}
                  onChange={(e) => setEditCollege(e.target.value)}
                  className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                    Batch / Year
                  </label>
                  <input
                    type="text"
                    required
                    value={editBatch}
                    onChange={(e) => setEditBatch(e.target.value)}
                    className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    value={editRoll}
                    onChange={(e) => setEditRoll(e.target.value)}
                    className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer border border-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-primary text-primary-foreground text-xs font-black py-2.5 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-primary/10 flex items-center justify-center gap-1.5"
              >
                {isSaving ? (
                  <span className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                ) : (
                  <span>Save Profile</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <p className="text-center text-[10px] text-muted-foreground font-medium pt-2">
        परमास्त्र • Version 1.0.4 • BAMS Edition
      </p>
    </div>
  );
}
