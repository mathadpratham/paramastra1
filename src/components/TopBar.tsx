import { Bell } from "lucide-react";
import { GoldenTrishulIcon } from "./GoldenTrishulIcon";

type TopBarProps = {
  title?: string;
  onProfileClick?: () => void;
  onNotificationClick?: () => void;
  notificationsCount?: number;
  userRole?: "student" | "cr" | null;
};

export function TopBar({
  title = "Paramastra",
  onProfileClick,
  onNotificationClick,
  notificationsCount = 1,
  userRole,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-screen-sm items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          {/* High-contrast brand logo representing celestial Paramastra armor/weapon */}
          <div
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-card border border-border/60 ring-1 ring-primary/35 cursor-pointer transition-transform duration-200 active:scale-95 shadow-sm"
            onClick={onProfileClick}
            title="View Profile"
          >
            <GoldenTrishulIcon className="h-9 w-9" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight leading-none flex items-center gap-2">
            <span className="font-calligraphy text-[17px] font-black tracking-wide text-stone-900 select-none bg-gradient-to-r from-stone-950 via-[#9a721d] to-stone-950 bg-clip-text text-transparent drop-shadow-[0_0.5px_0.5px_rgba(204,164,59,0.15)] transition-all duration-300 hover:brightness-110">
              Paramastra
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}
