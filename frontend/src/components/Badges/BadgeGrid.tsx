import type { Badge } from "@/types";

interface BadgeGridProps {
  badges: Badge[];
  showLocked?: boolean; // true = show all (locked grayed out), false = only earned
}

export function BadgeGrid({ badges, showLocked = false }: BadgeGridProps) {
  const visible = showLocked ? badges : badges.filter((b) => b.earned);

  if (visible.length === 0) {
    return (
      <p className="text-sm text-dark-500 text-center py-4">
        Henuz rozet yok
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
      {visible.map((badge) => (
        <div
          key={badge.id}
          className={`group relative rounded-xl p-3 text-center transition-all duration-200 ${
            badge.earned
              ? "bg-dark-800 border border-neon-500/30 shadow-[0_0_12px_rgba(255,0,127,0.15)] hover:shadow-[0_0_20px_rgba(255,0,127,0.3)] hover:scale-105 cursor-default"
              : "bg-dark-900 border border-dark-700 opacity-40"
          }`}
        >
          {/* Lock overlay for unearned */}
          {!badge.earned && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl">
              <span className="text-dark-600 text-lg">&#128274;</span>
            </div>
          )}

          {/* Emoji icon */}
          <div
            className={`text-3xl leading-none ${
              badge.earned ? "" : "grayscale opacity-50"
            }`}
          >
            {badge.icon}
          </div>

          {/* Badge name */}
          <p
            className={`text-xs font-medium mt-1 truncate ${
              badge.earned ? "text-white" : "text-dark-500"
            }`}
          >
            {badge.name}
          </p>

          {/* Description - visible on hover for earned, always dim for locked */}
          <p
            className={`text-[10px] mt-0.5 line-clamp-2 ${
              badge.earned
                ? "text-dark-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                : "text-dark-600"
            }`}
          >
            {badge.description}
          </p>

          {/* Earned date */}
          {badge.earned && badge.earnedAt && (
            <p className="text-[10px] text-dark-500 mt-0.5">
              {new Date(badge.earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
