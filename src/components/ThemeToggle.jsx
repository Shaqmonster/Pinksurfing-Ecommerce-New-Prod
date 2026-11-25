import { IoDesktopOutline, IoSunnyOutline, IoMoonOutline } from "react-icons/io5";
import { useTheme } from "../context/themeContext.jsx";

const OPTIONS = [
  { value: "system", label: "System", Icon: IoDesktopOutline },
  { value: "light", label: "Light", Icon: IoSunnyOutline },
  { value: "dark", label: "Dark", Icon: IoMoonOutline },
];

/**
 * System / Light / Dark segmented control. Arrow keys move the choice,
 * as in a native radio group.
 */
export default function ThemeToggle({ className = "", compact = false }) {
  const { preference, setPreference } = useTheme();

  const onKeyDown = (e) => {
    const i = OPTIONS.findIndex((o) => o.value === preference);
    let next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = OPTIONS[(i + 1) % OPTIONS.length];
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = OPTIONS[(i - 1 + OPTIONS.length) % OPTIONS.length];
    if (!next) return;
    e.preventDefault();
    setPreference(next.value);
    e.currentTarget.querySelector(`[data-value="${next.value}"]`)?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      onKeyDown={onKeyDown}
      className={`grid grid-cols-3 gap-1 p-1 rounded-xl bg-ps-sunken border border-ps-border ${className}`}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const selected = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            data-value={value}
            tabIndex={selected ? 0 : -1}
            onClick={() => setPreference(value)}
            className={`inline-flex items-center justify-center gap-1.5 min-h-[40px] px-2 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ps-focus ${
              selected
                ? "bg-ps-action-soft text-ps-action-text ring-1 ring-[color-mix(in_srgb,var(--ps-primary)_45%,transparent)]"
                : "text-ps-fg2 hover:text-ps-fg"
            }`}
          >
            <Icon className="text-sm" aria-hidden="true" />
            <span className={compact ? "sr-only" : ""}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
