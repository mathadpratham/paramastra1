import { useState, useEffect } from "react";
import { Users, Copy, Check, RefreshCw, GraduationCap, Calendar, School, CornerDownRight, ShieldCheck, UserX, MessageCircle } from "lucide-react";
import { getApiUrl } from "../config";

type Student = {
  name: string;
  rollNumber: string;
  collegeName: string;
  batchYear: string;
  joinedAt: number;
  whatsappNumber?: string;
};

type StudentRosterViewProps = {
  classCode: string;
  collegeName: string;
  batchYear: string;
  showToast: (msg: string, type?: "success" | "warning" | "info" | "error") => void;
};

export function StudentRosterView({ classCode, collegeName, batchYear, showToast }: StudentRosterViewProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmingRoll, setConfirmingRoll] = useState<string | null>(null);
  const [removingRoll, setRemovingRoll] = useState<string | null>(null);

  const fetchRoster = async () => {
    if (!classCode) return;
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/api/class/${classCode}/students`));
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error("Failed to load roster", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (rollNumber: string, studentName: string) => {
    setRemovingRoll(rollNumber);
    try {
      const res = await fetch(getApiUrl(`/api/class/${classCode}/students/${rollNumber}`), {
        method: "DELETE"
      });
      if (res.ok) {
        showToast(`${studentName} (Roll: ${rollNumber}) has been successfully removed from this class roster.`, "success");
        setConfirmingRoll(null);
        await fetchRoster();
      } else {
        const errorData = await res.json();
        showToast(errorData.error || "Failed to remove classmate.", "error");
      }
    } catch (err) {
      console.error("Error removing student from class database", err);
      showToast("Unable to remove student due to a network connection issue.", "error");
    } finally {
      setRemovingRoll(null);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [classCode]);

  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(classCode);
      setCopied(true);
      showToast("Class code copied to clipboard! Share this with your students.", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Could not auto-copy, please copy manually: " + classCode, "warning");
    }
  };

  return (
    <div className="space-y-5 animate-fade-in text-left">
      {/* Code Broadcast Deck */}
      <div className="rounded-3xl border border-primary/20 bg-primary/[0.03] p-5 relative overflow-hidden">
        {/* Soft corner flare */}
        <div className="absolute right-0 bottom-0 h-16 w-16 rounded-full bg-primary/10 blur-xl" />
        
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">
            Active Class Broadcast Hub
          </span>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-display text-base font-extrabold text-foreground leading-tight">
              Share Class Code with Students
            </h3>
            <p className="text-xs text-muted-foreground/90 max-w-sm font-medium leading-relaxed">
              Copy this private 4-digit code and share it with your college classmates. When they sign in, they will be mapped here automatically.
            </p>
          </div>

          <button
            onClick={handleCopyCode}
            type="button"
            className="flex items-center gap-2 bg-muted hover:bg-muted/80 ring-1 ring-border/80 hover:ring-primary/50 rounded-2xl px-4.5 py-3 transition-all active:scale-98 shrink-0 self-start sm:self-center"
          >
            <div className="text-center">
              <span className="block text-[8px] font-black tracking-widest text-muted-foreground uppercase">
                CODE
              </span>
              <span className="block font-sans text-xl font-black text-primary tracking-wide">
                {classCode}
              </span>
            </div>
            <div className="h-7 w-px bg-border/80 mx-1.5" />
            {copied ? (
              <Check className="h-4.5 w-4.5 text-emerald-500" />
            ) : (
              <Copy className="h-4.5 w-4.5 text-muted-foreground" />
            )}
          </button>
        </div>

        <div className="mt-4 border-t border-border/40 pt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground font-semibold">
          <span className="flex items-center gap-1">
            <School className="h-3.5 w-3.5 text-primary" />
            {collegeName}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Batch: {batchYear}
          </span>
        </div>
      </div>

      {/* Login Directory List */}
      <div className="rounded-3xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary">
              <Users className="h-3 w-3" />
            </div>
            <span className="font-display text-sm font-black text-foreground">
              Connected Class Directory ({students.length})
            </span>
          </div>

          <button
            onClick={fetchRoster}
            disabled={loading}
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {students.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">
              No students have connected to this hub yet.
            </p>
            <p className="text-[10px] text-muted-foreground/70 max-w-xs mx-auto leading-normal">
              Share code <span className="font-bold text-foreground font-mono">{classCode}</span> with your classmates on WhatsApp to view live registrations.
            </p>
          </div>
        ) : (
          <div className="grid gap-2.5 max-h-[350px] overflow-y-auto pr-1">
            {students.slice().sort((a,b) => b.joinedAt - a.joinedAt).map((stud, idx) => {
              // Extract initials
              const initials = stud.name
                .split(/\s+/)
                .map(n => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              const isConfirming = confirmingRoll === stud.rollNumber;
              const isRemoving = removingRoll === stud.rollNumber;

              return (
                <div
                  key={stud.rollNumber + idx}
                  className="rounded-2xl border border-border/80 bg-background/50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:border-primary/30 transition-all font-body relative overflow-hidden"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted ring-1 ring-border text-xs font-black text-foreground shrink-0 select-none">
                      {initials || "ST"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-sm font-black text-foreground truncate">
                        {stud.name}
                      </div>
                      <div className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mt-0.5">
                        <School className="h-3 w-3 text-primary shrink-0" />
                        <span className="truncate max-w-[120px] sm:max-w-none">{stud.collegeName}</span>
                        <span>•</span>
                        <span>{stud.batchYear}</span>
                      </div>
                      {stud.whatsappNumber && (
                        <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1 mt-1 bg-emerald-500/5 px-2 py-0.5 rounded-lg border border-emerald-500/10 w-fit">
                          <MessageCircle className="h-3 w-3 shrink-0" />
                          <span>WhatsApp: {stud.whatsappNumber}</span>
                          <span className="text-muted-foreground">•</span>
                          <a
                            href={`https://wa.me/${stud.whatsappNumber.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] underline font-extrabold text-foreground hover:text-primary transition-colors cursor-pointer"
                          >
                            Chat
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 justify-between sm:justify-end shrink-0 border-t sm:border-t-0 border-border/30 pt-2 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <span className="rounded-lg bg-input border border-border/60 px-2 py-1 text-[10px] font-black text-foreground font-mono">
                        {stud.rollNumber}
                      </span>
                    </div>

                    {isConfirming ? (
                      <div className="flex items-center gap-1.5 animate-fade-in">
                        <button
                          type="button"
                          disabled={isRemoving}
                          onClick={() => handleRemoveStudent(stud.rollNumber, stud.name)}
                          className="px-2 py-1 bg-destructive hover:brightness-105 active:scale-95 text-white font-bold text-[9px] uppercase rounded-md transition-all cursor-pointer"
                        >
                          {isRemoving ? "Removing..." : "Remove"}
                        </button>
                        <button
                          type="button"
                          disabled={isRemoving}
                          onClick={() => setConfirmingRoll(null)}
                          className="px-2 py-1 bg-muted hover:bg-muted/80 text-foreground font-bold text-[9px] uppercase rounded-md transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingRoll(stud.rollNumber)}
                        title="Remove student outside college"
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                      >
                        <UserX className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[9px] font-black uppercase text-muted-foreground hidden sm:inline">Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-[9px] text-muted-foreground/70 flex gap-1 font-medium select-none bg-muted/20 px-3.5 py-2.5 rounded-xl border border-border/40">
          <CornerDownRight className="h-3 w-3 text-primary shrink-0 mt-0.5" />
          <span>This directory lists all classmates who verified their profile on this server using class code {classCode} to receive your high-yield Ayurveda study updates.</span>
        </div>
      </div>
    </div>
  );
}
