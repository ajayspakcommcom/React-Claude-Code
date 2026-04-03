// REUSABLE COMPONENT LIBRARY — Avatar.tsx
//
// Patterns:
//   ✅ Image with initials fallback — if src fails or is absent, shows initials
//   ✅ Size variants — sm/md/lg/xl via a size map
//   ✅ Color derived from name — consistent color per person across sessions
//   ✅ AvatarGroup — renders overlapping avatars (compound-style static export)

import React, { useState } from "react";
import type { Size } from "../types";

const SIZES: Record<Size, number> = { sm: 28, md: 36, lg: 48, xl: 64 };
const FONT:  Record<Size, number> = { sm: 11, md: 13, lg: 16, xl: 20 };

// Deterministic color from name — same person always gets same color
const COLORS = ["#3b82f6","#8b5cf6","#ec4899","#f59e0b","#10b981","#06b6d4","#f97316"];
const colorFor = (name: string) =>
  COLORS[name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % COLORS.length];

const initials = (name: string) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

// ── Avatar ────────────────────────────────────────────────────────────────────

export interface AvatarProps {
  name:   string;
  src?:   string;
  size?:  Size;
  style?: React.CSSProperties;
}

export const Avatar = ({ name, src, size = "md", style }: AvatarProps) => {
  const [imgFailed, setImgFailed] = useState(false);
  const px = SIZES[size];
  const fs = FONT[size];

  const base: React.CSSProperties = {
    width:        px,
    height:       px,
    borderRadius: "50%",
    flexShrink:   0,
    display:      "flex",
    alignItems:   "center",
    justifyContent: "center",
    fontSize:     fs,
    fontWeight:   700,
    overflow:     "hidden",
    ...style,
  };

  if (src && !imgFailed) {
    return (
      <div style={base}>
        <img
          src={src}
          alt={name}
          onError={() => setImgFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }

  return (
    <div
      style={{ ...base, background: colorFor(name), color: "#fff" }}
      aria-label={name}
      title={name}
    >
      {initials(name)}
    </div>
  );
};

// ── AvatarGroup ───────────────────────────────────────────────────────────────

export interface AvatarGroupProps {
  avatars: AvatarProps[];
  max?:    number;
  size?:   Size;
}

export const AvatarGroup = ({ avatars, max = 4, size = "md" }: AvatarGroupProps) => {
  const visible  = avatars.slice(0, max);
  const overflow = avatars.length - max;
  const px = SIZES[size];
  const fs = FONT[size];

  return (
    <div style={{ display: "flex" }}>
      {visible.map((a, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -(px * 0.3), zIndex: visible.length - i }}>
          <Avatar {...a} size={size} style={{ border: "2px solid #fff" }} />
        </div>
      ))}
      {overflow > 0 && (
        <div
          style={{
            width: px, height: px, borderRadius: "50%", background: "#f1f5f9",
            color: "#475569", fontSize: fs, fontWeight: 700, border: "2px solid #fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginLeft: -(px * 0.3),
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
};
