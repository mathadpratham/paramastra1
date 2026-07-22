import React, { useState } from "react";
import { GraduationCap, Mic, ArrowRight, CornerDownRight, RotateCw, AlertCircle, KeyRound, Sparkles, UserCheck, ShieldAlert, Check } from "lucide-react";
import { GoldenTrishulIcon } from "./GoldenTrishulIcon";
import { getApiUrl } from "../config";

type RoleSelectionLandingProps = {
  onLoginSuccess: (
    role: "student" | "cr",
    classCode: string,
    name: string,
    college: string,
    batch: string,
    roll?: string
  ) => void;
};

export function RoleSelectionLanding({ onLoginSuccess }: RoleSelectionLandingProps) {
  const [flow, setFlow] = useState<"sign_in" | "register">("sign_in");
  const [role, setRole] = useState<"student" | "cr">("student");
  
  // Sign In inputs
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [classCode, setClassCode] = useState("");

  // Registration inputs
  const [regName, setRegName] = useState("");
  const [regCollege, setRegCollege] = useState("AAMC Moodbidari");
  const [regBatch, setRegBatch] = useState("1st year");
  const [regRoll, setRegRoll] = useState("");
  const [regWhatsapp, setRegWhatsapp] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regClassCode, setRegClassCode] = useState("");

  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const handleResetPassword = async () => {
    setErrorMsg(null);
    setResetSuccess(null);
    
    if (!userId.trim()) {
      setErrorMsg("Please enter your Academic User ID first.");
      return;
    }
    if (!password.trim()) {
      setErrorMsg("Please enter the new Password you wish to set.");
      return;
    }
    const trimmedCode = classCode.trim();
    if (trimmedCode.length !== 4 || !/^\d{4}$/.test(trimmedCode)) {
      setErrorMsg("Please enter your 4-digit Class Code.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim().toLowerCase(),
          newPassword: password.trim(),
          classCode: trimmedCode,
          role,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Password reset failed.");
      }

      setResetSuccess(data.message || "Password updated successfully! Signing you in...");
      
      // Auto-trigger login
      const loginResponse = await fetch(getApiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim().toLowerCase(),
          password: password.trim(),
          classCode: trimmedCode,
          role,
        }),
      });

      const loginData = await loginResponse.json();
      if (!loginResponse.ok) {
        throw new Error(loginData.error || "Automatic authentication failed.");
      }

      // Handle successful login
      if (role === "student") {
        const student = loginData.studentInfo || {};
        localStorage.setItem("paramastra_user_role", "student");
        localStorage.setItem("paramastra_class_code", trimmedCode);
        localStorage.setItem("paramastra_user_name", student.name || "BAMS Student");
        localStorage.setItem("paramastra_user_college", student.collegeName || "AAMC Moodbidari");
        localStorage.setItem("paramastra_user_batch", student.batchYear || "1st year");
        if (student.rollNumber) {
          localStorage.setItem("paramastra_user_roll", student.rollNumber);
        }
        onLoginSuccess(
          "student",
          trimmedCode,
          student.name || "BAMS Student",
          student.collegeName || "AAMC Moodbidari",
          student.batchYear || "1st year",
          student.rollNumber || ""
        );
      } else {
        const classInfo = loginData.classInfo || {};
        localStorage.setItem("paramastra_user_role", "cr");
        localStorage.setItem("paramastra_class_code", trimmedCode);
        localStorage.setItem("paramastra_user_name", classInfo.crName || "Class Representative");
        localStorage.setItem("paramastra_user_college", classInfo.collegeName || "AAMC Moodbidari");
        localStorage.setItem("paramastra_user_batch", classInfo.batchYear || "1st year");
        onLoginSuccess(
          "cr",
          trimmedCode,
          classInfo.crName || "Class Representative",
          classInfo.collegeName || "AAMC Moodbidari",
          classInfo.batchYear || "1st year"
        );
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred during password reset.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to generate a random 4 digit code for CR setup registration
  const handleGenerateRegCode = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setRegClassCode(code);
    setErrorMsg(null);
    setResetSuccess(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!userId.trim()) {
      setErrorMsg("Please enter your Academic User ID.");
      return;
    }
    if (!password.trim()) {
      setErrorMsg("Please enter your password.");
      return;
    }
    const trimmedCode = classCode.trim();
    if (trimmedCode.length !== 4 || !/^\d{4}$/.test(trimmedCode)) {
      setErrorMsg("Class Code must be exactly 4 digits.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim().toLowerCase(),
          password: password.trim(),
          classCode: trimmedCode,
          role,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      // Successful login
      if (role === "student") {
        const student = data.studentInfo || {};
        // Cache to localStorage
        localStorage.setItem("paramastra_user_id", userId.trim().toLowerCase());
        localStorage.setItem("paramastra_user_password", password.trim());
        localStorage.setItem("paramastra_user_role", "student");
        localStorage.setItem("paramastra_class_code", trimmedCode);
        localStorage.setItem("paramastra_user_name", student.name || "BAMS Student");
        localStorage.setItem("paramastra_user_college", student.collegeName || "AAMC Moodbidari");
        localStorage.setItem("paramastra_user_batch", student.batchYear || "1st year");
        if (student.rollNumber) {
          localStorage.setItem("paramastra_user_roll", student.rollNumber);
        }
        onLoginSuccess(
          "student",
          trimmedCode,
          student.name || "BAMS Student",
          student.collegeName || "AAMC Moodbidari",
          student.batchYear || "1st year",
          student.rollNumber || ""
        );
      } else {
        const classObj = data.classInfo || {};
        localStorage.setItem("paramastra_user_id", userId.trim().toLowerCase());
        localStorage.setItem("paramastra_user_password", password.trim());
        localStorage.setItem("paramastra_user_role", "cr");
        localStorage.setItem("paramastra_class_code", trimmedCode);
        localStorage.setItem("paramastra_user_name", classObj.crName || "Class Representative");
        localStorage.setItem("paramastra_user_college", classObj.collegeName || "AAMC Moodbidari");
        localStorage.setItem("paramastra_user_batch", classObj.batchYear || "1st year");
        onLoginSuccess(
          "cr",
          trimmedCode,
          classObj.crName || "Class Representative",
          classObj.collegeName || "AAMC Moodbidari",
          classObj.batchYear || "1st year"
        );
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setRegisteredUserId(null);

    if (!regName.trim()) {
      setErrorMsg("Please enter your Full Name.");
      return;
    }
    if (!regPassword.trim()) {
      setErrorMsg("Please enter your Password choice.");
      return;
    }
    if (role === "student" && !regRoll.trim()) {
      setErrorMsg("Please enter your Roll Number.");
      return;
    }
    if (role === "student" && !regWhatsapp.trim()) {
      setErrorMsg("Please enter your WhatsApp Number.");
      return;
    }
    const trimmedCode = regClassCode.trim();
    if (trimmedCode.length !== 4 || !/^\d{4}$/.test(trimmedCode)) {
      setErrorMsg("Class Hub Code must be exactly 4 digits.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          collegeName: regCollege.trim(),
          batchYear: regBatch.trim(),
          rollNumber: role === "student" ? regRoll.trim() : "01",
          password: regPassword.trim(),
          classCode: trimmedCode,
          role,
          whatsappNumber: role === "student" ? regWhatsapp.trim() : "",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      // Show success
      setRegisteredUserId(data.userId);
      setClassCode(trimmedCode); // Auto fill login
      
      // Clear inputs
      setRegName("");
      setRegPassword("");
      setRegRoll("");
      setRegWhatsapp("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[90vh] max-w-screen-sm flex-col items-center justify-center px-4 py-8 animate-fade-in relative overflow-hidden">
      {/* Background radial soft golden ambient light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-56 w-56 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      {/* Styled logo header */}
      <div className="flex flex-col items-center gap-1.5 relative z-10 select-none">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-card border border-border ring-1 ring-primary/40 shadow-inner">
          <GoldenTrishulIcon className="h-12 w-12" />
        </div>
        <span className="font-display text-3xl font-black tracking-tight text-primary mt-1">
          Paramastra
        </span>
      </div>

      <p className="mt-2 text-center text-[10px] font-black text-muted-foreground tracking-widest uppercase mb-6 select-none">
        Academic Workspace for BAMS
      </p>

      <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-xl relative z-10 text-left animate-fade-in space-y-4">
        {/* Sign In / Register Header */}
        <div className="border-b border-border pb-3 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-foreground flex items-center gap-1.5">
              <KeyRound className="h-4 w-4 text-primary" />
              <span>{flow === "sign_in" ? "Academic Access Hub" : "New Account Registration"}</span>
            </h3>
            <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
              {flow === "sign_in" 
                ? "Sign in with your system generated User ID & password choice."
                : "Register first to safely secure your credentials & generate your User ID."}
            </p>
          </div>
        </div>

        {/* Top level Switcher Tab */}
        <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => {
              setFlow("sign_in");
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg text-xs font-black tracking-wide flex items-center justify-center gap-1.5 transition-all outline-none cursor-pointer ${
              flow === "sign_in"
                ? "bg-card text-primary shadow-sm border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Sign In Account</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFlow("register");
              setErrorMsg(null);
              setRegisteredUserId(null);
            }}
            className={`py-2 rounded-lg text-xs font-black tracking-wide flex items-center justify-center gap-1.5 transition-all outline-none cursor-pointer ${
              flow === "register"
                ? "bg-card text-primary shadow-sm border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Register First</span>
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 flex flex-col gap-2 items-start text-xs font-semibold text-destructive">
            <div className="flex gap-2 items-start w-full">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <div className="leading-relaxed flex-1">{errorMsg}</div>
            </div>
            {errorMsg.toLowerCase().includes("incorrect password") && (
              <button
                type="button"
                onClick={handleResetPassword}
                className="mt-1 px-3 py-1.5 bg-destructive hover:bg-destructive/95 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer active:scale-98 transition-all shadow-sm"
              >
                Reset Password to current entry
              </button>
            )}
          </div>
        )}

        {resetSuccess && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex gap-2 items-start text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Check className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{resetSuccess}</div>
          </div>
        )}

        {/* Dynamic Success Mode overlay */}
        {registeredUserId ? (
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-4.5 flex flex-col gap-2.5 text-xs text-primary animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <span className="font-bold text-sm text-foreground">🎉 Registration Successful!</span>
            </div>
            <p className="text-muted-foreground leading-normal font-semibold">
              Your secure academic login User ID has been successfully generated based on your name and roll number.
            </p>
            
            <div className="bg-background border border-border py-3 px-4 rounded-xl text-center shadow-inner my-1">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Generated User ID</span>
              <span className="font-mono text-lg font-black tracking-widest text-primary block select-all select-text">
                {registeredUserId}
              </span>
            </div>

            <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
              👉 Please copy or write down this User ID. You will use <strong>{registeredUserId}</strong> and your password to sign in!
            </p>

            <button
              type="button"
              onClick={() => {
                setUserId(registeredUserId);
                setFlow("sign_in");
                setRegisteredUserId(null);
                setErrorMsg(null);
              }}
              className="mt-1 w-full bg-primary hover:brightness-105 active:scale-[0.98] transition-all font-display font-black text-primary-foreground text-xs h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
            >
              <UserCheck className="h-4 w-4" />
              <span>Go to Sign In Now &rarr;</span>
            </button>
          </div>
        ) : (
          /* Normal Authentication Forms depending on flow state */
          <>
            {/* Common Role Segmented Controller */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1.5">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => {
                    setRole("student");
                    setErrorMsg(null);
                  }}
                  className={`py-2 rounded-lg text-xs font-black tracking-wide flex items-center justify-center gap-1.5 transition-all outline-none cursor-pointer ${
                    role === "student"
                      ? "bg-card text-primary shadow-sm border border-border/40"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>BAMS Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole("cr");
                    setErrorMsg(null);
                  }}
                  className={`py-2 rounded-lg text-xs font-black tracking-wide flex items-center justify-center gap-1.5 transition-all outline-none cursor-pointer ${
                    role === "cr"
                      ? "bg-card text-primary shadow-sm border border-border/40"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Mic className="h-3.5 w-3.5" />
                  <span>Class Rep (CR)</span>
                </button>
              </div>
            </div>

            {flow === "sign_in" ? (
              /* SIGN IN FORM HTML */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* User ID field */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                    Academic User ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={role === "student" ? "e.g. sun67" : "e.g. pra01"}
                    value={userId}
                    onChange={(e) => setUserId(e.target.value.replace(/\s+/g, ""))}
                    className="w-full bg-input border border-border/70 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/45"
                  />
                  <span className="block mt-1 text-[9px] text-muted-foreground font-semibold leading-normal">
                    ⚙️ Format: <strong>First 3 letters of name</strong> + <strong>Roll Number</strong>.
                    {role === "student" ? " (e.g., sun67)" : " (e.g., paracr for CR Param)"}
                  </span>
                </div>

                {/* Password field */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1.5">
                    Secret Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter your security password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-input border border-border/70 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Class Code field */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1.5">
                    Classroom Access Code
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    placeholder="Enter 4-digit numeric code"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-full bg-input border border-border/70 rounded-xl px-3.5 py-2.5 text-xs font-bold text-center tracking-widest text-foreground focus:outline-none focus:border-primary placeholder:font-normal placeholder:tracking-normal placeholder:text-muted-foreground/45"
                  />
                </div>

                <div className="text-[10px] text-muted-foreground/80 flex gap-1.5 leading-normal bg-muted/30 p-3 rounded-xl border border-border/40 font-semibold">
                  <CornerDownRight className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Connecting matching credentials with your Class Representative&apos;s digital syllabus diary.</span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:brightness-105 active:scale-[0.99] disabled:opacity-50 transition-all font-display font-black text-primary-foreground text-xs h-11 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-4.5 w-4.5 border-2 border-primary-foreground border-t-transparent rounded-full" />
                      <span>Authenticating Hub...</span>
                    </span>
                  ) : (
                    <>
                      <span>Open Workspace Room</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* REGISTRATION FORM HTML */
              <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fade-in">
                {/* Full name field */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-input border border-border/70 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/45"
                  />
                </div>

                {/* Roll Number field - Only for Student */}
                {role === "student" && (
                  <>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                        Class Roll Number
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 67, 12, or roll-b2"
                        value={regRoll}
                        onChange={(e) => setRegRoll(e.target.value)}
                        className="w-full bg-input border border-border/70 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/45"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                        WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 9876543210 or 10-digit number"
                        value={regWhatsapp}
                        onChange={(e) => setRegWhatsapp(e.target.value)}
                        className="w-full bg-input border border-border/70 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/45"
                      />
                    </div>
                  </>
                )}

                {/* College & Batch fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                      Medical College
                    </label>
                    <input
                      type="text"
                      required
                      value={regCollege}
                      onChange={(e) => setRegCollege(e.target.value)}
                      className="w-full bg-input border border-border/70 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                      Academic Batch
                    </label>
                    <input
                      type="text"
                      required
                      value={regBatch}
                      onChange={(e) => setRegBatch(e.target.value)}
                      className="w-full bg-input border border-border/70 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Preferred Password selection */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground mb-1">
                    Choose Security Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Set password of your choice"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-input border border-border/70 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary placeholder:text-zinc-500"
                  />
                  <span className="block mt-1 text-[9px] text-rose-600 font-semibold leading-normal">
                    🔒 Pick a password you will remember. This secures your reading progress!
                  </span>
                </div>

                {/* Classroom Code Setup */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">
                      {role === "student" ? "CR Classroom Access Code" : "Create 4-Digit Class Code"}
                    </label>
                    {role === "cr" && (
                      <button
                        type="button"
                        onClick={handleGenerateRegCode}
                        className="text-[9px] font-bold text-primary flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        <RotateCw className="h-2.5 w-2.5 animate-spin" style={{ animationDuration: '3s' }} />
                        Generate Custom Code
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    placeholder={role === "student" ? "Ask your CR for their 4-digit code" : "e.g. 2933"}
                    value={regClassCode}
                    onChange={(e) => setRegClassCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-full bg-input border border-border/70 rounded-xl px-3.5 py-2.5 text-xs font-bold text-center tracking-widest text-foreground focus:outline-none focus:border-primary placeholder:font-normal placeholder:tracking-normal placeholder:text-muted-foreground/45"
                  />
                </div>

                <div className="text-[10px] text-muted-foreground/85 flex gap-1.5 leading-normal bg-muted p-3 rounded-xl border border-border/40 font-semibold">
                  <CornerDownRight className="h-4 w-4 text-primary shrink-0" />
                  {role === "cr" ? (
                    <span>Registering a Class Code reserves this hub space for your medical student roster. The database will store your account securely.</span>
                  ) : (
                    <span>Registering auto-generates your official User ID under the Selected Classroom. Make sure you enter your CR&apos;s exact 4-digit code.</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:brightness-105 active:scale-[0.99] disabled:opacity-50 transition-all font-display font-black text-primary-foreground text-xs h-11 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-4.5 w-4.5 border-2 border-primary-foreground border-t-transparent rounded-full" />
                      <span>Saving Secure Credentials...</span>
                    </span>
                  ) : (
                    <>
                      <span>Complete Secure Registration</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      <p className="mt-8 text-center text-[10px] text-stone-500/85 max-w-[200px] leading-normal font-bold">
        परमास्त्र BAMS Workspace • Pure Educational Weapon
      </p>
    </div>
  );
}
