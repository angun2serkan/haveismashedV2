import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, Users, User, ChevronDown } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

interface GlobeFilterBarProps {
  value: string;
  onChange: (value: string) => void;
  friends: FilterOption[];
}

export function GlobeFilterBar({ value, onChange, friends }: GlobeFilterBarProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeLabel =
    value === "mine"
      ? "Sadece Ben"
      : value === "all"
        ? "Herkes"
        : friends.find((f) => f.value === value)?.label ?? "Anonim";

  const activeColor =
    value === "mine"
      ? "#ff007f"
      : value === "all"
        ? "#00e5ff"
        : friends.find((f) => f.value === value)?.color ?? "#ff007f";

  const activeIcon =
    value === "mine" ? (
      <User size={13} />
    ) : value === "all" ? (
      <Users size={13} />
    ) : (
      <span
        className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-white/20"
        style={{ backgroundColor: activeColor }}
      />
    );

  return (
    <div ref={ref} className="relative">
      {/* Trigger pill */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md transition-all duration-200 cursor-pointer group hover:scale-[1.03] active:scale-[0.97]"
        style={{
          background: `linear-gradient(135deg, rgba(10,10,15,0.85), rgba(10,10,15,0.95))`,
          borderColor: `${activeColor}50`,
          boxShadow: `0 0 12px ${activeColor}25, inset 0 0 12px ${activeColor}08`,
        }}
      >
        <span style={{ color: activeColor }} className="flex items-center">
          {activeIcon}
        </span>
        <span className="text-xs font-semibold text-white/90 max-w-[100px] truncate">
          {activeLabel}
        </span>
        <ChevronDown
          size={12}
          className={`text-dark-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          className="absolute top-full right-0 mt-2 min-w-[180px] rounded-xl border border-dark-600/80 backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            background: "linear-gradient(180deg, rgba(17,17,24,0.97), rgba(10,10,15,0.99))",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.05)",
          }}
        >
          {/* Fixed options */}
          <div className="p-1.5">
            <FilterItem
              icon={<Eye size={13} className="text-accent-cyan" />}
              label="Herkes"
              color="#00e5ff"
              active={value === "all"}
              onClick={() => { onChange("all"); setOpen(false); }}
            />
            <FilterItem
              icon={<EyeOff size={13} className="text-neon-500" />}
              label="Sadece Ben"
              color="#ff007f"
              active={value === "mine"}
              onClick={() => { onChange("mine"); setOpen(false); }}
            />
          </div>

          {/* Friend list */}
          {friends.length > 0 && (
            <>
              <div className="h-px bg-dark-700/60 mx-2" />
              <div className="p-1.5 max-h-[200px] overflow-y-auto scrollbar-thin">
                <p className="text-[9px] text-dark-500 uppercase tracking-widest font-semibold px-2 py-1">
                  Arkadaşlar
                </p>
                {friends.map((f) => (
                  <FilterItem
                    key={f.value}
                    icon={
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-white/20"
                        style={{ backgroundColor: f.color }}
                      />
                    }
                    label={f.label}
                    color={f.color ?? "#ff007f"}
                    active={value === f.value}
                    onClick={() => { onChange(f.value); setOpen(false); }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function FilterItem({
  icon,
  label,
  color,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150 cursor-pointer group ${
        active
          ? "bg-white/[0.06]"
          : "hover:bg-white/[0.04]"
      }`}
      style={active ? { boxShadow: `inset 2px 0 0 ${color}` } : undefined}
    >
      <span className="flex items-center flex-shrink-0">{icon}</span>
      <span
        className={`text-xs font-medium truncate ${active ? "text-white" : "text-dark-200"}`}
      >
        {label}
      </span>
      {active && (
        <span
          className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
        />
      )}
    </button>
  );
}
