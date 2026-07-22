import React from "react";
import { Home, Library, Notebook, Sparkles, User, Mic, Users } from "lucide-react";
import type { AppState } from "../types";

type BottomNavProps = {
  currentRoute: AppState["route"];
  onChangeRoute: (route: AppState["route"]) => void;
  userRole?: "student" | "cr" | null;
};

const navItems: {
  id: AppState["route"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "feed", label: "Feed", icon: Home },
  { id: "library", label: "Library", icon: Library },
  { id: "diary", label: "Diary", icon: Notebook },
  { id: "tutor", label: "AI Tutor", icon: Sparkles },
  { id: "cr", label: "CR", icon: Mic },
  { id: "roster", label: "Roster", icon: Users },
  { id: "profile", label: "Profile", icon: User },
];

export function BottomNav({ currentRoute, onChangeRoute, userRole }: BottomNavProps) {
  // If we are on the landing/role page, we don't display the persistent bottom nav bar
  if (currentRoute === "landing") return null;

  const filteredItems = navItems.filter((item) => {
    if (userRole === "student" && (item.id === "cr" || item.id === "roster")) {
      return false;
    }
    if (userRole === "cr" && (item.id === "feed" || item.id === "library" || item.id === "tutor" || item.id === "diary")) {
         return false;
    }
    return true;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/80 bg-background/95 backdrop-blur-xl max-w-screen-sm mx-auto shadow-[0_-8px_30px_rgb(0,0,0,0.12)] border-x">
      <ul className="mx-auto flex max-w-screen-sm items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-1">
        {filteredItems.map(({ id, label, icon: Icon }) => {
          const active = currentRoute === id;
          return (
            <li key={id} className="flex-1">
              <button
                onClick={() => onChangeRoute(id)}
                className="flex w-full flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium transition-colors"
                aria-pressed={active}
              >
                <span
                  className={
                    "flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-300 " +
                    (active
                      ? "text-primary scale-110 drop-shadow-[0_0_6px_rgba(251,191,36,0.25)]"
                      : "text-muted-foreground hover:bg-muted/10 hover:text-foreground active:scale-95")
                  }
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className={active ? "text-primary font-black scale-105 transition-all duration-300" : "text-muted-foreground"}>
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
