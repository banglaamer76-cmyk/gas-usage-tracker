import type { ReactNode, SVGProps } from "react";
import { cx } from "@/app/lib/cx";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function icon(name: string, paths: ReactNode, { filled = false } = {}) {
  function Icon({ size = 20, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={filled ? "currentColor" : "none"}
        stroke={filled ? "none" : "currentColor"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...props}
      >
        {paths}
      </svg>
    );
  }
  Icon.displayName = name;
  return Icon;
}

export const PlayIcon = icon("PlayIcon", <path d="M8 5.6v12.8a1 1 0 0 0 1.5.86l10.3-6.4a1 1 0 0 0 0-1.72L9.5 4.74A1 1 0 0 0 8 5.6Z" />, { filled: true });
export const StopIcon = icon("StopIcon", <rect x="6" y="6" width="12" height="12" rx="2.5" />, { filled: true });
export const UserIcon = icon("UserIcon", <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>);
export const UsersIcon = icon("UsersIcon", <><circle cx="9" cy="8" r="3.5" /><path d="M2 20a7 7 0 0 1 14 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M18.5 14.2A7 7 0 0 1 22 20" /></>);
export const XIcon = icon("XIcon", <path d="M18 6 6 18M6 6l12 12" />);
export const CheckIcon = icon("CheckIcon", <path d="M20 6 9 17l-5-5" />);
export const AlertIcon = icon("AlertIcon", <><circle cx="12" cy="12" r="9" /><path d="M12 8v4.5M12 16h.01" /></>);
export const InfoIcon = icon("InfoIcon", <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>);
export const ClockIcon = icon("ClockIcon", <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const TimerIcon = icon("TimerIcon", <><path d="M10 2h4M12 14l3-3" /><circle cx="12" cy="14" r="8" /></>);
export const PieIcon = icon("PieIcon", <><path d="M21 12a9 9 0 1 1-9-9" /><path d="M21 12A9 9 0 0 0 12 3v9Z" /></>);
export const PhoneIcon = icon("PhoneIcon", <><rect x="6" y="2" width="12" height="20" rx="2.5" /><path d="M11 18h2" /></>);
export const DownloadIcon = icon("DownloadIcon", <path d="M12 3v12m-5-5 5 5 5-5M5 21h14" />);
export const ShareIcon = icon("ShareIcon", <><path d="M12 15V3m-4 4 4-4 4 4" /><path d="M7 10H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1" /></>);
export const PlusSquareIcon = icon("PlusSquareIcon", <><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M12 8v8M8 12h8" /></>);
export const LogOutIcon = icon("LogOutIcon", <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9" />);
export const LockIcon = icon("LockIcon", <><rect x="4" y="11" width="16" height="10" rx="2.5" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>);
export const CylinderIcon = icon("CylinderIcon", <><path d="M10 2h4M12 2v3" /><path d="M7 10a5 5 0 0 1 10 0v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2Z" /><path d="M7 14h10" /></>);
export const RefreshIcon = icon("RefreshIcon", <path d="M20 11a8 8 0 0 0-14.8-4M4 4v4h4M4 13a8 8 0 0 0 14.8 4M20 20v-4h-4" />);
export const WifiOffIcon = icon("WifiOffIcon", <path d="M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5.1-2.8M19 12.9a10 10 0 0 0-2.3-1.7M2 8.8a15 15 0 0 1 4.3-2.7M22 8.8a15 15 0 0 0-11.4-3.7M12 20h.01" />);

/** Google's multicolour "G", per Google's sign-in branding guidelines. */
export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3.01h3.88c2.27-2.09 3.57-5.17 3.57-8.83Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.01c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.26v3.11A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.29A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.57.37-2.29V6.6H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.4l4.01-3.11Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.53 11.53 0 0 0 12 0 12 12 0 0 0 1.26 6.6l4.01 3.11C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx("inline-block size-5 animate-spin rounded-full border-2 border-current border-r-transparent", className)}
    />
  );
}
