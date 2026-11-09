"use client";

import * as React from "react";
import "./gooey-dock.css";

export interface GooeyDockItem {
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

interface GooeyDockProps {
  items: GooeyDockItem[];
  className?: string;
  hidden?: boolean;
  ariaLabel?: string;
}

export default function GooeyDock({
  items,
  className = "",
  hidden = false,
  ariaLabel = "Main navigation",
}: GooeyDockProps) {
  const [hovered, setHovered] = React.useState<number | null>(null);

  return (
    <nav
      aria-label={ariaLabel}
      className={`gooey-dock-shell ${hidden ? "gooey-dock-shell--hidden" : ""} ${className}`}
      onMouseLeave={() => setHovered(null)}
    >
      <svg className="gooey-dock-filter" aria-hidden="true" focusable="false">
        <defs>
          <filter id="sunny-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div className="gooey-dock" role="group" aria-label={ariaLabel}>
        <div className="gooey-dock__goo-layer" aria-hidden="true">
          {items.map((item, index) => (
            <span
              key={item.label}
              className={`gooey-dock__blob ${item.active || hovered === index ? "gooey-dock__blob--active" : ""}`}
              style={{ left: `${((index + 0.5) / items.length) * 100}%` }}
            />
          ))}
        </div>

        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = Boolean(item.active);
          const isEmphasized = isActive || hovered === index;

          return (
            <button
              key={item.label}
              type="button"
              className={`gooey-dock__item ${isActive ? "gooey-dock__item--active" : ""} ${isEmphasized ? "gooey-dock__item--emphasized" : ""}`}
              onClick={item.onClick}
              onMouseEnter={() => setHovered(index)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              title={item.label}
            >
              <span className="gooey-dock__icon-wrap">
                <Icon size={22} strokeWidth={isActive ? 2.6 : 2} />
              </span>
              <span className="gooey-dock__label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
