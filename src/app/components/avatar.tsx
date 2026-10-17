"use client";

import { useState } from "react";
import { cx } from "@/app/lib/cx";

function initials(name?: string | null) {
  const letters = (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("");
  return letters.slice(0, 2).toUpperCase() || "?";
}

/** Profile photo, falling back to initials when there's no photo or it fails to load. */
export function Avatar({
  src,
  name,
  size = 32,
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const style = { width: size, height: size };

  if (src && src !== failedSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- tiny remote avatar; the image optimizer adds nothing here
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        // Google profile photos can refuse requests that send a Referer header.
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        onError={() => setFailedSrc(src)}
        className={cx("shrink-0 rounded-full bg-surface-raised object-cover ring-1 ring-white/10", className)}
        style={style}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cx(
        "grid shrink-0 place-items-center rounded-full bg-linear-to-br from-brand-deep to-brand-deeper font-semibold text-white ring-1 ring-white/10",
        className
      )}
      style={{ ...style, fontSize: Math.round(size * 0.38) }}
    >
      {initials(name)}
    </span>
  );
}
